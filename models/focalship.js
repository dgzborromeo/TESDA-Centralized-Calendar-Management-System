'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Focal extends Model {
    static associate(models) {
    }
  }
  Focal.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Focalship',
    tableName: 'focalships',
    underscored: true
  });
  return Focal;
};