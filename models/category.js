'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Focal, {
        foreignKey: 'category_id',
        as: 'focal'
      })
    }
  }
  Category.init({
    category_name: { // Inayos ang typo mula 'catefory'
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Ito ang magpapatupad ng uniqueness constraint
  }
  }, {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    underscored: true,
    created_at: 'created_at',
    updated_at: false
  });
  return Category;
};