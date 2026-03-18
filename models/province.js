'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Province extends Model {
    static associate(models) {
      // Isang probinsya ay nasa ilalim ng isang rehiyon
      this.belongsTo(models.Region, { 
        foreignKey: 'region_id',
        as: 'region' 
      });
    }
  }
  Province.init({
    region_id: DataTypes.INTEGER,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Province',
    tableName: 'provinces',
    underscored: true, // Para automatic ang created_at at updated_at
  });
  return Province;
};