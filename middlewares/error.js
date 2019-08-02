const { HTTPError } = require('../errors')
const logger = require('../config/winston')

const ErrorHandler = (err, req, res, next) => {
  logger.error('ErrorHandler: ', err)

  if (res.headersSent) {
    return next(err)
  }

  return res.status(500).send(
    {
      error: { code: 500, msg: err.message }
    }
  )
}

const HTTPErrorHandler = (err, req, res, next) => {
  if (err instanceof HTTPError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.statusCode,
        msg: err.message
      }
    })
  }

  next(err)
}

module.exports = {
  ErrorHandler,
  HTTPErrorHandler
}
