'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  UserProfile.init({
    user_id: DataTypes.INTEGER,
    first_name: DataTypes.STRING,
    middle_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    designation: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    office_department: DataTypes.STRING,
    picture: DataTypes.STRING,
    qr_code: DataTypes.TEXT // TEXT ang ginamit ko para kung sakaling Base64 ang itago niyo, kasya
  }, {
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return UserProfile;
};