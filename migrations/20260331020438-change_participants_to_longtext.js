'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Gumamit ng Sequelize.TEXT('long') para sa MySQL LONGTEXT
    await queryInterface.changeColumn('events', 'participants', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
    await queryInterface.changeColumn('events', 'executive_directors_label', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
    await queryInterface.changeColumn('events', 'regional_directors_label', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
    await queryInterface.changeColumn('events', 'provincial_directors_label', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('events', 'participants', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('events', 'executive_directors_label', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('events', 'regional_directors_label', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('events', 'provincial_directors_label', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }
};