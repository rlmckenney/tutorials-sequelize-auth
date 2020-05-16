const router = require('express').Router()
// const { User } = require('../../models')

router.post('/', async (req, res, next) => {
  try {
    // load the target user based on the `req.body.email` property
    // verify the password with `argon2`
    // create a real JWT token
    const token = 'I am a token'
    res.status(201).json({ data: token })
  } catch (err) {
    next(err)
  }
})

module.exports = router
