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
      this.belongsTo(models.Office, {
        foreignKey: 'location_id',
        constraints: false,
        as: 'office_location'
      });

      // 2. Link to Regions (RO)
      this.belongsTo(models.Region, {
        foreignKey: 'location_id',
        constraints: false,
        as: 'region_location'
      });

      // 3. Link to Provinces/Districts (PO)
      this.belongsTo(models.Province, {
        foreignKey: 'location_id',
        constraints: false,
        as: 'province_location'
      });

      // 4. Link to TTIs (TI)
      this.belongsTo(models.TTI, { // Siguraduhin na 'Tti' ang pangalan ng model mo
        foreignKey: 'location_id',
        constraints: false,
        as: 'tti_location'
      });
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
    },
    location_type: {
      type: DataTypes.ENUM('CO', 'RO', 'PO', 'TI', 'Others'),
      allowNull: true
    },
    location_table: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: true
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