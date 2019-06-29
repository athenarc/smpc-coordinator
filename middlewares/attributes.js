const _ = require('lodash')
const { HTTPError } = require('../errors')

const processAttributes = (req, res, next) => {
  if (!req.body.attributes || !_.isArray(req.body.attributes)) {
    next(new HTTPError(400, 'attributes: Bad request'))
    return
  }

  req.body.attributes = req.body.attributes.map(attr => {
    if (_.isString(attr)) {
      return { name: attr }
    }

    return attr
  })

  next()
}

module.exports = processAttributes
