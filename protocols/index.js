const HistogramProtocol = require('../protocols/HistogramProtocol')

const protocolMapping = new Map()

/* All available protocols */
protocolMapping.set('histogram', HistogramProtocol)

module.exports = {
  protocolMapping
}
