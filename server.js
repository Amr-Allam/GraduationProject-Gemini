// backend/server.js

// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const express = require("express");
const cors = require("cors"); // Middleware for Cross-Origin Resource Sharing
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Express app
const app = express();
const port = process.env.PORT || 4000; // Use port 3000 by default, or an environment variable

// --- Middleware ---
// Enable CORS for all origins.
// For production, this should be restricted to your specific frontend domain(s) for security.
// Example for production: app.use(cors({ origin: 'https://your-website-domain.com' }));
app.use(cors());
// Middleware to parse JSON request bodies
app.use(express.json());

// --- Gemini API Setup ---
const API_KEY = process.env.GEMINI_API_KEY;

// Check if API key is loaded
if (!API_KEY) {
  console.error("🚫 ERROR: GEMINI_API_KEY not found in .env file.");
  console.error(
    "Please create a .env file in the 'backend' folder and add: GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE"
  );
  process.exit(1); // Exit the process if the API key is missing
}

// Initialize the Generative AI client with your API key
const genAI = new GoogleGenerativeAI(API_KEY);

// --- API Endpoint for Chat ---
// This is the endpoint your frontend will send requests to.
app.post("/generate", async (req, res) => {
  try {
    // Extract the prompt from the request body sent by the frontend
    const { prompt } = req.body;

    // Basic validation for the prompt
    if (!prompt) {
      return res
        .status(400)
        .json({ error: "Prompt is required in the request body." });
    }

    // *** FIX FOR 404 ERROR: Use "gemini-2.5-flash" instead of "gemini-pro" ***
    // "gemini-2.5-flash" is a stable model ID.
    // You can also try "gemini-1.5-pro-latest" if available and suited for your use case.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Call the Gemini API to generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response; // Get the response object from the result
    const text = response.text(); // Extract the plain text from the response

    // Send the generated text back to the frontend
    res.json({ generatedText: text });
  } catch (error) {
    console.error("🚨 Error calling Gemini API:", error);

    // Detailed error handling for better debugging
    let errorMessage = "An unexpected server error occurred.";
    let errorDetails = {};

    // Check for specific error details from Gemini API responses
    if (error.response && error.response.data) {
      // This structure is common for errors returned by Google APIs
      if (error.response.data.error) {
        errorMessage = error.response.data.error.message || errorMessage;
        errorDetails = error.response.data.error;
      } else {
        // Fallback for other error formats
        errorMessage = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Send appropriate status code and error message to the frontend
    res.status(500).json({
      error: "Error processing your request",
      details: errorMessage,
      fullError: errorDetails, // Include full details for debugging purposes
    });
  }
});

// --- Optional: Endpoint to List Available Models ---
// You can access this by navigating to http://localhost:3000/models in your browser
// This is useful for debugging if you encounter model-related errors again.
app.get("/models", async (req, res) => {
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
    res.json(modelDescriptors);
  } catch (error) {
    console.error("🚨 Error listing models:", error);
    res.status(500).json({
      error: "Failed to list models",
      details:
        error.message || "An unknown error occurred while listing models.",
    });
  }
});

// --- Start the Express Server ---
app.listen(port, () => {
  console.log(`✅ Backend server listening at http://localhost:${port}`);
  console.log(`   (Gemini API Key loaded: ${API_KEY ? "Yes" : "No"})`); // Indicate if key was found
  console.log(`   API endpoint for chat: http://localhost:${port}/generate`);
  console.log(`   Optional model list:   http://localhost:${port}/models`);
});
