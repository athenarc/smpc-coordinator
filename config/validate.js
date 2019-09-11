const _ = require('lodash')
const { ConfigurationError } = require('../errors')

// validate function must return true when the check should pass and false otherwise
const variables = [
  {
    name: 'API_BASE_URL',
    errorMsg: 'API base url',
    validate: variable => !_.isEmpty(process.env[variable.name])
  },
  {
    name: 'ROOT_CA',
    errorMsg: 'HTTPS root CA',
    validate: variable => !_.isEmpty(process.env[variable.name])
  },
  {
    name: 'KEY',
    errorMsg: 'HTTPS key',
    validate: variable => !_.isEmpty(process.env[variable.name])
  },
  {
    name: 'CERT',
    errorMsg: 'HTTPS cert',
    validate: variable => !_.isEmpty(process.env[variable.name])
  },
  {
    name: 'AUTH_API',
    errorMsg: 'Authentication API url',
    validate: variable => !_.isEmpty(process.env[variable.name])
  },
  {
    name: 'NOTIFICATION_API',
    errorMsg: 'Notification API url',
    validate: variable => (process.env.BLOCKCHAIN === '1' && !_.isEmpty(process.env[variable.name]))
  },
  {
    name: 'NOTIFICATION_API_TOKEN',
    errorMsg: 'Notification token',
    validate: variable => (process.env.BLOCKCHAIN === '1' && !_.isEmpty(process.env[variable.name]))
  }
]

const validateConfiguration = () => {
  for (let variable of variables) {
    if (!variable.validate(variable)) {
      throw new ConfigurationError(variable.errorMsg)
    }
  }
}

module.exports = {
  validateConfiguration
}
