import fetch from "node-fetch";
import { config } from "dotenv";
import * as fs from "fs";
import { getLLMAnswer, getOpenAIClient } from "./tools/index.js";
import { answerQuestions } from "./prompts/task3.js";

config();

async function getFileContent(url: string): Promise<unknown> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error fetching file: ${response.statusText}`);
    }
    const text = await response.json();
    return text;
}

async function main() {
    const openai = getOpenAIClient();
    
    const c3ntralaKey = process.env.C3NTRALA_KEY;
    let fileUrl = "https://centrala.ag3nts.org/data/C3NTRALA_KEY/json.txt"
    fileUrl = fileUrl.replace("C3NTRALA_KEY",c3ntralaKey)
    const fileContent = await getFileContent(fileUrl);

    for (const data of fileContent['test-data']) {
        const question = data.question;
        const answer = data.answer;

        const isAnswerCorrect = eval(question) === answer;
        if (!isAnswerCorrect) {
            console.log(`Question: ${question} Answer: ${answer} is incorrect`);
            console.log(`Correct answer is: ${eval(question)}`);
            fileContent['test-data'][fileContent['test-data'].indexOf(data)] = {
                question: question,
                answer: eval(question)
            }
        }
        if (data['test']) {
            const testQuestion = data['test']['q'];
            const testAnswer = data['test']['a'];
            const answer = await getLLMAnswer(openai, testQuestion, answerQuestions);

            console.log(`Test Question: ${testQuestion} Answer: ${answer} `);
            fileContent['test-data'][fileContent['test-data'].indexOf(data)]['test'] = {
                q: testQuestion,
                a: answer
            }
        }

    }
    fs.writeFileSync("./data/s01e03/fixed-robot-instructions.json", JSON.stringify(fileContent, null, 2));
    fileContent['apikey'] = c3ntralaKey

    const response = await fetch("https://centrala.ag3nts.org/report", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            task: "JSON",
            apikey: c3ntralaKey,
            answer: fileContent,
        }),
    });

    const responseJSON = await response.json()
    console.log(responseJSON)
}

main()