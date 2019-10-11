const express = require('express')
const smpc = require('./smpc')
const queue = require('./queue')
const search = require('./search')
const auth = require('./auth')

const router = express.Router()

router.get('/', (_, res) => res.status(204).send())
router.get('/health', (_, res) => res.status(204).send())

module.exports = {
  '/api': router,
  '/api/smpc': smpc,
  '/api/queue': queue,
  '/api/search': search,
  '/api/auth': auth
}
