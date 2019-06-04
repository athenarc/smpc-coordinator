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

    appEmitter.on('update-computation', (msg) => {
      if (ws.readyState === WebSocket.OPEN && msg) {
        if (msg.status) {
          msg.status = status.properties[msg.status].msg
        }
        ws.send(pack({ message: 'update-computation', job: msg }))
      }
    })
  })

  startPing({ wss, interval: 30 * 1000 }) // 30 seconds
}

module.exports = { setupWss }
