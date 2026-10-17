import emailService from './email.service.js';
import { centralGet, centralPost } from './central.service.js';

/**
 * Email campaigns
 * ---------------------------------------------------------
 * The audience, counts and history live in the central database (PHP API).
 * Sending is done in small batches so each request finishes quickly (the
 * backend can run as a serverless function). The browser keeps calling
 * send-batch until `done` is true.
 *
 * Gmail caps how many emails an account can send per day (roughly 500 for a
 * personal account), so create() reports a warning for large audiences.
 */

const BATCH_SIZE = 20;
const PARALLEL = 5;
const GMAIL_DAILY_SOFT_LIMIT = 450;

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text becomes paragraphs; anything that already looks like HTML is sent as-is. */
export const renderBody = (body, name) => {
  const first = String(name || 'there').trim().split(/\s+/)[0];
  const withName = String(body).replace(/\{\{\s*name\s*\}\}/gi, first);
  if (/<[a-z][\s\S]*>/i.test(withName)) return withName;
  return withName
    .split(/\n{2,}/)
    .map((p) => `<p style="color:#475569;line-height:1.6;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
};

export const audienceCounts = (audience) => centralPost('email_audience_counts', { audience });

export const createCampaign = async ({ subject, body, audience, sentBy }) => {
  const campaign = await centralPost('email_campaign_create', { subject, body, audience, sent_by: sentBy });
  return {
    ...campaign,
    warning:
      campaign.with_email > GMAIL_DAILY_SOFT_LIMIT
        ? `This audience has ${campaign.with_email} emails. Gmail may stop sending after about ${GMAIL_DAILY_SOFT_LIMIT} a day; remaining emails will be counted as failed.`
        : null,
  };
};

/** Sends the next batch. Safe to call repeatedly; returns progress. */
export const sendCampaignBatch = async (campaignId) => {
  const campaign = await centralGet('email_campaign_get', { id: campaignId });
  if (campaign.status !== 'sending') {
    return { done: true, campaign };
  }

  const processed = Number(campaign.sent_count) + Number(campaign.failed_count);
  const { recipients } = await centralPost('email_recipients', {
    audience: {
      type: campaign.audience_type,
      level: campaign.audience_level,
      department: campaign.audience_department,
    },
    offset: processed,
    limit: BATCH_SIZE,
  });

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += PARALLEL) {
    const chunk = recipients.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(
      chunk.map((r) => emailService.sendCustomEmail(r.email, campaign.subject, renderBody(campaign.body, r.name))),
    );
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent += 1;
      } else {
        failed += 1;
        console.error(`Campaign ${campaignId} email to ${chunk[index].email} failed:`, result.reason?.message);
      }
    });
  }

  const done = recipients.length < BATCH_SIZE;
  const updated = await centralPost('email_campaign_progress', { id: campaignId, sent, failed, done });
  return { done, campaign: updated };
};

export const listCampaigns = () => centralGet('email_campaigns');
