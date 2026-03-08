const { Category, Focal, ConfigPosition, Office, Division, Position } = require('../models');
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
  },

  // CONFIG FOR POSITION
  // 1. CREATE POSITION (Master List)
  async createPosition(req, res) {
    try {
      const { name } = req.body;

      // STEP 1: Trim the input
      const cleanName = name ? name.trim() : '';

      if (!cleanName) {
        return res.status(400).json({ message: 'Position name is required.' });
      }

      // STEP 2: Check uniqueness (Case-insensitive check sa master list)
      const existing = await Position.findOne({ 
        where: { name: cleanName } 
      });

      if (existing) {
        return res.status(400).json({ message: 'This position already exists in the master list.' });
      }

      // STEP 3: Create
      const position = await Position.create({ 
        name: cleanName 
      });
      
      return res.status(201).json(position);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. GET ALL POSITIONS
  async getAllPositions(req, res) {
    try {
      const positions = await Position.findAll({
        order: [['name', 'ASC']]
      });
      return res.status(200).json(positions);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
  async getPositionById(req, res) {
    try {
      const position = await Position.findByPk(req.params.id);

      if (!position) {
        return res.status(404).json({ message: 'Position not found.' });
      }

      return res.status(200).json(position);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. UPDATE POSITION
  async updatePosition(req, res) {
    try {
      const { name } = req.body;
      const cleanName = name ? name.trim() : '';

      const position = await Position.findByPk(req.params.id);
      if (!position) {
        return res.status(404).json({ message: 'Position not found.' });
      }

      // Uniqueness check kung binago ang pangalan
      if (cleanName && cleanName !== position.name) {
        const duplicate = await Position.findOne({ where: { name: cleanName } });
        if (duplicate) {
          return res.status(400).json({ message: 'Position name already exists.' });
        }
      }

      await position.update({ name: cleanName });
      return res.status(200).json(position);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. DELETE POSITION
  async deletePosition(req, res) {
    try {
      const position = await Position.findByPk(req.params.id);
      if (!position) {
        return res.status(404).json({ message: 'Position not found.' });
      }

      await position.destroy();
      return res.status(200).json({ message: 'Position deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

    async setupPosition(req, res) {
    try {
        // Gamit tayo ng 'let' sa office_id dahil babaguhin natin ang value nito sa loob
        let { office_id, division_id, position_id } = req.body;

        // 1. Basic Validation
        if (!position_id || (!office_id && !division_id)) {
        return res.status(400).json({ message: 'Position and either Office or Division are required.' });
        }

        // 2. AUTO-BIND: Kung may division pero walang office_id, kunin natin ang parent office
        if (division_id && !office_id) {
        const div = await Division.findByPk(division_id);
        if (div) {
            office_id = div.office_id; 
        }
        }

        // 3. CHECK DUPLICATE (Dapat ito ang mauna bago mag-create)
        const existing = await ConfigPosition.findOne({
        where: {
            position_id,
            office_id: office_id || null,
            division_id: division_id || null
        }
        });

        if (existing) {
        return res.status(400).json({ message: 'This position is already assigned to this unit.' });
        }

        // 4. CREATE (Isang beses lang dapat ito)
        const setup = await ConfigPosition.create({
        office_id: office_id || null,
        division_id: division_id || null,
        position_id
        });

        // 5. FETCH RESULT WITH ASSOCIATIONS
        const result = await ConfigPosition.findByPk(setup.id, {
        include: [
            { model: Office, as: 'office', attributes: ['name', 'abbr'] },
            { model: Division, as: 'division', attributes: ['name', 'abbr'] },
            { model: Position, as: 'position', attributes: ['name'] }
        ]
        });

        return res.status(201).json(result);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
    },

  // 2. GET ALL CONFIGURED POSITIONS
  async getAllConfigPositions(req, res) {
    try {
      const configs = await ConfigPosition.findAll({
        include: [
          { model: Office, as: 'office', attributes: ['name', 'abbr'] },
          { model: Division, as: 'division', attributes: ['name', 'abbr'] },
          { model: Position, as: 'position', attributes: ['name'] }
        ],
        order: [['created_at', 'DESC']]
      });
      return res.status(200).json(configs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. REMOVE ASSIGNMENT (Delete Config)
  async deleteConfigPosition(req, res) {
    try {
      const config = await ConfigPosition.findByPk(req.params.id);
      if (!config) return res.status(404).json({ message: 'Configuration not found.' });

      await config.destroy();
      return res.status(200).json({ message: 'Position assignment removed successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 5. READ ONE - Kunin ang specific configuration/assignment gamit ang ID
  async getConfigPositionById(req, res) {
    try {
      const config = await ConfigPosition.findByPk(req.params.id, {
        include: [
          { model: Office, as: 'office', attributes: ['id', 'name', 'abbr'] },
          { model: Division, as: 'division', attributes: ['id', 'name', 'abbr'] },
          { model: Position, as: 'position', attributes: ['id', 'name'] }
        ]
      });

      if (!config) {
        return res.status(404).json({ message: 'Configuration assignment not found.' });
      }

      return res.status(200).json(config);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Note: Usually, sa config table na ganito, 'Delete' at 'Add' lang (Setup/Remove) 
  // ang common dahil 3 IDs lang naman ang laman. Pero kung kailangan ng Update:
  async updateConfigPosition(req, res) {
    try {
      const { office_id, division_id, position_id } = req.body;
      const config = await ConfigPosition.findByPk(req.params.id);
      if (!config) return res.status(404).json({ message: 'Config not found.' });

      await config.update({
        office_id: office_id || null,
        division_id: division_id || null,
        position_id
      });

      const updated = await ConfigPosition.findByPk(config.id, {
        include: ['office', 'division', 'position']
      });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Add new category
  async createCategory(req, res) {
    try {
      const { category_name } = req.body;

      // Uniqueness Check
      const existing = await Category.findOne({ where: { category_name } });
      if (existing) {
        return res.status(400).json({ message: 'Category name already exists.' });
      }

      const newCategory = await Category.create({ 
        category_name // Siguraduhin na ang field sa DB ay category_name
      });

      return res.status(201).json(newCategory);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get all categories with association
  async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll({
        include: ['focal'],
        order: [['id', 'ASC']]
      });
      return res.status(200).json(categories);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get single category
  async getCategoryById(req, res) {
    try {
      const category = await Category.findByPk(req.params.id, {
        include: ['focal']
      });
      if (!category) return res.status(404).json({ message: 'Category not found.' });
      
      return res.status(200).json(category);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Update category
  async updateCategory(req, res) {
    try {
      const { category_name } = req.body;
      const category = await Category.findByPk(req.params.id);
      
      if (!category) return res.status(404).json({ message: 'Category not found.' });

      // Check if the new name is taken by another ID
      if (category_name && category_name !== category.category_name) {
        const duplicate = await Category.findOne({ where: { category_name } });
        if (duplicate) {
          return res.status(400).json({ message: 'New category name is already in use.' });
        }
      }

      await category.update({ category_name });

      // Refresh data
      const updated = await Category.findByPk(category.id);
      
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Delete category
  async deleteCategory(req, res) {
    try {
      const category = await Category.findByPk(req.params.id);
      if (!category) return res.status(404).json({ message: 'Category not found.' });

      await category.destroy();
      return res.status(200).json({ message: 'Category removed successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Add new focal type
  async createFocal(req, res) {
    try {
      const { category_id, type } = req.body;

      // 1. Check if Category exists
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found. Cannot assign focal type.' });
      }

      // 2. Uniqueness Check for 'type'
      const existing = await Focal.findOne({ where: { type } });
      if (existing) {
        return res.status(400).json({ message: 'Focal type already exists.' });
      }

      const newFocal = await Focal.create({
        category_id,
        type
      });

      return res.status(201).json(newFocal);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get all focal types with category info
  async getAllFocals(req, res) {
    try {
      const focals = await Focal.findAll({
        include: [{
          model: Category,
          as: 'category'
        }],
        order: [['id', 'ASC']]
      });
      return res.status(200).json(focals);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get single focal type
  async getFocalById(req, res) {
    try {
      const focal = await Focal.findByPk(req.params.id, {
        include: ['category']
      });
      if (!focal) return res.status(404).json({ message: 'Focal type not found.' });

      return res.status(200).json(focal);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Update focal type
  async updateFocal(req, res) {
    try {
      const { category_id, type } = req.body;
      const focal = await Focal.findByPk(req.params.id);

      if (!focal) return res.status(404).json({ message: 'Focal type not found.' });

      // Uniqueness check if type is being changed
      if (type && type !== focal.type) {
        const duplicate = await Focal.findOne({ where: { type } });
        if (duplicate) {
          return res.status(400).json({ message: 'This focal type is already in use.' });
        }
      }

      await focal.update({
        category_id: category_id || focal.category_id,
        type: type || focal.type
      });

      const updated = await Focal.findByPk(focal.id, { include: ['category'] });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Delete focal type
  async deleteFocal(req, res) {
    try {
      const focal = await Focal.findByPk(req.params.id);
      if (!focal) return res.status(404).json({ message: 'Focal type not found.' });

      await focal.destroy();
      return res.status(200).json({ message: 'Focal type removed successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};



