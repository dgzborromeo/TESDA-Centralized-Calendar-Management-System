'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('config_positions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      office_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Gawing nullable
        references: {
          model: 'offices', // Pangalan ng table sa database
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Imbes na Cascade, SET NULL para hindi mabura ang config kung mabura ang office
      },
      division_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Gawing nullable
        references: {
          model: 'divisions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      position_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Gawing nullable
        references: {
          model: 'positions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('config_positions');
  }
};