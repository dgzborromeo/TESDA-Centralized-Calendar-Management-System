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
// POST create new user
async createUser(req, res) {
    try {
        const { 
            name, email, password, role, 
            first_name, last_name, middle_name, designation, phone_number,
            cluster_id, region_id, province_id, office_id, designation_id, // Isama ang designation_id
            cluster, region, province_district, office, division
        } = req.body;

        // Validation para sa required fields lang
        if (!name || !email || !password || !first_name || !last_name) {
            return res.status(400).json({ 
                error: "Name, Email, Password, First Name, and Last Name are required." 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create User
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            email_verified_at: new Date() 
        });

        // 2. Create Profile (Lahat ng hindi required ay || null)
        await UserProfile.create({ 
            user_id: newUser.id,
            first_name,
            last_name,
            middle_name: middle_name || null,
            designation: designation || null, // String label
            designation_id: designation_id || null, // Foreign Key
            phone_number: phone_number || null,
            cluster_id: cluster_id || null,
            region_id: region_id || null,
            province_id: province_id || null,
            office_id: office_id || null,
            cluster: cluster || null,
            region: region || null,
            province_district: province_district || null,
            office: office || null,
            division: division || null
        });

        const { password: _, ...userWithoutPass } = newUser.toJSON();
        return res.status(201).json(userWithoutPass);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "Email is already registered." });
        }
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}

// PUT update user details
async updateUser(req, res) {
    try {
        const { id } = req.params;
        const { 
            name, email, role, password,
            first_name, last_name, middle_name, designation, phone_number,
            cluster_id, region_id, province_id, office_id, designation_id,
            cluster, region, province_district, office, division 
        } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // 1. Update User account
        const userUpdateData = { name, email, role };
        if (password && String(password).trim() !== "") {
            userUpdateData.password = await bcrypt.hash(password, 10);
        }
        await user.update(userUpdateData);

        // 2. Update or Create Profile (Para sigurado kung sakaling walang profile record)
        const profileData = {
            user_id: id, // Required for upsert logic
            first_name,
            last_name,
            middle_name: middle_name || null,
            designation: designation || null,
            designation_id: designation_id || null,
            phone_number: phone_number || null,
            cluster_id: cluster_id || null,
            region_id: region_id || null,
            province_id: province_id || null,
            office_id: office_id || null,
            cluster: cluster || null,
            region: region || null,
            province_district: province_district || null,
            office: office || null,
            division: division || null
        };

        // Gagamit tayo ng update kung existing, pero pwede ring UserProfile.upsert(profileData)
        // Pero base sa code mo, update ang gamit natin:
        await UserProfile.update(profileData, {
            where: { user_id: id }
        });

        return res.json({ message: "User and Profile updated successfully" });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "Email is already taken." });
        }
        console.error(err);
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
  // GET single user by ID with profile
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password', 'verification_token'] },
        include: [{ 
          model: UserProfile, 
          as: 'profile' 
        }]
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new userController();