'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. location_type (CO, RO, PO, TI, Others)
    await queryInterface.addColumn('schedules', 'location_type', {
      type: Sequelize.ENUM('CO', 'RO', 'PO', 'TI', 'Others'),
      allowNull: true,
      after: 'id' // Ilalagay sa dulo o pagkatapos ng specific column (MySQL)
    });

    // 2. location_table (Kung anong table galing: offices, regions, etc.)
    await queryInterface.addColumn('schedules', 'location_table', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'location_type'
    });

    // 3. location_id (Ang ID galing sa source table)
    await queryInterface.addColumn('schedules', 'location_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'location_table'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reverse order ang pag-remove para malinis
    await queryInterface.removeColumn('schedules', 'location_id');
    await queryInterface.removeColumn('schedules', 'location_table');
    await queryInterface.removeColumn('schedules', 'location_type');
    
  }
};