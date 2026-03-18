'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Region extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    this.hasMany(models.Province, { 
    foreignKey: 'region_id',
    as: 'province' 
    });
    }
  }
  Region.init({
    region: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Region',
    tableName: 'regions', 
    underscored: true,
  });
  return Region;
};