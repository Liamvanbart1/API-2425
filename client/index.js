import "./index.css";

const competitionDiv = document.querySelector(".competitions");
const button = document.getElementById("toggleButton");

button.addEventListener("click", () => {
  competitionDiv.classList.toggle("open");
});

console.log("Hello, world!");
