'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('event_attendees', {
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
          model: 'events', // Table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
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
      }
    }, {
      engine: 'InnoDB'
    });

    // Pag-setup ng UNIQUE KEY (unique_attendee)
    // Para hindi pwedeng mag-join ang isang user sa iisang event nang dalawang beses
    await queryInterface.addIndex('event_attendees', ['event_id', 'user_id'], {
      unique: true,
      name: 'unique_attendee'
    });

    // Individual Indices (idx_event at idx_user)
    await queryInterface.addIndex('event_attendees', ['event_id'], { name: 'idx_event' });
    await queryInterface.addIndex('event_attendees', ['user_id'], { name: 'idx_user' });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('event_attendees');
  }
};