const WebSocket = require('ws')

const logger = require('./config/winston')
const { appEmitter } = require('./emitters.js')
const { pack, unpack } = require('./helpers.js')
const { status } = require('./config/constants')

const startPing = ({ wss, interval = 30 * 1000 }) =>
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate()
      }
      ws.isAlive = false
      ws.send(pack({ message: 'ping' }))
    })
  }, interval)

const setupWss = async (server, sessionMiddleware) => {
  const wss = new WebSocket.Server({
    server,
    verifyClient: ({ req }, done) => {
      if (!req.session) {
        return done(true)
      }

      return sessionMiddleware(req, {}, () => done(req.session.id))
    }
  })

  wss.on('connection', (ws, req) => {
    logger.info('Web client connected.')
    ws.req = req
    ws.isAlive = true

    ws.on('pong', () => (ws.isAlive = true))
    ws.on('message', (msg) => {
      msg = unpack(msg)
      if (msg.message === 'pong') {
        ws.isAlive = true
      }
    }) // silent client message

    const handleComputation = (msg) => {
      if (ws.readyState === WebSocket.OPEN && msg) {
        if (msg.status && status.properties[msg.status]) {
          msg.status = status.properties[msg.status].msg
        }
        ws.send(pack({ message: 'update-computation', job: msg }))
      }
    }

    ws.on('close', (code, reason) => {
      logger.info(`Web client disconnected with ${code} and reason ${reason}.`)
      appEmitter.removeListener('update-computation', handleComputation)
    })

    appEmitter.on('update-computation', handleComputation)
  })

  startPing({ wss, interval: 30 * 1000 }) // 30 seconds
}

module.exports = { setupWss }
