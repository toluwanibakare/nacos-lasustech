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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Campaigns this server is already sending in the background. A campaign has only one sender at a
// time, so a browser asking for a batch at the same moment can never cause duplicate emails.
const running = new Set();

/** Sends the next batch. Safe to call repeatedly; returns progress. */
export const sendCampaignBatch = async (campaignId, { fromRunner = false } = {}) => {
  const campaign = await centralGet('email_campaign_get', { id: campaignId });
  if (campaign.status !== 'sending') {
    return { done: true, campaign };
  }
  if (!fromRunner && running.has(String(campaignId))) {
    // The server is already sending this one. Wait a moment so a polling browser does not spin.
    await sleep(1500);
    return { done: false, busy: true, campaign: await centralGet('email_campaign_get', { id: campaignId }) };
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

/**
 * Sends a whole campaign from the server, batch by batch, without needing anyone's browser open.
 * Returns straight away; progress is read from the campaign record.
 */
export const startCampaignInBackground = (campaignId) => {
  const key = String(campaignId);
  if (running.has(key)) return;
  running.add(key);

  (async () => {
    try {
      for (;;) {
        const { done } = await sendCampaignBatch(campaignId, { fromRunner: true });
        if (done) break;
        await sleep(1500);
      }
      console.log(`✉️  Campaign ${campaignId} finished sending.`);
    } catch (error) {
      console.error(`❌ Campaign ${campaignId} stopped:`, error.response?.data?.message || error.message);
    } finally {
      running.delete(key);
    }
  })();
};

/** After a restart, carries on with any campaign that was still sending (created in the last 2 days). */
export const resumeUnfinishedCampaigns = async () => {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const rows = await listCampaigns();
  rows
    .filter((c) => c.status === 'sending' && new Date(String(c.created_at).replace(' ', 'T') + 'Z').getTime() > cutoff)
    .forEach((c) => {
      console.log(`✉️  Resuming campaign ${c.id} ("${c.subject}")`);
      startCampaignInBackground(c.id);
    });
};
