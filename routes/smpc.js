const express = require('express')
const _ = require('lodash')

const { db } = require('../db')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')
const { createSimpleSMPCRouter } = require('../helpers')
const { SMPCEngine } = require('../smpc/SMPC')

const Sharemind = require('../smpc/Sharemind')

let router = express.Router()
const smpc = new SMPCEngine(new Sharemind())

router.get('/queue/:id', async (req, res, next) => {
  try {
    let value = await db.get(req.params.id)

    if (_.isUndefined(value.status)) {
      throw new HTTPError(500, 'An error was occured')
    }

    if (value.status === status.PENDING || value.status === status.PROCESSING) {
      return res.status(200).json({
        'status': status.properties[value.status].msg
      })
    }

    const location = `/api/smpc/results/${req.params.id}`

    res.set('Location', location)
    return res.status(303).json({ location })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }
})

router.get('/results/:id', async (req, res, next) => {
  try {
    let value = await db.get(req.params.id)

    if (_.isUndefined(value.results)) {
      throw new HTTPError(404, 'Not found')
    }

    return res.status(200).json({ results: value.results })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }

  res.status(200).json()
})

router = createSimpleSMPCRouter(router, '/histogram/numerical', smpc)
router = createSimpleSMPCRouter(router, '/histogram/categorical', smpc)
router = createSimpleSMPCRouter(router, '/decision_tree', smpc)

module.exports = router
