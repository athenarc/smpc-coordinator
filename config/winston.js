const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.simple(),
    format.timestamp()
  ),
  transports: [
    new transports.Console()
  ]
})

module.exports = logger
