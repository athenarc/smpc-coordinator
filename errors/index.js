// https://gist.github.com/TooTallNate/4fd641f820e1325695487dfd883e5285

const { STATUS_CODES } = require('http')

const httpCodeToName = (code) => {
  const suffix = (code / 100 | 0) === 4 || (code / 100 | 0) === 5 ? 'Error' : ''
  return `${STATUS_CODES[code].replace(/\s|error/igm, '')}${suffix}`
}

class AppError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class HTTPError extends AppError {
  constructor (code, message) {
    super(message || STATUS_CODES[code])
    this.name = httpCodeToName(code)
    this.statusCode = code
  }
}

class ConfigurationError extends AppError {
  constructor (configuration) {
    super(`Configuration: ${configuration} must be defined!`)
    this.data = { configuration }
  }
}

class BlockchainError extends AppError {
  constructor (message) {
    super(`Blockchain Error: ${message}`)
    this.data = { message }
  }
}

class InternalError extends AppError {
  constructor (error) {
    super(error.message)
    this.data = { error }
  }
}

module.exports = {
  AppError,
  HTTPError,
  ConfigurationError,
  BlockchainError,
  InternalError
}
