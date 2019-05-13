const roles = {
  manager: {
    can: ['publish'],
    inherits: ['writer']
  },
  writer: {
    can: ['write'],
    inherits: ['guest']
  },
  guest: {
    can: ['read']
  }
}

module.exports = roles
