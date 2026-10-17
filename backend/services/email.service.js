import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';
import { centralGet, centralPost } from './central.service.js';

dotenv.config();

// Mail settings come from the environment, so the provider can change without touching code.
// Some hosts (for example Render's free plan) block the usual mail ports 25, 465 and 587; a provider
// that also listens on 2525 (Brevo, SendGrid, Mailgun) works there.
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_SECURE = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : SMTP_PORT === 465 || SMTP_PORT === 2465; // implicit TLS only on those ports; others use STARTTLS

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: SMTP_PORT,
  secure: SMTP_SECURE, // STARTTLS on 587/2525/2587, avoids IPv6 issues that plague port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // Force IPv4: look up the hostname and pin the resolved IPv4 address
  dnsLookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// Two ways to send:
//  - EMAIL_TRANSPORT=central: ask the central PHP API to send it (used on Render, whose free plan blocks the
//    SMTP ports; the PHP server sends through its own mail account).
//  - otherwise: send straight over SMTP with the settings above (used on a computer or a host that allows it).
const USE_CENTRAL = process.env.EMAIL_TRANSPORT === 'central';
export const usesCentralMail = USE_CENTRAL;

/** Sends one prepared email through the central PHP API. */
const sendViaCentral = async (mailOptions) => {
  const fromName = String(mailOptions.from || '').match(/^"?([^"<]+?)"?\s*</)?.[1];
  try {
    await centralPost('send_email', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      from_name: fromName,
      reply_to: mailOptions.replyTo,
    });
  } catch (error) {
    // Keep the PHP API's own explanation (for example "mail_config.php is missing") instead of a bare status code.
    const reason = error.response?.data?.message || error.message;
    const wrapped = new Error(reason);
    // 429 means the PHP server's hourly sending cap was reached: not a failure, just wait and try again.
    wrapped.code = error.response?.status === 429 ? 'ERATELIMIT' : error.response ? 'ECENTRAL' : 'ECONNECTION';
    throw wrapped;
  }
  return { accepted: [mailOptions.to], rejected: [] };
};

const mailer = {
  sendMail: (mailOptions) => (USE_CENTRAL ? sendViaCentral(mailOptions) : transporter.sendMail(mailOptions)),
};

if (USE_CENTRAL) {
  console.log('✉️  Email is sent through the central PHP server.');
} else {
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email Server Error:', error);
    } else {
      console.log('🚀 Email Server is ready to take our messages');
    }
  });
}

const APP_NAME = 'NACOS LASUSTECH';

/**
 * The From header. MAIL_FROM is the address the provider has verified as a sender; when it is not set the
 * SMTP login is used (fine for Gmail, where the login is the address).
 */
const mailFrom = (label) => `"${label}" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`;
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
    from: mailFrom(`${APP_NAME}`),
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

  return mailer.sendMail(mailOptions);
};

/**
 * Send Contact Form Notification to Admin
 */
