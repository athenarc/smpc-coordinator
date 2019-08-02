const passport = require('passport')
const JwtStrategy = require('./jwt')
const AuthenticationService = require('./service')

passport.use(JwtStrategy)

module.exports = new AuthenticationService(passport)
