import fetch from "node-fetch";
import { config } from "dotenv";
import * as fs from "fs";
import { getOpenAIClient } from "./tools/index.js";

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
                        text: "Przeanalizuj dokładnie te cztery fragmenty mapy z Polski. Twoim zadaniem jest:\n\n1. Zidentyfikuj nazwy ulic, charakterystyczne obiekty (cmentarze, kościoły, szkoły) i układ urbanistyczny na każdym fragmencie.\n2. Zwróć szczególną uwagę, że jeden z tych czterech fragmentów może pochodzić z innego miasta - zidentyfikuj który, jeśli taki znajdziesz.\n3. Na podstawie nazw ulic i obiektów, określ z całkowitą pewnością, z jakiego miasta pochodzą te fragmenty mapy.\n4. Upewnij się, że wszystkie lokalizacje, które rozpoznajesz, rzeczywiście znajdują się w proponowanym mieście.\n\nOdpowiedz w następującym formacie:\n1. Znalezione nazwy ulic i obiektów (dla każdego fragmentu)\n2. Który fragment może być z innego miasta (jeśli taki jest)\n3. Nazwa miasta, z którego pochodzą mapy (z wyjaśnieniem dlaczego)\n\nWAŻNE: Podaj tylko jedno, najbardziej pewne miasto. Jeśli nie masz 100% pewności, zaznacz to wyraźnie."
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
