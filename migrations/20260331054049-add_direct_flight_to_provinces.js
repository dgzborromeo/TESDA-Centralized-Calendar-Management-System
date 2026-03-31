'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('provinces', 'direct_flight', { // Pangalan ng column
      type: Sequelize.BOOLEAN,
      defaultValue: true,      // Default value (true o false)
      allowNull: true,        // Hindi pwedeng null
      after: 'name'            // Opsyonal: Ilalagay sa tabi ng 'name' column (MySQL only)
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('provinces', 'direct_flight');
  }
};