require('dotenv').config();
const emailService = require('./src/utils/emailService');

/**
 * Email Service Test Script
 * Tests various email functionalities of the EmailService
 */

class EmailTester {
    constructor() {
        this.testEmail = process.env.TEST_EMAIL || 'mahmoudmetawea161@gmail.com';
        this.testResults = [];
    }

    // Helper method to log test results
    logTest(testName, success, message = '') {
        const status = success ? '✅ PASS' : '❌ FAIL';
        const result = `${status} - ${testName}${message ? ': ' + message : ''}`;
        console.log(result);
        this.testResults.push({ testName, success, message });
    }

    // Test basic email sending
    async testBasicEmail() {
        console.log('\n📧 Testing Basic Email Functionality...');
        
        try {
            const result = await emailService.sendEmail(
                this.testEmail,
                'Test Email - Basic Functionality',
                '<h1>Test Email</h1><p>This is a basic email test from KeyTour Email Service.</p>'
            );
            
            this.logTest('Basic Email Send', result, result ? 'Email sent successfully' : 'Failed to send email');
            return result;
        } catch (error) {
            this.logTest('Basic Email Send', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test OTP email template
    async testOTPEmail() {
        console.log('\n🔐 Testing OTP Email Template...');
        
        try {
            const testOTP = '123456';
            const result = await emailService.sendOTPEmail(this.testEmail, testOTP);
            
            this.logTest('OTP Email Template', result, result ? `OTP email sent with code: ${testOTP}` : 'Failed to send OTP email');
            return result;
        } catch (error) {
            this.logTest('OTP Email Template', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test booking confirmation email template
    async testBookingConfirmationEmail() {
        console.log('\n📅 Testing Booking Confirmation Email Template...');
        
        try {
            // Mock data for testing
            const mockUser = {
                name: 'John Doe',
                email: this.testEmail
            };
            
            const mockBooking = {
                _id: '507f1f77bcf86cd799439011',
                tour: {
                    title: 'Amazing City Tour'
                },
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                totalPrice: '$150'
            };

            const html = emailService.createBookingConfirmationHTML(mockUser, mockBooking);
            const result = await emailService.sendEmail(
                this.testEmail,
                'Test - Booking Confirmation',
                html
            );
            
            this.logTest('Booking Confirmation Email', result, result ? 'Booking confirmation email sent' : 'Failed to send booking confirmation');
            return result;
        } catch (error) {
            this.logTest('Booking Confirmation Email', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test vendor notification email template
    async testVendorNotificationEmail() {
        console.log('\n🏪 Testing Vendor Notification Email Template...');
        
        try {
            // Mock data for testing
            const mockVendor = {
                name: 'Jane Smith',
                email: this.testEmail
            };
            
            const mockUser = {
                name: 'John Doe',
                email: 'customer@example.com'
            };
            
            const mockBooking = {
                _id: '507f1f77bcf86cd799439011',
                tour: {
                    title: 'Amazing City Tour'
                },
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            };

            const html = emailService.createVendorNotificationHTML(mockVendor, mockUser, mockBooking);
            const result = await emailService.sendEmail(
                this.testEmail,
                'Test - New Booking Request',
                html
            );
            
            this.logTest('Vendor Notification Email', result, result ? 'Vendor notification email sent' : 'Failed to send vendor notification');
            return result;
        } catch (error) {
            this.logTest('Vendor Notification Email', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Test vendor acceptance email template
    async testVendorAcceptanceEmail() {
        console.log('\n🎉 Testing Vendor Acceptance Email Template...');
        
        try {
            const mockVendor = {
                name: 'Jane Smith'
            };

            const html = emailService.createVendorAcceptedHTML(mockVendor);
            const result = await emailService.sendEmail(
                this.testEmail,
                'Test - Welcome to KeyTour!',
                html
            );
            
            this.logTest('Vendor Acceptance Email', result, result ? 'Vendor acceptance email sent' : 'Failed to send vendor acceptance email');
            return result;
        } catch (error) {
            this.logTest('Vendor Acceptance Email', false, `Error: ${error.message}`);
            return false;
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Email Service Tests...');
        console.log(`📧 Test emails will be sent to: ${this.testEmail}`);
        console.log('⚠️  Make sure SENDGRID_API_KEY is set in your environment variables');
        
        // Check if SendGrid API key is configured
        if (!process.env.SENDGRID_API_KEY) {
            console.log('❌ SENDGRID_API_KEY environment variable is not set!');
            console.log('Please set it in your .env file or environment variables.');
            return;
        }

        const tests = [
            () => this.testBasicEmail(),
            () => this.testOTPEmail(),
            () => this.testBookingConfirmationEmail(),
            () => this.testVendorNotificationEmail(),
            () => this.testVendorAcceptanceEmail()
        ];

        let passedTests = 0;
        let totalTests = tests.length;

        for (const test of tests) {
            try {
                const result = await test();
                if (result) passedTests++;
                
                // Add delay between tests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.log(`❌ Test failed with error: ${error.message}`);
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Email service is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please check the configuration and try again.');
        }
    }

    // Run individual test methods
    async runSingleTest(testType) {
        console.log(`🚀 Running single test: ${testType}`);
        console.log(`📧 Test email will be sent to: ${this.testEmail}`);
        
        if (!process.env.SENDGRID_API_KEY) {
            console.log('❌ SENDGRID_API_KEY environment variable is not set!');
            return;
        }

        switch (testType.toLowerCase()) {
            case 'basic':
                await this.testBasicEmail();
                break;
            case 'otp':
                await this.testOTPEmail();
                break;
            case 'booking':
                await this.testBookingConfirmationEmail();
                break;
            case 'vendor':
                await this.testVendorNotificationEmail();
                break;
            case 'acceptance':
                await this.testVendorAcceptanceEmail();
                break;
            default:
                console.log('❌ Unknown test type. Available types: basic, otp, booking, vendor, acceptance');
                console.log('Or run without arguments to run all tests.');
        }
    }
}

// Main execution
async function main() {
    const tester = new EmailTester();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Run all tests
        await tester.runAllTests();
    } else if (args[0] === '--help' || args[0] === '-h') {
        console.log('📧 Email Service Tester');
        console.log('Usage:');
        console.log('  npm run test:email              - Run all email tests');
        console.log('  npm run test:email basic        - Test basic email sending');
        console.log('  npm run test:email otp          - Test OTP email template');
        console.log('  npm run test:email booking      - Test booking confirmation email');
        console.log('  npm run test:email vendor       - Test vendor notification email');
        console.log('  npm run test:email acceptance   - Test vendor acceptance email');
        console.log('');
        console.log('Environment Variables:');
        console.log('  SENDGRID_API_KEY - Your SendGrid API key (required)');
        console.log('  TEST_EMAIL       - Email address to send test emails to (optional, defaults to test@example.com)');
    } else {
        // Run specific test
        await tester.runSingleTest(args[0]);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});