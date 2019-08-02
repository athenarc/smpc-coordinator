const { Strategy, ExtractJwt } = require('passport-jwt')
const { JWT_SECRET } = require('../config/constants')

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
}

const strategy = new Strategy(
  opts,
  async (jwtPayload, done) => {
    done(null, { username: jwtPayload.username })
  }
)

module.exports = strategy
