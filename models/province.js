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
        this.hasMany(models.Schedule, {
          foreignKey: 'location_id',
          constraints: false,
          scope: {
            location_table: 'provinces'
          },
          as: 'schedules'
        });

        this.belongsTo(models.Province, {
          foreignKey: 'affected_id',
          as: 'transit_province'
        });

        // Kung gusto mo ring makita kung anong mga provinces ang dadaan sa kanya
        this.hasMany(models.Province, {
          foreignKey: 'affected_id',
          as: 'dependent_provinces'
        });

    }
  }
  Province.init({
    region_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    direct_flight: DataTypes.BOOLEAN,
    affected_id: {
  type: DataTypes.INTEGER,
  allowNull: true
},
affected_province: {
  type: DataTypes.STRING,
  allowNull: true
}
  }, {
    sequelize,
    modelName: 'Province',
    tableName: 'provinces',
    underscored: true, // Para automatic ang created_at at updated_at
  });
  return Province;
};