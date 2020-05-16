const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {}

  Post.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      },
      body: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true }
      }
    },
    {
      sequelize
    }
  )

  Post.associate = models => Post.belongsTo(models.User)

  return Post
}
