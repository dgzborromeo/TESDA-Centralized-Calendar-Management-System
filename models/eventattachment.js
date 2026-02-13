'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventAttachment extends Model {
    static associate(models) {
      // Ang attachment ay nakakabit sa isang Event
      this.belongsTo(models.Event, { 
        foreignKey: 'event_id',
        as: 'event'
      });
    }
  }

  EventAttachment.init({
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size_bytes: {
      type: DataTypes.INTEGER.UNSIGNED, // Para tumugma sa INT UNSIGNED ng migration
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'EventAttachment',
    tableName: 'event_attachments',
    underscored: true,
    timestamps: true,
    updatedAt: false,          // Walang updated_at sa migration mo
    createdAt: 'created_at'    // Saktong mapping
  });

  return EventAttachment;
};