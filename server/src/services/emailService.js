
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendEmail = async (to, subject, message) => {
    try {
        const mailOptions = {
            from: `"CampusOS" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            text: message
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent successfully:", info.messageId);

        return info;
    } catch (error) {
        console.error("Email sending failed:", error.message);
        throw error;
    }
};

module.exports = sendEmail;
