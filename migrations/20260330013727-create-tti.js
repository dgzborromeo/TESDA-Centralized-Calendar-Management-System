'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ttis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      province_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // Hindi pwedeng walang probinsya ang isang TTI
        references: {
          model: 'provinces', // Siguraduhing lowercase/plural ito base sa table name mo
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // O 'CASCADE' kung gusto mong mabura ang TTI pag binura ang probinsya
      },
      name: {
        type: Sequelize.STRING
      },
      classification: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.TEXT
      },
      email: {
        type: Sequelize.STRING
      },
      created_at: { // Palitan mula createdAt
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: { // Palitan mula updatedAt
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ttis');
  }
};