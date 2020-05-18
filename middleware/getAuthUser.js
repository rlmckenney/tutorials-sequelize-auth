const { User } = require('../models')
const jwt = require('jsonwebtoken')

// This should really come from an environment variable.
// For this simple example make sure that it matches the one used
// to create the token in `/routes/api/auth-tokens.js`
const jwtPrivateKey = 'superSecretKey'

/**
 * Extract the JWT from the Authorization header string.
 * @param {string} headerValue
 * @return {string | undefined} The JWT if present, else undefined
 */
function parseToken (headerValue) {
  if (headerValue) {
    const [type, token] = headerValue.split(' ')
    if (type === 'Bearer' && typeof token !== 'undefined') {
      return token
    }
    return undefined
  }
}

module.exports = async (req, res, next) => {
  // Check if we have a token in the request headers
  const token = parseToken(req.header('Authorization'))
  if (!token) {
    return res.status(401).send({
      errors: [
        {
          status: '401',
          title: 'Authentication failed',
          detail: 'Missing bearer token'
        }
      ]
    })
  }

  try {
    // Get the user.id from the token
    const { id } = jwt.verify(token, jwtPrivateKey)
    // Load the User from the database and store it on the request object
    req.user = await User.findByPk(id)
    // Pass control to the next middleware or the route handler function
    next()
  } catch (err) {
    console.log(err)
    res.status(401).send({
      errors: [
        {
          status: '401',
          title: 'Authentication failed',
          detail: 'Invalid bearer token'
        }
      ]
    })
  }
}
