const path = require('path')
const { createLogger, format, transports } = require('winston')

const LOG_PATH = process.env.LOG_PATH || 'logs'

const options = {
  file: {
    level: 'info',
    handleExceptions: true,
    json: true,
    filename: path.resolve(LOG_PATH, 'coordinator.log'),
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true
  }
}

const logger = createLogger({
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.simple(),
    format.timestamp()
  ),
  transports: [
    new transports.Console(),
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
