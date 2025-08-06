// external import
import express from "express";

// internal import
import userController from "../controller/user-controller.mjs";
import { verifyToken } from "../middlewares/verify-token.mjs";

// router setup
const router = express.Router();

// check authentication status
router.get("/check-auth", userController.checkAuth);

// verify user auth tokens
router.get("/verify-token", verifyToken, userController.verifyToken);

// login a user
router.post("/login", userController.login);

// logout a user
router.post("/logout", userController.logout);

// register new user
router.post("/register", userController.register);

// Google login or register
router.post("/google-auth", userController.googleAuth);

// get refresh token
router.post("/refresh-token", userController.refreshToken);

export default router;
