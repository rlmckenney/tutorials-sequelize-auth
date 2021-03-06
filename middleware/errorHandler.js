function isValidationError (err) {
  return !!(err.name && err.name === 'SequelizeValidationError')
}

module.exports = (err, req, res, next) => {
  if (isValidationError(err)) {
    res.status(400).json({ errors: err.errors })
  } else {
    res.status(500).json({ errors: [err] })
  }
}
