const express = require('express')

const { getJob } = require('../db')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')

const auth = require('../auth')

let router = express.Router()

router.get('/:id', [auth.authenticate], async (req, res, next) => {
  try {
    let value = await getJob(req.params.id)

    if (value.status !== status.COMPLETED) {
      return res.status(200).json({
        ...value,
        status: status.properties[value.status].msg
      })
    }

    /* TODO: Take results url from express */
    const location = `/api/results/${req.params.id}`

    res.set('Location', location)
    return res.status(303).json({ location })
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }
})

module.exports = router
