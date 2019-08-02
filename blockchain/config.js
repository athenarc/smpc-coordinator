const fs = require('fs')

const HYPERLEDGER_CHANNEL = process.env.HYPERLEDGER_CHANNEL
const HYPERLEDGER_CHAINCODE_ID = process.env.HYPERLEDGER_CHAINCODE_ID
const HYPERLEDGER_PEER_ADDR = process.env.HYPERLEDGER_PEER_ADDR
const HYPERLEDGER_PEER_DOMAIN = process.env.HYPERLEDGER_PEER_DOMAIN
const HYPERLEDGER_IDENTITY = process.env.HYPERLEDGER_IDENTITY
const HYPERLEDGER_CERT = fs.readFileSync(process.env.HYPERLEDGER_CERT, { encoding: 'utf-8' })
const HYPERLEDGER_KEY_STORE = process.env.HYPERLEDGER_KEY_STORE

module.exports = {
  HYPERLEDGER_CHANNEL,
  HYPERLEDGER_CHAINCODE_ID,
  HYPERLEDGER_PEER_ADDR,
  HYPERLEDGER_PEER_DOMAIN,
  HYPERLEDGER_IDENTITY,
  HYPERLEDGER_CERT,
  HYPERLEDGER_KEY_STORE
}
