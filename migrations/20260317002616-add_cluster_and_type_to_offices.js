'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add cluster_id (Foreign Key)
    await queryInterface.addColumn('offices', 'cluster_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { 
        model: 'clusters', 
        key: 'id' 
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // 2. Add office_type (ENUM)
    await queryInterface.addColumn('offices', 'office_type', {
      type: Sequelize.ENUM('CO', 'RO', 'PO', 'DO', 'TI'),
      defaultValue: 'CO',
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Tanggalin ang columns pag nag-rollback
    await queryInterface.removeColumn('offices', 'cluster_id');
    await queryInterface.removeColumn('offices', 'office_type');
    
    // Importante: Kapag ENUM ang nire-remove sa Postgres, 
    // minsan kailangan pang i-drop ang Type manually, 
    // pero sa MySQL/MariaDB, removeColumn lang ay sapat na.
  }
};