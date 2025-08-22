// external import
import cookieParser from "cookie-parser";
// import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

// internal import
import geminiHandler from "./routeHandler/gemini-handler.mjs";
import quizHandler from "./routeHandler/quiz-handler.mjs";
import topicHandler from "./routeHandler/topic-handler.mjs";
import userHandler from "./routeHandler/user-handler.mjs";
import usersHandler from "./routeHandler/users-handler.mjs";

// express app initialization
const app = express();

// json parser middleware
app.use(express.json());

// cookie parser
app.use(cookieParser());

// config env file
dotenv.config();

// Enable CORS for all routes
// app.use(
//   cors({
//     origin: `${process.env.ORIGIN_URL}`,
//     credentials: true,
//   })
// );

// database connection with mongoose
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connection successful");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

connectDB();

// routing setup
app.use("/user", userHandler);

app.use("/users", usersHandler);

app.use("/topics", topicHandler);

app.use("/quizzes", quizHandler);

app.use("/generate-quiz", geminiHandler);

// Central Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate key error" });
  }
  return res.status(500).json({ message: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Quiz app backend listening on port ${PORT}`);
});
