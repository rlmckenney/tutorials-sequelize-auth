const router = require('express').Router()
const { User } = require('../../models')

router.post('/', async (req, res, next) => {
  try {
    const user = await User.create(req.body)
    res.status(201).json({ data: user })
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  User.findAll()
    .then(users => res.status(200).json({ data: users }))
    .catch(next)
})

module.exports = router
