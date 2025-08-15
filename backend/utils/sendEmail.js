const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;

  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    // SendGrid configuration
    transporter = nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    // SMTP configuration (Gmail, etc.)
    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  const message = {
    from: `${process.env.FROM_NAME || 'SkillBridge'} <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
  return info;
};

module.exports = sendEmail;