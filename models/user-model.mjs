// external import
import mongoose from "mongoose";

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

// user schema structure
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      // maxlength: [20, "Name cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [emailRegex, "Please provide a valid email address"],
    },
    username: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      trim: true,
      lowercase: true,
      // maxlength: [20, "User Name cannot exceed 20 characters"],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: { type: String, trim: true },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  { timestamps: true }
);

// user model
const userModel = mongoose.model("User", userSchema);

export default userModel;
