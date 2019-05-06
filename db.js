const level = require('level')
const path = require('path')
const { appEmitter } = require('./emitters.js')

const db = level(path.resolve(__dirname, './smpc-db'), { valueEncoding: 'json' })
const userDB = level(path.resolve(__dirname, './smpc-user-db'), { valueEncoding: 'json' })

const databases = {
  'smpc': db,
  'users': userDB
}

appEmitter.on('update-computation', (msg) => {
  updateJob(msg)
})

const add = (db, key, value) => {
  return databases[db].put(key, { ...value })
}

const get = (db, key) => {
  return databases[db].get(key)
}

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

const getUser = async id => {
  const out = await get('users', id)
  return out
}

const addUser = async user => {
  await add('user', user.username, user)
}

module.exports = {
  db,
  userDB,
  addJobToDB,
  updateJob,
  getJob,
  getUser,
  addUser
}
