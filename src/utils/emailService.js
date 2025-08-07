const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // sgMail.setDataResidency('eu');
    }

    // Utility method to mask email addresses
    maskEmail(email) {
        const parts = email.split('@');
        if (parts.length !== 2) return email;

        const [localPart, domain] = parts;
        const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
        
        if (localPart.length <= 3) {
            return `${localPart[0]}***@${domain}`;
        }
        
        const masked = localPart.substring(0, visibleChars) + 
                      '***' + 
                      localPart.substring(localPart.length - 1);
        
        return `${masked}@${domain}`;
    }

    createEmailHTML(otp, expiryMinutes = 5) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>KeyTour - Email Verification</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <div style="background: linear-gradient(135deg, #2C5282 0%, #2B6CB0 100%); padding: 40px 20px; text-align: center;">
                        <img src="https://placeholder-logo.com/keytour-logo.png" alt="KeyTour" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Email Verification</h1>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <p style="color: #2D3748; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                            We received a request to verify your email address. Please use the verification code below:
                        </p>
                        
                        <!-- OTP Box -->
                        <div style="background: linear-gradient(135deg, #EBF8FF 0%, #E6FFFA 100%); border: 2px solid #2B6CB0; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                            <p style="color: #2D3748; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                                Your Verification Code
                            </p>
                            <h2 style="color: #2B6CB0; font-size: 48px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace; font-weight: bold;">
                                ${otp}
                            </h2>
                            <p style="color: #718096; font-size: 14px; margin: 15px 0 0 0;">
                                <span style="display: inline-block; padding: 5px 15px; background-color: #FFF5F5; color: #E53E3E; border-radius: 20px; font-weight: 500;">
                                    Expires in ${expiryMinutes} minutes
                                </span>
                            </p>
                        </div>
                        
                        <!-- Instructions -->
                        <div style="margin: 30px 0;">
                            <p style="color: #4A5568; font-size: 15px; line-height: 1.6;">
                                Enter this code in the KeyTour app to complete your verification. This code is valid for ${expiryMinutes} minutes only.
                            </p>
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="background-color: #FFF5F5; border-left: 4px solid #FC8181; padding: 15px 20px; margin: 30px 0;">
                            <p style="color: #742A2A; font-size: 14px; margin: 0; font-weight: 600;">
                                Security Notice
                            </p>
                            <p style="color: #742A2A; font-size: 13px; margin: 5px 0 0 0; line-height: 1.5;">
                                If you didn't request this verification code, please ignore this email. Someone may have entered your email address by mistake.
                            </p>
                        </div>
                        
                        <!-- Help Section -->
                        <div style="text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #E2E8F0;">
                            <p style="color: #718096; font-size: 14px; margin-bottom: 10px;">
                                Need help? Contact our support team
                            </p>
                            <a href="mailto:support@keytour.com" style="color: #2B6CB0; text-decoration: none; font-weight: 600;">
                                support@keytour.com
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #2D3748; padding: 30px; text-align: center;">
                        <p style="color: #A0AEC0; font-size: 13px; margin: 0 0 10px 0;">
                            © ${new Date().getFullYear()} KeyTour. All rights reserved.
                        </p>
                        <p style="color: #718096; font-size: 12px; margin: 0;">
                            This is an automated message, please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async sendOTPEmail(email, otp, expiryMinutes = 5) {
        const subject = 'Your KeyTour Verification Code';
        const html = this.createEmailHTML(otp, expiryMinutes);
        return this.sendEmail(email, subject, html);
    }

    createSuspiciousLoginHTML(otp, deviceInfo, expiryMinutes = 5) {
        const { browser = 'Unknown', os = 'Unknown', location = 'Unknown', ip = 'Unknown' } = deviceInfo;
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>KeyTour - Security Alert</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <div style="background: linear-gradient(135deg, #E53E3E 0%, #C53030 100%); padding: 40px 20px; text-align: center;">
                        <img src="https://placeholder-logo.com/keytour-logo.png" alt="KeyTour" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Security Alert</h1>
                    </div>
                    
                    <!-- Alert Banner -->
                    <div style="background-color: #FED7D7; border-bottom: 3px solid #FC8181; padding: 20px 30px;">
                        <p style="color: #742A2A; font-size: 16px; margin: 0; font-weight: 600;">
                            ⚠️ New device login attempt detected
                        </p>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 40px 30px;">
                        <p style="color: #2D3748; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            We detected a login attempt from a new device or location. If this was you, please enter the verification code below:
                        </p>
                        
                        <!-- Device Info -->
                        <div style="background-color: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                            <h3 style="color: #2D3748; font-size: 16px; margin: 0 0 15px 0;">Login Attempt Details:</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #4A5568; font-size: 14px; line-height: 1.8;">
                                <li><strong>Browser:</strong> ${browser}</li>
                                <li><strong>Operating System:</strong> ${os}</li>
                                <li><strong>Location:</strong> ${location}</li>
                                <li><strong>IP Address:</strong> ${ip}</li>
                                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                            </ul>
                        </div>
                        
                        <!-- OTP Box -->
                        <div style="background: linear-gradient(135deg, #FFF5F5 0%, #FED7D7 100%); border: 2px solid #E53E3E; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                            <p style="color: #742A2A; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                                Your Verification Code
                            </p>
                            <h2 style="color: #E53E3E; font-size: 48px; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace; font-weight: bold;">
                                ${otp}
                            </h2>
                            <p style="color: #742A2A; font-size: 14px; margin: 15px 0 0 0;">
                                <span style="display: inline-block; padding: 5px 15px; background-color: #2D3748; color: #FFFFFF; border-radius: 20px; font-weight: 500;">
                                    Expires in ${expiryMinutes} minutes
                                </span>
                            </p>
                        </div>
                        
                        <!-- Security Notice -->
                        <div style="background-color: #FFF5F5; border-left: 4px solid #FC8181; padding: 15px 20px; margin: 30px 0;">
                            <p style="color: #742A2A; font-size: 14px; margin: 0; font-weight: 600;">
                                ⚠️ Not You?
                            </p>
                            <p style="color: #742A2A; font-size: 13px; margin: 5px 0 0 0; line-height: 1.5;">
                                If you didn't attempt to log in, your account may be compromised. Please change your password immediately and contact our support team.
                            </p>
                        </div>
                        
                        <!-- Actions -->
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="https://keytour.com/security" style="display: inline-block; background-color: #E53E3E; color: #FFFFFF; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                Review Account Security
                            </a>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #2D3748; padding: 30px; text-align: center;">
                        <p style="color: #A0AEC0; font-size: 13px; margin: 0 0 10px 0;">
                            © ${new Date().getFullYear()} KeyTour. All rights reserved.
                        </p>
                        <p style="color: #718096; font-size: 12px; margin: 0;">
                            This is an automated security alert. If you have concerns, contact support@keytour.com
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    async sendSuspiciousLoginOTP(email, otp, deviceInfo, expiryMinutes = 5) {
        const subject = '🔒 Security Alert - New Device Login Attempt';
        const html = this.createSuspiciousLoginHTML(otp, deviceInfo, expiryMinutes);
        return this.sendEmail(email, subject, html);
    }

    createBookingConfirmationHTML(user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
                <h2 style="color: #333;">Booking Request Received</h2>
                <p>Dear ${user.name},</p>
                <p>We have received your booking request for the tour: <strong>${booking.tour.title}</strong>.</p>
                <p>Your booking is currently pending and will be reviewed by the vendor shortly.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                    <li><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
                    <li><strong>Total Price:</strong> ${booking.totalPrice}</li>
                </ul>
                <p>We will notify you again once your booking is confirmed.</p>
                <p>Thank you for choosing us!</p>
            </div>
        `;
    }

    createVendorNotificationHTML(vendor, user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
                <h2 style="color: #333;">New Booking Request</h2>
                <p>Hello ${vendor.name},</p>
                <p>You have received a new booking request from <strong>${user.name}</strong> for your tour: <strong>${booking.tour.title}</strong>.</p>
                <p>Please review the details and take action.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>User:</strong> ${user.name} (${user.email})</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                    <li><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
                </ul>
                <p>You can manage this booking from your vendor dashboard.</p>
            </div>
        `;
    }

     createAdminNotificationHTML(admin, user, vendor, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd;">
                <h2 style="color: #333;">New Booking Created (Admin Notification)</h2>
                <p>Hello ${admin.name},</p>
                <p>A new booking has been created in the system.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>User:</strong> ${user.name} (${user.email})</li>
                    <li><strong>Vendor:</strong> ${vendor.name} (${vendor.email})</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                    <li><strong>Total Price:</strong> ${booking.totalPrice}</li>
                </ul>
            </div>
        `;
    }

    createBookingConfirmedHTML(user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #28a745;">
                <h2 style="color: #28a745;">Booking Confirmed!</h2>
                <p>Dear ${user.name},</p>
                <p>Great news! Your booking for the tour: <strong>${booking.tour.title}</strong> has been confirmed.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                    <li><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
                    <li><strong>Total Price:</strong> ${booking.totalPrice}</li>
                </ul>
                <p>We look forward to seeing you!</p>
            </div>
        `;
    }

    createBookingRejectedHTML(user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #dc3545;">
                <h2 style="color: #dc3545;">Booking Status Update</h2>
                <p>Dear ${user.name},</p>
                <p>We regret to inform you that your booking status for the tour: <strong>${booking.tour.title}</strong> has been updated to <strong>${booking.status}</strong>.</p>
                <p>If you have any questions, please contact our support.</p>
                <p>We apologize for any inconvenience.</p>
            </div>
        `;
    }

    createCancellationNotificationForVendorHTML(vendor, user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ffc107;">
                <h2 style="color: #333;">Booking Cancellation Notice</h2>
                <p>Hello ${vendor.name},</p>
                <p>Please be advised that the user <strong>${user.name}</strong> has cancelled their booking for the tour: <strong>${booking.tour.title}</strong>.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                    <li><strong>User:</strong> ${user.name} (${user.email})</li>
                </ul>
                <p>This tour's slot may now be available for other customers.</p>
            </div>
        `;
    }

    createCancellationNotificationForUserHTML(user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #dc3545;">
                <h2 style="color: #dc3545;">Booking Cancelled by Vendor</h2>
                <p>Dear ${user.name},</p>
                <p>We are writing to inform you that your booking for the tour: <strong>${booking.tour.title}</strong> has been cancelled by the provider.</p>
                <p>We sincerely apologize for this inconvenience. Please contact our support team if you have any questions or wish to explore other options.</p>
                 <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                </ul>
            </div>
        `;
    }

    createPaymentSuccessHTML(user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #28a745;">
                <h2 style="color: #28a745;">Payment Successful & Booking Confirmed!</h2>
                <p>Dear ${user.name},</p>
                <p>Your payment for the tour: <strong>${booking.tour.title}</strong> was successful. Your booking is now confirmed!</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                    <li><strong>Amount Paid:</strong> ${booking.totalPrice}</li>
                    <li><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</li>
                </ul>
                <p>We look forward to seeing you. You can view your booking details in your account.</p>
            </div>
        `;
    }

    createBookingConfirmedForVendorHTML(vendor, user, booking) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #17a2b8;">
                <h2 style="color: #17a2b8;">New Confirmed Booking!</h2>
                <p>Hello ${vendor.name},</p>
                <p>You have a new confirmed booking from <strong>${user.name}</strong> for your tour: <strong>${booking.tour.title}</strong>.</p>
                <p>The payment has been successfully processed.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>User:</strong> ${user.name} (${user.email})</li>
                    <li><strong>Tour:</strong> ${booking.tour.title}</li>
                </ul>
                <p>Please prepare for the upcoming tour.</p>
            </div>
        `;
    }

    createVendorAcceptedHTML(vendor) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #28a745;">
                <h2 style="color: #28a745;">Welcome to KeyTour!</h2>
                <p>Dear ${vendor.name},</p>
                <p>Congratulations! Your application to become a vendor on KeyTour has been accepted.</p>
                <p>You can now log in to your dashboard and start creating tours.</p>
                <p>We are excited to have you on board!</p>
            </div>
        `;
    }

    createVendorRejectedHTML(vendor) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #dc3545;">
                <h2 style="color: #dc3545;">Update on your KeyTour Application</h2>
                <p>Dear ${vendor.name},</p>
                <p>We regret to inform you that your application to become a vendor on KeyTour has been rejected at this time.</p>
                <p>If you have any questions, please contact our support.</p>
                <p>We appreciate your interest in our platform.</p>
            </div>
        `;
    }

    createVendorWelcomeHTML(vendor) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #17a2b8;">
                <h2 style="color: #17a2b8;">Welcome to KeyTour - Application Received!</h2>
                <p>Dear ${vendor.name},</p>
                <p>Thank you for registering as a vendor with KeyTour. We have successfully received your application.</p>
                <p><strong>What happens next?</strong></p>
                <ul>
                    <li>Our team will review your application within 24-48 hours</li>
                    <li>You will receive an email notification once your application is reviewed</li>
                    <li>If approved, you'll be able to log in and start creating tours</li>
                </ul>
                <p><strong>Your Application Details:</strong></p>
                <ul>
                    <li><strong>Company Name:</strong> ${vendor.company_name}</li>
                    <li><strong>Email:</strong> ${vendor.email}</li>
                    <li><strong>Status:</strong> Pending Review</li>
                </ul>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
                <p>We look forward to potentially having you as part of our vendor network!</p>
                <p>Best regards,<br>The KeyTour Team</p>
            </div>
        `;
    }

    async sendEmail(to, subject, html) {
        const msg = {
            to,
            from: 'admin@keytor.com', // This must be a verified sender in SendGrid
            subject,
            html,
        };

        try {
          const result =  await sgMail.send(msg);
          console.log(result,'result');
            console.log(`Email sent successfully to: ${to}`);
            return true;
        } catch (error) {
            console.error(`Error sending email to ${to}:`);
            if (error.response) {
                console.error(error.response.body);
            }
            return false;
        }
    }
}

module.exports = new EmailService();
