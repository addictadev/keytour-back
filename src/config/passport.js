const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple').Strategy;
const User = require('../models/user');

passport.use(new GoogleStrategy({
    clientID: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    callbackURL: 'http://localhost:9000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.create({ 
                name: profile.displayName, 
                email: profile.emails[0].value, 
                googleId: profile.id, 
                provider: 'google' 
            });
        }
        done(null, user);
    } catch (err) {
        done(err, false);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: '/auth/facebook/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
            user = await User.create({ 
                name: profile.displayName, 
                email: profile.emails[0].value, 
                facebookId: profile.id, 
                provider: 'facebook' 
            });
        }
        done(null, user);
    } catch (err) {
        done(err, false);
    }
}));

passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    callbackURL: '/auth/apple/callback',
    privateKeyString: process.env.APPLE_PRIVATE_KEY,
    passReqToCallback: true
}, async (req, accessToken, refreshToken, idToken, profile, done) => {
    try {
        let user = await User.findOne({ appleId: profile.id });
        if (!user) {
            user = await User.create({ 
                name: profile.name, 
                email: profile.email, 
                appleId: profile.id, 
                provider: 'apple' 
            });
        }
        done(null, user);
    } catch (err) {
        done(err, false);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

module.exports = passport;
