module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('schedules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      host_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      host_division: {
        type: Sequelize.STRING,
        allowNull: true
      },
      event_title: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        // IMPORTANT: Add your allowed values here
        type: Sequelize.ENUM('Face to Face', 'Hybrid', 'Virtual/Zoom'), 
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATEONLY, // Use DATEONLY if you don't need time inside this field
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      location: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      participants: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachment_file: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attachment_path: {
        type: Sequelize.TEXT,
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
  down: async (queryInterface) => {
    await queryInterface.dropTable('schedules');
    // Note: If using Postgres, you might need to drop the ENUM type explicitly here
  }
};