const Hyperleder = require('./nodes/Hyperledger')
const Ethereum = require('./nodes/Ethereum')

const blockchain = (node) => {
  switch (node) {
    case 'ethereum':
      return Ethereum
    case 'hyperledger':
      return Hyperleder
    default:
      throw new Error('Unsupported blockchain!')
  }
}

module.exports = blockchain
