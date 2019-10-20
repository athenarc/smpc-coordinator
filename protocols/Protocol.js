const _ = require('lodash')
const WebSocket = require('ws')
const EventEmitter = require('events')

const logger = require('../config/winston')
const { players, clients, ROOT_CA, KEY, CERT } = require('../config')
const { pack } = require('../helpers')

class Protocol {
  constructor ({ job, name, opts = { entities: 'both' } }) {
    if (new.target === Protocol) {
      throw new TypeError('Cannot construct abstract Protocol instances directly')
    }

    this._validate({ job })
    this.job = job
    this.protocolName = name
    this.emitter = new EventEmitter()

    this.players = players.map(p => ({ ...p, socket: null, type: 'player' }))
    this.clients = clients
      .filter(c => _.includes(this.job.data.dataProviders, c.id))
      .map(c => ({ ...c, socket: null, type: 'client' }))

    this.job.data.totalClients = this.clients.length

    this.opts = {
      ca: ROOT_CA,
      key: KEY,
      cert: CERT,
      rejectUnauthorized: true,
      requestCert: true,
      checkServerIdentity: (host, cert) => {
        return undefined
      }
    }

    if (opts.entities === 'clients' || opts.entities === 'both') {
      this._initClients()
    }

    if (opts.entities === 'players' || opts.entities === 'both') {
      this._initPlayers()
    }
  }

  _validate ({ job }) {
    if (!job) {
      throw new Error('Protocol: Job must be defined!')
    }
  }

  _initEntity (key, index, entity) {
    // connection errors are handle on ws.on('error')
    this[key][index].socket = new WebSocket(entity.address, { ...this.opts })
    this[key][index].socket._index = index

    const ws = this[key][index].socket

    ws.on('open', () => this._openDecorator({ ws, entity }))

    ws.on('close', (code, reason) => this._closeDecorator({ ws, code, reason, entity }))

    ws.on('error', (err) => this._errorDecorator({ ws, err, entity }))

    ws.on('message', (msg) => this._messageDecorator({ ws, msg, entity }))
  }

  _initPlayers () {
    for (const [index, p] of this.players.entries()) {
      this._initEntity('players', index, p)
    }
  }

  _initClients () {
    for (const [index, c] of this.clients.entries()) {
      this._initEntity('clients', index, c)
    }
  }

  execute () {
    return new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
      this._execute()
    })
  }

  sendToAll (message, entities) {
    for (const e of entities) {
      if (e.socket && e.socket.readyState === WebSocket.OPEN) {
        e.socket.send(message) // Assume message is already packed. Message must be packed beforehand to avoid expessive call to JSON API
      }
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
        e.socket.close(1000)
      }
    }
  }

  restart () {
    const msg = pack({ message: 'restart', job: this.job.data })
    this.sendToAll(msg, this.players)
    this.sendToAll(msg, this.clients)
  }

  /* Decorators */
  _openDecorator ({ ws, entity }) {
    if (entity.type === 'player') {
      logger.info(`Connected to player ${entity.id}.`)
      ws.send(pack({ message: 'job-info', job: this.job.data }))
    }

    if (entity.type === 'client') {
      logger.info(`Connected to client ${entity.id}.`)
      ws.send(pack({ message: 'job-info', job: this.job.data }))
    }

    this.handleOpen({ ws, entity })
  }

  _closeDecorator ({ ws, code, reason, entity }) {
    if (entity.type === 'player') {
      logger.info(`Disconnected from player ${entity.id}.`)
      this.players[ws._index].socket = null
    }

    if (entity.type === 'client') {
      logger.info(`Disconnected from client ${entity.id}.`)
      this.clients[ws._index].socket = null
    }

    this.handleClose({ ws, code, reason, entity })
  }

  _errorDecorator ({ ws, err, entity }) {
    logger.error(err)
    this.handleError({ ws, err, entity })
    // TODO: Get messages from err if exist
    this.reject(new Error('An error has occured!'))
  }

  _messageDecorator ({ ws, msg, entity }) {
    this.handleMessage({ ws, msg, entity })
  }

  /* Abstract Methods */
  _execute () {
    throw new Error('_execute: Implementation Missing!')
  }

  handleOpen ({ ws, entity }) {
    throw new Error('handleOpen: Implementation Missing!')
  }

  handleClose ({ ws, code, reason, entity }) {
    throw new Error('handleClose: Implementation Missing!')
  }

  handleError ({ ws, err, entity }) {
    throw new Error('handleError: Implementation Missing!')
  }

  handleMessage ({ ws, msg, entity }) {
    throw new Error('handleMessage: Implementation Missing!')
  }
}

module.exports = Protocol
