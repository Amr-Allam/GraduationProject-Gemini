import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { models } = await genAI.listModels();
    const modelDescriptors = models.map((model) => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods,
      inputTokenLimit: model.inputTokenLimit,
      outputTokenLimit: model.outputTokenLimit,
      version: model.version,
    }));
    res.status(200).json(modelDescriptors);
  } catch (error) {
    res.status(500).json({
      error: "Failed to list models",
      details:
        error.message || "An unknown error occurred while listing models.",
    });
  }
}
