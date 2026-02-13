'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventRsvp extends Model {
    static associate(models) {
      // Isang RSVP ay para sa isang partikular na Event
      this.belongsTo(models.Event, { 
        foreignKey: 'event_id',
        as: 'event' 
      });

      // Isang RSVP ay galing sa isang User (Office representative)
      this.belongsTo(models.User, { 
        foreignKey: 'office_user_id', 
        as: 'office' 
      });
    }
  }

  EventRsvp.init({
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    office_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      allowNull: false,
      defaultValue: 'pending'
    },
    representative_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    decline_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'EventRsvp',
    tableName: 'event_rsvps', // Pluralized snake_case
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return EventRsvp;
};