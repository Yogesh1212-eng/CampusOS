
require("dotenv").config();

const sendEmail = require("../src/services/emailService");

const testEmail = async () => {
    try {
        await sendEmail(
            process.env.EMAIL_USER,
            "CampusOS Email Test",
            "Congratulations! CampusOS backend is successfully sending emails through Gmail."
        );

        console.log("Test email sent successfully!");
    } catch (error) {
        console.log("Test failed. Please check your Gmail configuration.");
    }
};

testEmail();
