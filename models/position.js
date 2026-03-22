'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Position extends Model {
    static associate(models) {
    this.hasMany(models.ConfigPosition, { 
        foreignKey: 'position_id',
        as: 'configurations' 
      });
    this.hasMany(models.ScheduleParticipant, {
        foreignKey: 'designation_id',
        as: 'schedule_participants'
      });
    this.hasMany(models.UserProfile, { foreignKey: 'cluster_id', as: 'user_profile' });
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
    },
    has_sub_menu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
    },
    sub_menu_type: DataTypes.STRING,
    sub_menu_source: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Position',
    tableName: 'positions', // Tugma sa migration
    updated_at: false,          // Walang updated_at sa migration mo
    created_at: 'created_at',
    underscored: true,
  });
  return Position;
};