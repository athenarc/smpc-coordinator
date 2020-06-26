const HistogramProtocol = require('./HistogramProtocol')
const DockerImageProtocol = require('./DockerImageProtocol')

const protocolMapping = new Map()

/* All available protocols */
protocolMapping.set('histogram', HistogramProtocol)
protocolMapping.set('dockerImage', DockerImageProtocol)

const compute = async job => {
  if (protocolMapping.has(job.data.protocol)) {
    const Protocol = protocolMapping.get(job.data.protocol)
    const computation = new Protocol(job)
    let out = await computation.execute()
    return out
  } else {
    throw new Error('Compute: Protocol not supported!')
  }
}

module.exports = {
  compute
}
