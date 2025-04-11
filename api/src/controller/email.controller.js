const mailgun = require('mailgun-js');
const { mailgunApi, mailgunDomain, frontendUrl } = require("../config");

class EmailCtrl {

    constructor() {
        this.mg = mailgun({ apiKey: mailgunApi, domain: mailgunDomain });
        this.logoUrl = '<img src=https://midstream-wine.vercel.app/assets/logo-BGCVPzqJ.png alt="Midstream Logo" style="width: auto; height: 100px;"></img>'
        
    }

    getFooter() {
        const currentYear = new Date().getFullYear();
        return `
        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f7f7f7; border-top: 1px solid #ddd;">
            <p style="color: #555; font-size: 14px; line-height: 1.5;">
                Need help? Contact our support team at <a href="mailto:support@midstream-wine.com" style="color:rgb(239, 44, 44); text-decoration: none;">support@midstream-wine.com</a>.<br>
                Visit our website: <a href="https://midstream-wine.com" style="color:rgb(239, 44, 44); text-decoration: none;">midstream-wine.com</a><br>
                © ${currentYear} Midstream Energy Production and Distribution. All rights reserved.
            </p>
        </div>`;
    }

    async welcomeEmailEnumerator(email, password) {

        let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center;">
                ${this.logoUrl}
            </div>
            <h2 style="color: #333; text-align: center;">Welcome to WashPro</h2>
            <h3 style="color: #2cbeef; text-align: center; font-weight: normal;">Water Sanitation and Hygiene Management Information System</h3>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Hello,
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Welcome to Midstream - your comprehensive platform for Energy Production and Distribution. Below are your account credentials and verification code:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                    <p style="margin: 0; color: #555;">Your temporary password:</p>
                    <h3 style="background-color:rgb(239, 44, 44); color: white; padding: 10px; border-radius: 5px; margin: 10px 0;">${password}</h3>
                    <p style="margin: 0; color: #555; font-style: italic;">For security reasons, you will be required to change this password upon your first login.</p>
                </div>
            </div>
                <p style="color: #555; font-size: 16px; line-height: 1.5;">
                As an enumerator, you will log in via mobile and can only capture data.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Login Steps:
                <ol style="color: #555; font-size: 16px; line-height: 1.5;">
                    <li>Download the mobile app from <a href="https://washpro.ng/login" style="color: #2cbeef; text-decoration: none;">this link</a></li>
                    <li>Login with your email and the temporary password provided above</li>
                    <li>You will be prompted to set a new password</li>
                </ol>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                If you did not sign up for a WashPro account, please ignore this email.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                The WashPro Team
            </p>
            ${this.getFooter()}
        </div>`;

        const emailData = {
            from: `WashPro WASH-MIS <no-reply@|${mailgunDomain}>`,
            to: email,
            subject: "Welcome to WashPro - Verify Your Account",
            html: html,
        };

        try {
            await this.mg.messages().send(emailData);
        } catch (error) {
            console.error(error.message);
            throw new Error(error.message);
        }
    }

    async verifyEmailEnumerator(email, otp) {

        let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center;">
                ${this.logoUrl}
            </div>
            <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
            <h3 style="color:rgb(239, 44, 44); text-align: center; font-weight: normal;">Midstream Energy Production and Distribution</h3>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Hello,
            </p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Thank you for registering with Midstream. To complete your registration, please use the verification code below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0; color: #555; font-size: 14px;">Your verification code is:</p>
                    <h2 style="background-color:rgb(239, 44, 44); color: white; padding: 15px; border-radius: 5px; margin: 10px 0; font-size: 24px; letter-spacing: 5px;">${otp}</h2>
                    <p style="margin: 0; color: #777; font-size: 13px;">This code will expire in 10 minutes</p>
                </div>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                If you didn't request this verification code, please ignore this email.
            </p>
            
            <p style="color: #555; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                Best regards,<br>
                The Midstream Team
            </p>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #777; font-size: 12px; text-align: center;">
                    This is an automated message, please do not reply to this email.
                </p>
            </div>
            
            ${this.getFooter()}
        </div>`;

        const emailData = {
            from: `Midstream Energy Production and Distribution <no-reply@${mailgunDomain}>`,
            to: email,
            subject: "Welcome to Midstream - Verify Your Email",
            html: html,
        };

        try {
            await this.mg.messages().send(emailData);
        } catch (error) {
            console.error(error.message);
            throw new Error(error.message);
        }
    }

    async welcomeEmailUser(email, token) {

        let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center;">
                ${this.logoUrl}
            </div>
            <h2 style="color: #333; text-align: center;">Welcome to WashPro</h2>
            <h3 style="color: #2cbeef; text-align: center; font-weight: normal;">Water Sanitation and Hygiene Management Information System</h3>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Hello,
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Welcome to WashPro - your comprehensive platform for Water, Sanitation, and Hygiene management. Please click the button below to verify your account:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${frontendUrl}/account-setup?token=${token}" style="background-color: #2cbeef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Your Account</a>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                If you did not sign up for a WashPro account, please ignore this email.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                The WashPro Team
            </p>
            ${this.getFooter()}
        </div>`;

        const emailData = {
            from: `Midstream Energy Production and Distribution <no-reply@${mailgunDomain}>`,
            to: email,
            subject: "Welcome to Midstream - Verify Your Account",
            html: html,
        };

        try {
            await this.mg.messages().send(emailData);
        } catch (error) {
            console.error(error.message);
            throw new Error(error.message);
        }
    }

    async forgetPasswordEnumerator(email, code) {
        let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center;">
                ${this.logoUrl}
            </div>
            <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
            <h3 style="color: #2cbeef; text-align: center; font-weight: normal;">Water Sanitation and Hygiene Management Information System</h3>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Hello,
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your WashPro account. To ensure the security of your account, please use the verification code below:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <h3 style="background-color: #2cbeef; color: white; padding: 10px; border-radius: 5px;">${code}</h3>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                This code will expire in 15 minutes for security purposes. If you did not request a password reset, please contact our support team immediately.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                The WashPro Team
            </p>
            ${this.getFooter()}
        </div>`;

        const emailData = {
            from: `Midstream Energy Production and Distribution <no-reply@${mailgunDomain}>`,
            to: email,
            subject: "Midstream Password Reset Request",
            html: html,
        };

        try {
            await this.mg.messages().send(emailData);
        } catch (error) {
            console.error(error.message);
            throw new Error(error.message);
        }
    }

    async forgetPasswordUser(email, token) {
        let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <div style="text-align: center;">
                ${this.logoUrl}
            </div>
            <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
            <h3 style="color: #2cbeef; text-align: center; font-weight: normal;">Water Sanitation and Hygiene Management Information System</h3>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Hello,
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your WashPro account. Please click the button below to reset your password:
            </p>
            <div style="text-align: center; margin: 20px 0;">
                <a href="${frontendUrl}/reset-password?token=${token}" style="background-color: #2cbeef; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                This link will expire in 15 minutes for security purposes. If you did not request a password reset, please contact our support team immediately.
            </p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">
                Best regards,<br>
                The WashPro Team
            </p>
            ${this.getFooter()}
        </div>`;

        const emailData = {
            from: `Midstream Energy Production and Distribution <no-reply@|${mailgunDomain}>`,
            to: email,
            subject: "Midstream Password Reset Request",
            html: html,
        };

        try {
            await this.mg.messages().send(emailData);
        } catch (error) {
            console.error(error.message);
            throw new Error(error.message);
        }
    }
}

module.exports = new EmailCtrl();
