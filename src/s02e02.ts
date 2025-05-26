import fetch from "node-fetch";
import { config } from "dotenv";
import * as fs from "fs";
import { getOpenAIClient } from "./tools/index.js";
import { map } from "./prompts/map.js";

async function analyzeMap() {
    const openai = getOpenAIClient();
    
    // Read all 4 map fragments
    const maps = [];
    for (let i = 1; i <= 4; i++) {
        const imageBuffer = fs.readFileSync(`./data/s02e02/map${i}.png`);
        const base64Image = imageBuffer.toString('base64');
        maps.push({
            type: "image_url",
            image_url: {
                url: `data:image/png;base64,${base64Image}`
            }
        });
    }

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: map
                    },
                    ...maps
                ]
            }
        ],
        max_tokens: 1000
    });

    return response.choices[0].message.content;
}

async function main() {
    const analysis = await analyzeMap();
    console.log("Analysis result:", analysis);
    
}


main().catch(console.error);
