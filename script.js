const models = {
  terraH: {
    name: "ORBEA TERRA H",
    url: "https://daa.activetrail.biz/orbea-terra-2026",
    image: "assets/bikes/terra-h-result-v2.jpg?v=1",
    text: "אתם אנשים שאוהבים לנסות דברים חדשים. ORBEA Terra אלומיניום הם אופני הכניסה המושלמים לעולם הגראבל.",
    gallery: [
      "assets/bikes/terra/front-3.jpg",
      "assets/bikes/terra/front.jpg",
      "assets/bikes/terra/front-2.jpg",
    ],
  },
  terraM: {
    name: "ORBEA TERRA M",
    url: "https://daa.activetrail.biz/orbea-terra-2026",
    image: "assets/bikes/terra/result-v2.jpg?v=3",
    text: "אתם אנשים שאוהבים לחקור, לצאת למסעות ולבחור בכל פעם דרך אחרת.",
    gallery: [
      "assets/bikes/terra/front-2.jpg",
      "assets/bikes/terra/front-3.jpg",
      "assets/bikes/terra/front.jpg",
    ],
  },
  race: {
    name: "ORBEA TERRA RACE",
    url: "https://daa.activetrail.biz/orbea-terra-race-2026",
    image: "assets/bikes/terra-race/result-v2.jpg?v=3",
    text: "אתם אנשים של קצב גבוה, ביצועים ורכיבה מדויקת וחדה.",
    gallery: [
      "assets/bikes/terra-race/front.jpg",
      "assets/bikes/terra-race/front-2.jpg",
      "assets/bikes/terra-race/front-3.jpg",
    ],
  },
  denna: {
    name: "ORBEA DENNA",
    url: "https://daa.activetrail.biz/ORBEA-Denna",
    image: "assets/bikes/denna/result-v2.jpg?v=3",
    text: "אתם אנשים של כיף, הרפתקאות ורכיבות ארוכות עם קצת יותר כוח להמשיך.",
    gallery: [
      "assets/bikes/denna/front.jpg",
      "assets/bikes/denna/front-2.jpg",
      "assets/bikes/denna/front.jpg",
    ],
  },
};

const weights = {
  experience: {
    new: { terraH: 4 },
    some: { terraH: 1, terraM: 3 },
    life: { terraM: 3, race: 1 },
  },
  style: {
    fun: { terraH: 3, denna: 1 },
    trail: { terraM: 3, denna: 1 },
    competitive: { race: 5 },
  },
  priority: {
    speed: { race: 5 },
    comfort: { terraH: 2, terraM: 2, denna: 2 },
    confidence: { terraH: 2, denna: 2, terraM: 1 },
  },
  rides: {
    short_fast: { race: 4 },
    long: { terraM: 3, denna: 2 },
    unknown: { terraM: 3, denna: 1 },
  },
  electric: {
    no: { terraH: 1, terraM: 1, race: 1, denna: -6 },
    open: { denna: 2, terraM: 1 },
    yes: { denna: 10 },
  },
};

const quizForm = document.querySelector("#quizForm");
const overlay = document.querySelector("#resultOverlay");
const scanGrid = document.querySelector("#scanGrid");
const resultCard = document.querySelector("#resultCard");
const resultImage = document.querySelector("#resultImage");
const resultName = document.querySelector("#resultName");
const resultText = document.querySelector("#resultText");
const resultLink = document.querySelector("#resultLink");
const resultField = document.querySelector("#resultField");
const tryAgain = document.querySelector("#tryAgain");

const scanImages = Object.entries(models).flatMap(([key, model]) =>
  model.gallery.map((src) => ({ key, src, alt: model.name }))
).slice(0, 9);

function buildScanGrid() {
  scanGrid.innerHTML = "";
  scanImages.forEach((item) => {
    const tile = document.createElement("div");
    tile.className = "scan-tile";
    tile.dataset.model = item.key;

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt;
    tile.append(image);
    scanGrid.append(tile);
  });
}

function preloadResultImages() {
  Object.values(models).forEach((model) => {
    const image = new Image();
    image.src = model.image;
  });
}

function calculateResult(formData) {
  const scores = { terraH: 0, terraM: 0, race: 0, denna: 0 };

  if (formData.get("electric") === "yes") {
    return "denna";
  }

  if (formData.get("experience") === "new") {
    return "terraH";
  }

  for (const [question, answer] of formData.entries()) {
    const answerWeights = weights[question]?.[answer] || {};
    for (const [model, score] of Object.entries(answerWeights)) {
      scores[model] += score;
    }
  }

  if (
    formData.get("electric") === "open" &&
    (formData.get("rides") === "long" || formData.get("rides") === "unknown")
  ) {
    scores.denna += 2;
  }

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function showResult(modelKey) {
  const model = models[modelKey];
  resultCard.dataset.model = modelKey;
  resultImage.src = model.image;
  resultImage.alt = model.name;
  resultName.querySelector("span").textContent = model.name.replace("ORBEA ", "");
  resultText.textContent = model.text;
  resultLink.href = model.url;

  scanGrid.classList.add("hidden");
  resultCard.classList.add("visible");
}

function runScanAnimation(modelKey) {
  const tiles = [...document.querySelectorAll(".scan-tile")];
  let index = 0;
  let loops = 0;

  tiles.forEach((tile) => tile.classList.remove("active"));
  scanGrid.classList.remove("hidden");
  resultCard.classList.remove("visible");

  const interval = window.setInterval(() => {
    tiles.forEach((tile) => tile.classList.remove("active"));
    tiles[index % tiles.length].classList.add("active");
    index += 1;
    loops += 1;

    if (loops > 22) {
      const winningTile = tiles.find((tile) => tile.dataset.model === modelKey);
      tiles.forEach((tile) => tile.classList.remove("active"));
      winningTile?.classList.add("active");
      window.clearInterval(interval);
      window.setTimeout(() => showResult(modelKey), 520);
    }
  }, 86);
}

function submitAnonymousResult(formData, result) {
  const payload = new URLSearchParams();
  payload.set("form-name", "orbea-gravel-results");
  payload.set("result", models[result].name);

  for (const [key, value] of formData.entries()) {
    payload.set(key, value);
  }

  window.fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  }).catch((error) => {
    console.warn("Could not submit anonymous quiz result", error);
  });
}

quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(quizForm);
  const result = calculateResult(formData);
  resultField.value = models[result].name;

  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  runScanAnimation(result);
  submitAnonymousResult(formData, result);
});

tryAgain.addEventListener("click", () => {
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  scanGrid.classList.remove("hidden");
  resultCard.classList.remove("visible");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && overlay.classList.contains("active")) {
    tryAgain.click();
  }
});

buildScanGrid();
preloadResultImages();
