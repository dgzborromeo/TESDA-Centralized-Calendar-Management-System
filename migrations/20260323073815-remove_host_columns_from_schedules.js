module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('schedules', 'host_name');
    await queryInterface.removeColumn('schedules', 'host_division');
  },

  down: async (queryInterface, Sequelize) => {
    // Kung gusto mong i-undo, kailangang ibalik ang columns
    await queryInterface.addColumn('schedules', 'host_name', { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('schedules', 'host_division', { type: Sequelize.STRING, allowNull: true });
  }
};