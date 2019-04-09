const PLAYER_1 = process.env.PLAYER_1 || 'ws://localhost:3005'
const PLAYER_2 = process.env.PLAYER_2 || 'ws://localhost:3006'
const PLAYER_3 = process.env.PLAYER_3 || 'ws://localhost:3007'
const CLIENT_1 = process.env.CLIENT_1 || 'ws://localhost:3008'
const CLIENT_2 = process.env.CLIENT_2 || 'ws://localhost:3009'
const CLIENT_3 = process.env.CLIENT_3 || 'ws://localhost:3010'

const WebSocket = require('ws')
const EventEmitter = require('events')
const { pack, unpack } = require('../helpers')
const { step } = require('../config/constants')

class Computation {
  constructor (job) {
    this.job = job
    this.emitter = new EventEmitter()

    this.players = [
      { address: PLAYER_1, socket: null },
      { address: PLAYER_2, socket: null },
      { address: PLAYER_3, socket: null }
    ]

    this.clients = [
      { address: CLIENT_1, socket: null },
      { address: CLIENT_2, socket: null },
      { address: CLIENT_3, socket: null }
    ]

    this.state = {
      dataInfoReceived: 0,
      compiled: 0,
      listen: 0,
      import: 0,
      exit: 0,
      step: step.INIT,
      dataInfo: {
        precision: 0.00001,
        sizeAlloc: 0,
        cellsX: null,
        cellsY: null,
        dataSize: 0
      },
      results: ''
    }

    this.resolve = null
    this.reject = null
    this._register()
  }

  _execute (resolve, reject) {
    console.log('Initiating SMPC Engine...')
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
        this.handleError(msg)
        return
      }

      if (msg.code && msg.code !== 0) {
        this.handleError(msg)
        return
      }
    }

    next(msg)
  }

  setupPlayers () {
    for (const [index, p] of this.players.entries()) {
      this.players[index].socket = new WebSocket(p.address) // connection errors are handle on ws.on('error')
      this.players[index].socket._index = index
      const ws = this.players[index].socket

      ws.on('open', () => {
        ws.send(pack({ message: 'job-info', job: this.job }))
        console.log(`Connected to player ${index}.`)
      })

      ws.on('close', (code, reason) => {
        console.log(`Disconnected from player ${index}.`)
        this.players[ws._index].socket = null

        if (this.state.step !== step.COMPUTATION_END) {
          // this.restart()
          this.reject(new Error(`Unexpected close with code: ${code} and reason: ${reason}`))
        }
      })

      ws.on('error', (err) => {
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
      this.clients[index].socket = new WebSocket(c.address)
      this.clients[index].socket._index = index
      const ws = this.clients[index].socket

      ws.on('open', () => {
        console.log(`Connected to client ${index}.`)
        ws.send(pack({ message: 'job-info', job: this.job }))
        ws.send(pack({ message: 'data-info', job: this.job }))
      })

      ws.on('close', (code, reason) => {
        console.log(`Disconnected from client ${index}.`)
        this.clients[ws._index].socket = null
        if (this.state.step !== step.IMPORT_END) {
          // this.restart()
          this.reject(new Error(`Unexpected close with code: ${code} and reason: ${reason}`))
        }
      })

      ws.on('message', (data) => {
        data = unpack(data)
        this.handleMessage('client', ws, data)
      })

      ws.on('error', (err) => {
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
        console.log(data)
    }
  }

  handleError ({ data }) {
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
      console.log(`Datasize Accepted: Total: ${this.state.dataInfo.dataSize}`)
      this.state.step = step.DATA_SIZE_ACCEPTED
      this.state.dataInfoReceived = 0
      this.sendToAll(pack({ message: 'compile', job: this.job, dataInfo: this.state.dataInfo }), this.players)
    }
  }

  processDataInfo (info) {
    this.state.dataInfo.sizeAlloc += Number(info.sizeAlloc)
    this.state.dataInfo.dataSize += Number(info.dataSize)
    this.state.dataInfo.precision = Math.min(Number(info.precision))
    this.state.dataInfo.cellsX = Number(info.cellsX) // Number(null) === 0
    this.state.dataInfo.cellsY = Number(info.cellsY)
  }

  handleCompilation ({ data }) {
    this.state.compiled += 1
    if (this.state.compiled === this.players.length) {
      console.log('Compilation finished.')
      this.state.step = step.COMPILE_END
      this.state.compiled = 0
      this.sendToAll(pack({ message: 'start', job: this.job }), this.players)
    }
  }

  handleComputationFinished ({ data }) {
    console.log('Computation Finished')
    this.state.step = step.COMPUTATION_END
    this.state.exit = 0
    this.cleanUpPlayers()
    this.cleanUpClients()
    this.processResults()
    this.resolve(this.state.results)
  }

  processResults () {
    let results = []
    for (let r of this.state.results.split('\n')) {
      if (r.includes('START')) {
        continue
      }

      if (r.includes('END')) {
        break
      }

      results.push(r)
    }
  }

  handleImportationFinished () {
    console.log('Importation Finished')
    this.state.step = step.IMPORT_END
  }

  execute () {
    return new Promise((resolve, reject) => this._execute(resolve, reject))
  }

  restart () {
    const msg = pack({ message: 'restart', job: this.job })
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
      console.log('Players are listening...')
      this.state.step = step.IMPORT_START
      this.state.listen = 0
      this.sendToAll(pack({ message: 'import', job: this.job }), this.clients)
    }
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
        e.socket.terminate()
      }
    }
  }
}

module.exports = Computation
