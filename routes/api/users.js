const router = require('express').Router()
const { User } = require('../../models')

router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({ data: user })
  } catch (err) {
    console.log(err)
    next(err)
  }
})

module.exports = router
