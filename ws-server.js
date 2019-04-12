const WebSocket = require('ws')

const { appEmitter } = require('./emitters.js')
const { pack } = require('./helpers.js')
const { status } = require('./config/constants')

const startPing = ({ wss, interval = 30 * 1000 }) =>
  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate()
      }
      ws.isAlive = false
      ws.ping(() => null)
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
    console.log('Web client connected.')
    ws.req = req
    ws.isAlive = true

    ws.on('pong', () => (ws.isAlive = true))
    ws.on('message', () => {}) // silent client message

    appEmitter.on('update-computation', (msg) => {
      if (ws.readyState === WebSocket.OPEN) {
        msg.status = status.properties[msg.status].msg
        ws.send(pack({ message: 'update-computation', job: msg }))
      }
    })
  })

  // startPing({ wss, interval: 30 * 1000 })
}

module.exports = { setupWss }
