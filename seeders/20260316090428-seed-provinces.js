'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const provinces = [
      // NCR (Region ID: 2)
      { region_id: 2, name: 'Manila' },
      { region_id: 2, name: 'PaMaMariSan' }, // Pasig, Marikina, Mandaluyong, San Juan
      { region_id: 2, name: 'Quezon City' },
      { region_id: 2, name: 'CaMaNaVa' },     // Caloocan, Malabon, Navotas, Valenzuela
      { region_id: 2, name: 'PasMak' },       // Pasay, Makati
      { region_id: 2, name: 'MuntiParLasTaPat' }, // Muntinlupa, Parañaque, Las Piñas, Taguig, Pateros

      // CAR (Region ID: 3)
      { region_id: 3, name: 'Apayao' },
      { region_id: 3, name: 'Ifugao' },
      { region_id: 3, name: 'Abra' },
      { region_id: 3, name: 'Benguet' },
      { region_id: 3, name: 'Kalinga' },
      { region_id: 3, name: 'Mt. Province' },

      // Region I (Region ID: 4)
      { region_id: 4, name: 'La Union' },
      { region_id: 4, name: 'Ilocos Sur' },
      { region_id: 4, name: 'Pangasinan' },
      { region_id: 4, name: 'Ilocos Norte' },

      // Region II (Region ID: 5)
      { region_id: 5, name: 'Cagayan' },
      { region_id: 5, name: 'Isabela' },
      { region_id: 5, name: 'Quirino' },
      { region_id: 5, name: 'Batanes' },
      { region_id: 5, name: 'Nueva Vizcaya' },

      // Region III (Region ID: 6)
      { region_id: 6, name: 'Bataan' },
      { region_id: 6, name: 'Aurora' },
      { region_id: 6, name: 'Nueva Ecija' },
      { region_id: 6, name: 'Bulacan' },
      { region_id: 6, name: 'Tarlac' },
      { region_id: 6, name: 'Pampanga' },
      { region_id: 6, name: 'Zambales' },

      // Region IV-A (Region ID: 7)
      { region_id: 7, name: 'Rizal' },
      { region_id: 7, name: 'Laguna' },
      { region_id: 7, name: 'Batangas' },
      { region_id: 7, name: 'Cavite' },
      { region_id: 7, name: 'Quezon' },

      // MIMAROPA (Region ID: 8)
      { region_id: 8, name: 'Marinduque' },
      { region_id: 8, name: 'Oriental Mindoro' },
      { region_id: 8, name: 'Palawan' },
      { region_id: 8, name: 'Occidental Mindoro' },
      { region_id: 8, name: 'Romblon' },

      // Region V (Region ID: 9)
      { region_id: 9, name: 'Camarines Norte' },
      { region_id: 9, name: 'Sorsogon' },
      { region_id: 9, name: 'Catanduanes' },
      { region_id: 9, name: 'Albay' },
      { region_id: 9, name: 'Camarines Sur' },
      { region_id: 9, name: 'Masbate' },

      // Region VI (Region ID: 10)
      { region_id: 10, name: 'Iloilo' },
      { region_id: 10, name: 'Aklan' },
      { region_id: 10, name: 'Capiz' },
      { region_id: 10, name: 'Guimaras' },
      { region_id: 10, name: 'Antique' },

      // NIR (Region ID: 11)
      { region_id: 11, name: 'Negros Occidental' },
      { region_id: 11, name: 'Negros Oriental' },
      { region_id: 11, name: 'Siquijor' },

      // Region VII (Region ID: 12)
      { region_id: 12, name: 'Cebu' },
      { region_id: 12, name: 'Bohol' },

      // Region VIII (Region ID: 13)
      { region_id: 13, name: 'Leyte' },
      { region_id: 13, name: 'Southern Leyte' },
      { region_id: 13, name: 'Eastern Samar' },
      { region_id: 13, name: 'Samar' },
      { region_id: 13, name: 'Biliran' },
      { region_id: 13, name: 'Northern Samar' },

      // Region IX (Region ID: 14)
      { region_id: 14, name: 'Zamboanga del Sur' },
      { region_id: 14, name: 'Zamboanga Sibugay' },
      { region_id: 14, name: 'Zamboanga del Norte' },

      // Region X (Region ID: 15)
      { region_id: 15, name: 'Lanao del Norte' },
      { region_id: 15, name: 'Misamis Occidental' },
      { region_id: 15, name: 'Misamis Oriental' },
      { region_id: 15, name: 'Bukidnon' },
      { region_id: 15, name: 'Camiguin' },

      // Region XI (Region ID: 16)
      { region_id: 16, name: 'Davao City' },
      { region_id: 16, name: 'Davao Occidental' },
      { region_id: 16, name: 'Davao Del Sur' },
      { region_id: 16, name: 'Davao Del Norte' },
      { region_id: 16, name: 'Davao Oriental' },
      { region_id: 16, name: 'Davao De Oro' },

      // Region XII (Region ID: 17)
      { region_id: 17, name: 'South Cotabato' },
      { region_id: 17, name: 'Sultan Kudarat' },
      { region_id: 17, name: 'Sarangani' },
      { region_id: 17, name: 'North Cotabato' },

      // Region XIII (Region ID: 18)
      { region_id: 18, name: 'Surigao del Norte' },
      { region_id: 18, name: 'Surigao del Sur' },
      { region_id: 18, name: 'Agusan del Sur' },
      { region_id: 18, name: 'Dinagat Island' },
      { region_id: 18, name: 'Agusan del Norte' }
    ];

    return queryInterface.bulkInsert('provinces', provinces.map(p => ({
      ...p,
      created_at: new Date(),
      updated_at: new Date()
    })));
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('provinces', null, {});
  }
};