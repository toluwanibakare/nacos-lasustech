import axios from 'axios';
import emailService from './email.service.js';
import dotenv from 'dotenv';

dotenv.config();

const ID_SYSTEM_API = process.env.CENTRAL_API_URL || 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * Birthday Service (Proxy Mode)
 * ---------------------------------------------------------
 * Emails the recipients set on the admin Birthdays page (Central ID System).
 *   Day before : twice, morning (from 07:00) and night (from 20:00), Lagos time.
 *   Birthday   : once, in the morning (from 07:00).
 * Each reminder is claimed on the central system first, so a restart or an extra
 * cron call never sends it again.
 */
const LAGOS_OFFSET_HOURS = 1; // Africa/Lagos is UTC+1 all year

const lagosNow = () => new Date(Date.now() + LAGOS_OFFSET_HOURS * 3600 * 1000);

// Which reminder window Lagos time is in right now, or null when none is open.
export const currentSlot = (now = lagosNow()) => {
  const hour = now.getUTCHours();
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 20) return 'night';
  return null;
};

class BirthdayService {
  async getRecipients() {
    const response = await axios.get(`${ID_SYSTEM_API}?action=get_birthday_settings`, {
      headers: { 'X-API-KEY': API_KEY },
    });
    return response.data.recipients || [];
  }

  async claim(action, slot) {
    const response = await axios.post(`${ID_SYSTEM_API}?action=${action}`, { slot }, {
      headers: { 'X-API-KEY': API_KEY },
    });
    return response.data;
  }

  buildEmail(student, timing) {
    return `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #169b2d;">🎂 Birthday Alert: ${timing}!</h2>
        <p>Hello Admin,</p>
        <p>This is an automated reminder that one of our members has a birthday ${timing.toLowerCase()}.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
          <p><strong>Full Name:</strong> ${student.full_name}</p>
          <p><strong>Level:</strong> ${student.level}</p>
          <p><strong>Gender:</strong> ${student.gender || 'Not specified'}</p>
          <p><strong>WhatsApp:</strong> ${student.whatsapp_number || 'Not provided'}</p>
          <p><strong>Birthday:</strong> ${student.birthday}</p>
        </div>
        <p style="margin-top: 20px;">Don't forget to send them a congratulatory message!</p>
        <p>Best regards,<br/>NACOS LASUSTECH Portal</p>
      </div>
    `;
  }

  async checkBirthdays() {
    const slot = currentSlot();
    if (!slot) return;

    try {
      const recipients = await this.getRecipients();
      if (recipients.length === 0) {
        console.warn('⚠️ No birthday email address is set. Add one on the admin Birthdays page.');
        return;
      }

      const response = await axios.get(`${ID_SYSTEM_API}?action=get_birthdays`, {
        headers: { 'X-API-KEY': API_KEY }
      });
      const students = response.data.students || [];
      const date = lagosNow().toISOString().slice(0, 10);

      // The birthday itself gets one email, in the morning. The day before gets morning and night.
      const kinds = [['tomorrow', students.filter((s) => !s.is_today)]];
      if (slot === 'morning') kinds.push(['today', students.filter((s) => s.is_today)]);

      for (const [kind, group] of kinds) {
        if (group.length === 0) continue;
        const key = `${date}_${slot}_${kind}`;
        const { claimed } = await this.claim('birthday_claim', key);
        if (!claimed) continue;

        const timing = kind === 'today' ? 'TODAY' : 'TOMORROW';
        try {
          for (const student of group) {
            console.log(`🎉 Birthday found: ${student.full_name} (${timing})`);
            await emailService.sendCustomEmail(
              recipients.join(','),
              `🎂 Birthday Alert: ${student.full_name} (${timing})`,
              this.buildEmail(student, timing)
            );
          }
          console.log(`✅ Birthday notifications sent for ${group.length} members (${key}).`);
        } catch (error) {
          // Let the next check try this reminder again.
          await this.claim('birthday_unclaim', key).catch(() => {});
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Birthday Service API Error:', error.message);
    }
  }

  start() {
    this.checkBirthdays();
    setInterval(() => this.checkBirthdays(), 10 * 60 * 1000);
  }
}

export default new BirthdayService();
