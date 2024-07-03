const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    companyName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid email address!`,
      },
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

userSchema.virtual('url').get(function () {
  return `${this._id}`;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
