'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('schedules', 'status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Tentative' // Heto ang default na hinihingi mo
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('schedules', 'status');
  }
};