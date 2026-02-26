const { Office, Division } = require('../models');
const { Op } = require('sequelize');
module.exports = {
  // 1. CREATE - Magdagdag ng bagong Office
async create(req, res) {
  try {
    const { name, abbr } = req.body;

    // STEP 1: Trim the inputs
    const cleanName = name ? name.trim() : '';
    const cleanAbbr = abbr ? abbr.trim() : '';

    if (!cleanName) {
      return res.status(400).json({ message: 'Office name is required.' });
    }

    // STEP 2: Check uniqueness gamit ang trimmed name
    const existing = await Office.findOne({ 
      where: { name: cleanName } 
    });

    if (existing) {
      return res.status(400).json({ message: 'Office name already exists.' });
    }

    // STEP 3: Create gamit ang malinis na data
    const office = await Office.create({ 
      name: cleanName, 
      abbr: cleanAbbr 
    });
    
    return res.status(201).json(office);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
},

  // 2. READ ALL - Kunin lahat ng Offices
  async getAll(req, res) {
    try {
      const offices = await Office.findAll({
        order: [['name', 'ASC']] // Naka-alphabetical order
      });
      return res.status(200).json(offices);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. READ ONE - Kunin ang isang Office gamit ang ID
  async getById(req, res) {
    try {
      const office = await Office.findByPk(req.params.id);
      if (!office) {
        return res.status(404).json({ message: 'Office not found.' });
      }
      return res.status(200).json(office);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. UPDATE OFFICE
async update(req, res) {
  try {
    const { name, abbr } = req.body;
    
    const cleanName = name ? name.trim() : '';
    const cleanAbbr = abbr ? abbr.trim() : '';

    const office = await Office.findByPk(req.params.id);
    if (!office) {
      return res.status(404).json({ message: 'Office not found.' });
    }

    // Check uniqueness kung binago ang pangalan
    if (cleanName && cleanName !== office.name) {
      const duplicate = await Office.findOne({ 
        where: { name: cleanName } 
      });
      if (duplicate) {
        return res.status(400).json({ message: 'New office name already exists.' });
      }
    }

    await office.update({ 
      name: cleanName, 
      abbr: cleanAbbr 
    });
    
    return res.status(200).json(office);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
},

  // 5. DELETE - Burahin ang Office
  async delete(req, res) {
    try {
      const office = await Office.findByPk(req.params.id);
      if (!office) {
        return res.status(404).json({ message: 'Office not found.' });
      }

      await office.destroy();
      return res.status(200).json({ message: 'Office deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // --- NEW DIVISION FUNCTIONS ---

// 1. CREATE DIVISION
async createDivision(req, res) {
  try {
    const { name, abbr, office_id } = req.body;

    // STEP 1: Trim the inputs para matanggal ang leading/trailing spaces
    const cleanName = name ? name.trim() : '';
    const cleanAbbr = abbr ? abbr.trim() : '';

    if (!cleanName) {
      return res.status(400).json({ message: 'Division name is required.' });
    }

    // 2. Check kung valid ang Office (Parent)
    const parentOffice = await Office.findByPk(office_id);
    if (!parentOffice) {
      return res.status(404).json({ message: 'Parent Office not found.' });
    }

    // 3. CASE-INSENSITIVE & TRIMMED CHECK
    // Hahanapin natin ang kaparehong pangalan sa loob ng parehong office_id
    const existing = await Division.findOne({ 
      where: { 
        office_id,
        name: cleanName // Dahil naka-trim na ito, mahuhuli na nito ang may extra spaces
      } 
    });

    if (existing) {
      return res.status(400).json({ message: 'Division already exists in this office.' });
    }

    // 4. I-save ang "Clean" version ng data
    const division = await Division.create({ 
      name: cleanName, 
      abbr: cleanAbbr, 
      office_id 
    });
    
    // Ibalik ang data kasama ang Office details
    const result = await Division.findByPk(division.id, { 
      include: [{
          model: Office,
          as: 'office'
      }] 
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
},
 // 2. GET ALL DIVISIONS
  async getAllDivisions(req, res) {
    try {
      const divisions = await Division.findAll({
        include: [{
          model: Office,
          as: 'office', // DAGDAG ITO
          attributes: ['name', 'abbr']
        }],
        order: [[ { model: Office, as: 'office' }, 'name', 'ASC'], ['name', 'ASC']]
      });
      return res.status(200).json(divisions);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

// 3. UPDATE DIVISION
  async updateDivision(req, res) {
    try {
      const { name, abbr, office_id } = req.body;
      
      // 1. Trim the inputs
      const cleanName = name ? name.trim() : '';
      const cleanAbbr = abbr ? abbr.trim() : '';

      const division = await Division.findByPk(req.params.id);
      if (!division) {
        return res.status(404).json({ message: 'Division not found.' });
      }

      // 2. Check uniqueness kung binago ang pangalan o ang parent office
      // Ginagamit natin ang cleanName sa comparison
      if (cleanName && (cleanName !== division.name || office_id !== division.office_id)) {
        const duplicate = await Division.findOne({ 
          where: { 
            name: cleanName, 
            office_id: office_id 
          } 
        });
        
        if (duplicate) {
          return res.status(400).json({ message: 'Division name already exists in this office.' });
        }
      }

      // 3. Update gamit ang malinis na data
      await division.update({ 
        name: cleanName, 
        abbr: cleanAbbr, 
        office_id 
      });

      // 4. Ibalik ang updated record kasama ang Office alias
      const updated = await Division.findByPk(division.id, { 
        include: [{ model: Office, as: 'office' }] 
      });
      
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. GET BY ID
  async getDivisionById(req, res) {
    try {
      const division = await Division.findByPk(req.params.id, {
        include: [{
          model: Office,
          as: 'office', // DAGDAG DIN DITO
          attributes: ['id', 'name', 'abbr']
        }]
      });

      if (!division) return res.status(404).json({ message: 'Division not found.' });
      return res.status(200).json(division);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 5. DELETE
  async deleteDivision(req, res) {
    try {
      const division = await Division.findByPk(req.params.id);
      if (!division) return res.status(404).json({ message: 'Division not found.' });
      await division.destroy();
      return res.status(200).json({ message: 'Division deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};


