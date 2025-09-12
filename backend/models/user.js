const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
    },
    userName: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      default: undefined,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: "",
    },
    verificationCodeExpiresAt: {
      type: Date,
      default: null,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    lastResendAt: {
      type: Date,
      default: null,
    },
    resetCode: {
      type: String,
      default: undefined,
    },
    resetCodeExpiresAt: {
      type: Date,
      default: undefined,
    },
    subscription: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;
