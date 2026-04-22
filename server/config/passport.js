const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const User           = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googlePic = profile.photos?.[0]?.value || null;

        // ── Case 1: Returning Google user ───────────────────
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          // Always refresh the pic from Google on every login
          // This fixes the blank picture bug after re-login
          if (googlePic) user.profilePic = googlePic;
          await user.save();
          console.log('Google login:', user.username);
          return done(null, user);
        }

        // ── Case 2: Existing phone-auth user — link Google ──
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId  = profile.id;
            if (googlePic) user.profilePic = googlePic;
            await user.save();
            console.log('Google linked to existing user:', user.username);
            return done(null, user);
          }
        }

        // ── Case 3: Brand new user ──────────────────────────
        const newUser = await User.create({
          googleId:   profile.id,
          username:   profile.displayName,
          email:      email || null,
          profilePic: googlePic,
          role:       'resident',
          street:     'Not Specified',
        });

        console.log('New Google user created:', newUser.username);
        return done(null, newUser);

      } catch (error) {
        console.error('Google authentication failed:', error);
        return done(error, null);
      }
    }
  )
);