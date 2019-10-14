const express = require('express')

const { processDataProviders, preprocess } = require('../middlewares')
const { createJobRouter } = require('./utils')
const { addJobToDB, getJob } = require('../db')

let router = express.Router()

router = createJobRouter(
  router,
  '/blackbox/create',
  [preprocess],
  'dockerImage'
)

router.get('/blackbox/:id', [processDataProviders, preprocess], async (req, res, next) => {

})

router = createJobRouter(
  router,
  '/blackbox/:id/train',
  [preprocess],
  'blackbox'
)

module.exports = router
