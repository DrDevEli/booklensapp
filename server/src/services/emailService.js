import nodemailer from 'nodemailer';
import { getEnvConfig } from '../utils/envValidator.js';
import logger from '../config/logger.js';

// Get email configuration from environment
const emailConfig = getEnvConfig({
  SMTP_HOST: { default: '' },
  SMTP_PORT: { type: 'number', default: 587 },
  SMTP_USER: { default: '' },
  SMTP_PASS: { default: '' },
  FRONTEND_URL: { default: 'http://localhost:3000' },
  NODE_ENV: { default: 'development' }
});

// Create a test account for development if SMTP credentials are not provided
let testAccount;
let transporter;

/**
 * Initialize the email transporter
 */
async function initializeTransporter() {
  try {
    // If we're in development and no SMTP credentials are provided, use Ethereal
    if (emailConfig.NODE_ENV === 'development' && 
        (!emailConfig.SMTP_HOST || !emailConfig.SMTP_USER || !emailConfig.SMTP_PASS)) {
      testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      logger.info('Using Ethereal test account for email', { 
        user: testAccount.user 
      });
    } else {
      // Use provided SMTP credentials
      transporter = nodemailer.createTransport({
        host: emailConfig.SMTP_HOST,
        port: emailConfig.SMTP_PORT,
        secure: emailConfig.SMTP_PORT === 465,
        auth: {
          user: emailConfig.SMTP_USER,
          pass: emailConfig.SMTP_PASS
        }
      });
      
      logger.info('Email transporter initialized with SMTP settings');
    }
    
    // Verify connection
    await transporter.verify();
    logger.info('Email service is ready');
    return true;
  } catch (error) {
    logger.error('Failed to initialize email service', { error: error.message });
    return false;
  }
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Email send info
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    if (!transporter) {
      await initializeTransporter();
    }
    
    const mailOptions = {
      from: `"BookLens API" <${emailConfig.SMTP_USER || testAccount?.user || 'noreply@booklens.com'}>`,
      to,
      subject,
      html,
      text
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // If using Ethereal, log the preview URL
    if (testAccount) {
      logger.info('Email preview URL', { 
        previewUrl: nodemailer.getTestMessageUrl(info) 
      });
    }
    
    logger.info('Email sent successfully', { 
      messageId: info.messageId,
      to
    });
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: testAccount ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    logger.error('Failed to send email', { 
      error: error.message,
      to
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send a verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} username - User's name
 * @returns {Promise<Object>} - Email send info
 */
async function sendVerificationEmail(email, token, username) {
  const verificationUrl = `${emailConfig.FRONTEND_URL}/verify-email/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email Address</h2>
      <p>Hello ${username},</p>
      <p>Thank you for registering with BookLens. Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The BookLens Team</p>
    </div>
  `;
  
  const text = `
    Verify Your Email Address
    
    Hello ${username},
    
    Thank you for registering with BookLens. Please verify your email address by visiting the link below:
    
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    Best regards,
    The BookLens Team
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email Address - BookLens',
    html,
    text
  });
}

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @param {string} username - User's name
 * @returns {Promise<Object>} - Email send info
 */
async function sendPasswordResetEmail(email, token, username) {
  const resetUrl = `${emailConfig.FRONTEND_URL}/reset-password/${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>The BookLens Team</p>
    </div>
  `;
  
  const text = `
    Reset Your Password
    
    Hello ${username},
    
    We received a request to reset your password. Please visit the link below to create a new password:
    
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email or contact support if you have concerns.
    
    Best regards,
    The BookLens Team
  `;
  
  return sendEmail({
    to: email,
    subject: 'Password Reset Request - BookLens',
    html,
    text
  });
}

// Initialize the transporter when the module is imported
initializeTransporter();

export default {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};
