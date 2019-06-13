const express = require('express')
const _ = require('lodash')
const meshTerms = require('../smpc-global/catalogue.json')
const { HTTPError } = require('../errors')

let router = express.Router()

const search = async (needle) => {
  return new Promise((resolve, reject) => {
    let query = needle.toLowerCase()
    resolve(meshTerms.filter(item => item.name.toLowerCase().indexOf(query) >= 0))
  })
}

router.get('/mesh', async (req, res, next) => {
  if (_.isEmpty(req.query.q)) {
    return next(new HTTPError(400, 'Bad request'))
  }

  const results = await search(req.query.q)

  return res.status(200).json(results)
})

module.exports = router
