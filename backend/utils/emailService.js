// Email Service using Nodemailer

const nodemailer = require('nodemailer');

// Create transporter (configure based on your email service)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Mock transporter for development
const mockTransporter = {
  sendMail: (mailOptions) => {
    console.log('📧 Mock Email Sent:');
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('Text:', mailOptions.text?.substring(0, 100) + '...');
    return Promise.resolve({ messageId: 'mock-message-id' });
  }
};

// Use mock in development, real in production
const emailTransporter = process.env.NODE_ENV === 'production' ? transporter : mockTransporter;

exports.sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Campus Safety <safety@campus.edu>',
      to,
      subject,
      text
    };
    
    if (html) {
      mailOptions.html = html;
    }
    
    const info = await emailTransporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Email Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send report confirmation email
exports.sendReportConfirmation = async (email, reportId, reportDetails) => {
  const subject = 'Campus Safety Report Confirmation';
  const text = `
Dear Student,

Thank you for reporting the incident. Your report has been received successfully.

Report ID: ${reportId}
Category: ${reportDetails.category}
Status: ${reportDetails.status}
Date: ${new Date(reportDetails.createdAt).toLocaleDateString()}

Your report is completely anonymous and will be reviewed by our security team.
If this is an emergency, please contact campus security immediately at 911.

Stay safe,
Campus Safety Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background-color: #f9f9f9; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .report-id { background-color: #e0e7ff; padding: 10px; border-radius: 5px; font-weight: bold; }
    .emergency { background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Campus Safety Platform</h1>
    </div>
    <div class="content">
      <h2>Report Confirmation</h2>
      <p>Dear Student,</p>
      <p>Thank you for reporting the incident. Your report has been received successfully.</p>
      
      <div class="report-id">
        <strong>Report ID:</strong> ${reportId}
      </div>
      
      <p><strong>Category:</strong> ${reportDetails.category}</p>
      <p><strong>Status:</strong> ${reportDetails.status}</p>
      <p><strong>Date:</strong> ${new Date(reportDetails.createdAt).toLocaleDateString()}</p>
      
      <div class="emergency">
        <strong>🚨 Emergency Contacts:</strong><br>
        Campus Security: 911<br>
        Women's Helpline: 1091<br>
        Police: 100
      </div>
      
      <p>Your report is completely anonymous and will be reviewed by our security team.</p>
      <p>Stay safe,<br>Campus Safety Team</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Campus Safety Platform. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
  
  return await this.sendEmail(email, subject, text, html);
};

// Send admin notification
exports.sendAdminNotification = async (adminEmail, report) => {
  const subject = `New Safety Report: ${report.category.toUpperCase()}`;
  const text = `
New safety report submitted:

Report ID: ${report.reportId}
Category: ${report.category}
Severity: ${report.severity}
Location: ${report.location.address}
Description: ${report.description.substring(0, 200)}...

Please review the report in the admin dashboard.

Campus Safety Platform
  `;
  
  return await this.sendEmail(adminEmail, subject, text);
};