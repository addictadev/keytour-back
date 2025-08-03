const jwt = require('../utils/jwt');
const User = require('../model/UserModel');
const CustomError = require('../utils/customError');
const admin = require('../../firebase/firebaseAdmin');

class GoogleAuthService {
    async googleAuth(idToken, fcmtoken) {
        try {
            // Verify the Google ID Token
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            console.log(decodedToken)
            const { uid, email, name, picture } = decodedToken;

            // Find existing user or create a new one
            let user = await User.findOne({ googleId: uid });

            if (!user) {
                // If the user doesn't exist, create a new user
                user = new User({
                    name: name || 'Google User',
                    email,
                    googleId: uid,
                    isVerified: true, // Google verified email
                    isLogin: true,
                    provider: 'google',
                    fcmtoken,
                    image: picture || 'https://i.pinimg.com/originals/b7/90/1e/b7901e00c054be87c92485fa29a46581.png'
                });
                await user.save({validateBeforeSave:false});
            } else {
                // If the user exists, update their login status and FCM token
                user.isLogin = true;
                user.fcmtoken = fcmtoken;
                await user.save({ validateBeforeSave: false });
            }

            // Create JWT token for the session
            const token = jwt.createToken(user);

            return { user, token };
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new CustomError('Invalid Google token', 401);
        }
    }













    async googleAuthmobile(uid, email, name, picture,fcmtoken) {
        try {
            // Verify the Google ID Token
       

            // Find existing user or create a new one
            let user = await User.findOne({ googleId: uid });

            if (!user) {
                // If the user doesn't exist, create a new user
                user = new User({
                    name: name || 'Google User',
                    email,
                    googleId: uid,
                    isVerified: true, // Google verified email
                    isLogin: true,
                    provider: 'google',
                    fcmtoken,
                    image: picture || 'https://i.pinimg.com/originals/b7/90/1e/b7901e00c054be87c92485fa29a46581.png'
                });
                await user.save({validateBeforeSave:false});
            } else {
                // If the user exists, update their login status and FCM token
                user.isLogin = true;
                user.fcmtoken = fcmtoken;
                await user.save({ validateBeforeSave: false });
            }

            // Create JWT token for the session
            const token = jwt.createToken(user);

            return { user, token };
        } catch (error) {
            console.error('Error verifying Google token:', error);
            throw new CustomError('Invalid creadintions', 401);
        }
    }
}

module.exports = new GoogleAuthService();