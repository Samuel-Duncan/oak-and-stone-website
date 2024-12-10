const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    additionalEmailOne: {
      type: String,
      default: null,
    },
    additionalEmailTwo: {
      type: String,
      default: null,
    },
    password: { type: String, required: true, minLength: 6 },
    phoneNumber: {
      type: String,
      default: null,
      // Prevent duplicate phone numbers
      set: function (phoneNumber) {
        const cleanedNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
        if (cleanedNumber.length === 10) {
          return `(${cleanedNumber.substring(
            0,
            3,
          )}) ${cleanedNumber.substring(
            3,
            6,
          )}-${cleanedNumber.substring(6)}`;
        } else if (
          cleanedNumber.length === 11 &&
          cleanedNumber.startsWith('1')
        ) {
          return `(${cleanedNumber.substring(
            1,
            4,
          )}) ${cleanedNumber.substring(
            4,
            7,
          )}-${cleanedNumber.substring(7)}`;
        } else {
          // Handle invalid phone number cases (e.g., throw an error, return null, etc.)
          return null; // Or your desired handling for invalid numbers
        }
      },
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
  return `/users/${this._id}`;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
