'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cluster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Office, { 
    foreignKey: 'cluster_id',
    as: 'office' 
  });
  this.hasMany(models.UserProfile, { foreignKey: 'cluster_id', as: 'user_profile' });
  this.hasMany(models.ScheduleParticipant, {
    foreignKey: 'target_id',
    constraints: false,
    scope: { target_type: 'cluster' },
    as: 'participants'
  });
    }
  }
  Cluster.init({
    name: DataTypes.STRING,
    color: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Cluster',
    tableName: 'clusters',
    underscored: true,
    created_at: 'created_at',
    updated_at: false
  });
  return Cluster;
};