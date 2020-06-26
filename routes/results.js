const express = require('express')
const contentDisposition = require('content-disposition')

const { getJob } = require('../db')
const { status } = require('../config/constants')
const { HTTPError } = require('../errors')

const auth = require('../auth')

let router = express.Router()

const getResults = async (req, res, next, download = false) => {
  try {
    let value = await getJob(req.params.id)
    value = { ...value, status: status.properties[value.status].msg }
    res.set({
      'Content-Type': 'application/json'
    })

    if (download) {
      res.set({
        'Content-Disposition': contentDisposition(`${req.params.id}.json`)
      })

      value = JSON.stringify(value)
    }

    return res.status(200).send(value)
  } catch (err) {
    if (err.notFound) {
      next(new HTTPError(404, 'Not found'))
    }

    next(err)
  }
}

router.get('/:id', [auth.authenticate], async (req, res, next) => {
  await getResults(req, res, next)
})

router.get('/:id/download', [auth.authenticate], async (req, res, next) => {
  await getResults(req, res, next, true)
})

module.exports = router
