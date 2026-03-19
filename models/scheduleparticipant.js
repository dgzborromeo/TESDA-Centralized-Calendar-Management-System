'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ScheduleParticipant extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Schedule, {
        foreignKey: 'schedule_id',
        as: 'schedule'
      });
      this.belongsTo(models.Position, {
        foreignKey: 'designation_id',
        as: 'designation'
      });
    }
  }
  ScheduleParticipant.init({
    schedule_id: DataTypes.INTEGER,
    designation_id: DataTypes.INTEGER,
    target_id: DataTypes.INTEGER,
    target_type: DataTypes.STRING,
    is_all: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'ScheduleParticipant',
    tableName: 'schedule_participants',
    underscored: true,
  });
  return ScheduleParticipant;
};