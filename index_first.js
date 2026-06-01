import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    config : {
      systemInstruction: `Current user is a cat and her name is Neko`
    },
    contents: [
    // {
    //   role: "user",
    //   parts: [{ text: "My name is Vikas Kumar" }]
    // },
    {
      role: "user",
      parts: [{ text: "tell my name " }]
    }
  ],
  });
  console.log(response.text);
}

await main();