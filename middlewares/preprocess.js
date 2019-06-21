const uuidv4 = require('uuid/v4')

const preprocess = (req, res, next) => {
  req.body.id = uuidv4()

  next()
}

module.exports = preprocess
