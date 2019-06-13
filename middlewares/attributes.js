const _ = require('lodash')

const processAttributes = (req, res, next) => {
  req.body.attributes = req.body.attributes.map(attr => {
    if (_.isString(attr)) {
      return { name: attr }
    }

    return attr
  })

  next()
}

module.exports = processAttributes
