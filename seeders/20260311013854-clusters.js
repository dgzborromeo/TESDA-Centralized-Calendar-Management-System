// seeders/20240520000001-seed-clusters.js
'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.bulkInsert('clusters', [
      { id: 1, name: 'Office of the Secretary (OSEC)', color: '#ef4444', created_at: new Date(), updated_at: new Date() },
      { id: 2, name: 'Policies and Planning (ODDG-PP)', color: '#ec4899', created_at: new Date(), updated_at: new Date() },
      { id: 3, name: 'Administration and Innovation (ODDG-AI)', color: '#06b6d4', created_at: new Date(), updated_at: new Date() },
      { id: 4, name: 'Special Concerns (ODDG-SC)', color: '#f59e0b', created_at: new Date(), updated_at: new Date() },
      { id: 5, name: 'TVET Partnerships and Linkages (ODDG-PL)', color: '#8b5cf6', created_at: new Date(), updated_at: new Date() },
      { id: 6, name: 'Finance and Legal Affairs (ODDG-FLA)', color: '#22c55e', created_at: new Date(), updated_at: new Date() },
      { id: 7, name: 'TESD Operations (ODDG-TESDO)', color: '#3b82f6', created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface) => {
    return queryInterface.bulkDelete('clusters', null, {});
  }
};