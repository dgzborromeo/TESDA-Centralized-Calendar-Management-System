'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TTI extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Province, {
        foreignKey: 'province_id',
        as: 'province'
      });
      this.hasMany(models.ScheduleParticipant, {
    foreignKey: 'target_id',
    constraints: false,
    scope: { target_type: 'tti' },
    as: 'participants'
  });
  this.hasMany(models.UserProfile, {
    foreignKey: 'tti_id',
    constraints: false,
    as: 'user_profiles'
  });
    }
  }
  TTI.init({
    province_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    classification: DataTypes.STRING,
    address: DataTypes.TEXT,
    email: DataTypes.STRING
  }, {
    sequelize,
      modelName: 'TTI',
      tableName: 'ttis', // Siguraduhing plural ito
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
  });
  return TTI;
};