'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Position extends Model {
    static associate(models) {
    this.hasMany(models.ConfigPosition, { 
        foreignKey: 'position_id',
        as: 'configurations' 
      });
    }
  }
  Position.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    }
  }, {
    sequelize,
    modelName: 'Position',
    tableName: 'positions', // Tugma sa migration
    updated_at: false,          // Walang updated_at sa migration mo
    created_at: 'created_at'
  });
  return Position;
};