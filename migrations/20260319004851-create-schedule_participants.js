'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('schedule_participants', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schedules', // Main table ng events/meetings
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      designation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'positions', // Table sa image_436bd5
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      /* Polymorphic Columns:
         Dito papasok ang ID ng Office, Region, Cluster, or Province.
      */
      target_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID mula sa regions, offices, clusters, o provinces table'
      },
      target_type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Label: cluster, office, region, province, o district'
      },
      is_all: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'True kung "All" (hal. All Regions) ang pinili'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Indexes para sa mabilis na filtering sa Phase 2
    await queryInterface.addIndex('schedule_participants', ['schedule_id']);
    await queryInterface.addIndex('schedule_participants', ['designation_id']);
    await queryInterface.addIndex('schedule_participants', ['target_id', 'target_type']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('schedule_participants');
  }
};