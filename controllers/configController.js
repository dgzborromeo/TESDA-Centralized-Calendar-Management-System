const { Category, Focal, ConfigPosition, Office, Division, Position, Cluster, ClusterOffice, User, Schedule, Focalship, Region, Province } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs'); 
const office = require('../models/office');
const db = require('../config/db');
module.exports = {
  // 1. CREATE - Magdagdag ng bagong Office
async create(req, res) {
  try {
    const { cluster_id, office_type, name, abbr } = req.body;

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
      cluster_id: cluster_id,
      office_type: office_type, 
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
    const { cluster_id, office_type, name, abbr } = req.body;
    
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
      cluster_id: cluster_id,
      office_type: office_type, 
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
    const { name, has_sub_menu, sub_menu_type, sub_menu_source } = req.body; // Dagdag ang fields

    const cleanName = name ? name.trim() : '';
    if (!cleanName) return res.status(400).json({ message: 'Position name is required.' });

    const existing = await Position.findOne({ where: { name: cleanName } });
    if (existing) return res.status(400).json({ message: 'This position already exists.' });

    // Isama ang bagong columns sa pag-create
    const position = await Position.create({ 
      name: cleanName,
      has_sub_menu: has_sub_menu || false,
      sub_menu_type: sub_menu_type || null,
      sub_menu_source: sub_menu_source || null
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
        order: [['id', 'ASC']]
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
    const { name, has_sub_menu, sub_menu_type, sub_menu_source } = req.body;
    const cleanName = name ? name.trim() : '';

    const position = await Position.findByPk(req.params.id);
    if (!position) return res.status(404).json({ message: 'Position not found.' });

    // Update with new fields
    await position.update({ 
      name: cleanName || position.name,
      has_sub_menu: has_sub_menu !== undefined ? has_sub_menu : position.has_sub_menu,
      sub_menu_type: sub_menu_type, 
      sub_menu_source: sub_menu_source
    });

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
  },

    async getClusterMembers(req, res) {
    try {
      const members = await ClusterOffice.findAll({
        include: [
          {
            model: Cluster,
            as: 'cluster',
            attributes: ['id', 'name', 'color'] // Para makuha yung cluster info
          },
          {
            model: User,
            as: 'user', 
            attributes: ['id', 'name', 'email'] // Ito yung User/Office account info
          }
        ],
        order: [['cluster_id', 'ASC']]
      });

      return res.status(200).json(members);
    } catch (err) {
      console.error('Error in getClusterMembers:', err);
      return res.status(500).json({ error: err.message });
    }
  },
  // Sa configController.js
async getClusters(req, res) {
  try {
    const clusters = await Cluster.findAll({
      order: [['id', 'ASC']]
    });
    return res.status(200).json(clusters);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
},

  async getAllSchedule(req, res) {
    try {
      const schedules = await Schedule.findAll({
        order: [['created_at', 'DESC']]
      });
      return res.status(200).json(schedules);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET one schedule by ID
  async getByIdSchedule(req, res) {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      return res.status(200).json(schedule);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // POST create new schedule
  async createSchedule(req, res) {
    try {
      const { host_name, event_title } = req.body;

      // Validation gaya ng sa Profile
      if (!host_name || !event_title) {
        return res.status(400).json({ error: "Host name and Event title are required." });
      }

      // 1. Paglilinis ng FileName (Logic base sa Profile mo)
      const cleanHost = host_name ? host_name.replace(/\s+/g, '_') : 'NoHost';
      const cleanTitle = event_title ? event_title.replace(/\s+/g, '_').substring(0, 20) : 'NoTitle';
      const baseFileName = `${cleanHost}_${cleanTitle}_${Date.now()}`;

      let attachmentFile = null;
      let attachmentPath = null;

      // 2. Handle File Upload
      if (req.file) {
        const ext = path.extname(req.file.originalname);
        const newFileName = `${baseFileName}${ext}`;
        const targetPath = path.join(__dirname, '..', 'uploads', 'schedules', newFileName);

        // Siguraduhing existing ang folder
        const dir = path.join(__dirname, '..', 'uploads', 'schedules');
        if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

        // I-rename ang inupload ni multer
        fs.renameSync(req.file.path, targetPath);
        
        attachmentFile = req.file.originalname; // Original name
        attachmentPath = `/uploads/schedules/${newFileName}`; // Public path
      }

      // 3. Database Save
      const newSchedule = await Schedule.create({
        ...req.body,
        attachment_file: attachmentFile,
        attachment_path: attachmentPath
      });

      return res.status(201).json(newSchedule);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // POST (Update) schedule/:id
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { host_name, event_title } = req.body;

      let schedule = await Schedule.findByPk(id);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const previousStatus = schedule.status;

      // 1. Prepare base filename para sa bagong file kung meron
      const cleanHost = (host_name || schedule.host_name || 'NoHost').replace(/\s+/g, '_');
      const cleanTitle = (event_title || schedule.event_title || 'NoTitle').replace(/\s+/g, '_').substring(0, 20);
      const baseFileName = `${cleanHost}_${cleanTitle}_${Date.now()}`;

      let attachmentFile = schedule.attachment_file;
      let attachmentPath = schedule.attachment_path;

      // 2. Kung may bagong in-upload na file
      if (req.file) {
        if (schedule.attachment_path) {
          const oldPath = path.join(__dirname, '..', schedule.attachment_path);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        const ext = path.extname(req.file.originalname);
        const newFileName = `${baseFileName}${ext}`;
        const targetPath = path.join(__dirname, '..', 'uploads', 'schedules', newFileName);

        fs.renameSync(req.file.path, targetPath);
        
        attachmentFile = req.file.originalname;
        attachmentPath = `/uploads/schedules/${newFileName}`;
      }

      // 3. Update Database
      await schedule.update({
        ...req.body,
        attachment_file: attachmentFile,
        attachment_path: attachmentPath
      });

      // 4. Kung Tentative → Final, i-promote sa events table
      const newStatus = req.body.status || schedule.status;
      if (previousStatus !== 'Final' && newStatus === 'Final') {
        try {
          const s = await Schedule.findByPk(id);
          const startDate = s.start_date ? String(s.start_date).slice(0, 10) : null;
          const endDate = s.end_date ? String(s.end_date).slice(0, 10) : null;

          if (startDate && s.start_time && s.end_time) {
            const hostUser = s.user_id ? await User.findByPk(s.user_id, { attributes: ['id', 'email'] }) : null;
            const { assignedOfficeColor } = require('../utils/specialUsers');
            const eventColor = hostUser ? assignedOfficeColor(hostUser) : '#4f6d8a';
            const createdBy = s.user_id || 1;

            // Build participant labels from schedule_participants
            const { ScheduleParticipant, Position: Pos } = require('../models');
            const parts = await ScheduleParticipant.findAll({
              where: { schedule_id: s.id },
              include: [{ model: Pos, as: 'designation' }]
            });

            const rdNames = [], pdNames = [], edNames = [], allNames = [];
            for (const p of parts) {
              const posName = p.designation?.name || '';
              const posLower = posName.toLowerCase();
              const targetType = p.target_type ? String(p.target_type).toLowerCase().trim() : '';
              const targetId = p.target_id;
              const isAll = p.is_all;
              let locationName = '';
              if (isAll) {
                locationName = '(All)';
              } else if (targetId) {
                switch (targetType) {
                  case 'region': { const [r] = await db.query('SELECT region FROM regions WHERE id = ? LIMIT 1', [targetId]); locationName = r[0] ? `(${r[0].region})` : ''; break; }
                  case 'province': case 'prov': case 'district': { const [r] = await db.query('SELECT name FROM provinces WHERE id = ? LIMIT 1', [targetId]); locationName = r[0] ? `(${r[0].name})` : ''; break; }
                  case 'office': { const [r] = await db.query('SELECT name, abbr FROM offices WHERE id = ? LIMIT 1', [targetId]); locationName = r[0] ? `(${r[0].abbr || r[0].name})` : ''; break; }
                  case 'cluster': { const [r] = await db.query('SELECT name FROM clusters WHERE id = ? LIMIT 1', [targetId]); locationName = r[0] ? `(${r[0].name})` : ''; break; }
                  default: locationName = targetType ? `(${targetType.toUpperCase()})` : '';
                }
              }
              const label = locationName ? `${posName} ${locationName}` : posName;
              allNames.push(label);
              if (posLower.includes('regional director')) rdNames.push(isAll ? 'All RDs' : label);
              else if (posLower.includes('provincial director') || posLower.includes('district director')) pdNames.push(isAll ? 'All PDs' : label);
              else if (posLower.includes('executive director')) edNames.push(isAll ? 'All EDs' : label);
            }

            const [result] = await db.query(
              `INSERT INTO events (title, type, date, end_date, start_time, end_time, location, description, participants, regional_directors_label, provincial_directors_label, executive_directors_label, color, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                s.event_title || 'Untitled Activity',
                'meeting',
                startDate,
                endDate && endDate !== startDate ? endDate : null,
                s.start_time,
                s.end_time,
                s.location || null,
                s.description || null,
                allNames.length ? allNames.join(', ') : null,
                rdNames.length ? rdNames.join(', ') : null,
                pdNames.length ? pdNames.join(', ') : null,
                edNames.length ? edNames.join(', ') : null,
                eventColor,
                createdBy,
              ]
            );
          }
        } catch (eventErr) {
          console.error('Failed to promote schedule to calendar:', eventErr.message);
        }
      }

      return res.status(200).json(schedule);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  // DELETE schedule
  async deleteSchedule(req, res) {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      await schedule.destroy();
      return res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async createFocalship(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required." });
      }

      const focal = await Focalship.create({ name });
      return res.status(201).json(focal);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. READ ALL - Kunin lahat ng records
  async getAllFocalship(req, res) {
    try {
      const focals = await Focalship.findAll({
        order: [['id', 'DESC']]
      });
      return res.json(focals);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. READ ONE - Kunin ang isang specific record gamit ang ID
  async getOneFocalship(req, res) {
    try {
      const focal = await Focalship.findByPk(req.params.id);
      if (!focal) {
        return res.status(404).json({ error: "Record not found." });
      }
      return res.json(focal);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. UPDATE - Baguhin ang pangalan ng focal record
  async updateFocalship(req, res) {
    try {
      const { name } = req.body;
      const focal = await Focalship.findByPk(req.params.id);

      if (!focal) {
        return res.status(404).json({ error: "Record not found." });
      }

      await focal.update({ name });
      return res.json({ message: "Updated successfully", focal });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 5. DELETE - Tanggalin ang record
  async deleteFocalship(req, res) {
    try {
      const focal = await Focalship.findByPk(req.params.id);
      if (!focal) {
        return res.status(404).json({ error: "Record not found." });
      }

      await focal.destroy();
      return res.json({ message: "Deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

    async getAllRegions(req, res) {
    try {
      const regions = await Region.findAll({
        order: [['id', 'ASC']]
      });
      return res.json(regions);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

      async getAllProvinces(req, res) {
    try {
      const provinces = await Province.findAll({
        order: [['id', 'ASC']]
      });
      return res.json(provinces);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async getByRegion(req, res) {
    try {
      const { region_id } = req.params;
      
      const provinces = await Province.findAll({
        where: { region_id },
        order: [['name', 'ASC']]
      });

      return res.status(200).json(provinces);
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // (Optional) Kunin lahat ng provinces sa buong Pinas
   async getAllProvinces(req, res) {
    try {
      const provinces = await Province.findAll({ order: [['name', 'ASC']] });
      return res.status(200).json(provinces);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

};



