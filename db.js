const level = require('level')
const { appEmitter } = require('./emitters.js')

const db = level('./smpc-db', { valueEncoding: 'json' })

appEmitter.on('update-computation', (msg) => {
  updateJob(msg)
})

const addJobToDB = async (job) => {
  await db.put(job.id, { ...job })
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
