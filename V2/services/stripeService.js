const stripe = require('stripe')(process.env.STRIPE_SECRET);

class StripeService {
    async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, // Convert to cents
                currency,
                metadata,
                payment_method_types: ['card'],
            });
            return paymentIntent;
        } catch (error) {
            throw new Error(`Error creating payment intent: ${error.message}`);
        }
    }

    async createPaymentSession(amount, successUrl, cancelUrl, metadata = {}) {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: 'Tour Booking Payment',
                                description: 'Payment for tour booking'
                            },
                            unit_amount: Math.round(amount * 100), // Convert to cents
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata,
            });
            return session;
        } catch (error) {
            console.error('Stripe session creation error:', error);
            throw new Error(`Error creating payment session: ${error.message}`);
        }
    }
}

module.exports = new StripeService();