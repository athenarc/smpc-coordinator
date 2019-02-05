require('dotenv').config()

const LISTEN_PORT = process.env.PORT || 3000
const express = require('express')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')
const routes = require('./routes')
const logger = require('./config/winston')

const app = express()

;(() => {
  app.set('trust proxy', '127.0.0.1')
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ methods: ['GET', 'POST'] }))
  app.use(bodyParser.json())

  for (const url in routes) {
    app.use(url, routes[url])
  }

  app.listen(LISTEN_PORT, () => {
    logger.info('SMPC Coordinator running on port %d', LISTEN_PORT)
  })
})()
