const express = require('express')
const { createJobRouter } = require('./utils')
const validateHistogram = require('../validators/histogram')
const { processAttributes, processDataProviders, preprocess, cache } = require('../middlewares')
const auth = require('../auth')

let router = express.Router()

router = createJobRouter(
  router,
  '/histogram',
  [auth.authenticate, processAttributes, processDataProviders, validateHistogram, preprocess, cache],
  'histogram'
)

module.exports = router
