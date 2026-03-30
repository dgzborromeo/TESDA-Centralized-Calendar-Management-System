'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Idagdag ang tti_id (Foreign Key)
    await queryInterface.addColumn('user_profiles', 'tti_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'ttis', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 2. Idagdag ang tti_name (Para sa mabilis na display)
    await queryInterface.addColumn('user_profiles', 'tti_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Baligtarin ang proseso: Burahin ang columns kapag nag-rollback
    await queryInterface.removeColumn('user_profiles', 'tti_id');
    await queryInterface.removeColumn('user_profiles', 'tti_name');
  }
};