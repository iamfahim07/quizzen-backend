import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";

// internal import
import userService from "../services/user-service.mjs";

// config env file
dotenv.config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

// checkAuth router callback function
export const checkAuth = async (req, res) => {
  try {
    if (Object.keys(req.cookies).length === 0 || !req.cookies["accessToken"]) {
      return res.status(200).json({ data: {} });
    }

    const { accessToken, refreshToken } = req.cookies;

    const user = await userService.checkAuth(accessToken);

    res.status(200).json({ data: user });
  } catch (err) {
    res.status(401).json({ message: "Authentication error" });
  }
};

// verify-token router callback function
export const verifyToken = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({ data: user });
  } catch (err) {
    res.status(401).json({ message: "Authentication error" });
  }
};

// login router callback function
export const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Please provide user name and password" });
    }

    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid input format" });
    }

    if (username.trim().length === 0 || password.length === 0) {
      return res.status(400).json({
        message: "Username and password cannot be empty",
      });
    }

    const {
      user,
      tokens: { accessToken, refreshToken },
    } = await userService.login(username, password);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ data: user });
  } catch (err) {
    const isAuthError = err.message.includes("Invalid credentials!");

    const errMsg = isAuthError
      ? err.message
      : "An internal server error occurred";

    const statusCode = isAuthError ? 401 : 500;

    return res.status(statusCode).json({ message: errMsg });
  }
};

// logout router callback function
export const logout = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    };

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    if (req.session) {
      req.session.destroy();
    }

    // res.clearCookie("accessToken", {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    //   path: "/",
    // });
    // res.clearCookie("refreshToken", {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: "None",
    //   path: "/",
    // });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};

// register router callback function
export const register = async (req, res, next) => {
  const { fullName, email, username, password } = req.body || {};

  if (!fullName || !email || !username || !password) {
    return res.status(400).json({
      message: "Please provide full name, email, username and password!",
    });
  }

  try {
    const {
      user,
      tokens: { accessToken, refreshToken },
    } = await userService.register(req.body);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ data: user });
  } catch (err) {
    return next(err);
    // if (err.code === 11000) {
    //   return res.status(409).json({
    //     message: "Username or email already exists, please choose another.",
    //   });
    // }
    // console.error(err);
    // return res.status(500).json({
    //   message: "An unexpected server error occurred.",
    // });

    // res.status(500).json({
    //   message:
    //     "Sorry, that username is already taken. Please try a different one.",
    // });
  }
};

// Google login or register router callback function
export const googleAuth = async (req, res, next) => {
  const { credential, clientId } = req.body || {};

  if (!credential || !clientId) {
    return res.status(400).json({
      message: "Please provide necessary credentials",
    });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      user,
      tokens: { accessToken, refreshToken },
    } = await userService.googleAuth(payload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ data: user });
  } catch (err) {
    return next(err);
  }
};

export const refreshToken = async (req, res) => {
  try {
    if (Object.keys(req.cookies).length === 0 || !req.cookies["refreshToken"]) {
      return res.status(200).json({ data: {} });
    }

    const { accessToken, refreshToken } = req.cookies;

    const {
      user,
      tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    } = await userService.refreshToken(refreshToken);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ data: user });
  } catch (err) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.status(401).json({ message: "Authentication error!" });
  }
};

const userController = {
  checkAuth,
  verifyToken,
  login,
  logout,
  register,
  googleAuth,
  refreshToken,
};

export default userController;
