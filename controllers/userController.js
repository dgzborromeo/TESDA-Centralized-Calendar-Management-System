const { DATE } = require('sequelize');
const { User, UserProfile } = require('../models');
const bcrypt = require('bcryptjs');
const { now } = require('sequelize/lib/utils');

class userController {
  // GET all users with their profiles
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password', 'verification_token'] },
        include: [{ model: UserProfile, as: 'profile' }],
        order: [['created_at', 'DESC']]
      });
      return res.json(users);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

// POST create new user (Admin version)
  async createUser(req, res) {
    try {
      const { name, email, password, role, is_verified } = req.body;

      // 1. Validation check bago mag-hash
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields: Name, Email, and Password are required." });
      }

      // Hash password - Safe na rito dahil sure tayong may 'password'
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        email_verified_at: is_verified ? new Date() : null
      });

      // Create empty profile automatically
      await UserProfile.create({ user_id: newUser.id });

      const { password: _, ...userWithoutPass } = newUser.toJSON();
      return res.status(201).json(userWithoutPass);
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: "Email already exists." });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT update user details
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, is_verified, password } = req.body;

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Build update object
      const updateData = { name, email, role, is_verified };

      // 2. Conditional password hashing
      // I-hash lang kung ang password ay string at hindi empty string
      if (password && String(password).trim() !== "") {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await user.update(updateData);
      
      // Huwag ibalik ang password sa response
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      return res.json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: "Email is already taken by another user." });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Safety: Wag hayaan ang admin na i-delete ang sarili niya
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ error: "You cannot delete your own admin account." });
      }

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      await user.destroy();
      return res.json({ message: "User deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new userController();