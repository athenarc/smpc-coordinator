const bcrypt = require('bcrypt')
const { addUser, getUser } = require('../db')

class User {
  constructor ({ id, username, hash, salt }) {
    this.id = id
    this.username = username
    this.hash = hash
    this.salt = salt
  }

  save () {
    return addUser(
      {
        id: this.id,
        hash: this.hash,
        salt: this.salt
      }
    )
  }

  async validatePassword (password) {
    const match = await bcrypt.compare(password, this.hash)
    return match
  }
}

User.findOne = async username => {
  const res = await getUser(username)
  return new User({ ...res })
}

module.exports = User
