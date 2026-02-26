// models/division.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Division extends Model {
    static associate(models) {
      this.hasMany(models.ConfigPosition, { 
    foreignKey: 'division_id',
    as: 'configurations' 
  });
      // Isang Division ay kabilang sa isang Office
      this.belongsTo(models.Office, { 
        foreignKey: 'office_id',
        as: 'office' 
      });
    }
  }
  Division.init({
    office_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    abbr: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Division',
    tableName: 'divisions', // Tugma sa migration name
    updated_at: false,          // Walang updated_at sa migration mo
    created_at: 'created_at'
  });
  return Division;
};