import "dotenv/config";
import { App } from "@tinyhttp/app";
import { logger } from "@tinyhttp/logger";
import { Liquid } from "liquidjs";
import sirv from "sirv";

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

// app.get("/", async (req, res) => {
//   const key = process.env.API_KEY;
//   const baseUrl = process.env.BASE_URL;
//   const leagueIds = [39, 140, 135, 78, 61];

//   const endPoint = new URL("standings?league=39&season=2023", baseUrl);

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
//   console.log(json);
//   const standings = json.response?.[0]?.league?.standings?.[0] || [];

//   return res.send(
//     renderTemplate("server/views/index.liquid", {
//       title: "Standings",
//       items: standings,
//     })
//   );
// });

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
  if (json.errors && Object.keys(json.errors).length) {
    console.log("Fout met de API", json.errors);
    return res.status(500).send("API error");
  }

  const leagueName = json.response?.[0]?.league?.name || `League ${id}`;
  const standings = json.response?.[0]?.league?.standings?.[0] || [];

  return res.send(
    renderTemplate("server/views/competitions.liquid", {
      title: leagueName,
      items: standings,
    })
  );
});

app.get("/plant/:id/", async (req, res) => {
  const id = req.params.id;
  const item = data[id];
  if (!item) {
    return res.status(404).send("Not found");
  }
  return res.send(
    renderTemplate("server/views/detail.liquid", {
      title: `Detail page for ${id}`,
      item,
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
