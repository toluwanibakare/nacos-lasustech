import axios from 'axios';
import emailService from './email.service.js';
import dotenv from 'dotenv';

dotenv.config();

const ID_SYSTEM_API = 'https://nacosid.tmb.it.com/api.php';
const API_KEY = process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY';

/**
 * Birthday Service (Proxy Mode)
 * ---------------------------------------------------------
 * Checks for upcoming birthdays via Central ID System.
 */
class BirthdayService {
  async checkBirthdays() {
    console.log('🎂 Running daily birthday check (Central System)...');
    
    try {
      const response = await axios.get(`${ID_SYSTEM_API}?action=get_birthdays`, {
        headers: { 'X-API-KEY': API_KEY }
      });
      
      const students = response.data.students || [];
      
      if (students.length === 0) {
        console.log('ℹ️ No birthdays today or tomorrow found on central system.');
        return;
      }

      for (const student of students) {
        const timing = student.is_today ? "TODAY" : "TOMORROW";

        console.log(`🎉 Birthday found: ${student.full_name} (${timing})`);

        const emailContent = `
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

        const recipients = [process.env.ADMIN_EMAIL, 'nacoslasustech01@gmail.com'];
        
        for (const recipient of recipients) {
          if (recipient) {
            await emailService.sendCustomEmail(
              recipient,
              `🎂 Birthday Alert: ${student.full_name} (${timing})`,
              emailContent
            );
          }
        }
      }
      
      console.log(`✅ Birthday notifications sent for ${students.length} members.`);
    } catch (error) {
      console.error('❌ Birthday Service API Error:', error.message);
    }
  }

  start() {
    this.checkBirthdays();
    setInterval(() => this.checkBirthdays(), 24 * 60 * 60 * 1000); 
  }
}

export default new BirthdayService();
