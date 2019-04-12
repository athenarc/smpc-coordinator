const { HTTPError } = require('../errors')

const ErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err)
  }

  return res.status(500).send(
    {
      error: { code: 500, message: err.message }
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
