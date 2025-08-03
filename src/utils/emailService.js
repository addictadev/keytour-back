const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // sgMail.setDataResidency('eu');
    }

    createEmailHTML(otp) {
        return `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Email Verification</h2>
                <p style="color: #666; font-size: 16px;">Your OTP for verification is:</p>
                <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 20px 0;">${otp}</h1>
                <p style="color: #666; font-size: 14px;">This OTP will expire in 5 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
            </div>
        `;
    }

    async sendOTPEmail(email, otp) {
        const subject = 'Your OTP for Verification';
        const html = this.createEmailHTML(otp);
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

    async sendEmail(to, subject, html) {
        const msg = {
            to,
            from: 'mizoomizoo161@gmail.com', // This must be a verified sender in SendGrid
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
