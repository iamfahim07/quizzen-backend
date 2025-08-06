// external import
import mongoose from "mongoose";

// option schema structure
const optionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    trim: true,
    maxlength: [40, "Value cannot exceed 40 characters"],
  },
  isCorrect: {
    type: Boolean,
    required: true,
    enum: [true, false],
  },
  position: {
    type: Number,
    required: false,
    min: 1,
    max: 4,
  },
});

// question schema structure
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, "Question cannot exceed 100 characters"],
  },
  isMultiple: {
    type: Boolean,
    required: true,
    enum: [true, false],
  },
  isSortQuiz: {
    type: Boolean,
    required: true,
    enum: [true, false],
  },
  options: {
    type: [optionSchema],
    required: true,
    validate: [
      (val) => val.length === 4,
      "Must have four options, no more no less",
    ],
  },
});

// quiz schema structure
const quizSchema = new mongoose.Schema(
  {
    relatedTopicId: {
      type: String,
      required: true,
      trim: true,
    },

    questionVault: {
      type: [questionSchema],
      required: true,
    },
  },
  { timestamps: true }
);

//  quiz model
const QuizModel = mongoose.model("Quiz", quizSchema);

export default QuizModel;
