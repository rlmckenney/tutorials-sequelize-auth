const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { notEmpty: true }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { isEmail: true }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [6] }
      }
    },
    { sequelize }
  )

  return User
}
