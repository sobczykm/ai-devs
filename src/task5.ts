import fetch from "node-fetch";
import { config } from "dotenv";
import * as fs from "fs";
import { getLLMAnswer, getOpenAIClient } from "./tools/index.js";
import { answerQuestions } from "./prompts/task3.js";
import { anonimize } from "./prompts/anonimize.js";

config();

async function getFileContent(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error fetching file: ${response.statusText}`);
    }
    const text = await response.text();
    return text;
}

async function main() {
    const openai = getOpenAIClient();
    
    const c3ntralaKey = process.env.C3NTRALA_KEY;
    let fileUrl = "https://centrala.ag3nts.org/data/C3NTRALA_KEY/cenzura.txt"
    fileUrl = fileUrl.replace("C3NTRALA_KEY",c3ntralaKey)
    const fileContent = await getFileContent(fileUrl) as string;
    console.log(fileContent)

    const answer = await getLLMAnswer(openai, fileContent, anonimize);
    console.log(answer)

    const response = await fetch("https://centrala.ag3nts.org/report", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            task: "CENZURA",
            apikey: c3ntralaKey,
            answer: answer,
        }),
    });

    const responseJSON = await response.json()
    console.log(responseJSON)

}

main()
