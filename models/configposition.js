'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConfigPosition extends Model {
static associate(models) {
  // Ang config row ay "pag-aari" ng isang Office
  this.belongsTo(models.Office, { 
    foreignKey: 'office_id',
    as: 'office' 
  });

  // Ang config row ay "pag-aari" ng isang Division
  this.belongsTo(models.Division, { 
    foreignKey: 'division_id',
    as: 'division' 
  });

  // Ang config row ay "pag-aari" ng isang Position
  this.belongsTo(models.Position, { 
    foreignKey: 'position_id',
    as: 'position' 
  });
}
  }
  ConfigPosition.init({
    office_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    division_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    position_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ConfigPosition',
    tableName: 'config_positions', // Tugma sa migration
    updated_at: false,          // Walang updated_at sa migration mo
    created_at: 'created_at',
    underscored: true,
  });
  return ConfigPosition;
};