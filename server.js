require('dotenv').config()

const LISTEN_PORT = process.env.PORT || 3000

const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const routes = require('./routes')
const logger = require('./config/winston')
const { ErrorHandler, HTTPErrorHandler } = require('./middlewares/error')

const app = express()

if (_.isEmpty(process.env.SMPC_ENGINE)) {
  throw new Error('SMPC Engine absolute path not defined!')
}

;(() => {
  app.set('trust proxy', '127.0.0.1')
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ methods: ['GET', 'POST'] }))
  app.use(bodyParser.json())

  for (const url in routes) {
    app.use(url, routes[url])
  }

  app.use(HTTPErrorHandler)
  app.use(ErrorHandler)

  app.listen(LISTEN_PORT, () => {
    logger.info('SMPC Coordinator running on port %d', LISTEN_PORT)
  })
})()
