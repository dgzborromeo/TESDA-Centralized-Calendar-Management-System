'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Region extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
    this.hasMany(models.Province, { 
    foreignKey: 'region_id',
    as: 'province' 
    });
     this.hasMany(models.UserProfile, { foreignKey: 'region_id', as: 'user_profile' });
     this.hasMany(models.ScheduleParticipant, {
    foreignKey: 'target_id',
    constraints: false,
    scope: { target_type: 'region' },
    as: 'participants'
  });
    }
  }
  Region.init({
    region: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Region',
    tableName: 'regions', 
    underscored: true,
  });
  return Region;
};