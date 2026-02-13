'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Conflict extends Model {
    static associate(models) {
      // Ang main event na may conflict
      this.belongsTo(models.Event, { 
        foreignKey: 'event_id', 
        as: 'mainEvent' 
      });

      // Ang event na naging dahilan ng conflict
      this.belongsTo(models.Event, { 
        foreignKey: 'conflicting_event_id', 
        as: 'conflictingEvent' 
      });
    }
  }

  Conflict.init({
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    conflicting_event_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Conflict',
    tableName: 'conflicts',
    underscored: true,
    timestamps: true,
    updatedAt: false,          // Walang updated_at sa migration mo
    createdAt: 'created_at'    // Saktong mapping
  });

  return Conflict;
};