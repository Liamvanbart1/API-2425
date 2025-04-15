import "dotenv/config";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import { Liquid } from "liquidjs";
import sirv from "sirv";
import OpenAI from "openai";

const data = {
  beemdkroon: {
    id: "beemdkroon",
    name: "Beemdkroon",
    image: {
      src: "https://i.pinimg.com/736x/09/0a/9c/090a9c238e1c290bb580a4ebe265134d.jpg",
      alt: "Beemdkroon",
      width: 695,
      height: 1080,
    },
  },
  "wilde-peen": {
    id: "wilde-peen",
    name: "Wilde Peen",
    image: {
      src: "https://mens-en-gezondheid.infonu.nl/artikel-fotos/tom008/4251914036.jpg",
      alt: "Wilde Peen",
      width: 418,
      height: 600,
    },
  },
};

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

//   console.log(tableSummary);

//   return res.send(
//     renderTemplate("server/views/competitions.liquid", {
//       title: leagueName,
//       items: standings,
//     })
//   );
// });

app.get("/competitions/:id", async (req, res) => {
  const id = req.params.id;
  const key = process.env.API_KEY;
  const baseUrl = process.env.BASE_URL;

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

  const leagueName = json.response?.[0]?.league?.name || `League ${id}`;
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

  // chatgpt stukje
  const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
  });

  const prompt = `
You are a quiz generator. Create 5 multiple-choice questions based on the following football league standings.

Each question must:
- Be based on rank, points, wins, or games played.
- Have 3 choices (A, B, C).
- Indicate the correct answer by setting its value to {"text": "...", "correct": true}, and the others to {"text": "...", "correct": false}.

Return the output as a valid JSON array of objects in the following format:

[
  {
    "question": "Question text?",
    "choices": {
      "A": { "text": "Choice A", "correct": false },
      "B": { "text": "Choice B", "correct": true },
      "C": { "text": "Choice C", "correct": false }
    }
  },
  ...
]

Here is the table:
${tableSummary}
  `;

  let quizQuestions = [];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;
    console.log("📝 Raw GPT response:", raw);
    console.log(quizQuestions);

    quizQuestions = JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to create quiz:", err);
  }

  return res.send(
    renderTemplate("server/views/competitions.liquid", {
      title: leagueName,
      items: standings,
      quiz: quizQuestions,
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
