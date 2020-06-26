const Protocol = require('./Protocol')
const logger = require('../config/winston')

const { pack } = require('../helpers')

class DockerImageProtocol extends Protocol {
  constructor (job) {
    super({ job, name: 'dockerImage', opts: { entities: 'clients' } })
    this.state = {
      responses: 0
    }
  }

  _execute () {
    logger.info('Initiating Docker Image Protocol...')
  }

  handleOpen ({ ws, entity }) {
    ws.send(pack({ message: 'import-image', job: this.job.data }))
  }

  handleClose ({ ws, code, reason, entity }) {
    if (this.state.responses < this.clients.length) {
      this.reject(new Error(`Client ${entity.id} closed before the end of the computation. Reason: ${reason}`))
    }
  }

  handleError ({ ws, err, entity }) {}

  handleMessage ({ ws, msg, entity }) {
    switch (msg.message) {
      case 'image-imported':
        this.handleImageImported(msg)
        break
      default:
        logger.info(msg)
    }
  }

  handleImageImported (msg) {
    this.state.responses++
    if (this.state.responses >= this.clients.length) {
      this.resolve({})
    }
  }
}

module.exports = DockerImageProtocol
