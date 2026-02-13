const { UserProfile, User } = require('../models');

const userProfileController = {
  // 1. READ: Kunin ang profile ng kasalukuyang logged-in user
  // GET /api/profile/me
  async getMyProfile(req, res) {
    try {
      const profile = await UserProfile.findOne({
        where: { user_id: req.user.id },
        include: [{ 
          model: User, 
          as: 'user', 
          attributes: ['email', 'role', 'created_at'] 
        }]
      });

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found.' });
      }

      return res.json(profile);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 2. CREATE/UPDATE: Ang "Upsert" method
  // POST /api/profile/save
 async saveProfile(req, res) {
    try {
      const { first_name, last_name, designation, phone_number, office_department } = req.body;

      if (!first_name || !last_name) {
        return res.status(400).json({ error: "First name and Last name are required." });
      }

      // Hanapin muna ang existing profile para sa file cleanup
      let profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
      
      let picturePath = profile ? profile.picture : null;

      // Kung may bagong in-upload na file
      if (req.file) {
        // BURAHIN ANG LUMANG PICTURE (Kung meron)
        if (profile && profile.picture) {
          const oldPath = path.join(__dirname, '..', profile.picture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath); 
          }
        }
        // I-set ang bagong path (relative path para sa static serving)
        picturePath = `/uploads/profiles/${req.file.filename}`;
      }

      if (profile) {
        // UPDATE
        await profile.update({
          first_name, last_name, designation, phone_number, office_department,
          picture: picturePath
        });
      } else {
        // CREATE
        profile = await UserProfile.create({
          user_id: req.user.id,
          first_name, last_name, designation, phone_number, office_department,
          picture: picturePath
        });
      }

      return res.status(200).json({
        message: 'Profile saved successfully!',
        data: profile
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 3. READ (Public/Admin): Kunin ang profile ng ibang user via ID
  // GET /api/profile/:userId
  async getUserProfile(req, res) {
    try {
      const profile = await UserProfile.findOne({
        where: { user_id: req.params.userId },
        include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
      });

      if (!profile) return res.status(404).json({ message: 'User profile not found.' });

      return res.json(profile);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // 4. DELETE: Burahin ang profile details
  // DELETE /api/profile/remove
  async deleteProfile(req, res) {
    try {
      const deleted = await UserProfile.destroy({
        where: { user_id: req.user.id }
      });

      if (!deleted) return res.status(404).json({ message: 'Nothing to delete.' });

      return res.json({ message: 'Profile deleted successfully.' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = userProfileController;