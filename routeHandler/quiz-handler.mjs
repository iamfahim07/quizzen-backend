// external import
import express from "express";

// internal import
import QuizModel from "../models/quiz-model.mjs";
import QuizTopicModel from "../models/quiz-topic-model.mjs";
import removeExtraSpaces from "../utilities/remove-extra-spaces.mjs";

// router setup
const router = express.Router();

// count all the quizzes
router.get("/count", async (req, res) => {
  try {
    const result = await QuizModel.aggregate([
      { $addFields: { vaultSize: { $size: "$questionVault" } } },
      { $group: { _id: null, totalQuestions: { $sum: "$vaultSize" } } },
    ]);

    async function delay(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    await delay(5000);

    res.status(200).json({ data: result[0]?.totalQuestions || 0 });
  } catch (err) {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

// get all the quiz
router.get("/:topicId", async (req, res) => {
  try {
    const quiz = await QuizModel.findOne({
      relatedTopicId: req.params.topicId,
    });

    async function delay(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    await delay(5000);

    if (quiz) {
      res.status(200).json({ data: quiz.questionVault });
    } else {
      res.status(409).json({
        message: "No quiz exists under this topic name.",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

// post a quiz
router.post("/:topicId", async (req, res) => {
  try {
    const paramsValue = req.params.topicId;

    // checking if the topic exist or not
    const isTopicExist = await QuizTopicModel.findById(paramsValue);

    // checking if the quiz already exist or not
    const isQuizExist = await QuizModel.findOne({
      relatedTopicId: paramsValue,
    });

    const payload = req.body;

    // Defensive guard – makes debugging 400s easier if the client sends the wrong shape
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "payload must be an array" });
    }

    // const {
    //   question,
    //   isMultiple,
    //   isSortQuiz,
    //   options: rawOptions,
    // } = req.body.payload;

    // data to save
    const received_data = payload.map(
      ({ question, isMultiple, isSortQuiz, options: rawOptions = [] }) => ({
        question: removeExtraSpaces(question),
        isMultiple: isSortQuiz ? false : isMultiple,
        isSortQuiz,
        options: rawOptions
          .filter((opt) => opt?.value && opt.value.trim().length > 0)
          .map((opt) => ({
            value: removeExtraSpaces(opt.value),
            isCorrect: !isSortQuiz && Boolean(opt.isCorrect),
            position: isSortQuiz ? opt.position : null,
          })),
      })
    );

    if (isTopicExist && !isQuizExist && received_data.length > 0) {
      const new_quiz_data = {
        relatedTopicId: isTopicExist.id,
        questionVault: [...received_data],
      };

      // const new_quiz = new QuizModel(new_quiz_data);
      // await new_quiz.save();

      const new_quiz = await QuizModel.create(new_quiz_data);

      res.status(200).json({
        data: new_quiz.questionVault,
      });
    } else if (
      isTopicExist?.title &&
      isQuizExist?.relatedTopicId &&
      received_data.length > 0
    ) {
      const updated_quiz = await QuizModel.findOneAndUpdate(
        { relatedTopicId: paramsValue },
        { questionVault: [...isQuizExist.questionVault, ...received_data] },
        { returnDocument: "after" }
      );

      res.status(200).json({
        data: updated_quiz.questionVault,
      });
    } else {
      res.status(409).json({
        message: "There is no topic name or data provided by the user.",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

// update a quiz
router.put("/:topicId", async (req, res) => {
  try {
    const paramsValue = req.params.topicId;

    // checking if the topic exist or not
    const isTopicExist = await QuizTopicModel.findById(paramsValue);

    // checking if the quiz already exist or not
    const isQuizExist = await QuizModel.findOne({
      relatedTopicId: paramsValue,
    });

    // checking if the quiz is true/false or sortable
    // const isSortQuiz = req.body.payload.quizData.isSortQuiz;

    const payload = req.body;

    // Defensive guard – makes debugging 400s easier if the client sends the wrong shape
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: "payload must be an array" });
    }

    const received_data = payload.map(
      ({ id, question, isMultiple, isSortQuiz, options: rawOptions = [] }) => ({
        _id: id,
        question: removeExtraSpaces(question),
        isMultiple: isSortQuiz ? false : isMultiple,
        isSortQuiz,
        options: rawOptions
          .filter((opt) => opt?.value && opt.value.trim().length > 0)
          .map((opt) => ({
            value: removeExtraSpaces(opt.value),
            isCorrect: !isSortQuiz && Boolean(opt.isCorrect),
            position: isSortQuiz ? opt.position : null,
          })),
      })
    );

    // data to save
    // const received_data = {
    //   id: req.body.payload.id,
    //   quizData: {
    //     question: removeExtraSpaces(req.body.payload.quizData.question),
    //     isMultiple: isSortQuiz ? false : req.body.payload.quizData.isMultiple,
    //     isSortQuiz: isSortQuiz,
    //     options: [
    //       {
    //         value: removeExtraSpaces(
    //           req.body.payload.quizData.options[0].value
    //         ),
    //         isCorrect: isSortQuiz
    //           ? false
    //           : req.body.payload.quizData.options[0].isCorrect,
    //         position: isSortQuiz
    //           ? req.body.payload.quizData.options[0].position
    //           : null,
    //       },
    //       {
    //         value: removeExtraSpaces(
    //           req.body.payload.quizData.options[1].value
    //         ),
    //         isCorrect: isSortQuiz
    //           ? false
    //           : req.body.payload.quizData.options[1].isCorrect,
    //         position: isSortQuiz
    //           ? req.body.payload.quizData.options[1].position
    //           : null,
    //       },
    //       {
    //         value: removeExtraSpaces(
    //           req.body.payload.quizData.options[2].value
    //         ),
    //         isCorrect: isSortQuiz
    //           ? false
    //           : req.body.payload.quizData.options[2].isCorrect,
    //         position: isSortQuiz
    //           ? req.body.payload.quizData.options[2].position
    //           : null,
    //       },
    //       {
    //         value: removeExtraSpaces(
    //           req.body.payload.quizData.options[3].value
    //         ),
    //         isCorrect: isSortQuiz
    //           ? false
    //           : req.body.payload.quizData.options[3].isCorrect,
    //         position: isSortQuiz
    //           ? req.body.payload.quizData.options[3].position
    //           : null,
    //       },
    //     ],
    //   },
    // };

    if (isTopicExist && isQuizExist && received_data) {
      const new_questionVault_value = isQuizExist.questionVault.reduce(
        (arr, qn) => {
          const match = received_data.find(
            (r) => r._id.toString() === qn._id.toString()
          );

          const updated = match
            ? {
                question: match.question,
                isMultiple: match.isMultiple,
                isSortQuiz: match.isSortQuiz,
                options: [...match.options],
              }
            : qn;
          return [...arr, updated];
        },
        []
      );

      const updated_quiz_optionAndValue = await QuizModel.findOneAndUpdate(
        { relatedTopicId: paramsValue },
        { questionVault: new_questionVault_value },
        { returnDocument: "after" }
      );

      res.status(200).json({
        data: updated_quiz_optionAndValue.questionVault,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

// delete a quiz
router.delete("/:topicId", async (req, res) => {
  try {
    const paramsValue = req.params.topicId;

    // checking if the quiz already exist or not
    const isQuizExist = await QuizModel.findOne({
      relatedTopicId: paramsValue,
    });

    // id to received
    const received = req.body;

    if (isQuizExist && received?._id) {
      const updatedValueAfterDeletion = isQuizExist.questionVault.filter(
        (qn) => qn.id !== received?._id
      );

      const updated_quiz_after_deletion = await QuizModel.findOneAndUpdate(
        { relatedTopicId: paramsValue },
        { questionVault: [...updatedValueAfterDeletion] },
        { returnDocument: "after" }
      );

      res.status(200).json({ data: received?._id });
    } else {
      res.status(409).json({
        message: "Invalid id or quiz",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

export default router;
