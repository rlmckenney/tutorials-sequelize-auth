const router = require('express').Router()
const argon2 = require('argon2')
const jwt = require('jsonwebtoken')
const { User } = require('../../models')

router.post('/', async (req, res, next) => {
  try {
    // Check if the User exists
    const user = await User.scope('withPassword').findOne({
      where: { email: req.body.email }
    })
    if (!user) throw new Error('Bad email or password')

    // Verify the password
    const didAuthenticate = await argon2.verify(
      user.password,
      req.body.password
    )
    if (!didAuthenticate) throw new Error('Bad email or password')

    // Encode the user.id in the JWT
    const token = jwt.sign({ id: user.id }, 'superSecretKey')
    res.status(201).json({ data: token })
  } catch (err) {
    // @todo create a ResourceNotFoundException class
    next(err)
  }
})

module.exports = router
