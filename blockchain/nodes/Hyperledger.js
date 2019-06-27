const FabricClient = require('fabric-client')

const {
  HYPERLEDGER_CHANNEL,
  HYPERLEDGER_CHAINCODE_ID,
  HYPERLEDGER_PEER_ADDR,
  HYPERLEDGER_PEER_DOMAIN,
  HYPERLEDGER_IDENTITY,
  HYPERLEDGER_CERT,
  HYPERLEDGER_KEY_STORE
} = require('../config')

const Node = require('./Node')
const query = require('../query')
const logger = require('../../config/winston')

const { BlockchainError } = require('../../errors')

class Hyperledger extends Node {
  constructor () {
    super()
    this.client = new FabricClient()

    // setup the fabric network
    this.channel = this.client.newChannel(HYPERLEDGER_CHANNEL)

    // let peer = this.client.newPeer(PEER_ADDR);
    this.peer = this.client.newPeer(HYPERLEDGER_PEER_ADDR,
      {
        'pem': Buffer.from(HYPERLEDGER_CERT).toString(),
        'ssl-target-name-override': HYPERLEDGER_PEER_DOMAIN
      }
    )

    this.channel.addPeer(this.peer)
    this.updateStudy = this.updateStudy.bind(this)
    this.updateStudyResponse = this.updateStudyResponse.bind(this)
    this.registerData = this.registerData.bind(this)
    this.registerResponse = this.registerResponse.bind(this)
    this.handleError = this.handleError.bind(this)
  }

  async connect () {
    logger.info('Connected to Hyperledger Fabric!')

    this.store = await FabricClient.newDefaultKeyValueStore({
      path: HYPERLEDGER_KEY_STORE
    })

    this.client.setStateStore(this.store)
    let cryptoSuite = FabricClient.newCryptoSuite()
    let cryptoStore = FabricClient.newCryptoKeyStore({ path: HYPERLEDGER_KEY_STORE })
    cryptoSuite.setCryptoKeyStore(cryptoStore)
    this.client.setCryptoSuite(cryptoSuite)
    this.user = await this.client.getUserContext(HYPERLEDGER_IDENTITY, true)

    if (!this.user || !this.user.isEnrolled()) {
      throw new BlockchainError('User not found')
    }
  }

  _registerEvents () {
    return new Promise((resolve, reject) => {
      this.eventHub = this.channel.newChannelEventHub(this.peer)
      this.eventHub.registerChaincodeEvent(HYPERLEDGER_CHAINCODE_ID, 'createStudy', this.createStudy, this.handleError)
      this.eventHub.registerChaincodeEvent(HYPERLEDGER_CHAINCODE_ID, 'updateStudy', this.updateStudy, this.handleError)
      this.eventHub.registerChaincodeEvent(HYPERLEDGER_CHAINCODE_ID, 'updateStudyResponse', this.updateStudyResponse, this.handleError)
      this.eventHub.registerChaincodeEvent(HYPERLEDGER_CHAINCODE_ID, 'registerData', this.registerData, this.handleError)
      this.eventHub.registerChaincodeEvent(HYPERLEDGER_CHAINCODE_ID, 'registerResponse', this.registerResponse, this.handleError)
      this.eventHub.connect({ full_block: true }, (err, status) => {
        if (err) {
          reject(err)
        }

        logger.info('Waiting for blockchain events...')
        resolve(status)
      })
    })
  }

  async register () {
    await this._registerEvents()
  }

  registerResponse (event, block, txnid, status) {
    console.log(`registerResponse: Event happened, transaction ID : ${txnid} Status: ${status}`)
    let eventPayload = event.payload.toString()

    let eventPayloadObject = JSON.parse(event.payload.toString())

    console.log(`Payload : ${eventPayload}`)

    let params = [eventPayloadObject.studyid]
    const request = {
      chaincodeId: HYPERLEDGER_CHAINCODE_ID,
      fcn: 'query',
      args: params
    }

    query.cc_query(request, HYPERLEDGER_CHANNEL).then((result) => {
      console.log('Query result :' + result)
    })
  }

  handleError (err) {
    console.log('There is a problem with the event hub : ' + err)
    throw new Error(err)
  }

  createStudy (event, block, txnid, status) {
    console.log(`createStudy : Event happened, transaction ID : ${txnid} Status: ${status}`)
    let eventPayload = event.payload.toString()
    console.log(`Payload : ${eventPayload}`)
  }

  updateStudy (event, block, txnid, status) {
    console.log(`updateStudy : Event happened, transaction ID : ${txnid} Status: ${status}`)
    let eventPayload = event.payload.toString()
    console.log(`Payload : ${eventPayload}`)
  }

  updateStudyResponse (event, block, txnid, status) {
    console.log(`updateStudyResponse : Event happened, transaction ID : ${txnid} Status: ${status}`)
    console.log('Event happened, transaction ID :' + txnid + ' Status:' + status)
    let eventPayload = event.payload.toString()
    console.log(`Payload : ${eventPayload}`)
  }

  registerData (event, block, txnid, status) {
    console.log(`registerData : Event happened, transaction ID : ${txnid} Status: ${status}`)
    let eventPayload = event.payload.toString()
    console.log(`Payload : ${eventPayload}`)
  }
}

module.exports = Hyperledger
