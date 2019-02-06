const level = require('level')

const db = level('./smpc-db', { valueEncoding: 'json' })
const cachedb = level('./smpc-cache', { valueEncoding: 'json' })

module.exports = {
  db,
  cachedb
}
