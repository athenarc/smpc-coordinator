require('dotenv').config()
const { validateConfiguration } = require('./config/validate')

const LISTEN_PORT = process.env.PORT || 3000
const ENV = process.env.NODE_ENV || 'development'

// Throws ConfigurationError
validateConfiguration()

const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const morgan = require('morgan')
const routes = require('./routes')
const queue = require('./queue')
const logger = require('./config/winston')
const { ErrorHandler, HTTPErrorHandler } = require('./middlewares/error')
const { setupWss } = require('./ws-server.js')
const Node = require('./blockchain')('hyperledger')

const app = express()
const node = new Node()

app.queue = queue

;(async () => {
  app.set('trust proxy', '127.0.0.1')
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ methods: ['GET', 'POST'] }))
  app.use(bodyParser.json())
  app.use(morgan('combined', { stream: logger.stream }))

  const sessionMiddleware = session({
    store: new RedisStore(),
    secret: process.env.SESSION_SECRET || 'smpc-coordinator session secret',
    resave: false,
    cookie: { secure: ENV !== 'development' },
    saveUninitialized: true // investigate more the option
  })

  app.use(sessionMiddleware)

  for (const url in routes) {
    app.use(url, routes[url])
  }

  app.use(HTTPErrorHandler)
  app.use(ErrorHandler)

  if (process.env.BLOCKCHAIN === '1') {
    await node.connect()
    await node.register()

    app.node = node
  }

  const server = app.listen(LISTEN_PORT, () => {
    logger.info('SMPC Coordinator running on port %d', LISTEN_PORT)
  })

  setupWss(server, sessionMiddleware)
})()
  .catch(err => {
    logger.error(err)
    process.exit(1)
  })
