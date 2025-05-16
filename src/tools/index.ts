import OpenAI from "openai";
import { config} from "dotenv";
config();

export const xyzPageUrl = process.env.XYZ_PAGE_URL
export const xyzCredentials = {
    username: process.env.XYZ_USERNAME,
    password: process.env.XYZ_PASSWORD,
}
export const xyzVerifyUrl = process.env.XYZ_VERIFY_URL


export function getOpenAIClient(): OpenAI {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

export async function getPageContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error fetching page: ${response.statusText}`);
    }
    const text = await response.text();
    return text;
}


export async function getLLMAnswer(openai: OpenAI, question: string, prompt?: string): Promise<string> {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: prompt
                    ? prompt.replace("{{question}}", question)
                    : `Answer the following question: ${question}`,
            },
        ],
    });

    return response.choices[0].message.content;
}