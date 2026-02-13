'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },
      // --- Dagdag para sa Email Confirmation Task ---
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      verification_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      // ----------------------------------------------
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      engine: 'InnoDB', // Pinipilit na maging InnoDB (katulad ng SQL mo)
      charset: 'utf8mb4'
    });

    // Pag-create ng Indices (INDEX idx_email at INDEX idx_role)
    await queryInterface.addIndex('users', ['email'], { name: 'idx_email' });
    await queryInterface.addIndex('users', ['role'], { name: 'idx_role' });
  },

  async down (queryInterface, Sequelize) {
    // Katumbas ng DROP TABLE
    await queryInterface.dropTable('users');
  }
};