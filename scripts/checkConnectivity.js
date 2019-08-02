#!/usr/bin/env node

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../', '.env') })

const WebSocket = require('ws')
const { ROOT_CA, KEY, CERT } = require('../config/constants')

const PLAYER_1 = process.env.PLAYER_1 || 'wss://localhost:3005'
const PLAYER_2 = process.env.PLAYER_2 || 'wss://localhost:3006'
const PLAYER_3 = process.env.PLAYER_3 || 'wss://localhost:3007'
const CLIENT_1 = process.env.CLIENT_1 || 'wss://localhost:3008'
const CLIENT_2 = process.env.CLIENT_2 || 'wss://localhost:3009'
const CLIENT_3 = process.env.CLIENT_3 || 'wss://localhost:3010'

const opts = {
  ca: ROOT_CA,
  key: KEY,
  cert: CERT,
  rejectUnauthorized: true,
  requestCert: true,
  checkServerIdentity: (host, cert) => {
    return undefined
  }
}

const checkConnection = (address) => {
  const ws = new WebSocket(address, { ...opts })
  ws.on('open', () => {
    console.log(`Successfully connected to ${address}.`)
    ws.close(1000)
  })

  ws.on('close', (code, reason) => {
    console.log(`Disconnected from ${address} with code ${code}`)
  })

  ws.on('error', (err) => {
    console.log(err)
  })
}

checkConnection(PLAYER_1)
checkConnection(PLAYER_2)
checkConnection(PLAYER_3)
checkConnection(CLIENT_1)
checkConnection(CLIENT_2)
checkConnection(CLIENT_3)
