// external import
import mongoose from "mongoose";

// quiz topic schema structure
const quizTopicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, "Title cannot exceed 20 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [230, "Description cannot exceed 230 characters"],
    },
    img_link: {
      type: String,
      required: true,
      trim: true,
    },
    img_ref: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

//  quiz topic model
const QuizTopicModel = mongoose.model("Topic", quizTopicSchema);

export default QuizTopicModel;
