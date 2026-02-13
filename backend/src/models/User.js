const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, default: 'inconnu' },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  githubId: String,
  githubUsername: String,
  githubToken: String,
  profilePicture: String,
  academicYear: {
    type: String,
    enum: ['BUT1', 'BUT2', 'BUT3', 'LP', 'Master'],
    default: 'BUT1',
    required: function () { return this.role === 'student'; }
  },
  group: {
    type: String, // ex: 'G1', 'TP-A', 'FA' (Formation alternance)
    uppercase: true,
    trim: true
  },
  theme: {
    type: String,
    enum: ['classic', 'modern'],
    default: 'modern'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
