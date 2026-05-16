import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  family: 4 // Force IPv4
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email Server Error:', error);
  } else {
    console.log('🚀 Email Server is ready to take our messages');
  }
});

const APP_NAME = 'NACOS LASUSTECH';
const PRIMARY_COLOR = '#169B2D';
const SECONDARY_COLOR = '#1F5FAF';

const emailHeader = `
  <div style="padding: 20px; font-family: sans-serif; color: #333; background-color: #f9f9f9;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #eee; border-radius: 8px;">
      <div style="padding: 20px; border-bottom: 2px solid ${PRIMARY_COLOR};">
        <h2 style="margin: 0; color: ${PRIMARY_COLOR};">${APP_NAME}</h2>
      </div>
      <div style="padding: 30px;">
`;

const emailFooter = `
      </div>
      <div style="padding: 20px; background-color: #f5f5f5; border-radius: 0 0 8px 8px; font-size: 12px; color: #777; text-align: center;">
        <p style="margin: 0 0 10px 0;">© ${new Date().getFullYear()} NACOS LASUSTECH Chapter</p>
        <div style="margin-top: 10px;">
          <a href="https://x.com/nacoslasustech" style="color: ${SECONDARY_COLOR}; margin: 0 5px;">X</a> | 
          <a href="https://instagram.com/nacoslasustech" style="color: ${SECONDARY_COLOR}; margin: 0 5px;">Instagram</a> | 
          <a href="https://linkedin.com/company/nacos-lasustech" style="color: ${SECONDARY_COLOR}; margin: 0 5px;">LinkedIn</a>
        </div>
      </div>
    </div>
  </div>
`;

/**
 * Send Contact Form Confirmation to User
 */
