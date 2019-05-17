const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  level: 'info',
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
