const router = require('express').Router()
const { Post, User } = require('../../models')

router.post('/', async (req, res, next) => {
  try {
    const post = await Post.create(req.body)
    res.status(201).json({ data: post })
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  Post.findAll({ include: [User] })
    .then(posts => res.status(200).json({ data: posts }))
    .catch(next)
})

module.exports = router
