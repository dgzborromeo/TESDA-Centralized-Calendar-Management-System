'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('provinces', 'affected_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'provinces', // Self-referencing table name
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('provinces', 'affected_province', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('provinces', 'affected_id');
    await queryInterface.removeColumn('provinces', 'affected_province');
  }
};