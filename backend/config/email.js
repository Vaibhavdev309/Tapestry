import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Load and compile email template
const loadTemplate = (templateName) => {
  try {
    const templatePath = path.join(__dirname, `../templates/email/${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, "utf8");
    return handlebars.compile(templateSource);
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    return null;
  }
};

// Send email with template
export const sendEmail = async (to, subject, templateName, data = {}) => {
  try {
    const transporter = createTransporter();
    const template = loadTemplate(templateName);

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = template(data);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

// Send simple text email
export const sendSimpleEmail = async (to, subject, text) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Simple email sent successfully to ${to}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Simple email sending failed:", error);
    return { success: false, error: error.message };
  }
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email configuration verified successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Email configuration verification failed:", error);
    return { success: false, error: error.message };
  }
};

export default { sendEmail, sendSimpleEmail, verifyEmailConfig };