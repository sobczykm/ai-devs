import { config } from "dotenv";
config();
import fetch from "node-fetch";
import { OpenAI } from "openai";
import * as fs from "fs";
import { solveQuestion } from "./prompts/solveCaptcha.js";
import { getLLMAnswer, getOpenAIClient, getPageContent, xyzCredentials, xyzPageUrl } from "./tools/index.js";


async function main() {
    const openai = getOpenAIClient();
    const page = await getPageContent(xyzPageUrl);

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
    console.log(result)

    const flag = result.match(/{{FLG:(.*?)}}/);
    if (!flag) {
        throw new Error("Flag not found in the response");
    }
    const capturedFlag = flag[1];
    console.log("Captured flag:", capturedFlag);

    const filePath = result.match(/<dt><a href="(\/files\/.*?)">(.*?)<\/a><\/dt>/)[1];
    if (!filePath) {
        throw new Error("File path not found in the response");
    }

    const fileUrl = `${xyzPageUrl}${filePath}`;
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
        throw new Error(`Error fetching file: ${fileResponse.statusText}`);
    }
    const fileBuffer = await fileResponse.buffer();

    const fileName = filePath.split("/").pop();
    fs.writeFile(`./data/task1/${fileName}`, fileBuffer, (err: any) => {
        if (err) {
            console.error("Error writing file:", err);
        }
    });

    fs.writeFile("./data/task1/response.html", result, (err: any) => {
        if (err) {
            console.error("Error writing file:", err);
        }
    }
    );
}

main();