import { config } from "dotenv";
config();
import fetch from "node-fetch";
import { OpenAI } from "openai";
import * as fs from "fs";
import { getLLMAnswer } from "./tools/getLLMAnswer.js";
import { solveQuestion } from "./prompts/solveCaptcha.js";
const xyzPageUrl = process.env.XYZ_PAGE_URL
const xyzCredentials = {
    username: process.env.XYZ_USERNAME,
    password: process.env.XYZ_PASSWORD,
}


async function getXYZPageContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error fetching page: ${response.statusText}`);
    }
    const text = await response.text();
    return text;
}

async function main() {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const page = await getXYZPageContent(xyzPageUrl);
    if (!page) {
        throw new Error("Failed to fetch the page content");
    }

    const question = page.match(/<p id="human-question">Question:<br \/>.*?<\/p>/)[0].replace(/<.*?>/g, "");

    if (!question) {
        throw new Error("Question not found in the page content");
    }

    const answer = await getLLMAnswer(openai, question, solveQuestion);
    if (!answer) {
        throw new Error("Failed to get an answer from the LLM");
    }
    const clearedAnswer = answer.replace(/Answer:\s*/i, "").trim();

    const formData = new URLSearchParams();
    formData.append("username", xyzCredentials.username);
    formData.append("password", xyzCredentials.password);
    formData.append("answer", clearedAnswer);

    console.log(formData.toString());

    const response = await fetch(xyzPageUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
    });
    if (!response.ok) {
        throw new Error(`Error submitting answer: ${response.statusText}`);
    }
    const result = await response.text();
    //search the response for string containin {{FLG:<capturedflag>}}

    const flag = result.match(/{{FLG:(.*?)}}/);
    if (!flag) {
        throw new Error("Flag not found in the response");
    }
    const capturedFlag = flag[1];
    console.log("Captured flag:", capturedFlag);


    //save the result to a file
    fs.writeFile("data/response.html", result, (err: any) => {
        if (err) {
            console.error("Error writing file:", err);
        } else {
            console.log("File saved successfully.");
        }
    }
    );
}

main();