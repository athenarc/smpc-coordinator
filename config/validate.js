const _ = require('lodash')
const { ConfigurationError } = require('../errors')

const validateConfiguration = () => {
  if (_.isEmpty(process.env.ROOT_CA)) {
    throw new ConfigurationError('HTTPS root CA')
  }

  if (_.isEmpty(process.env.KEY)) {
    throw new ConfigurationError('HTTPS key')
  }

  if (_.isEmpty(process.env.CERT)) {
    throw new ConfigurationError('HTTPS cert')
  }
}

module.exports = {
  validateConfiguration
}
