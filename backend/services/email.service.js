const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || `"Nexus Care" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

const emailTemplates = {
  otpVerification: (name, otp) => ({
    subject: 'Verify Your Nexus Care Account',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:40px 20px">
        <div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <div style="text-align:center;margin-bottom:32px">
            <div style="width:60px;height:60px;background:linear-gradient(135deg,#0ea5e9,#2563eb);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
              <span style="color:#fff;font-size:24px">⚕</span>
            </div>
            <h1 style="color:#0f172a;font-size:24px;margin:0;font-weight:700">Nexus Care</h1>
          </div>
          <h2 style="color:#0f172a;font-size:20px;margin-bottom:8px">Hello, ${name}!</h2>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin-bottom:28px">
            Thank you for registering with Nexus Care. Please use the OTP below to verify your email address.
          </p>
          <div style="background:#f0f9ff;border:2px dashed #0ea5e9;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600">Your Verification Code</p>
            <p style="color:#0ea5e9;font-size:40px;font-weight:800;letter-spacing:12px;margin:0">${otp}</p>
            <p style="color:#94a3b8;font-size:13px;margin:12px 0 0">Valid for 10 minutes</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;text-align:center">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
  }),

  appointmentBooked: (patientName, doctorName, date, time, tokenNumber) => ({
    subject: 'Appointment Confirmed - Nexus Care',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:40px 20px">
        <div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <h1 style="color:#0ea5e9;font-size:22px;margin-bottom:4px">Appointment Confirmed ✓</h1>
          <p style="color:#64748b;margin-bottom:24px">Your appointment has been successfully booked.</p>
          <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:24px">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#64748b;font-size:14px">Patient</span>
              <span style="color:#0f172a;font-weight:600;font-size:14px">${patientName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#64748b;font-size:14px">Doctor</span>
              <span style="color:#0f172a;font-weight:600;font-size:14px">Dr. ${doctorName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#64748b;font-size:14px">Date</span>
              <span style="color:#0f172a;font-weight:600;font-size:14px">${date}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#64748b;font-size:14px">Time</span>
              <span style="color:#0f172a;font-weight:600;font-size:14px">${time}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:#64748b;font-size:14px">Token #</span>
              <span style="color:#0ea5e9;font-weight:800;font-size:18px">${tokenNumber}</span>
            </div>
          </div>
          <p style="color:#94a3b8;font-size:13px">Please arrive 10 minutes before your scheduled time. Bring your token number.</p>
        </div>
      </div>
    `
  }),

  prescriptionReady: (patientName, doctorName, prescriptionNumber) => ({
    subject: 'Prescription Ready - Nexus Care',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:40px 20px">
        <div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <h1 style="color:#10b981;font-size:22px;margin-bottom:4px">Prescription Ready 💊</h1>
          <p style="color:#64748b;margin-bottom:24px">Dear ${patientName}, your prescription is ready.</p>
          <p style="color:#64748b">Dr. <strong>${doctorName}</strong> has issued prescription <strong>${prescriptionNumber}</strong>. You can view and download it from your Nexus Care dashboard.</p>
        </div>
      </div>
    `
  }),

  appointmentReminder: (patientName, doctorName, date, time) => ({
    subject: 'Appointment Reminder - Nexus Care',
    html: `
      <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:40px 20px">
        <div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
          <h1 style="color:#f59e0b;font-size:22px;margin-bottom:4px">⏰ Appointment Reminder</h1>
          <p style="color:#64748b;margin-bottom:24px">Hi ${patientName}, this is a reminder for your upcoming appointment.</p>
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="margin:0;color:#0f172a"><strong>Dr. ${doctorName}</strong></p>
            <p style="margin:4px 0 0;color:#64748b">${date} at ${time}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px">Please arrive 10 minutes early. If you need to cancel, please do so at least 2 hours in advance.</p>
        </div>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
