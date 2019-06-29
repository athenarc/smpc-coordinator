require('dotenv').config()

const { validateConfiguration } = require('./validate')
const constants = require('./constants')

const LISTEN_PORT = process.env.PORT || 3000
const ENV = process.env.NODE_ENV || 'development'

const players = [
  { id: 0, address: process.env.PLAYER_1 || 'wss://localhost:3005' },
  { id: 1, address: process.env.PLAYER_2 || 'wss://localhost:3006' },
  { id: 2, address: process.env.PLAYER_3 || 'wss://localhost:3007' }
]

const clients = [
  { id: 0, address: process.env.CLIENT_1 || 'wss://localhost:3008' },
  { id: 1, address: process.env.CLIENT_2 || 'wss://localhost:3009' },
  { id: 2, address: process.env.CLIENT_3 || 'wss://localhost:3010' }
]

// Throws ConfigurationError
validateConfiguration()

module.exports = {
  LISTEN_PORT,
  ENV,
  players,
  clients,
  ...constants
}
