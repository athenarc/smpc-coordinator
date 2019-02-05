const level = require('level')

const db = level('./smpc')
const cachedb = level('./smpc-cache')

module.exports = {
  db,
  cachedb
}
