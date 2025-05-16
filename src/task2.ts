import fetch from "node-fetch";
import { getLLMAnswer, getOpenAIClient, xyzVerifyUrl } from "./tools/index.js";
import { config } from "dotenv";
import { passVerify } from "./prompts/passVerify.js";


config();

async function main() {
    console.log(xyzVerifyUrl)
    const response = await fetch(xyzVerifyUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: "READY",
            msgID: 0
        }),
    });

    if (!response.ok) {
        throw new Error(`Error submitting answer: ${response.statusText}`);
    }
    const result = await response.json() as { text: string, msgID: number };
    console.log(result)

    const openai = getOpenAIClient();
    const answer = await getLLMAnswer(openai, result.text, passVerify);
    console.log(answer)

    const responsev2 = await fetch(xyzVerifyUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            text: answer,
            msgID: result.msgID
        }),
    });

    if (!responsev2.ok) {
        throw new Error(`Error submitting answer: ${responsev2.statusText}`);
    }
    const resultv2 = await responsev2.json() 
    console.log(resultv2)
}

main()