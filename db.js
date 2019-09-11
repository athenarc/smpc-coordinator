const _ = require('lodash')
const level = require('level')
const { appEmitter } = require('./emitters.js')
const { SMPC_DB_PATH } = require('./config/constants')
const logger = require('./config/winston')

const db = level(SMPC_DB_PATH, { valueEncoding: 'json' })

appEmitter.on('update-computation', msg => {
  try {
    updateJob(msg)
  } catch (e) {
    logger.error('DB: Update computation failed', e)
  }
})

const normalizeDBRecord = rec => {
  const forbiddenAttributes = ['link', 'totalClients']
  return _.omit(rec, forbiddenAttributes)
}

const addJobToDB = async job => {
  await db.put(job.id, { ...job })
}

const updateJob = async job => {
  await db.put(job.id, { ...job })
}

const getJob = async id => {
  let out = await db.get(id)
  return normalizeDBRecord(out)
}

module.exports = {
  db,
  addJobToDB,
  updateJob,
  getJob
}
