import "./index.css";

console.log("Hello, world!");

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load and decode the ticking sound
const loadTickingSound = async () => {
  const response = await fetch("/audio/klok.mp3");
  if (response.ok) {
    console.log("Fetching audio: Success");
  } else {
    console.log("Fetching audio failed: ", response.statusText);
  }
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  console.log("Audio loaded and decoded:", audioBuffer);
  return audioBuffer;
};

// Load and decode the buzzer sound
const loadBuzzerSound = async () => {
  const response = await fetch("/audio/buzzer.mp3");
  if (response.ok) {
    console.log("Fetching buzzer audio: Success");
  } else {
    console.log("Fetching buzzer audio failed: ", response.statusText);
  }
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  console.log("Buzzer audio loaded and decoded:", audioBuffer);
  return audioBuffer;
};

// Initialize the ticking sound
const initializeSounds = async () => {
  const tickingSound = await loadTickingSound();
  startTicking(tickingSound);
};

// Start playing the ticking sound in a loop
let tickingSource;
const startTicking = (tickingSound) => {
  console.log("Starting ticking sound...");
  tickingSource = audioContext.createBufferSource();
  tickingSource.buffer = tickingSound;
  tickingSource.loop = true;
  tickingSource.connect(audioContext.destination);
  tickingSource.start();
};

// Ensure the audio context is resumed after user interaction
document.addEventListener("click", () => {
  // Resume the audio context when the user clicks anywhere
  if (audioContext.state === "suspended") {
    audioContext.resume().then(() => {
      console.log("AudioContext resumed after user interaction");

      // Check if the 'startAudio' flag is set
      if (window.startAudio) {
        initializeSounds(); // Start the ticking sound
      }
    });
  }
});

// Timer functionality
let timeLeft = 30; // Time in seconds
const timerDisplay = document.getElementById("timer"); // This will be the element that displays the timer
let buzzerSound;

// Load buzzer sound
const loadSounds = async () => {
  buzzerSound = await loadBuzzerSound();
};

// Play buzzer sound
const playBuzzer = () => {
  const buzzerSource = audioContext.createBufferSource();
  buzzerSource.buffer = buzzerSound;
  buzzerSource.connect(audioContext.destination);
  buzzerSource.start();
};

// Stop the ticking sound when the buzzer plays
const stopTicking = () => {
  if (tickingSource) {
    tickingSource.stop();
  }
};

// Start the timer
const startTimer = () => {
  const timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval); // Stop the timer when it reaches 0
      stopTicking(); // Stop the ticking sound when the buzzer rings
      playBuzzer(); // Play the buzzer sound when the timer finishes
      alert("Time's up!");
    } else {
      timerDisplay.textContent = `Time remaining: ${timeLeft} seconds`;
      timeLeft--;
    }
  }, 1000);
};

// Start audio with a button click
const startButton = document.getElementById("startButton");

if (startButton) {
  startButton.addEventListener("click", () => {
    if (audioContext.state === "suspended") {
      audioContext.resume().then(() => {
        console.log("AudioContext resumed after button click");
        initializeSounds(); // Start the ticking sound
        startTimer(); // Start the timer when button is clicked
      });
    }
  });
}

// Display timer on page
console.log("Hello, world!");

// Check if the 'startAudio' flag is set on page load
document.addEventListener("DOMContentLoaded", () => {
  // Check if the 'startAudio' flag is set
  if (window.startAudio) {
    initializeSounds(); // This will start the ticking sound
  }

  // Load buzzer sound when the page is ready
  loadSounds();
});
