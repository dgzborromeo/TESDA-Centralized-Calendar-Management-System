'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      // BelongsTo: Ang bawat event ay nilikha ng isang User (Admin)
      this.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator' // Para magamit mo: event.creator
      });

      // Many-to-Many: Ang event ay may maraming attendees (Users)
      this.belongsToMany(models.User, {
        through: 'event_attendees',
        foreignKey: 'event_id',
        otherKey: 'user_id',
        as: 'attendees'
      });
    }
  }

  Event.init({
    // Hindi na kailangan i-define ang 'id' manually (automatic na 'to), 
    // pero ang attributes sa baba ay dapat tugma sa migration:
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('meeting', 'zoom', 'event'),
      allowNull: false,
      defaultValue: 'meeting'
    },
    date: {
      type: DataTypes.DATEONLY, // Saktong DATE lang (YYYY-MM-DD)
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.TIME, // HH:mm:ss
      allowNull: false
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    location: DataTypes.STRING(500),
    description: DataTypes.TEXT,
    color: DataTypes.STRING(50),
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Event',      // SINGULAR (Para sa logic mo)
    tableName: 'events',     // PLURAL (Eto yung table sa MySQL)
    underscored: true,       // Para created_at, hindi createdAt
    timestamps: true,
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  });

  return Event;
};