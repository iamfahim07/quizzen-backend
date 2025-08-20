// external import
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// internal import
import userModel from "../models/user-model.mjs";
import { getNewTokens } from "../utilities/get-new-tokens.mjs";

const checkAuth = async (accessToken) => {
  const decoded = jwt.verify(accessToken, process.env.SECRET_KEY);

  const user = {
    fullName: decoded.fullName,
    username: decoded.username,
    role: decoded.role,
  };

  return user;
};

const login = async (username, password) => {
  try {
    const user = await userModel.findOne({ username });

    // Always perform bcrypt comparison to prevent timing attacks
    const hashToCompare =
      user?.password || "$2b$12$dummyhashtopreventtimingattacks1234567890";

    const isPasswordCorrect = await bcrypt.compare(password, hashToCompare);

    if (!user || !isPasswordCorrect) {
      throw new Error("Invalid credentials!");
    }

    const userData = {
      fullName: user.fullName,
      username: user.username,
      role: user.role,
    };

    const tokens = getNewTokens(userData);

    return {
      user: userData,
      tokens,
    };
  } catch (err) {
    console.error("Login error:", err);
    throw new Error("Invalid credentials!");
  }
};

const register = async (reqBody) => {
  const { fullName, email, username, password } = reqBody;

  const hashedPassword = await bcrypt.hash(password, 10);
  const payload = { fullName, email, username, password: hashedPassword };

  const user = (await userModel.findOne({ username })) || {};

  if (user?.email || user?.username) {
    throw new Error("email or username already exists");
  }

  try {
    const newUser = await userModel.create(payload);

    const userData = {
      fullName: newUser.fullName,
      username: newUser.username,
      role: newUser.role,
    };

    const tokens = getNewTokens(userData);

    return { user: userData, tokens };
  } catch (err) {
    // Handle duplicate-key error from MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {}).join(", ");
      const message = `${field} already exists`;
      const e = new Error(message);
      e.status = 409;
      throw e;
    }
    // Unexpected errors are rethrown
    throw err;
  }

  // const newUserInfo = new userModel(newUserInfoData);
  // const newUser = await newUserInfo.save();

  // const newUserData = {
  //   fullName: newUser.fullName,
  //   username: newUser.username,
  //   role: newUser.role,
  // };

  // const tokens = getNewTokens(newUserData);

  // return {
  //   user: newUserData,
  //   tokens,
  // };
};

const googleAuth = async (reqBody) => {
  const { sub, email, name } = reqBody;

  const payload = { fullName: name, email: email, googleId: sub };
  const { googleId } = payload;

  try {
    const user = (await userModel.findOne({ googleId })) || {};

    if (user?.email || user?.googleId) {
      const userData = {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };

      const tokens = getNewTokens(userData);

      return { user: userData, tokens };
    }

    const newUser = await userModel.create(payload);

    const userData = {
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    };

    const tokens = getNewTokens(userData);

    return { user: userData, tokens };
  } catch (err) {
    // Unexpected errors are rethrown
    throw err;
  }
};

const refreshToken = async (refreshToken) => {
  // check if refresh token valid
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

  const user = {
    fullName: decoded.fullName,
    username: decoded.username,
    role: decoded.role,
  };

  const tokens = getNewTokens(user);

  return { user, tokens };
};

const userService = {
  checkAuth,
  login,
  register,
  googleAuth,
  refreshToken,
};

export default userService;
