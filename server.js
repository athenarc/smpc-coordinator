require('dotenv').config()

const LISTEN_PORT = process.env.PORT || 3000
const ENV = process.env.NODE_ENV || 'development'

const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const routes = require('./routes')
const queue = require('./queue')
const logger = require('./config/winston')
const { ErrorHandler, HTTPErrorHandler } = require('./middlewares/error')
const { setupWss } = require('./ws-server.js')

const app = express()
app.queue = queue

if (_.isEmpty(process.env.ROOT_CA)) {
  throw new Error('HTTPS root CA path must be defined!')
}

if (_.isEmpty(process.env.SMPC_ENGINE)) {
  throw new Error('SMPC Engine absolute path not defined!')
}

;(() => {
  app.set('trust proxy', '127.0.0.1')
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ methods: ['GET', 'POST'] }))
  app.use(bodyParser.json())

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

  const server = app.listen(LISTEN_PORT, () => {
    logger.info('SMPC Coordinator running on port %d', LISTEN_PORT)
  })

  setupWss(server, sessionMiddleware)
})()
