const fs = require('fs')
const path = require('path')

const SMPC_DB_NAME = 'smpc-db'
const CACHE_DB_NAME = 'smpc-cache'
const USER_DB_NAME = 'smpc-user-db'

const SMPC_DB_PATH = path.resolve(__dirname, '../', SMPC_DB_NAME)
const CACHE_DB_PATH = path.resolve(__dirname, '../', CACHE_DB_NAME)
const USER_DB_PATH = path.resolve(__dirname, '../', USER_DB_NAME)

const status = {
  PENDING: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  FAILED: 3,
  properties: {
    0: { 'msg': 'pending' },
    1: { 'msg': 'processing' },
    2: { 'msg': 'completed' },
    3: { 'msg': 'failed' }
  }
}

const step = {
  INIT: 0,
  DATA_SIZE_ACCEPTED: 1,
  COMPILE_START: 2,
  COMPILE_END: 3,
  IMPORT_START: 4,
  IMPORT_END: 5,
  COMPUTATION_START: 6,
  COMPUTATION_END: 7,
  COMPLETED: 8,
  properties: {
    0: { 'msg': 'Init SMPC Computation' },
    1: { 'msg': 'Total data size accepted.' },
    2: { 'msg': 'Compiling MPC code' },
    3: { 'msg': 'MPC code compilation finished' },
    4: { 'msg': 'Importing data' },
    5: { 'msg': 'Data Importation Finished' },
    6: { 'msg': 'Computation started' },
    7: { 'msg': 'Computation completed' },
    8: { 'msg': 'Completed.' }
  }
}

const ROOT_CA = fs.readFileSync(process.env.ROOT_CA, { encoding: 'utf-8' })
const CERT = fs.readFileSync(process.env.CERT, { encoding: 'utf-8' })
const KEY = fs.readFileSync(process.env.KEY, { encoding: 'utf-8' })

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const JWT_SECRET = process.env.JWT_SECRET || 'smpc-coordinator jwt secret'
const AUTH_API = process.env.AUTH_API

module.exports = {
  status: Object.freeze(status),
  step: Object.freeze(step),
  ROOT_CA,
  CERT,
  KEY,
  REDIS_URL,
  SMPC_DB_PATH,
  CACHE_DB_PATH,
  USER_DB_PATH,
  JWT_SECRET,
  AUTH_API
}
