const express = require('express')
const jwt = require('jsonwebtoken')

const { JWT_SECRET } = require('../config/constants')
const { HTTPError, AuthenticationError } = require('../errors')
const auth = require('../auth')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  if (!req.body.username || !req.body.token) {
    return next(new HTTPError(401, 'Unauthorized'))
  }

  try {
    // throws error when authorization fails
    await auth.authorizeUser(req.body.username, req.body.token)
    const payload = { username: req.body.username }
    const token = jwt.sign(payload, JWT_SECRET)
    return res.status(200).json({ jwt_token: token })
  } catch (e) {
    if (e instanceof AuthenticationError) {
      return next(new HTTPError(401, e.message))
    }
    return next(new HTTPError(500, 'Server error'))
  }
})

module.exports = router
