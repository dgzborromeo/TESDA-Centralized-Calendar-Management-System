module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('schedules', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Gawing true muna para hindi mag-error sa existing data
      references: {
        model: 'users', // Pangalan ng target table
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // O 'CASCADE' depende sa gusto mo
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('schedules', 'user_id');
  }
};