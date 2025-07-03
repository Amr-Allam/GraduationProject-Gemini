import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res
      .status(400)
      .json({ error: "Prompt is required in the request body." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.status(200).json({ generatedText: text });
  } catch (error) {
    let errorMessage = "An unexpected server error occurred.";
    let errorDetails = {};

    if (error.response && error.response.data) {
      if (error.response.data.error) {
        errorMessage = error.response.data.error.message || errorMessage;
        errorDetails = error.response.data.error;
      } else {
        errorMessage = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      error: "Error processing your request",
      details: errorMessage,
      fullError: errorDetails,
    });
  }
}
