const _ = require('lodash')
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
const { appEmitter } = require('../../emitters.js')

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

    this.computationCompleted = this.computationCompleted.bind(this)

    this.events = [
      { name: 'createStudy', onEvent: this.createStudy, onError: this.handleError },
      { name: 'updateStudy', onEvent: this.updateStudy, onError: this.handleError },
      { name: 'updateStudyResponse', onEvent: this.updateStudyResponse, onError: this.handleError },
      { name: 'registerData', onEvent: this.registerData, onError: this.handleError },
      { name: 'registerResponse', onEvent: this.registerResponse, onError: this.handleError }
    ]

    this.studies = {}
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

  computationCompleted (job) {

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

    appEmitter.on('computation-completed', this.computationCompleted)
  }

  handleError (err) {
    logger.debug(err)
    throw new BlockchainError(`There is a problem with the event hub : ${err.message}`)
  }

  printInfo (eventName, txnid, status) {
    this.log(`Event: ${eventName} transaction ID : ${txnid} Status: ${status}`)
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

    try {
      let payload = JSON.parse(event.payload.toString())
      let properties = JSON.parse(payload.purp)

      this.log(`createStudy: Study ID: ${payload.studyid}`)

      if (properties && properties.smpc) {
        let request = JSON.parse(payload.studydef)
        request = this.normalizeRequest(request)

        this.studies[payload.studyid] = {
          responses: 0,
          confirmationsNeeded: 1,
          clients: [],
          request: { ...request, studyID: payload.studyid, studyName: payload.studyname || '', tx: txnid },
          raw_request: JSON.parse(payload.studydef)
        }
      }
    } catch (e) {
      this.catchError(e, 'createStudy')
    }
  }

  updateStudy (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
  }

  updateStudyResponse (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
  }

  async registerData (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)
  }

  async registerResponse (event, block, txnid, status) {
    this.printInfo(event.event_name, txnid, status)

    let payload = JSON.parse(event.payload.toString())
    this.log(`Data registration response. Study ID: ${payload.studyid}`)

    let res = await this.query([payload.studyid])
    res = JSON.parse(res)

    if (res.status === '200') {
      const study = payload.studyid.split('_')
      this.updateConfirmation(study[1], study[2], res.response)
    }
  }

  async updateConfirmation (studyID, id, res) {
    try {
      const link = JSON.parse(res.link)

      if (!this.studies.hasOwnProperty(studyID) || !_.isArray(link)) {
        return
      }

      this.studies[studyID].responses += 1
      this.studies[studyID].clients.push({ id, res })

      this.studies[studyID].request.dataProviders = [0]

      await this.requestComputation(
        {
          ...this.studies[studyID].request,
          link: link[0],
          raw_request: this.studies[studyID].raw_request
        })
    } catch (e) {
      this.catchError(e, 'updateConfirmation')
    }
  }
}

module.exports = Hyperledger
