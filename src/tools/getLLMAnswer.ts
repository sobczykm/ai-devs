import OpenAI from "openai";

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