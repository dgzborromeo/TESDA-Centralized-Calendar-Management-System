'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Office extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.ConfigPosition, { 
    foreignKey: 'office_id',
    as: 'configurations' 
  });
      this.hasMany(models.Division, { 
    foreignKey: 'office_id',
    as: 'divisions' 
  });

      this.belongsTo(models.Cluster, { 
    foreignKey: 'cluster_id',
    as: 'cluster' 
  });
    }
  }
  Office.init({
    cluster_id: { type:DataTypes.INTEGER, allowNull:true},
    office_type: DataTypes.ENUM('CO', 'RO', 'PO', 'DO', 'TI'),
    name: { type:DataTypes.STRING, allowNull:true, unique:true },
    abbr: { type:DataTypes.STRING, allowNull:true},
  }, {
    sequelize,
    modelName: 'Office',
    tableName: 'offices',
    underscored: true,
    timestamps: true,
    updated_at: false,          // Walang updated_at sa migration mo
    created_at: 'created_at'
  });
  return Office;
};