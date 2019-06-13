const level = require('level')
const { appEmitter } = require('./emitters.js')
const { SMPC_DB_PATH } = require('./config/constants')

const db = level(SMPC_DB_PATH, { valueEncoding: 'json' })

appEmitter.on('update-computation', (msg) => {
  updateJob(msg)
})

const addJobToDB = async (job) => {
  await db.put(job.id, { ...job })
}

const updateJob = async (job) => {
  await db.put(job.id, { ...job })
}

const getJob = async (id) => {
  const out = await db.get(id)
  return out
}

module.exports = {
  db,
  addJobToDB,
  updateJob,
  getJob
}
