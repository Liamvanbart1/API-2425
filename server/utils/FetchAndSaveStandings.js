import "dotenv/config";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import path from "path";

const getFootballstandings = async () => {
  const id = 78;
  const key = process.env.API_KEY;
  const baseUrl = process.env.BASE_URL;

  console.log("endpoint is", baseUrl);
  const endPoint = new URL(`standings?league=${id}&season=2023`, baseUrl);

  const response = await fetch(`${endPoint.href}`, {
    method: "GET",
    headers: {
      "x-apisports-key": key,
      "x-rapidapi-host": "v3.football.api-sports.io",
    },
  });

  const json = await response.json();
  if (json.errors.length) {
    console.log("fout met de api", json.errors);
  }

  // const leagueName = json.response?.[0]?.league?.name || `League ${id}`;
  const standings = json.response?.[0]?.league?.standings?.[0] || [];

  const tableSummary = standings
    .slice(0, 20)
    .map(
      (team, i) =>
        `${i + 1}. ${team.team.name} (${team.points} pts, ${
          team.all.played
        } games)`
    )
    .join("\n");

  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  const prompt = `
You are a quiz generator. Create 25 multiple-choice questions based on the following football league standings.

Each question must:
- Be based on rank, points, wins, or games played.
- Have 3 choices (A, B, C).
- Indicate the correct answer by setting its value to {"text": "...", "correct": true}, and the others to {"text": "...", "correct": false}.

Return the output as a valid JSON array of objects in the following format:

[
  {
    "question": "Question text?",
    "questionID": 1,
    "choices": [
      { "id": 1, "text": "Choice A", "correct": false },
      { "id": 2, "text": "Choice B", "correct": true },
      { "id": 3, "text": "Choice C", "correct": false }
    ]
  },
  ...
]

the ids should count up so the second question the id's should be 4, 5, 6
Here is the table:


${tableSummary}
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;
    console.log("📝 Raw GPT response:", raw);

    const quizQuestions = JSON.parse(raw);

    const filePath = path.resolve(
      "server/components/questions/json",
      `questions${id}.json`
    );
    await writeFile(filePath, JSON.stringify(quizQuestions, null, 2), "utf-8");

    console.log(`✅ Questions saved to ${filePath}`);
  } catch (err) {
    console.error("❌ Failed to create quiz:", err);
  }
};

getFootballstandings();
