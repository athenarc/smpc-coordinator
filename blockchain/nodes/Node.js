module.exports = class Node {
  constructor () {
    if (new.target === Node) {
      throw new TypeError('Cannot construct Abstract instances directly')
    }
  }

  connect () {
    throw new Error('connect: Implementation Missing!')
  }
}
