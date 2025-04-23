import "dotenv/config";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import { Liquid } from "liquidjs";
import path from "path";
import sirv from "sirv";
import { readFile } from "fs/promises";

const engine = new Liquid({
  extname: ".liquid",
});

const app = new App();

app
  .use(logger())
  .use("/", sirv("dist"))
  .listen(3000, () => console.log("Server available on http://localhost:3000"));

app.get("/", async (req, res) => {
  const leagues = [
    { id: 39, name: "Premier League" },
    { id: 140, name: "La Liga" },
    { id: 135, name: "Serie A" },
    { id: 78, name: "Bundesliga" },
    { id: 61, name: "Ligue 1" },
  ];

  return res.send(
    renderTemplate("server/views/index.liquid", {
      title: "Competitions",
      leagues,
    })
  );
});

// app.get("/competitions/:id", async (req, res) => {
//   const id = req.params.id;
//   const key = process.env.API_KEY;
//   const baseUrl = process.env.BASE_URL;

//   const endPoint = new URL(`standings?league=${id}&season=2023`, baseUrl);

//   const response = await fetch(`${endPoint.href}`, {
//     method: "GET",
//     headers: {
//       "x-apisports-key": key,
//       "x-rapidapi-host": "v3.football.api-sports.io",
//     },
//   });

//   const json = await response.json();
//   if (json.errors.length) {
//     console.log("fout met de api", json.errors);
//   }

//   const leagueName = json.response?.[0]?.league?.name || `League ${id}`;
//   const standings = json.response?.[0]?.league?.standings?.[0] || [];

//   const tableSummary = standings
//     .slice(0, 20)
//     .map(
//       (team, i) =>
//         `${i + 1}. ${team.team.name} (${team.points} pts, ${
//           team.all.played
//         } games)`
//     )
//     .join("\n");

//   // chatgpt stukje
//   const openai = new OpenAI({
//     apiKey: process.env.OPEN_AI_KEY,
//   });

//   const prompt = `
// You are a quiz generator. Create 5 multiple-choice questions based on the following football league standings.

// Each question must:
// - Be based on rank, points, wins, or games played.
// - Have 3 choices (A, B, C).
// - Indicate the correct answer by setting its value to {"text": "...", "correct": true}, and the others to {"text": "...", "correct": false}.

// Return the output as a valid JSON array of objects in the following format:

// [
//   {
//     "question": "Question text?",
//     "choices": [
//       { "id": 1, "text": "Choice A", "correct": false },
//       { "id": 2, "text": "Choice B", "correct": true },
//       { "id": 3, "text": "Choice C", "correct": false }
//     ]
//   },
//   ...
// ]

// the ids should count up so the second question the id's should be 4, 5, 6
// Here is the table:

// ${tableSummary}
//   `;

//   let quizQuestions = [];

//   try {
//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: prompt }],
//     });

//     const raw = completion.choices[0].message.content;
//     console.log("📝 Raw GPT response:", raw);

//     quizQuestions = JSON.parse(raw);
//     console.log(quizQuestions);
//   } catch (err) {
//     console.error("❌ Failed to create quiz:", err);
//   }

//   return res.send(
//     renderTemplate("server/views/competitions.liquid", {
//       title: leagueName,
//       items: standings,
//       questions: quizQuestions,
//     })
//   );
// });

app.get("/competitions/:id", async (req, res) => {
  const id = req.params.id;

  const filePath = path.resolve(
    "server/components/questions/json",
    `questions${id}.json`
  );

  let quizQuestions = [];
  try {
    const fileData = await readFile(filePath, "utf-8");
    quizQuestions = JSON.parse(fileData);
  } catch (err) {
    console.error("❌ Failed to read quiz questions:", err);
    return res.status(500).send("Failed to load quiz questions.");
  }

  return res.send(
    renderTemplate("server/views/competitions.liquid", {
      title: `Competition ${id}`,
      questions: quizQuestions,
    })
  );
});

const renderTemplate = (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || "production",
    ...data,
  };

  return engine.renderFileSync(template, templateData);
};
