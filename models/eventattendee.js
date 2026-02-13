'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventAttendee extends Model {
    static associate(models) {
      // Dito, pwede mong i-define ang direct link kung kailangan
      // Pero madalas, sapat na yung definition sa User at Event models
    }
  }

  EventAttendee.init({
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' }
    }
  }, {
    sequelize,
    modelName: 'EventAttendee',
    tableName: 'event_attendees', // Plural matching your migration
    underscored: true,
    timestamps: true,             // Naka-true para sa created_at
    updatedAt: false,            // I-disable kasi wala sa migration mo
    createdAt: 'created_at'      // Map to your specific column name
  });

  return EventAttendee;
};