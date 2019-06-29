const WebSocket = require('ws')
const EventEmitter = require('events')

const { pack, unpack } = require('../helpers')
const { step, players, clients, ROOT_CA, KEY, CERT } = require('../config')
const logger = require('../config/winston')

class Computation {
  constructor (job) {
    this.job = job
    this.emitter = new EventEmitter()

    this.players = players.map(p => ({ ...p, socket: null }))
    this.clients = clients.map(c => ({ ...c, socket: null }))

    this.state = {
      dataInfoReceived: 0,
      compiled: 0,
      listen: 0,
      import: 0,
      exit: 0,
      step: step.INIT,
      results: ''
    }

    this.opts = {
      ca: ROOT_CA,
      key: KEY,
      cert: CERT,
      rejectUnauthorized: true,
      requestCert: true
    }

    this.resolve = null
    this.reject = null
    this._register()
  }

  _execute (resolve, reject) {
    logger.info('Initiating SMPC Engine...')
    this.job.reportProgress(0) // Next release will inlude the feature to pass arbitrary data in reportProgress
    // this.job.reportProgress({ step: this.state.step }) // Next release will inlude the feature to pass arbitrary data in reportProgress
    this.resolve = resolve
    this.reject = reject
    this.setupPlayers()
    this.setupClients()
  }

  _register () {
    this.emitter.on('data-info-received', (msg) => this._eventMiddleware('data-info-received', msg, this.handleDataInfo.bind(this)))
    this.emitter.on('compilation-ended', (msg) => this._eventMiddleware('compilation-ended', msg, this.handleCompilation.bind(this)))
    this.emitter.on('listen', (msg) => this._eventMiddleware('listen', msg, this.listen.bind(this)))
    this.emitter.on('exit', (msg) => this._eventMiddleware('exit', msg, this.handleExit.bind(this)))
    this.emitter.on('computation-finished', (msg) => this._eventMiddleware('computation-finished', msg, this.handleComputationFinished.bind(this)))
    this.emitter.on('importation-finished', (msg) => this._eventMiddleware('importation-finished', msg, this.handleImportationFinished.bind(this)))
  }

  _eventMiddleware (event, msg, next) {
    if (msg.data) {
      if (msg.data.errors && msg.data.errors.length > 0) {
        return this.handleError(msg)
      }

      if (msg.data.code && msg.data.code !== 0) {
        return this.handleError(msg)
      }
    }

    next(msg)
  }

  setupPlayers () {
    for (const [index, p] of this.players.entries()) {
      this.players[index].socket = new WebSocket(p.address, { ...this.opts }) // connection errors are handle on ws.on('error')
      this.players[index].socket._index = index
      const ws = this.players[index].socket

      ws.on('open', () => {
        ws.send(pack({ message: 'job-info', job: this.job.data }))
        logger.info(`Connected to player ${index}.`)
      })

      ws.on('close', (code, reason) => {
        logger.info(`Disconnected from player ${index}.`)
        this.players[ws._index].socket = null

        if (this.state.step < step.COMPUTATION_END) {
          this.restart()
          this.reject(new Error(`Player ${index} closed before the end of the computation. Reason: ${reason}`))
        }
      })

      ws.on('error', (err) => {
        logger.error('Player websocket error: ', err)
        this.handleError(err)
      })

      ws.on('message', (data) => {
        data = unpack(data)
        this.handleMessage('player', ws, data)
      })
    }
  }

  setupClients () {
    for (const [index, c] of this.clients.entries()) {
      this.clients[index].socket = new WebSocket(c.address, { ...this.opts })
      this.clients[index].socket._index = index
      const ws = this.clients[index].socket

      ws.on('open', () => {
        logger.info(`Connected to client ${index}.`)
        ws.send(pack({ message: 'job-info', job: this.job.data }))
        ws.send(pack({ message: 'data-info', job: this.job.data }))
      })

      ws.on('close', (code, reason) => {
        logger.info(`Disconnected from client ${index}.`)
        this.clients[ws._index].socket = null
        if (this.state.step < step.IMPORT_END) {
          this.restart()
          this.reject(new Error(`Client ${index} closed before the end of the importation. Reason: ${reason}`))
        }
      })

      ws.on('message', (data) => {
        data = unpack(data)
        this.handleMessage('client', ws, data)
      })

      ws.on('error', (err) => {
        logger.error('Client websocket error: ', err)
        this.handleError(err)
      })
    }
  }

