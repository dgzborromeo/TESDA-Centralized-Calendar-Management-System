'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('positions', 'has_sub_menu', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
    await queryInterface.addColumn('positions', 'sub_menu_type', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'cluster, office, region, prov_region, district_ncr'
    });
    await queryInterface.addColumn('positions', 'sub_menu_source', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'clusters, offices, regions, districts'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('positions', 'has_sub_menu');
    await queryInterface.removeColumn('positions', 'sub_menu_type');
    await queryInterface.removeColumn('positions', 'sub_menu_source');
  }
};