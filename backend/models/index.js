const sequelize = require('../config/database');
const User = require('./User');
const File = require('./File');
const Note = require('./Note');

// Associations
User.hasMany(File, {
  foreignKey: 'user_id',
  as: 'files',
  onDelete: 'CASCADE',
});
File.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

User.hasMany(Note, {
  foreignKey: 'user_id',
  as: 'notes',
  onDelete: 'CASCADE',
});
Note.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

module.exports = {
  sequelize,
  User,
  File,
  Note,
};
