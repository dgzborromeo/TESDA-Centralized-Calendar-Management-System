'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DayFlag extends Model {}
  DayFlag.init({
    date: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM('suspended', 'wfh', 'suspended_wfh'),
      allowNull: false,
      defaultValue: 'suspended',
    },
    note: { type: DataTypes.STRING(255), allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
  }, {
    sequelize,
    modelName: 'DayFlag',
    tableName: 'day_flags',
  });
  return DayFlag;
};
