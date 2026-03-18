'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('regions', [
      { region: 'CO', name: 'Central Office'},
      { region: 'NCR', name: 'National Capital Region'},
      { region: 'CAR', name: 'Cordillera Administrative Region'},
      { region: 'Region I', name: 'Ilocos Region'},
      { region: 'Region II', name: 'Cagayan Valley'},
      { region: 'Region III', name: 'Central Luzon'},
      { region: 'Region IV-A', name: 'CALABARZON'},
      { region: 'MIMAROPA', name: 'Southwestern Tagalog Region'},
      { region: 'Region V', name: 'Bicol Region'},
      { region: 'Region VI', name: 'Western Visayas'},
      { region: 'NIR', name: 'Negros Island Region'},
      { region: 'Region VII', name: 'Central Visayas'},
      { region: 'Region VIII', name: 'Eastern Visayas'},
      { region: 'Region IX', name: 'Zamboanga Peninsula'},
      { region: 'Region X', name: 'Northern Mindanao'},
      { region: 'Region XI', name: 'Davao Region'},
      { region: 'Region XII', name: 'SOCCSKSARGEN'},
      { region: 'Region XIII', name: 'Caraga Region'},
      { region: 'BARMM', name: 'Bangsamoro Autonomous Region in Muslim Mindanao'},
    ].map(r => ({ ...r, created_at: new Date(), updated_at: new Date() })));
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('regions', null, {});
  }
};