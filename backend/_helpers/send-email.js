const nodemailer = require('nodemailer');
const config = require('../config');

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from = config.emailFrom }) {
    // Ensure smtpOptions exists in your config/index.js export
    if (!config.smtpOptions) {
        console.error("FATAL ERROR: smtpOptions missing in config/index.js");
        // Handle error appropriately - maybe throw, maybe log and skip sending
        // For now, let's throw to make it obvious during development:
        throw new Error("SMTP configuration (smtpOptions) is missing.");
    }
    const transporter = nodemailer.createTransport(config.smtpOptions);
    await transporter.sendMail({ from, to, subject, html });
}