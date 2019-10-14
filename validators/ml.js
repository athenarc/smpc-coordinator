const _ = require('lodash')
const { HTTPError } = require('../errors')

const validateCreation = (req, res, next) => {
  if (!req.body.image_url) {
    next(new HTTPError(400, 'image_url: Bad request'))
    return
  }

  if (!_.isNumber(req.body.number_of_parameters)) {
    next(new HTTPError(400, 'number_of_parameters: Must be a number'))
    return
  }

  next()
}

module.exports = {
  validateCreation
}
