const _ = require('lodash')
const crypto = require('crypto')

const totalAttributes = require('./smpc-global/attributes.json')
const algorithms = require('./smpc-global/algorithms.json')

const pack = (msg) => {
  return JSON.stringify(msg)
}

const unpack = (msg) => {
  return JSON.parse(msg)
}

const isAttribute = (attr) => {
  for (const a of attr) {
    if (_.isEmpty(a)) {
      return false
    }
  }

  return attr.every(r => totalAttributes.some((a) => a.name === r.name))
}

const validateRequest = (req) => {
  if (!req.attributes || !_.isArray(req.attributes)) {
    return { success: false, msg: 'Bad request' }
  }

  if (req.attributes.length > 2) {
    return { success: false, msg: 'No more than two attributes are allowed' }
  }

  if (!isAttribute(req.attributes)) {
    return { success: false, msg: 'Bad request or attribute not found' }
  }

  if (req.attributes.length === 2 && req.attributes[0].name === req.attributes[1].name) {
    return { success: false, msg: 'Same attributes are not allowed' }
  }

  return { success: true }
}

const getHistogramType = (attr) => {
  let types = attr.map(a => totalAttributes.find((b) => b.name === a.name)).map(item => item.type).sort()

  let candidates = algorithms[0]['histograms'].filter((item) => Object.values(item)[0].attributes.length === types.length)

  let algorithm = candidates.find((item) => {
    let attr = item[Object.keys(item)[0]].attributes.sort()
    return _.difference(attr, types).length === 0
  })

  return algorithm
}

const sha256 = (data) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

module.exports = {
  validateRequest,
  getHistogramType,
  pack,
  unpack,
  sha256
}
