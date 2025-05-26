import fetch from "node-fetch";
import { config } from "dotenv";
import * as fs from "fs";
import { getOpenAIClient } from "./tools/index.js";
import path from "path";

config();

const AUDIO_DIR = path.join(process.cwd(), "data", "s02e01", "przesluchania");
const TRANSCRIPTIONS_DIR = path.join(process.cwd(), "data", "s02e01", "transcriptions");

// Create transcriptions directory if it doesn't exist
if (!fs.existsSync(TRANSCRIPTIONS_DIR)) {
    fs.mkdirSync(TRANSCRIPTIONS_DIR, { recursive: true });
}

async function transcribeAudio(filePath: string, openai: any) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const transcriptionPath = path.join(TRANSCRIPTIONS_DIR, `${fileName}.txt`);

    // Check if transcription already exists
    if (fs.existsSync(transcriptionPath)) {
        console.log(`Transcription for ${fileName} already exists, skipping...`);
        return fs.readFileSync(transcriptionPath, 'utf-8');
    }

    console.log(`Transcribing ${fileName}...`);
    
    try {
        const audioFile = fs.createReadStream(filePath);
        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "pl"
        });

        const transcription = response.text;
        fs.writeFileSync(transcriptionPath, transcription);
        console.log(`Transcription saved for ${fileName}`);
        return transcription;
    } catch (error) {
        console.error(`Error transcribing ${fileName}:`, error);
        throw error;
    }
}

async function getAllTranscriptions(openai: any) {
    const audioFiles = fs.readdirSync(AUDIO_DIR)
        .filter(file => file.endsWith('.m4a'))
        .map(file => path.join(AUDIO_DIR, file));

    const transcriptions = await Promise.all(
        audioFiles.map(file => transcribeAudio(file, openai))
    );

    return transcriptions.join('\n\n---\n\n');
}

async function sendAnswer(answer: string, apiKey: string, url: string) {
    console.log("Sending answer:", answer);
    console.log("URL:", url);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            task: 'mp3',
            apikey: apiKey,
            answer: answer
        })
    });

    const data = await response.json();
    return data;
}

async function main() {
    const openai = getOpenAIClient();
    const c3ntralaKey = process.env.C3NTRALA_KEY;
    const c3ntralaUrl = process.env.C3NTRALA_URL;

    if (!c3ntralaKey) {
        throw new Error("C3NTRALA_KEY not found in environment variables");
    }

    // Get all transcriptions
    const allTranscriptions = await getAllTranscriptions(openai);

    // Create a prompt for the LLM
    const prompt = `Przeanalizuj poniższe transkrypcje przesłuchań i ustal, na jakiej ulicy znajduje się instytut uczelni, gdzie wykłada profesor Andrzej Maj. 
    
    Ważne wskazówki:
    1. Szukamy konkretnie ulicy, na której znajduje się INSTYTUT, a nie główna siedziba uczelni
    2. Analizuj informacje krok po kroku
    3. Niektóre zeznania mogą być chaotyczne lub wprowadzające w błąd
    4. Użyj swojej wiedzy o uczelniach w Polsce do weryfikacji informacji
    
    Transkrypcje:
    
    ${allTranscriptions}
    
    Proszę o podanie nazwy ulicy, na której znajduje się instytut, gdzie wykłada profesor Andrzej Maj. Przeanalizuj informacje krok po kroku i wyjaśnij swoje rozumowanie.
    
    <thinking>
    ...
    </thinking>
    
    <rules>
    return only the final answer (street name) without any other text
    </rules>
    `;

    // Get response from GPT
    const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            { role: "system", content: "Jesteś pomocnym asystentem, który analizuje informacje i wyciąga z nich wnioski." },
            { role: "user", content: prompt }
        ]
    });

    const streetName = completion.choices[0].message.content;
    console.log("GPT Analysis:", streetName);

    // Send answer to the API
    const result = await sendAnswer(streetName, c3ntralaKey, c3ntralaUrl);
    console.log("API Response:", result);
}

main().catch(console.error);