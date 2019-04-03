const express = require('express')

const { db } = require('../db')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')
const { createSimpleSMPCRouter } = require('../helpers')

let router = express.Router()

router.get('/queue/:id', async (req, res, next) => {
  try {
    let value = await db.get(req.params.id)

    if (value.status === status.PENDING || value.status === status.PROCESSING) {
      return res.status(200).json({
        status: status.properties[value.status].msg,
        id: req.params.id
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

    return res.status(200).json({ results: value.results })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }

  res.status(200).json()
})

router = createSimpleSMPCRouter(router, '/histogram/numerical')
router = createSimpleSMPCRouter(router, '/histogram/categorical')
router = createSimpleSMPCRouter(router, '/decision_tree')

module.exports = router
