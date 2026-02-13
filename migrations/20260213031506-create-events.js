'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('meeting', 'zoom', 'event'),
        allowNull: false,
        defaultValue: 'meeting'
      },
      // Gagamit tayo ng DATEONLY para maging "DATE" ang column sa MySQL
      date: {
        type: Sequelize.DATEONLY, 
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      location: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
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
      engine: 'InnoDB'
    });

    // Sinunod ang mga INDEX names mula sa SQL niya
    await queryInterface.addIndex('events', ['date'], { name: 'idx_date' });
    await queryInterface.addIndex('events', ['end_date'], { name: 'idx_end_date' });
    await queryInterface.addIndex('events', ['created_by'], { name: 'idx_created_by' });
    
    // Composite Index para sa calendar logic
    await queryInterface.addIndex('events', ['date', 'start_time', 'end_time'], { 
      name: 'idx_date_time' 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('events');
  }
};