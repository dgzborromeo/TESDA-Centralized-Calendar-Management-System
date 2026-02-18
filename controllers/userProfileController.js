const { UserProfile, User } = require('../models');
const path = require('path');
const fs = require('fs');    
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
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
        const userId = req.user.id;
      const { first_name, last_name, middle_name, designation, phone_number, office, division, cluster, province_district, region } = req.body;

      if (!first_name || !last_name) {
        return res.status(400).json({ error: "First name and Last name are required." });
      }
        const cleanOffice = office ? office.replace(/\s+/g, '_') : 'NoOffice';
        const cleanLastName = last_name ? last_name.replace(/\s+/g, '_') : 'NoName';
        const baseFileName = `${cleanOffice}_${cleanLastName}_${userId}`;
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
        // Kunin ang extension (jpg, png, etc.)
            const ext = path.extname(req.file.originalname);
            const newPicName = `${baseFileName}${ext}`; // Format: ROMD_Baron_5.jpg
            const newPicPath = path.join(__dirname, '..', 'uploads', 'profiles', newPicName);

            // I-rename ang inupload na file ni multer para sumunod sa format natin
            fs.renameSync(req.file.path, newPicPath);
            picturePath = `/uploads/profiles/${newPicName}`;
      }

      // --- SECTION 2: QR CODE GENERATION ---
      const qrFolder = path.join(__dirname, '..', 'uploads', 'qrs');
      if (!fs.existsSync(qrFolder)) {
        fs.mkdirSync(qrFolder, { recursive: true });
      }
      const qrFileName = `${baseFileName}.png`; // Format: ROMD_Baron_5.png
      const qrFilePath = path.join(qrFolder, qrFileName);
      const qrPublicUrl = `/uploads/qrs/${qrFileName}`;
      const qrToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your_secret_key');
      
        if (!fs.existsSync(qrFilePath)) {
            await QRCode.toFile(qrFilePath, qrToken, { // TOKEN na ang laman, hindi na Profile data
                width: 400,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            });
        }
      // --- SECTION 3: DATABASE UPSERT ---
      const profileData = {
        first_name, last_name, middle_name, designation, 
        phone_number, office, division, cluster, 
        province_district, region,
        picture: picturePath,
        qr_code: qrPublicUrl // I-save ang URL ng QR sa DB
      };

        if (profile) {
            // *** UPDATE: PINALITAN NATIN PARA MAISAMA ANG qr_code ***
            await profile.update(profileData); 
        } else {
            // *** CREATE: PINALITAN NATIN PARA MAISAMA ANG qr_code ***
            profile = await UserProfile.create({
                user_id: userId,
                ...profileData 
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
        // Isama natin ang pagbura ng Files (Picture at QR) kapag binura ang profile
        const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
        if (profile) {
            if (profile.picture) {
            const pPath = path.join(__dirname, '..', profile.picture);
            if (fs.existsSync(pPath)) fs.unlinkSync(pPath);
            }
            if (profile.qr_code) {
            const qPath = path.join(__dirname, '..', profile.qr_code);
            if (fs.existsSync(qPath)) fs.unlinkSync(qPath);
            }
            await profile.destroy();
            return res.json({ message: 'Profile and files deleted successfully.' });
        }
        return res.status(404).json({ message: 'Nothing to delete.' });
        } catch (err) {
        return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = userProfileController;