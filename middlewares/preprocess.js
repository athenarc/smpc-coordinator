const uuidv4 = require('uuid/v4')
const { getHistogramType } = require('../helpers')

const preprocess = (req, res, next) => {
  let algorithm = getHistogramType(req.body.attributes)
  req.body.algorithm = Object.keys(algorithm)[0]

  req.body.id = uuidv4()

  next()
}

module.exports = preprocess