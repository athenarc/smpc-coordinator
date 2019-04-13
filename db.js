const level = require('level')
const { sha256 } = require('./helpers')
const { appEmitter } = require('./emitters.js')

const db = level('./smpc-db', { valueEncoding: 'json' })
const cachedb = level('./smpc-cache', { valueEncoding: 'json' })

appEmitter.on('update-computation', (msg) => {
  updateJob(msg)
})

const addJobToDB = async (job) => {
  const { status: _status, id: _id, ...rest } = job
  await db.put(job.id, { ...job })
  await cachedb.put(sha256(JSON.stringify({ ...rest })), { ...rest, id: _id, status: _status })
}

const updateJob = async (job) => {
  await db.put(job.id, { ...job })
}

module.exports = {
  db,
  cachedb,
  addJobToDB,
  updateJob
}
