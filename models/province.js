'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Province extends Model {
    static associate(models) {
      // Isang probinsya ay nasa ilalim ng isang rehiyon
      this.belongsTo(models.Region, { 
        foreignKey: 'region_id',
        as: 'region' 
      });
       this.hasMany(models.UserProfile, { foreignKey: 'province_id', as: 'user_profile' });

       this.hasMany(models.TTI, {
          foreignKey: 'province_id',
          as: 'ttis'
        });
        this.hasMany(models.ScheduleParticipant, {
    foreignKey: 'target_id',
    constraints: false,
    scope: { target_type: 'province' },
    as: 'participants'
  });
    }
  }
  Province.init({
    region_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    direct_flight: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Province',
    tableName: 'provinces',
    underscored: true, // Para automatic ang created_at at updated_at
  });
  return Province;
};