const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20')
const User = require('../models/User')

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
        },
        async(accessToken,refreshToken, profile, done) => {
            try {
                 let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log('Existing user found:', user.username);
          return done(null, user);
        }

        const email = profile.emails[0].value;
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          if (!user.profilePic && profile.photos && profile.photos[0]) {
            user.profilePic = profile.photos[0].value;
          }
          await user.save();
          console.log('Google linked to existing user:', user.username);
          return done(null, user);
        }

                const newUser = await User.create({
                    googleId: profile.id,
                    username: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    profilePic: profile.photos?.[0]?.value,
                    role: 'resident',
                    street: 'Not Specified'
                })
                done(null, newUser)
            } catch (error) {
                console.error("Google authentication failed", error)
                done(error, null)
            }
        }
    )
)