const { Strategy, ExtractJwt } = require('passport-jwt')
const User = require('../models/User')
const { JWT_SECRET } = require('../config/constants')

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
}

const strategy = new Strategy(
  opts,
  async (jwtPayload, done) => {
    try {
      done(null, await User.findOne(jwtPayload.username))
    } catch (e) {
      console.log(e)

      if (e.notFound) {
        done(null, false, 'Unauthorized')
      }

      done(null, false, 'Server error')
    }
  }
)

module.exports = strategy