export const sendContactNotificationToAdmin = async (contactData) => {
  const { full_name, email, subject, message } = contactData;
  const mailOptions = {
    from: mailFrom(`${APP_NAME} Portal`),
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

  return mailer.sendMail(mailOptions);
};

/**
 * Send Payment Receipt to User
 */
export const sendPaymentReceipt = async (userEmail, userName, paymentData) => {
  const { amount, reference, type, date } = paymentData;
  const mailOptions = {
    from: mailFrom(`${APP_NAME} Finance`),
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

  return mailer.sendMail(mailOptions);
};

/**
 * Send Payment Notification to Admin
 */
export const sendPaymentNotificationToAdmin = async (paymentData, userDetails) => {
  const { amount, reference, type } = paymentData;
  const { full_name, matric_number } = userDetails;
  
  const mailOptions = {
    from: mailFrom(`${APP_NAME} Portal`),
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

  return mailer.sendMail(mailOptions);
};

/**
 * Send Password Reset Notification
 */
export const sendPasswordReset = async (userEmail, userName, tempPassword) => {
  const mailOptions = {
    from: mailFrom(`${APP_NAME}`),
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

  return mailer.sendMail(mailOptions);
};

/**
 * Send OTP for Password Reset
 */
export const sendOtp = async (userEmail, userName, otpCode) => {
  const mailOptions = {
    from: mailFrom(`${APP_NAME}`),
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
      
      <p style="color: #475569; font-size: 14px; line-height: 1.6;">This code will expire in 15 minutes. If you did not request this code, please ignore this email.</p>
      ${emailFooter}
    `,
  };

  return mailer.sendMail(mailOptions);
};

/**
 * Send the email-verification code to a new fresher
 */
export const sendVerificationCode = async (userEmail, userName, otpCode) => {
  const mailOptions = {
    from: mailFrom(`${APP_NAME}`),
    to: userEmail,
    subject: `Verify your email: ${otpCode}`,
    html: `
      ${emailHeader}
      <h3 style="color: #333; margin-top: 0;">Welcome to NACOS LASUSTECH, ${userName}!</h3>
      <p>Use the code below to verify your email and finish creating your account.</p>

      <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Verification Code</p>
        <p style="margin: 10px 0 0 0; font-family: monospace; font-size: 32px; color: ${PRIMARY_COLOR}; font-weight: bold; letter-spacing: 5px;">${otpCode}</p>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6;">This code will expire in 15 minutes. If you did not create this account, please ignore this email.</p>
      ${emailFooter}
    `,
  };

  return mailer.sendMail(mailOptions);
};

/**
 * Send Custom HTML Email
 */
export const sendCustomEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: mailFrom(`${APP_NAME}`),
    to,
    subject,
    html: `
      ${emailHeader}
      ${htmlContent}
      ${emailFooter}
    `,
  };

  return mailer.sendMail(mailOptions);
};

/** Resolves if the mail server accepts our connection and login; rejects with the reason otherwise. */
export const verifyConnection = async () => {
  if (!USE_CENTRAL) return transporter.verify();
  const result = await centralGet('email_check');
  if (!result.ok) {
    const error = new Error(result.error || 'The central mail server could not be used.');
    error.code = 'ECENTRAL';
    throw error;
  }
  return true;
};

/** Turns a mail error into something a person can act on. */
export const friendlyMailError = (error) => {
  const code = error?.code;
  if (['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNREFUSED', 'ENETUNREACH', 'EDNS'].includes(code)) {
    return `Could not reach the mail server on port ${SMTP_PORT}. The host may be blocking that port (Render's free plan blocks 25, 465 and 587); use a provider on port 2525.`;
  }
  if (code === 'EAUTH') return 'The mail server rejected the login. Check SMTP_USER and SMTP_PASS.';
  if (code === 'EENVELOPE') return 'The mail server did not accept the sender or recipient address. Check MAIL_FROM is a verified sender.';
  return error?.message || 'The mail could not be sent.';
};

/** What the admin "Test email connection" button reports: where mail goes and whether it works. */
export const checkMail = async () => {
  if (USE_CENTRAL) {
    try {
      const result = await centralGet('email_check');
      return { ok: Boolean(result.ok), via: 'central', host: result.host, port: result.port, from: result.from, error: result.error, sentLastHour: result.sent_last_hour, hourlyLimit: result.hourly_limit };
    } catch (error) {
      return { ok: false, via: 'central', host: 'central PHP server', port: null, from: null, error: error.response?.data?.message || 'Could not reach the central PHP server.' };
    }
  }
  const summary = { via: 'smtp', host: process.env.SMTP_HOST || 'smtp.gmail.com', port: SMTP_PORT, from: process.env.MAIL_FROM || process.env.SMTP_USER || null };
  try {
    await transporter.verify();
    return { ok: true, ...summary };
  } catch (error) {
    return { ok: false, ...summary, error: friendlyMailError(error) };
  }
};

export const mailSettingsSummary = () => ({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: SMTP_PORT,
  from: process.env.MAIL_FROM || process.env.SMTP_USER || null,
});

export default {
  sendContactConfirmation,
  sendContactNotificationToAdmin,
  sendPaymentReceipt,
  sendPaymentNotificationToAdmin,
  sendPasswordReset,
  sendOtp,
  sendVerificationCode,
  sendCustomEmail,
  verifyConnection,
  checkMail,
  friendlyMailError,
  mailSettingsSummary,
};
