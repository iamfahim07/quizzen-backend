// external import
import express from "express";

// internal import
import UserModel from "../models/user-model.mjs";

// router setup
const router = express.Router();

// get all users
router.get("/", async (req, res) => {
  try {
    const response = await UserModel.find().select({
      fullName: 1,
      username: 1,
    });

    const users = response.map((user) => ({
      fullName: user?.fullName,
      username: user?.username,
    }));

    async function delay(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    await delay(5000);

    res.status(200).json({ data: users });
  } catch {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

export default router;
