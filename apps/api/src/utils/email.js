const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendInvitationEmail = async ({ toEmail, workspaceName, inviterName, role }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `You've been invited to ${workspaceName} on Team Hub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6366f1; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Team Hub</h1>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">You've been invited! 🎉</h2>
          <p style="color: #475569; font-size: 16px;">
            <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
          </p>
          <a href="${process.env.CLIENT_URL}/register" 
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 24px;">
            If you don't have an account yet, you'll be asked to create one.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">Team Hub — Collaborative Workspace</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendMentionEmail = async ({ toEmail, mentionedByName, workspaceName, comment }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `${mentionedByName} mentioned you in ${workspaceName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6366f1; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Team Hub</h1>
        </div>
        <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">You were mentioned! 💬</h2>
          <p style="color: #475569; font-size: 16px;">
            <strong>${mentionedByName}</strong> mentioned you in <strong>${workspaceName}</strong>:
          </p>
          <div style="background: white; border-left: 4px solid #6366f1; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="color: #1e293b; margin: 0; font-style: italic;">"${comment}"</p>
          </div>
          <a href="${process.env.CLIENT_URL}/dashboard/announcements"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            View Comment
          </a>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">Team Hub — Collaborative Workspace</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendInvitationEmail, sendMentionEmail };