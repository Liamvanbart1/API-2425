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
  dir: "server/data/scores",
});

await storage.clear();

const engine = new Liquid({
  extname: ".liquid",
});

const app = new App();

app
  .use(logger())
  .use("/", sirv("dist"))
  .use(sirv("client/public"))
  .use(urlencoded())
  .listen(3000, () =>
    console.log("Server available on http://localhost:3000 ga rammen dannnn")
  );

app.get("/", async (req, res) => {
  const leagues = [
    {
      id: 39,
      name: "Premier League",
      description:
        "England’s top-tier football league, known for its fast-paced and physical play.",
      funFact:
        "The Premier League is the most-watched football league in the world, broadcast in 212 territories to 643 million homes.",
    },
    {
      id: 140,
      name: "La Liga",
      description:
        "Spain’s premier football competition, famous for its technical style and legendary clubs.",
      funFact:
        "La Liga has produced the most Ballon d'Or winners in the 21st century, thanks to stars like Messi and Ronaldo.",
    },
    {
      id: 135,
      name: "Serie A",
      description:
        "Italy’s top division, celebrated for its tactical depth and historic football clubs.",
      funFact:
        "Serie A has the most UEFA Champions League finalists among Italian clubs, with AC Milan leading the pack.",
    },
    {
      id: 78,
      name: "Bundesliga",
      description:
        "Germany’s top league, renowned for its attacking football and passionate fan culture.",
      funFact:
        "The Bundesliga has the highest average attendance of any football league in the world.",
    },
    {
      id: 61,
      name: "Ligue 1",
      description:
        "France’s top professional league, known for producing world-class young talent.",
      funFact:
        "Ligue 1 is the starting point for many global stars, including Thierry Henry, Eden Hazard, and Kylian Mbappé.",
    },
  ];

  const keys = await storage.keys();
  const scores = [];

  for (const key of keys) {
    const data = await storage.getItem(key);
    if (data?.score !== undefined) {
      scores.push({ userId: key, ...data });
    }
  }

  const sortedScores = scores.sort((a, b) => b.score - a.score);
  const topScores = sortedScores.slice(0, 5);

  return res.send(
    renderTemplate("server/views/index.liquid", {
      title: "The Big Football Quiz",
      leagues,
      topScores,
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
  // console.log(selectedQuestions); dit was voor debugging

  return res.send(
    renderTemplate("server/views/competitions.liquid", {
      title: league.name,
      competitionId: id,
      questions: selectedQuestions,
      startAudio: true,
    })
  );
});

app.post("/submit-quiz/:id", async (req, res) => {
  const competitionId = req.params.id;
  const { userId, ...userAnswers } = req.body;

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

  await storage.setItem(userId, {
    score,
    total: correctAnswers.length,
    date: new Date().toISOString(),
  });

  return res.send(
    renderTemplate("server/views/result.liquid", {
      score,
      total: correctAnswers.length,
      results,
      userId,
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
