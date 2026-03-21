'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_profiles', 'cluster_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'clusters', key: 'id' }, // Siguraduhing plural 'clusters'
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('user_profiles', 'region_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'regions', key: 'id' }, // Kadalasan 'regions'
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('user_profiles', 'province_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'provinces', key: 'id' }, // Kadalasan 'provinces'
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('user_profiles', 'office_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'offices', key: 'id' }, // Kadalasan 'offices'
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('user_profiles', 'designation_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'positions', key: 'id' }, // Siguraduhing 'positions' ang table name mo
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Dapat lahat ng in-add sa 'up', meron ditong remove
    await queryInterface.removeColumn('user_profiles', 'cluster_id');
    await queryInterface.removeColumn('user_profiles', 'region_id');
    await queryInterface.removeColumn('user_profiles', 'province_id');
    await queryInterface.removeColumn('user_profiles', 'office_id'); // Eto yung kulang mo kanina
    await queryInterface.removeColumn('user_profiles', 'designation_id');
  }
};