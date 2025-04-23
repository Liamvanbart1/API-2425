import "dotenv/config";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import { Liquid } from "liquidjs";
import path from "path";
import sirv from "sirv";
import { readFile } from "fs/promises";
import storage from "node-persist";
import { json, urlencoded } from "milliparsec";

await storage.init({
  dir: "server/storage",
});

const engine = new Liquid({
  extname: ".liquid",
});

const app = new App();

app
  .use(logger())
  .use("/", sirv("dist"))
  .use(urlencoded())
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

  const leagues = [
    { id: 39, name: "Premier League" },
    { id: 140, name: "La Liga" },
    { id: 135, name: "Serie A" },
    { id: 78, name: "Bundesliga" },
    { id: 61, name: "Ligue 1" },
  ];

  const league = leagues.find((league) => league.id === parseInt(id));

  if (!league) {
    return res.status(404).send("Competition not found.");
  }

  const shuffledQuestions = quizQuestions.sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffledQuestions.slice(0, 10);
  console.log(selectedQuestions);

  return res.send(
    renderTemplate("server/views/competitions.liquid", {
      title: league.name,
      competitionId: id,
      questions: selectedQuestions,
    })
  );
});

app.post("/submit-quiz/:id", async (req, res) => {
  const competitionId = req.params.id;
  const userAnswers = req.body;

  const filePath = path.resolve(
    "server/components/questions/json",
    `questions${competitionId}.json`
  );

  let correctAnswers = [];

  try {
    const fileData = await readFile(filePath, "utf-8");
    correctAnswers = JSON.parse(fileData);
  } catch (err) {
    console.error("❌ Error reading quiz file:", err);
    return res.status(500).send("Failed to load quiz.");
  }

  let score = 0;
  const results = [];

  for (const question of correctAnswers) {
    const qId = "question" + question.questionID;
    const userAnswer = userAnswers[qId];
    const correctChoice = question.choices.find((c) => c.correct);

    const isCorrect = correctChoice?.text === userAnswer;
    if (isCorrect) score++;

    results.push({
      question: question.question,
      userAnswer,
      correctAnswer: correctChoice?.text,
      isCorrect,
    });
  }

  return res.send(
    renderTemplate("server/views/result.liquid", {
      score,
      total: correctAnswers.length,
      results,
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
