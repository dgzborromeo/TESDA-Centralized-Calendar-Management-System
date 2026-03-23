'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    /**
     * Helper method for defining associations.
     * Dito mo ilalagay kung may foreign keys ka (e.g., belongsTo, hasMany).
     */
    static associate(models) {
      this.hasMany(models.ScheduleParticipant, {
        foreignKey: 'schedule_id',
        as: 'schedule_participants'
      });
      this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  Schedule.init({
    user_id: DataTypes.INTEGER,
    event_title: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      // Paalala: Ilagay dito ang parehong ENUM values na nasa migration
      type: DataTypes.ENUM('Face to Face', 'Hybrid', 'Virtual/Zoom'), 
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    participants: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachment_file: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachment_path: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Tentative'
    }
  }, {
    sequelize,
    modelName: 'Schedule',
    tableName: 'schedules', // Explicitly naming the table
    underscored: true,      // Importante: Para gumana ang created_at at updated_at
    timestamps: true,       // Awtomatikong iha-handle ng Sequelize ang timestamps
  });

  return Schedule;
};