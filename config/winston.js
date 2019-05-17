const { createLogger, format, transports } = require('winston')

const options = {
  file: {
    level: 'info',
    filename: `../logs/coordinator.log`,
    handleExceptions: true,
    json: true,
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

module.exports = logger
