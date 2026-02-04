import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { env } from '#configs/environment.js'

passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/v1/auth/google/callback',
  scope: ['profile', 'email']
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const googleUser = {
      googleId: profile.id,
      email: profile.emails[0].value,
      fullname: profile.displayName,
      avatar: profile.photos[0]?.value || null
    }
    return done(null, googleUser)
  } catch (error) {
    return done(error, null)
  }
}))

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

export default passport
