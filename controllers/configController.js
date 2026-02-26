const { Office } = require('../models');

module.exports = {
  // 1. CREATE - Magdagdag ng bagong Office
  async create(req, res) {
    try {
      const { name, abbr } = req.body;

      // Check kung may kaparehong pangalan na (Case-insensitive check)
      const existing = await Office.findOne({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: 'Office name already exists.' });
      }

      const office = await Office.create({ name, abbr });
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

  // 4. UPDATE - Baguhin ang detalye ng Office
  async update(req, res) {
    try {
      const { name, abbr } = req.body;
      const office = await Office.findByPk(req.params.id);

      if (!office) {
        return res.status(404).json({ message: 'Office not found.' });
      }

      // Check uniqueness kung binago ang pangalan
      if (name && name !== office.name) {
        const duplicate = await Office.findOne({ where: { name } });
        if (duplicate) {
          return res.status(400).json({ message: 'New office name already exists.' });
        }
      }

      await office.update({ name, abbr });
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
  }
};


