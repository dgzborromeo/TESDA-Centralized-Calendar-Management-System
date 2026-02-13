'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('event_rsvps', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      office_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined'),
        allowNull: false,
        defaultValue: 'pending'
      },
      representative_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      decline_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      responded_at: {
        type: Sequelize.DATE, // TIMESTAMP sa SQL = DATE sa Sequelize migration
        allowNull: true
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

    // Unique Key (uniq_event_office)
    await queryInterface.addIndex('event_rsvps', ['event_id', 'office_user_id'], {
      unique: true,
      name: 'uniq_event_office'
    });

    // Indices
    await queryInterface.addIndex('event_rsvps', ['office_user_id', 'status'], { 
      name: 'idx_office_status' 
    });
    await queryInterface.addIndex('event_rsvps', ['event_id', 'status'], { 
      name: 'idx_event_status' 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('event_rsvps');
  }
};