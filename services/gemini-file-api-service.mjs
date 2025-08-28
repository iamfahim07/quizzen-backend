import {
  GoogleGenAI,
  Type,
  createPartFromUri,
  createUserContent,
} from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const safetySettings = [
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_LOW_AND_ABOVE",
  },
];

export async function generateQuizFromFileApi(
  userPrompt,
  difficulty,
  files_array = null,
  modifyExisting = false,
  prevConversations = []
) {
  const instruction = `You are an AI quiz generator. Your goal is to create a structured quiz based on the user's provided prompt (text and/or file content).

  ${
    modifyExisting
      ? "The user wants to modify the Gemini generated previous response. Consider the previous attached files, previous_prompts, and Gemini_generated_previous_quizzes if provided."
      : "This is an initial request for a new quiz."
  }

  In your response, begin with a dynamic, conversational tone message that Includes a brief note explaining the steps you took or the information you included. Additionally, please include the count of **single-choice questions**, **multiple-choice questions**, and **sortable questions** generated, if possible, then ask the user if they’d like any changes.

  Also, in your response, include a short and simple topic name (e.g., 'Football Quiz', 'History Quiz', 'Mythology Quiz'), and a simple and short description (e.g., 'Test your knowledge of the beautiful game! From legendary players and memorable matches to team stats and World Cup history.', 'Journey through time with questions about ancient civilizations, world wars, famous leaders, and pivotal moments that shaped our world.', 'Explore gods, heroes, and legends from around the globe. Challenge yourself with tales from Greek, Norse, Egyptian, and other mythologies.'), for the quiz.

  Each question should strictly follow the provided response schema and the following rules for content generation:
  - For **single-choice questions** (not multiple answers, not sortable), 'isMultiple' and 'isSortQuiz' should be false, and only one option must have 'isCorrect' as true. 'position' should be null.
  - For **multiple-choice questions** (not sortable), 'isMultiple' should be true, 'isSortQuiz' should be false, and at least two options must have 'isCorrect' as true. 'position' should be null.
  - For **sortable questions**, 'isSortQuiz' should be true, 'isMultiple' should be false, all 'isCorrect' values for options must be false, and 'position' should indicate the correct order (starting from 1).
  - Generate a unique '_id' for each question and each option shown in the example below.

  Generate 10 quiz questions by default if the user doesn't mention how many questions they want.
  By default, create the quiz in ${difficulty} mode if the user doesn't specify a difficulty level.

  On "easy" mode:
  - Each quiz should consist of 50% **single-choice questions**, 30% **multiple-choice questions**, and 20% **sortable questions**.
  On "medium" mode:
  - Each quiz should consist of 30% **single-choice questions**, 40% **multiple-choice questions**, and 30% **sortable questions**.
  On "hard" mode:
  - Each quiz should consist of 20% **single-choice questions**, 50% **multiple-choice questions**, and 30% **sortable questions**. Each question should have at least 5 options.
  On "extreme" mode:
  - Each quiz should consist of 20% **single-choice questions**, 40% **multiple-choice questions**, and 40% **sortable questions**. Each question should have at least 6 options.

  Here is an example of each scenario of the expected JSON structure and content based on these rules. Remember to generate a dynamic conversational message based on the actual number of questions created:
  ${JSON.stringify(
    {
      message:
        "I’ve generated five single-choice quizzes, three multiple-choice quizzes, and two sortable quizzes based on your prompt. Would you like to refine the response further, such as adjusting the quiz count or requesting more specific responses?",
      topic: "Football Quiz",
      description:
        "Test your knowledge of the beautiful game! From legendary players and memorable matches to team stats and World Cup history.",
      quizData: [
        {
          _id: "<unique-id-q1>",
          question:
            "Which football club is known for it's Red Devils nickname?",
          isMultiple: false,
          isSortQuiz: false,
          options: [
            {
              value: "Liverpool",
              isCorrect: false,
              position: null,
              _id: "<unique-id-q1-o1>",
            },
            {
              value: "AC Milan",
              isCorrect: false,
              position: null,
              _id: "<unique-id-q1-o2>",
            },
            {
              value: "Manchester United",
              isCorrect: true,
              position: null,
              _id: "<unique-id-q1-o3>",
            },
            {
              value: "Arsenal",
              isCorrect: false,
              position: null,
              _id: "<unique-id-q1-o4>",
            },
          ],
        },
        {
          _id: "<unique-id-q2>",
          question:
            "Which countries have won the FIFA World Cup more than once?",
          isMultiple: true,
          isSortQuiz: false,
          options: [
            {
              value: "Brazil",
              isCorrect: true,
              position: null,
              _id: "<unique-id-q2-o1>",
            },
            {
              value: "Germany",
              isCorrect: true,
              position: null,
              _id: "<unique-id-q2-o2>",
            },
            {
              value: "Argentina",
              isCorrect: true,
              position: null,
              _id: "<unique-id-q2-o3>",
            },
            {
              value: "England",
              isCorrect: false,
              position: null,
              _id: "<unique-id-q2-o4>",
            },
          ],
        },
        {
          _id: "<unique-id-q3>",
          question:
            "Sort these countries by the number of FIFA World Cup wins, from least to most.",
          isMultiple: false,
          isSortQuiz: true,
          options: [
            {
              value: "Spain",
              isCorrect: false,
              position: 1,
              _id: "<unique-id-q3-o1>",
            },
            {
              value: "Argentina",
              isCorrect: false,
              position: 2,
              _id: "<unique-id-q3-o2>",
            },
            {
              value: "Germany",
              isCorrect: false,
              position: 3,
              _id: "<unique-id-q3-o3>",
            },
            {
              value: "Brazil",
              isCorrect: false,
              position: 4,
              _id: "<unique-id-q3-o4>",
            },
          ],
        },
      ],
    },
    null,
    2
  )}

  The quiz should be based on the content provided.
  
  Be language-specific: if the prompt, attached image, or document predominantly uses a specific language, then generate the **message**, **topic**, **description**, **question**, and **options value** properties in that language. Keep all other properties in English.
  
  In any language, if the user's prompt is insufficient or lacks context for creating the quiz response JSON object, respond with a generic message and leave all other properties empty. For e.g.:
  ${JSON.stringify(
    {
      message:
        "Your input is not sufficient to create a quiz. Please provide a meaningful input prompt.",
      topic: "",
      description: "",
      quizData: [],
    },
    null,
    2
  )}
  `;

  try {
    // res.json({ key, value, expiresIn: TTL_SECONDS });

    // const imageBlob = new Blob([files_array[0].buffer], {
    //   type: files_array[0].mimetype,
    // });
    // const imageBlob2 = new Blob([files_array[1].buffer], {
    //   type: files_array[1].mimetype,
    // });

    // const myfile = await ai.files.upload({
    //   file: imageBlob,
    //   config: { mimeType: files_array[0].mimetype },
    // });

    // const myfile2 = await ai.files.upload({
    //   file: imageBlob2,
    //   config: { mimeType: files_array[1].mimetype },
    // });

    // changeing code
    const filesParts = [];
    if (files_array && files_array.length > 0) {
      for (const file of files_array) {
        const fileBlob = new Blob([file.buffer], {
          type: file.mimetype,
        });

        const fileData = await ai.files.upload({
          file: fileBlob,
          config: { mimeType: file.mimetype },
        });

        filesParts.push(createPartFromUri(fileData.uri, fileData.mimeType));
      }
    }

    // const modifiedPrevConversations = prevConversations.flatMap((el) => {
    //   if (Array.isArray(el.filesInfo)) {
    //     return el.filesInfo.map((fi) =>
    //       createPartFromUri(fi.fileUri, fi.mimeType)
    //     );
    //   }

    //   return el;
    // });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: createUserContent([
        // instruction,
        { text: instruction },
        ...prevConversations,
        // createPartFromUri(myfile.uri, myfile.mimeType),
        // createPartFromUri(myfile2.uri, myfile2.mimeType),
        ...filesParts,
        // userPrompt,
        { text: userPrompt },
      ]),
      config: {
        systemInstruction:
          "You are a quiz generator bot. Your sole task is to create quizzes according to the user's specifications, following the responseSchema configuration. If the user's prompt is insufficient or lacks context for creating the quiz response JSON object, then respond with a generic message (e.g., 'Your input is not sufficient to create a quiz. Please provide a meaningful input prompt.') and leave the other properties empty (e.g., topic: '', description: '', quizData: []).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
            },
            topic: {
              type: Type.STRING,
            },
            description: {
              type: Type.STRING,
            },
            quizData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  _id: {
                    type: Type.STRING,
                  },
                  question: {
                    type: Type.STRING,
                  },
                  isMultiple: {
                    type: Type.BOOLEAN,
                  },
                  isSortQuiz: {
                    type: Type.BOOLEAN,
                  },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        value: {
                          type: Type.STRING,
                        },
                        isCorrect: {
                          type: Type.BOOLEAN,
                        },
                        position: {
                          type: Type.NUMBER,
                          nullable: true,
                        },
                        _id: {
                          type: Type.STRING,
                        },
                      },
                      propertyOrdering: [
                        "value",
                        "isCorrect",
                        "position",
                        "_id",
                      ],
                    },
                  },
                },
                propertyOrdering: [
                  "_id",
                  "question",
                  "isMultiple",
                  "isSortQuiz",
                  "options",
                ],
              },
            },
          },
          propertyOrdering: ["message", "topic", "description", "quizData"],
        },
        safetySettings: safetySettings,
      },
    });

    return { response, filesParts, userPrompt };
  } catch (err) {
    console.log(err);
  }
}
