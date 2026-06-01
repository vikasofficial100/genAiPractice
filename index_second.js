import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import readlineSync from "readline-sync"


const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",           //history will be store here in history

    history: [],                   

    config : {        // LLM configuration here
      systemInstruction: `Current user is a cat and her name is Neko`
    },
  });


  while(true){

    const question = readlineSync.question("ask me question : ");

    //breaking or existing the loop 
     if(question=='exit'){
        break;
     }
     // sending the response 
    const response = await chat.sendMessage({
        message:question
    })
    console.log("Response:", response.text);
  }
  
  
}

await main();