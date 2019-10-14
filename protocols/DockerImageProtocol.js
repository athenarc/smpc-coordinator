const Protocol = require('./Protocol')
const logger = require('../config/winston')
const { step } = require('../config')

const { pack, unpack } = require('../helpers')

class DockerImageProtocol extends Protocol {
  constructor (job) {
    super({ job, name: 'dockerImage', opts: { entities: 'clients' } })
  }

  _execute () {
  }

  handleOpen ({ ws, entity }) {
  }

  handleClose ({ ws, code, reason, entity }) {
  }

  handleError ({ ws, err, entity }) {
  }

  handleMessage ({ ws, msg, entity }) {
  }
}

module.exports = DockerImageProtocol
