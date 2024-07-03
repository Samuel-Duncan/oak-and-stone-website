const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Project = require('./project.js');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      set: function (name) {
        return name
          .trim()
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: { type: String, required: true, minLength: 6 },
    phoneNumber: {
      type: String,
      unique: true, // Prevent duplicate phone numbers
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 10);
  next();
});

// // Create and associate a project with a user on user creation
// userSchema.post('save', async function (next) {
//   // Check if user is newly created
//   if (this.isNew) {
//     const newProject = new Project({ userId: this._id }); // Assign user ID to project
//     await newProject.save();
//   }
//   next();
// });

userSchema.virtual('url').get(function () {
  return `${this._id}`;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