export const sendContactConfirmation = async (userEmail, userName) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: 'Message Received - NACOS LASUSTECH',
    text: `Hello ${userName},\n\nThank you for reaching out to the NACOS LASUSTECH Chapter. We've received your message and our team is already looking into it.\n\nYou'll hear from us as soon as possible.\n\nBest regards,\nThe NACOS Executive Council`,
    html: `
      ${emailHeader}
      <h2 style="color: #1e293b; margin-top: 0;">Hello ${userName},</h2>
      <p style="color: #475569; line-height: 1.6;">Thank you for reaching out to the NACOS LASUSTECH Chapter. We've received your message and our team is already looking into it.</p>
      <p style="color: #475569; line-height: 1.6;">You'll hear from us as soon as possible. In the meantime, feel free to explore our website or follow us on social media for the latest updates.</p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-left: 4px solid ${PRIMARY_COLOR}; border-radius: 4px;">
        <p style="margin: 0; font-style: italic; color: #64748b;">"Building the next generation of computing leaders through learning, innovation, and community."</p>
      </div>
      
      <p style="color: #475569; line-height: 1.6;">Best regards,<br><strong>The NACOS Executive Council</strong></p>
      ${emailFooter}
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Contact Form Notification to Admin
 */
export const sendContactNotificationToAdmin = async (contactData) => {
  const { full_name, email, subject, message } = contactData;
  const mailOptions = {
    from: `"${APP_NAME} Portal" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Message: ${subject}`,
    text: `New Contact Submission\n\nName: ${full_name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `
      ${emailHeader}
      <h3 style="color: #333; margin-top: 0;">New Contact Form Submission</h3>
      <p>A new message has been submitted via the NACOS website.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 4px; border: 1px solid #eee;">
        <p><strong>From:</strong> ${full_name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      </div>
      ${emailFooter}
    `,
    replyTo: email
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Payment Receipt to User
 */
export const sendPaymentReceipt = async (userEmail, userName, paymentData) => {
  const { amount, reference, type, date } = paymentData;
  const mailOptions = {
    from: `"${APP_NAME} Finance" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: 'Payment Receipt',
    text: `Hello ${userName},\n\nPayment Successful!\n\nReference: ${reference}\nType: ${type}\nAmount: ₦${parseFloat(amount).toLocaleString()}\nDate: ${date || new Date().toLocaleDateString()}\n\nThank you.`,
    html: `
      ${emailHeader}
      <h3 style="color: #333; margin-top: 0;">Payment Successful</h3>
      <p>Hello ${userName}, thank you for your payment. Here is your receipt.</p>
      
      <div style="margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fcfcfc;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Reference</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${reference}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Type</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${type}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${date || new Date().toLocaleDateString()}</td>
          </tr>
          <tr style="border-top: 1px solid #eee;">
            <td style="padding: 15px 0 0 0; font-weight: bold; font-size: 16px;">Total Paid</td>
            <td style="padding: 15px 0 0 0; text-align: right; color: ${PRIMARY_COLOR}; font-weight: bold; font-size: 18px;">₦${parseFloat(amount).toLocaleString()}</td>
          </tr>
        </table>
      </div>
      
      <p>Your record has been updated. You can now access your dashboard.</p>
      ${emailFooter}
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Payment Notification to Admin
 */
export const sendPaymentNotificationToAdmin = async (paymentData, userDetails) => {
  const { amount, reference, type } = paymentData;
  const { full_name, matric_number } = userDetails;
  
  const mailOptions = {
    from: `"${APP_NAME} Portal" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Payment Alert: ${full_name}`,
    text: `Payment Notification\n\nStudent: ${full_name} (${matric_number})\nAmount: ₦${parseFloat(amount).toLocaleString()}\nReference: ${reference}`,
    html: `
      ${emailHeader}
      <h3 style="color: #333; margin-top: 0;">Payment Notification</h3>
      <p>A new payment has been processed.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 4px; border: 1px solid #eee;">
        <p><strong>Student:</strong> ${full_name} (${matric_number})</p>
        <p><strong>Payment For:</strong> ${type}</p>
        <p><strong>Amount:</strong> ₦${parseFloat(amount).toLocaleString()}</p>
        <p><strong>Reference:</strong> ${reference}</p>
      </div>
      ${emailFooter}
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Password Reset Notification
 */
export const sendPasswordReset = async (userEmail, userName, tempPassword) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: 'Password Reset Request',
    text: `Hello ${userName},\n\nWe received a request to reset your NACOS Portal password. Your temporary password is: ${tempPassword}\n\nPlease login and change your password immediately.\n\nIf you did not request this, please contact the admin.`,
    html: `
      ${emailHeader}
      <h3 style="color: #333; margin-top: 0;">Password Reset Request</h3>
      <p>Hello ${userName}, we received a request to reset your password for the NACOS LASUSTECH Portal.</p>
      
      <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Temporary Password</p>
        <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 24px; color: ${PRIMARY_COLOR}; font-weight: bold;">${tempPassword}</p>
      </div>
      
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">Please use this password to log in and then <strong>change it immediately</strong> from your profile settings.</p>
      <p style="color: #ef4444; font-size: 11px;">If you did not request this, please ignore this email or contact support if you have concerns.</p>
      ${emailFooter}
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send OTP for Password Reset
 */
export const sendOtp = async (userEmail, userName, otpCode) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Your Verification Code: ${otpCode}`,
    html: `
      ${emailHeader}
      <h3 style="color: #333; margin-top: 0;">Verify Your Account</h3>
      <p>Hello ${userName}, use the code below to complete your verification.</p>
      
      <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
        <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 32px; color: ${PRIMARY_COLOR}; font-weight: bold; letter-spacing: 5px;">${otpCode}</p>
      </div>
      
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      ${emailFooter}
    `,
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send Custom HTML Email
 */
export const sendCustomEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: `"${APP_NAME}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: `
      ${emailHeader}
      ${htmlContent}
      ${emailFooter}
    `,
  };

  return transporter.sendMail(mailOptions);
};

export default {
  sendContactConfirmation,
  sendContactNotificationToAdmin,
  sendPaymentReceipt,
  sendPaymentNotificationToAdmin,
  sendPasswordReset,
  sendOtp,
  sendCustomEmail
};
