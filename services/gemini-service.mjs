import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyAGKbyiNTP5tul3EooIHR6ryqmJWwyZXLY",
});

export async function generateQuiz(userPrompt, files_array = null) {
  const instruction = `You are an AI quiz generator. Your goal is to create a structured quiz based on the user's prompt (text and/or file content).

  In your response, include a short and simple topic name for the quiz (e.g., 'Football Quiz', 'History Quiz', 'Mythology Quiz'). Also, include a dynamic conversational message to the user.
  
  Generate 10 quiz questions by default if the user doesn't mention how many questions they want.
  By default, create the quiz in normal mode if the user doesn't specify a difficulty level.

  Each question should strictly follow the provided response schema and the following rules for content generation:
  - For **single-choice questions** (not multiple answers, not sortable), 'isMultiple' and 'isSortQuiz' should be false, and only one option must have 'isCorrect' as true. 'position' should be null.
  - For **multiple-choice questions** (not sortable), 'isMultiple' should be true, 'isSortQuiz' should be false, and at least two options must have 'isCorrect' as true. 'position' should be null.
  - For **sortable questions**, 'isSortQuiz' should be true, 'isMultiple' should be false, all 'isCorrect' values for options must be false, and 'position' should indicate the correct order (starting from 1).
  - Generate a unique '_id' for each question and each option shown in the example below.

  Here is an example of each scenario of the expected JSON structure and content based on these rules. Remember to generate a dynamic conversational message based on the actual number of questions created:
  ${JSON.stringify(
    {
      message:
        "I’ve generated 10 quizzes based on your prompt. Would you like to refine the response further—such as adjusting the quiz count or requesting more specific responses?", // Example of a dynamic conversational message
      topic: "Football Quiz",
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

  The quiz should be based on the content provided.`;

  try {
    let finalContents = [
      { text: instruction }, // The main instruction for the AI
      { text: userPrompt },
    ];

    if (files_array) {
      // const base64Data = file_object.buffer.toString("base64");

      const filesBase64Data = files_array.map((file) => {
        return {
          inlineData: {
            mimeType: file.mimetype,
            data: file.buffer.toString("base64"),
          },
        };
      });

      finalContents.splice(finalContents.length - 1, 0, ...filesBase64Data);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: finalContents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // New property: message, placed first
            message: {
              type: Type.STRING,
            },
            topic: {
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
          propertyOrdering: ["message", "topic", "quizData"],
        },
      },
    });

    return response;
  } catch (err) {
    console.log(err);
  }
}
// test
