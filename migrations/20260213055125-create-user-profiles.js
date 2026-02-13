'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      first_name: { type: Sequelize.STRING, allowNull: false },
      middle_name: {type: Sequelize.STRING, allowNull: true },
      last_name: { type: Sequelize.STRING, allowNull: false },
      designation: { type: Sequelize.STRING, allowNull: true }, // Hal: "Director IV", "Instructor I"
      phone_number: { type: Sequelize.STRING(20) },
      office_department: { type: Sequelize.STRING },
      picture: { type: Sequelize.STRING, allowNull: true },     // URL or Path ng Profile Pic
      qr_code: { type: Sequelize.TEXT, allowNull: true },      // Pwedeng Path or Base64 String ng QR
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
    });

    // Index para sa mabilisang search by name
    await queryInterface.addIndex('user_profiles', ['first_name', 'last_name']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_profiles');
  }
};