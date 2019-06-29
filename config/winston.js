const path = require('path')
const { createLogger, format, transports } = require('winston')

const LOG_PATH = process.env.LOG_PATH || 'logs'

const options = {
  file: {
    level: 'info',
    filename: path.resolve(LOG_PATH, 'coordinator.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  },
  console: {
    level: 'info',
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }
}

const logger = createLogger({
  format: format.combine(
    format.errors({ stack: true }),
    format.splat(),
    format.timestamp(),
    format.simple()
  ),
  transports: [
    new transports.Console(options.console),
    new transports.File(options.file)
  ],
  exitOnError: false
})

logger.stream = {
  write: function (message, encoding) {
    logger.info(message)
  }
}

module.exports = logger
