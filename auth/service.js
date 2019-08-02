const axios = require('axios')
const url = require('url')

const logger = require('../config/winston')
const { AUTH_API } = require('../config/constants')
const { AuthenticationError, AppError } = require('../errors')

class AuthenticationService {
  constructor (passport) {
    this.passport = passport
    this.authenticate = this.authenticate.bind(this)
  }

  async authorizeUser (username, token) {
    if (!username || !token) {
      throw new AuthenticationError('Unauthorized')
    }

    try {
      const URL = ['/users/', `${username}/`, 'authByToken'].reduce(url.resolve, AUTH_API)
      const config = { headers: { 'X-request-token': token } }
      const res = await axios.get(URL, config)
      return { status: res.status, data: res.data }
    } catch (e) {
      if (e.response && e.response.status === 401) {
        throw new AuthenticationError('Unauthorized')
      }

      logger.error('authorizeUser: ', e)
      throw new AppError('Error')
    }
  }

  authenticate (req, res, next) {
    this.passport.authenticate('jwt', { session: false })(req, res, next)
  }
}

module.exports = AuthenticationService
