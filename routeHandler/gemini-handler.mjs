// external import
import express from "express";
import fileUploadMiddleware from "../middlewares/file-upload-middleware.mjs";

// internal import
import { getWithTTL, setWithExpire } from "../config/redis-client.mjs";
// import { generateQuizFromInlineData } from "../services/gemini-inline-data-service.mjs";
import { generateQuizFromFileApi } from "../services/gemini-file-api-service.mjs";
import { generateUniqueId } from "../utilities/utils.mjs";

// router setup
const router = express.Router();

// post a quiz
router.post("/", fileUploadMiddleware, async (req, res) => {
  let { prompt, difficulty, conversationId, modifyExisting, files_array } =
    req.body;
  modifyExisting = modifyExisting === "true";

  try {
    let quizData = {};

    if (modifyExisting) {
      const { value, ttl } = (await getWithTTL(conversationId)) || {};

      const { response, filesParts, userPrompt } =
        await generateQuizFromFileApi(
          prompt,
          difficulty,
          files_array,
          modifyExisting,
          value
        );

      const parsedResponse = JSON.parse(response.text);

      quizData = { ...parsedResponse };

      quizData.conversationId = conversationId;

      const filesMetadata = filesParts.map((file) => ({
        fileUri: file?.fileData?.fileUri,
        mimeType: file?.fileData?.mimeType,
      }));

      const prevConversations = [
        ...value,
        ...filesParts,
        {
          text: `user_previous_prompt: ${JSON.stringify(userPrompt)}`,
        },
        {
          text: `Gemini_generated_previous_quizzes: ${JSON.stringify(
            quizData
          )}`,
        },
      ];

      await setWithExpire(conversationId, prevConversations, 5 * 60);

      // const { value: updatedValue } = (await getWithTTL(conversationId)) || {};

      // console.log(updatedValue[0].filesInfo);
    } else {
      const { response, filesParts, userPrompt } =
        await generateQuizFromFileApi(prompt, difficulty, files_array);
      const parsedResponse = JSON.parse(response.text);

      quizData = { ...parsedResponse };

      const uniqueId = generateUniqueId();

      quizData.conversationId = conversationId;

      const filesMetadata = filesParts.map((file) => ({
        fileUri: file?.fileData?.fileUri,
        mimeType: file?.fileData?.mimeType,
      }));

      const prevConversations = [
        ...filesParts,
        {
          text: `user_previous_prompt: ${JSON.stringify(userPrompt)}`,
        },
        {
          text: `Gemini_generated_previous_quizzes: ${JSON.stringify(
            quizData
          )}`,
        },
      ];

      await setWithExpire(conversationId, prevConversations, 5 * 60);
    }

    res.status(200).json({
      data: quizData,
      // data: "success",
    });
  } catch (err) {
    res.status(500).json({
      message: "there was an error",
    });
  }
});

export default router;