  handleMessage (entity, ws, data) {
    switch (data.message) {
      case 'data-info':
        this.emitter.emit('data-info-received', { entity, ws, data })
        break
      case 'compilation-ended':
        this.emitter.emit('compilation-ended', { entity, ws, data })
        break
      case 'listen':
        this.emitter.emit('listen', { entity, ws, data })
        break
      case 'exit':
        this.emitter.emit('exit', { entity, ws, data })
        break
      case 'error':
        this.handleError({ data })
        break
      default:
        logger.info(data)
    }
  }

  handleError ({ data }) {
    logger.error(data)
    this.restart()
    this.reject(new Error('An error has occured!'))
  }

  handleExit ({ entity, data }) {
    switch (entity) {
      case 'player':
        this.state.exit += 1
        if (data.id === '0') {
          this.state.results = data.output
        }
        if (this.state.exit === this.players.length) {
          this.emitter.emit('computation-finished', { data })
        }
        break
      case 'client':
        this.state.import += 1
        if (this.state.import === this.clients.length) {
          this.emitter.emit('importation-finished', { data })
        }
        break
      default:
    }
  }

  handleDataInfo ({ data }) {
    this.state.dataInfoReceived += 1
    this.processDataInfo(data.datasetInfo)

    if (this.state.dataInfoReceived === this.clients.length) {
      if (this.state.dataInfo.dataSize === 0) {
        return this.handleComputationFinished({ data })
      }

      this.updateStep(step.DATA_SIZE_ACCEPTED)
      this.state.dataInfoReceived = 0
      this.sendToAll(pack({ message: 'compile', job: this.job.data, dataInfo: this.state.dataInfo }), this.players)
    }
  }

  handleCompilation ({ data }) {
    this.state.compiled += 1
    if (this.state.compiled === this.players.length) {
      logger.info('Compilation finished.')
      this.updateStep(step.COMPILE_END)
      this.state.compiled = 0
      this.sendToAll(pack({ message: 'start', job: this.job.data }), this.players)
    }
  }

  handleComputationFinished ({ data }) {
    logger.info('Computation Finished')
    this.updateStep(step.COMPUTATION_END)
    this.state.exit = 0
    this.cleanUpPlayers()
    this.cleanUpClients()
    this.processResults()
    this.state.results = this.postProcess([ ...this.state.results ])
    this.resolve(this.state.results)
  }

  processResults () {
    let results = []

    if (this.state.dataInfo.dataSize === 0) {
      return []
    }

    for (let r of this.state.results.split('\n')) {
      if (r.includes('#') || r.includes('START')) {
        continue
      }

      if (r.includes('$') || r.includes('END')) {
        break
      }

      results.push(r)
    }

    this.state.results = [...results]
  }

  handleImportationFinished () {
    logger.info('Importation Finished')
    this.updateStep(step.IMPORT_END)
  }

  execute () {
    return new Promise((resolve, reject) => this._execute(resolve, reject))
  }

  restart () {
    const msg = pack({ message: 'restart', job: this.job.data })
    this.sendToAll(msg, this.players)
    this.sendToAll(msg, this.clients)
  }

  sendToAll (message, entities) {
    for (const e of entities) {
      if (e.socket && e.socket.readyState === WebSocket.OPEN) {
        e.socket.send(message) // Assume message is already packed. Message must be packed beforehand to avoid expessive call to JSON API
      }
    }
  }

  listen () {
    this.state.listen += 1
    if (this.state.listen === this.players.length) {
      logger.info('Players are listening...')
      this.updateStep(step.IMPORT_START)
      this.state.listen = 0
      this.sendToAll(pack({ message: 'import', job: this.job.data }), this.clients)
    }
  }

  updateStep (_step) {
    this.state.step = _step
    // this.job.reportProgress({ step: this.state.step }) // Next release will inlude the feature to pass arbitrary data in reportProgress
    this.job.reportProgress((_step / (Object.keys(step).length - 1)) * 100)
  }

  cleanUpClients () {
    this.cleanUp(this.clients)
  }

  cleanUpPlayers () {
    this.cleanUp(this.players)
  }

  cleanUp (entities) {
    for (const e of entities) {
      if (e.socket) {
        e.socket.close(1000)
      }
    }
  }
}

module.exports = Computation
