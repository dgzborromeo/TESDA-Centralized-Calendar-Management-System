'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      this.belongsTo(models.Cluster, { foreignKey: 'cluster_id', as: 'cluster_data' });
      this.belongsTo(models.Region, { foreignKey: 'region_id', as: 'region_data' });
      this.belongsTo(models.Province, { foreignKey: 'province_id', as: 'province_data' });
      this.belongsTo(models.Office, { foreignKey: 'office_id', as: 'office_data' });
      this.belongsTo(models.Position, { foreignKey: 'designation_id', as: 'position' });
      this.belongsTo(models.TTI, { foreignKey: 'tti_id', as: 'tti' });
    }
    
  }
  UserProfile.init({
    user_id: DataTypes.INTEGER,
    cluster_id: DataTypes.INTEGER,
    region_id: DataTypes.INTEGER,
    province_id: DataTypes.INTEGER,
    office_id: DataTypes.INTEGER,
    designation_id: DataTypes.INTEGER,
    tti_id: DataTypes.INTEGER,
    tti_name: DataTypes.STRING,
    first_name: DataTypes.STRING,
    middle_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    designation: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    office: DataTypes.STRING,
    division: DataTypes.STRING,
    cluster: DataTypes.STRING,
    region: DataTypes.STRING,
    province_district: DataTypes.STRING,
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