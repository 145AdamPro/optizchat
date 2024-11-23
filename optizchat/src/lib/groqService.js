import Groq from "groq-sdk";
import { getGroqChatCompletion } from "../components/Chat";

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
});

export const getGroqChatCompletion = async (prompt, model = "llama3-8b-8192") => {
    return groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a smart AI that checks and thinks two times before answering.",
            },
            { role: "user", content: prompt },
        ],
        model: model, 
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 1,
        stop: null,
        stream: false,
    });
};
