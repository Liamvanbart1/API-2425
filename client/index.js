import "./index.css";

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let tickingSoundBuffer = null;
let tickingSource = null;
let buzzerSound = null;
let timerInterval = null;
let timeLeft = 60;
let currentQuestion = 0;

const timerDisplay = document.getElementById("timer");
const progressBar = document.querySelector(".progress-bar");
const startButton = document.getElementById("startButton");
const quizForm = document.getElementById("quiz-form");
const userNameInput = document.getElementById("userName");
const nextButton = document.getElementById("nextButton");
const submitButton = document.querySelector('button[type="submit"]');
const quizQuestions = document.getElementById("quiz-questions");
const questions = document.querySelectorAll(".quiz-question");

if (quizForm) {
  quizForm.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
}

if (userNameInput && startButton) {
  startButton.disabled = true;
  userNameInput.addEventListener("input", () => {
    startButton.disabled = userNameInput.value.trim() === "";
  });
}

const loadAudio = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
};

const initializeAudio = async () => {
  if (!tickingSoundBuffer)
    tickingSoundBuffer = await loadAudio("/audio/klok.mp3");
  if (!buzzerSound) buzzerSound = await loadAudio("/audio/buzzer.mp3");
  startTicking();
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

const playBuzzer = async () => {
  if (!buzzerSound) buzzerSound = await loadAudio("/audio/buzzer.mp3");
  if (audioContext.state === "suspended") await audioContext.resume();
  const source = audioContext.createBufferSource();
  source.buffer = buzzerSound;
  source.connect(audioContext.destination);
  source.start();
};

const startTimer = () => {
  const totalTime = timeLeft;
  timerInterval = setInterval(async () => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      stopTicking();
      await playBuzzer();
      alert("Time's up! Submitting your quiz...");
      setTimeout(() => quizForm?.submit(), 1000);
      return;
    }

    if (timerDisplay) {
      timerDisplay.textContent = `Time remaining: ${timeLeft} seconds`;
    }

    if (progressBar) {
      const percent = (timeLeft / totalTime) * 100;
      progressBar.style.width = `${percent}%`;
      progressBar.style.backgroundColor =
        percent > 50 ? "#4CAF50" : percent > 20 ? "#FFEB3B" : "#F44336";
    }

    timeLeft--;
  }, 1000);
};

// Question Navigation
const showQuestion = (index) => {
  questions.forEach((question) => question.classList.remove("show"));
  if (questions[index]) questions[index].classList.add("show");

  if (index < questions.length - 1 && nextButton) {
    nextButton.style.display = "inline-block";
  } else {
    nextButton.style.display = "none";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  if (startButton) {
    startButton.addEventListener("click", async () => {
      if (audioContext.state === "suspended") await audioContext.resume();
      await initializeAudio();
      startTimer();
      startButton.style.display = "none";
      quizQuestions.classList.remove("hidden");
      showQuestion(currentQuestion);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (currentQuestion < questions.length) {
        questions[currentQuestion].classList.remove("show");
        currentQuestion++;
        showQuestion(currentQuestion);
      }
      if (currentQuestion === questions.length - 1 && submitButton) {
        submitButton.style.display = "inline-block";
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const resultHeaders = document.querySelectorAll(".result-header");
  const toggleAllButton = document.querySelector(".toggle-all button");
  if (resultHeaders.length > 0) {
    resultHeaders.forEach((header) => {
      header.addEventListener("click", (e) => {
        const details = e.currentTarget.nextElementSibling;
        details.classList.toggle("visible");
      });
    });
  }
  if (toggleAllButton) {
    toggleAllButton.addEventListener("click", () => {
      const details = document.querySelectorAll(".answer-details");
      const allVisible = Array.from(details).every((d) =>
        d.classList.contains("visible")
      );

      details.forEach((d) => {
        allVisible ? d.classList.remove("visible") : d.classList.add("visible");
      });

      toggleAllButton.textContent = allVisible
        ? "Show All Answers"
        : "Hide All Answers";
    });
  }
});
