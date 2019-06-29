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

    this.createStudy = this.createStudy.bind(this)
    this.updateStudy = this.updateStudy.bind(this)
    this.updateStudyResponse = this.updateStudyResponse.bind(this)
    this.registerData = this.registerData.bind(this)
    this.registerResponse = this.registerResponse.bind(this)
    this.handleError = this.handleError.bind(this)

    this.events = [
      { name: 'createStudy', onEvent: this.createStudy, onError: this.handleError },
      { name: 'updateStudy', onEvent: this.updateStudy, onError: this.handleError },
      { name: 'updateStudyResponse', onEvent: this.updateStudyResponse, onError: this.handleError },
      { name: 'registerData', onEvent: this.registerData, onError: this.handleError },
      { name: 'registerResponse', onEvent: this.registerResponse, onError: this.handleError }
    ]
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

      for (let event of this.events) {
        this.eventHub.registerChaincodeEvent(HYPERLEDGER_CHAINCODE_ID, event.name, event.onEvent, event.onError)
      }

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

  handleError (err) {
    logger.debug(err)
    throw new BlockchainError(`There is a problem with the event hub : ${err.message}`)
  }

  printInfo (eventName, txnid, status) {
    logger.info(`${eventName}: Event happened, transaction ID : ${txnid} Status: ${status}`)
  }

  async query (params) {
    const request = {
      chaincodeId: HYPERLEDGER_CHAINCODE_ID,
      fcn: 'query',
      args: params
    }

    const res = await query.cc_query(request, this.channel)
    return res
  }

  async createStudy (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
    let eventPayload = JSON.parse(event.payload.toString())
    let properties = JSON.parse(eventPayload.purp)

    let res = await this.query([eventPayload.studyid])
    res = await this.query([`Resp_${eventPayload.studyid}_1`])

    if (properties && properties.smpc) {
      try {
        let request = JSON.parse(eventPayload.studydef)
        await this.requestComputation(request)
      } catch (e) {
        logger.error('Blockchain computation request error: ', e)
      }
    }
  }

  updateStudy (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
    let eventPayload = event.payload.toString()
    console.log(`Payload : ${eventPayload}`)
  }

  updateStudyResponse (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
    let eventPayload = event.payload.toString()
    console.log(`Payload : ${eventPayload}`)
  }

  async registerData (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
    let eventPayload = event.payload.toString()
    let eventPayloadObject = JSON.parse(event.payload.toString())

    console.log(`Payload : ${eventPayload}`)

    const res = await this.query([eventPayloadObject.studyid])
    console.log('Query result :' + res)
    // console.log(`Payload : ${eventPayload}`)
  }

  async registerResponse (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
    let eventPayload = event.payload.toString()

    let eventPayloadObject = JSON.parse(event.payload.toString())

    console.log(`Payload : ${eventPayload}`)

    let res = await this.query([eventPayloadObject.studyid])
    console.log('Query result :' + res)
    res = await this.query(['Snx55wlzy2yklttcqch0kd23zkhyv2pc'])
    console.log('Query result :' + res)
  }
}

module.exports = Hyperledger
