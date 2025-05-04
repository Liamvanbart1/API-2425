import "./index.css";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let tickingSoundBuffer = null;
let tickingSource = null;
let buzzerSound = null;
let timerInterval = null;
let timeLeft = 30;

const timerDisplay = document.getElementById("timer");
const progressBar = document.querySelector(".progress-bar");
const startButton = document.getElementById("startButton");
const quizForm = document.getElementById("quiz-form");

const loadTickingSound = async () => {
  const response = await fetch("/audio/klok.mp3");
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
};

const loadBuzzerSound = async () => {
  const response = await fetch("/audio/buzzer.mp3");
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
};

const startTicking = () => {
  if (tickingSource) return;

  tickingSource = audioContext.createBufferSource();
  tickingSource.buffer = tickingSoundBuffer;
  tickingSource.loop = true;
  tickingSource.connect(audioContext.destination);
  tickingSource.start();
};

const stopTicking = () => {
  if (tickingSource) {
    tickingSource.stop();
    tickingSource.disconnect();
    tickingSource = null;
  }
};

const playBuzzer = () => {
  const buzzerSource = audioContext.createBufferSource();
  buzzerSource.buffer = buzzerSound;
  buzzerSource.connect(audioContext.destination);
  buzzerSource.start();
};

const initializeAudio = async () => {
  if (!tickingSoundBuffer) {
    tickingSoundBuffer = await loadTickingSound();
  }
  startTicking();
};

const startTimer = () => {
  const totalTime = timeLeft;

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      stopTicking();
      playBuzzer();
      alert("Time's up! Submitting your quiz...");
      if (quizForm) quizForm.submit();
      return;
    }

    if (timerDisplay) {
      timerDisplay.textContent = `Time remaining: ${timeLeft} seconds`;
    }

    if (progressBar) {
      const percent = (timeLeft / totalTime) * 100;
      progressBar.style.width = percent + "%";

      if (percent > 50) {
        progressBar.style.backgroundColor = "#4CAF50";
      } else if (percent > 20) {
        progressBar.style.backgroundColor = "#FFEB3B";
      } else {
        progressBar.style.backgroundColor = "#F44336";
      }
    }

    timeLeft--;
  }, 1000);
};

document.addEventListener("DOMContentLoaded", async () => {
  buzzerSound = await loadBuzzerSound();
  if (startButton) {
    startButton.addEventListener("click", async () => {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      await initializeAudio();
      startTimer();
      startButton.style.display = "none";
    });
  }
});
