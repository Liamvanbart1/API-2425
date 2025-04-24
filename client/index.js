import "./index.css";
import "../server/views/competitions.css";
import "../server/views/results.css";

const competitionDiv = document.querySelector(".competitions");
const button = document.getElementById("toggleButton");

button.addEventListener("click", () => {
  competitionDiv.classList.toggle("open");
});

console.log("Hello, world!");
