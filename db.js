const level = require('level')
const path = require('path')
const { appEmitter } = require('./emitters.js')

const db = level(path.resolve(__dirname, './smpc-db'), { valueEncoding: 'json' })

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
