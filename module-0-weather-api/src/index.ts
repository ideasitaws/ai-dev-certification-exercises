import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

const CONDITIONS = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Stormy", "Snowy", "Foggy", "Windy"];

const CONDITION_EMOJI: Record<string, string> = {
  Sunny: "☀️",
  "Partly Cloudy": "⛅",
  Cloudy: "☁️",
  Rainy: "🌧️",
  Stormy: "⛈️",
  Snowy: "❄️",
  Foggy: "🌫️",
  Windy: "💨",
};

const DASHBOARD_CITIES = ["London", "Tokyo", "New York", "Sydney", "Paris"];

function hashCity(city: string): number {
  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = (hash * 31 + city.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Returns a stable pseudo-random float in [0, 1) given a seed and offset
function seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function getMockWeather(city: string) {
  const seed = hashCity(city.toLowerCase());
  return {
    city,
    temperature: Math.round(seededRandom(seed, 1) * 50 - 10),
    unit: "celsius",
    condition: CONDITIONS[Math.floor(seededRandom(seed, 2) * CONDITIONS.length)],
    humidity: Math.round(seededRandom(seed, 3) * 60 + 30),
  };
}

function getMockForecast(city: string) {
  const seed = hashCity(city.toLowerCase());
  const today = new Date();

  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i + 1);
    const o = i * 10;
    return {
      date: date.toISOString().split("T")[0],
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
      temperature: Math.round(seededRandom(seed, o + 1) * 50 - 10),
      unit: "celsius",
      condition: CONDITIONS[Math.floor(seededRandom(seed, o + 2) * CONDITIONS.length)],
      humidity: Math.round(seededRandom(seed, o + 3) * 60 + 30),
    };
  });
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/weather/:city", (req, res) => {
  res.json(getMockWeather(req.params.city));
});

app.get("/forecast/:city", (req, res) => {
  res.json(getMockForecast(req.params.city));
});

function buildDashboard(): string {
  const cards = DASHBOARD_CITIES.map((city) => {
    const w = getMockWeather(city);
    const emoji = CONDITION_EMOJI[w.condition] ?? "🌡️";
    const tempColor = w.temperature <= 0 ? "#60a5fa" : w.temperature >= 30 ? "#f97316" : "#34d399";
    return `
      <div class="card">
        <div class="emoji">${emoji}</div>
        <h2 class="city">${w.city}</h2>
        <div class="temp" style="color:${tempColor}">${w.temperature}°C</div>
        <div class="condition">${w.condition}</div>
        <div class="meta">
          <span class="badge">💧 ${w.humidity}%</span>
        </div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weather Dashboard</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #e2e8f0;
      padding: 2rem 1rem;
    }

    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    header h1 {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #818cf8, #c084fc, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    header p {
      margin-top: 0.4rem;
      color: #94a3b8;
      font-size: 0.95rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      max-width: 1100px;
      margin: 0 auto;
    }

    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.25rem;
      padding: 1.75rem 1.5rem;
      text-align: center;
      backdrop-filter: blur(12px);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      cursor: default;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      border-color: rgba(129, 140, 248, 0.4);
    }

    .emoji {
      font-size: 3rem;
      line-height: 1;
      margin-bottom: 0.75rem;
    }

    .city {
      font-size: 1.1rem;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 0.6rem;
      letter-spacing: 0.3px;
    }

    .temp {
      font-size: 2.4rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 0.4rem;
    }

    .condition {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .meta {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .badge {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      padding: 0.25rem 0.75rem;
      font-size: 0.8rem;
      color: #cbd5e1;
    }

    footer {
      text-align: center;
      margin-top: 2.5rem;
      color: #475569;
      font-size: 0.8rem;
    }

    footer a {
      color: #6366f1;
      text-decoration: none;
    }

    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <h1>🌍 Weather Dashboard</h1>
    <p>Live conditions across major cities</p>
  </header>
  <div class="grid">
    ${cards}
  </div>
  <footer>
    <p>Data refreshes on each request &nbsp;·&nbsp; <a href="/health">/health</a> &nbsp;·&nbsp; <a href="/weather/London">/weather/:city</a> &nbsp;·&nbsp; <a href="/forecast/London">/forecast/:city</a></p>
  </footer>
</body>
</html>`;
}

app.get("/", (_req, res) => {
  res.send(buildDashboard());
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
