const express = require('express')

const passport = require('../auth')
const { db, addJobToDB } = require('../db')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')
const { addJobToQueue } = require('../queue')
const validateHistogram = require('../validators/histogram')
const preprocess = require('../middlewares/preprocess')
const cache = require('../middlewares/cache')

let router = express.Router()

const createSimpleSMPCRouter = (router, path, middlewares) => {
  router.post(path, middlewares, async (req, res, next) => {
    const job = { ...req.body, timestamps: { accepted: Date.now() } }

    try {
      job.status = status.PENDING
      const location = `/api/smpc/queue/${job.id}`
      res.set('Location', location)
      res.status(202).json({ location, ...job, status: status.properties[status.PENDING].msg })

      addJobToDB({ ...job })
      addJobToQueue({ ...job })
    } catch (err) {
      job.status = status.FAILED
      next(err)
    }
  })

  return router
}

router.get('/queue/:id', async (req, res, next) => {
  try {
    let value = await db.get(req.params.id)

    if (value.status !== status.COMPLETED) {
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

    return res.status(200).json({
      ...value,
      status: status.properties[value.status].msg
    })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }

  res.status(200).json()
})

router = createSimpleSMPCRouter(router, '/histogram', [passport.authenticate('jwt', { session: false }), validateHistogram, preprocess, cache])

module.exports = router
