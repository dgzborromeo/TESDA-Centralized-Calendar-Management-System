'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('events', 'is_posted', { // Pangalan ng column
      type: Sequelize.BOOLEAN,
      defaultValue: true,      // Default value (true o false)
      allowNull: true,        // Hindi pwedeng null
      after: 'status'            // Opsyonal: Ilalagay sa tabi ng 'name' column (MySQL only)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'is_posted');
  }
};