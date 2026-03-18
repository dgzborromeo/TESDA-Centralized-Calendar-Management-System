'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // 1. Isang User ay pwedeng gumawa ng maraming Events (created_by)
      this.hasMany(models.Event, { 
        foreignKey: 'created_by',
        as: 'createdEvents' 
      });

      // 2. Many-to-Many: User as an Attendee (via event_attendees)
      this.belongsToMany(models.Event, { 
        through: 'event_attendees',
        foreignKey: 'user_id',
        otherKey: 'event_id',
        as: 'attendingEvents'
      });

      // 3. User RSVPs
      this.hasMany(models.EventRsvp, { 
        foreignKey: 'office_user_id',
        as: 'rsvps'
      });

      this.hasOne(models.UserProfile, {
        foreignKey: 'user_id',
        as: 'profile' // Para magamit mo: user.profile
      });
    }
  }

  User.init({
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verification_token: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};