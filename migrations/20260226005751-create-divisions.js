'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('divisions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      office_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'offices', // Pangalan ng table na ni-re-reference
          key: 'id'         // Primary key ng offices table
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Kapag binura ang Office, mabubura din ang Divisions nito
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      abbr: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('divisions');
  }
};