import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@qts.app",
    to,
    subject: "QTS Password Reset",
    text: `Reset your password here: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `<p>Reset your password <a href="${resetUrl}">here</a>.</p><p>This link expires in 1 hour.</p>`,
  });
}
