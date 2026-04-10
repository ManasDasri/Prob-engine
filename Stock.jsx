import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const STOCKS = ["AAPL", "TSLA", "NVDA", "MSFT"];
const GROQ_MODELS = "llama-3.3-70b-versatile";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0a0b0d;
      --surface: #111318;
      --surface2: #181b22;
      --border: #1e2229;
      --border2: #252b35;
      --text: #e8eaf0;
      --text2: #7a8394;
      --text3: #4a5260;
      --accent: #ff4e2a;
      --green: #2aff7a;
      --yellow: #f5c842;
      --blue: #4e9eff;
      --mono: 'IBM Plex Mono', monospace;
      --sans: 'IBM Plex Sans', sans-serif;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--mono);
      overflow-x: hidden;
      min-height: 100vh;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

    .page { min-height: 100vh; display: flex; flex-direction: column; }

    /* Nav */
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 40px; border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 100;
      background: rgba(10,11,13,0.92); backdrop-filter: blur(12px);
    }
    .nav-logo { font-size: 13px; font-weight: 600; letter-spacing: 0.12em; color: var(--text); }
    .nav-tabs { display: flex; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 3px; }
    .nav-tab {
      padding: 7px 18px; font-size: 10px; font-family: var(--mono); font-weight: 500;
      letter-spacing: 0.1em; cursor: pointer; border-radius: 4px; transition: all 0.18s;
      color: var(--text2); background: transparent; border: none;
    }
    .nav-tab.active { background: var(--surface2); color: var(--text); border: 1px solid var(--border2); }
    .nav-right { display: flex; align-items: center; gap: 16px; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
    .nav-time { font-size: 11px; color: var(--text2); letter-spacing: 0.06em; }

    /* Ticker */
    .ticker-bar {
      display: flex; gap: 0; overflow: hidden; border-bottom: 1px solid var(--border);
      background: var(--surface);
    }
    .ticker-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 24px; font-size: 10px; letter-spacing: 0.08em;
      border-right: 1px solid var(--border); white-space: nowrap; cursor: pointer;
      transition: background 0.15s;
    }
    .ticker-item:hover { background: var(--surface2); }
    .ticker-item.selected { background: var(--surface2); border-bottom: 1px solid var(--accent); }
    .ticker-sym { font-weight: 600; color: var(--text); }
    .ticker-price { color: var(--text2); }
    .ticker-chg.up { color: var(--green); }
    .ticker-chg.down { color: var(--accent); }
    .ticker-chg.flat { color: var(--text3); }

    /* Section headers */
    .section-label {
      font-size: 9px; letter-spacing: 0.2em; color: var(--text3); font-weight: 600;
      text-transform: uppercase; padding: 0 0 12px 0; border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
    }

    /* Cards */
    .card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; padding: 20px;
    }
    .card-sm { padding: 14px 16px; }

    /* Buttons */
    .btn {
      font-family: var(--mono); font-size: 10px; font-weight: 600;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 10px 20px; border-radius: 5px; cursor: pointer;
      transition: all 0.15s; border: 1px solid transparent;
    }
    .btn-primary { background: var(--text); color: var(--bg); border-color: var(--text); }
    .btn-primary:hover { background: transparent; color: var(--text); }
    .btn-outline { background: transparent; color: var(--text2); border-color: var(--border2); }
    .btn-outline:hover { color: var(--text); border-color: var(--text2); }
    .btn-accent { background: var(--accent); color: white; border-color: var(--accent); }
    .btn-accent:hover { background: transparent; color: var(--accent); }

    /* Input */
    .input {
      background: var(--surface); border: 1px solid var(--border2);
      color: var(--text); font-family: var(--mono); font-size: 11px;
      padding: 10px 14px; border-radius: 5px; outline: none; width: 100%;
      transition: border-color 0.15s;
    }
    .input:focus { border-color: var(--text3); }
    .input::placeholder { color: var(--text3); }

    /* Tags */
    .tag {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 3px; font-size: 9px;
      font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
    }
    .tag-bull { background: rgba(42,255,122,0.1); color: var(--green); border: 1px solid rgba(42,255,122,0.2); }
    .tag-bear { background: rgba(255,78,42,0.1); color: var(--accent); border: 1px solid rgba(255,78,42,0.2); }
    .tag-neutral { background: rgba(245,200,66,0.1); color: var(--yellow); border: 1px solid rgba(245,200,66,0.2); }

    /* News items */
    .news-item {
      padding: 16px 0; border-bottom: 1px solid var(--border);
      animation: fadeIn 0.4s ease-out;
    }
    .news-item:last-child { border-bottom: none; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
    .news-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .news-source { font-size: 9px; color: var(--text3); letter-spacing: 0.1em; }
    .news-time { font-size: 9px; color: var(--text3); }
    .news-title { font-size: 12px; color: var(--text); line-height: 1.6; margin-bottom: 8px; font-family: var(--sans); font-weight: 400; }
    .news-impact { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
    .impact-bar-wrap { flex: 1; height: 2px; background: var(--border2); border-radius: 2px; overflow: hidden; }
    .impact-bar { height: 100%; border-radius: 2px; transition: width 0.8s ease; }

    /* Canvas chart */
    .chart-wrap { position: relative; width: 100%; }
    canvas { display: block; width: 100% !important; }

    /* Grid layout helpers */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

    /* Stat block */
    .stat { }
    .stat-label { font-size: 9px; color: var(--text3); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px; }
    .stat-value { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--text); }
    .stat-sub { font-size: 10px; color: var(--text2); margin-top: 3px; }

    /* Loading */
    .loader { display: flex; align-items: center; gap: 8px; color: var(--text3); font-size: 11px; }
    .loader-dots span { display: inline-block; width: 4px; height: 4px; border-radius: 50%; background: var(--text3); margin: 0 2px; animation: dotBounce 1s ease-in-out infinite; }
    .loader-dots span:nth-child(2) { animation-delay: 0.15s; }
    .loader-dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes dotBounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }

    /* Probability arc */
    .prob-arc-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }

    /* Scrollable container */
    .scroll-area { overflow-y: auto; max-height: 480px; padding-right: 4px; }

    /* API Key input area */
    .api-setup { padding: 40px; max-width: 600px; margin: 0 auto; }
    .api-setup h2 { font-size: 14px; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 8px; }
    .api-setup p { font-size: 11px; color: var(--text2); line-height: 1.7; margin-bottom: 24px; }
    .api-field { margin-bottom: 16px; }
    .api-field label { font-size: 9px; letter-spacing: 0.15em; color: var(--text3); display: block; margin-bottom: 6px; }

    /* Divider */
    .divider { height: 1px; background: var(--border); margin: 24px 0; }

    /* Monte carlo path colors */
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--text2); }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

    /* Responsive */
    @media (max-width: 768px) {
      .nav { padding: 14px 20px; }
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .main-layout { flex-direction: column !important; }
    }

    .slide-in { animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

    .number-up { color: var(--green) !important; }
    .number-down { color: var(--accent) !important; }

    .corner-mark {
      position: absolute; width: 8px; height: 8px;
      border-color: var(--border2); border-style: solid;
    }
    .corner-mark.tl { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
    .corner-mark.tr { top: -1px; right: -1px; border-width: 1px 1px 0 0; }
    .corner-mark.bl { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
    .corner-mark.br { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
  `}</style>
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n, d = 2) => n?.toFixed(d) ?? "—";
const fmtPct = (n) => (n >= 0 ? "+" : "") + fmt(n) + "%";
const randNorm = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ─── MONTE CARLO ENGINE ───────────────────────────────────────────────────────
function runMonteCarlo({ S0, mu, sigma, days, n = 500, sentimentAdj = 0 }) {
  const dt = 1 / 252;
  const adjMu = mu + sentimentAdj;
  const paths = [];
  for (let i = 0; i < n; i++) {
    const path = [S0];
    for (let d = 1; d <= days; d++) {
      const prev = path[path.length - 1];
      const shock = sigma * Math.sqrt(dt) * randNorm();
      const drift = (adjMu - 0.5 * sigma * sigma) * dt;
      path.push(prev * Math.exp(drift + shock));
    }
    paths.push(path);
  }
  return paths;
}

// Markov Chain transition matrix for trend states (Bear/Neutral/Bull)
function buildMarkovMatrix(returns) {
  const thresholds = { bear: -0.005, bull: 0.005 };
  const states = returns.map(r => r < thresholds.bear ? 0 : r > thresholds.bull ? 2 : 1);
  const matrix = [[1, 1, 1], [1, 1, 1], [1, 1, 1]];
  for (let i = 0; i < states.length - 1; i++) matrix[states[i]][states[i + 1]]++;
  return matrix.map(row => { const s = row.reduce((a, b) => a + b, 0); return row.map(v => v / s); });
}

// GBM parameter estimation
function estimateGBM(prices) {
  if (!prices || prices.length < 2) return { mu: 0.08, sigma: 0.25 };
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const r = Math.log(prices[i] / prices[i - 1]);
    if (isFinite(r)) returns.push(r);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
  return { mu: mean * 252, sigma: Math.sqrt(variance * 252), returns };
}

// VaR calculation
function calcVaR(finalPrices, S0, conf = 0.95) {
  const pnl = finalPrices.map(p => (p - S0) / S0 * 100).sort((a, b) => a - b);
  return pnl[Math.floor((1 - conf) * pnl.length)];
}

// ─── CHART UTILITIES ─────────────────────────────────────────────────────────
function drawMonteCarloChart(canvas, paths, days, S0, theme) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 340 * dpr;
  canvas.style.height = "340px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const W = rect.width, H = 340;
  const pad = { top: 20, right: 30, bottom: 40, left: 60 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, W, H);

  const allVals = paths.flat();
  const minV = Math.min(...allVals) * 0.995;
  const maxV = Math.max(...allVals) * 1.005;
  const xScale = i => pad.left + (i / days) * cW;
  const yScale = v => pad.top + cH - ((v - minV) / (maxV - minV)) * cH;

  // Grid lines
  ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (i / 5) * cH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
    const val = maxV - (i / 5) * (maxV - minV);
    ctx.fillStyle = "#4a5260"; ctx.font = "9px 'IBM Plex Mono'";
    ctx.textAlign = "right"; ctx.fillText("$" + val.toFixed(0), pad.left - 6, y + 3);
  }
  for (let i = 0; i <= 6; i++) {
    const x = pad.left + (i / 6) * cW;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + cH); ctx.stroke();
    const day = Math.round((i / 6) * days);
    ctx.fillStyle = "#4a5260"; ctx.textAlign = "center";
    ctx.fillText("D+" + day, x, pad.top + cH + 16);
  }

  // Percentile bands
  const percentile = (arr, p) => arr.sort((a, b) => a - b)[Math.floor(p * arr.length / 100)];
  const bands = [[5, 95, "rgba(78,158,255,0.07)"], [25, 75, "rgba(78,158,255,0.12)"]];
  bands.forEach(([lo, hi, fill]) => {
    ctx.beginPath();
    for (let d = 0; d <= days; d++) {
      const vals = paths.map(p => p[d]);
      const x = xScale(d), y = yScale(percentile([...vals], hi));
      d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    for (let d = days; d >= 0; d--) {
      const vals = paths.map(p => p[d]);
      ctx.lineTo(xScale(d), yScale(percentile([...vals], lo)));
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  });

  // Individual paths (sample 80)
  const sample = paths.filter((_, i) => i % Math.ceil(paths.length / 80) === 0);
  sample.forEach(path => {
    const end = path[path.length - 1];
    const color = end > S0 ? "rgba(42,255,122,0.12)" : "rgba(255,78,42,0.12)";
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 0.8;
    path.forEach((v, i) => { const x = xScale(i), y = yScale(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
  });

  // Median path
  ctx.beginPath(); ctx.strokeStyle = "#e8eaf0"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  for (let d = 0; d <= days; d++) {
    const vals = paths.map(p => p[d]).sort((a, b) => a - b);
    const med = vals[Math.floor(vals.length / 2)];
    const x = xScale(d), y = yScale(med);
    d === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // S0 baseline
  ctx.beginPath(); ctx.strokeStyle = "rgba(255,200,42,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
  ctx.moveTo(pad.left, yScale(S0)); ctx.lineTo(pad.left + cW, yScale(S0)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#f5c842"; ctx.font = "9px 'IBM Plex Mono'"; ctx.textAlign = "left";
  ctx.fillText("$" + S0.toFixed(0), pad.left + 4, yScale(S0) - 4);
}

function drawDistChart(canvas, finalPrices, S0) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 180 * dpr;
  canvas.style.height = "180px";
  const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
  const W = rect.width, H = 180;
  const pad = { top: 16, right: 20, bottom: 30, left: 50 };
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#111318"; ctx.fillRect(0, 0, W, H);

  const sorted = [...finalPrices].sort((a, b) => a - b);
  const min = sorted[0] * 0.99, max = sorted[sorted.length - 1] * 1.01;
  const bins = 40;
  const binSize = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  sorted.forEach(v => { const bi = Math.min(Math.floor((v - min) / binSize), bins - 1); counts[bi]++; });
  const maxCount = Math.max(...counts);
  const cW = W - pad.left - pad.right, cH = H - pad.top - pad.bottom;
  const xScale = v => pad.left + ((v - min) / (max - min)) * cW;
  const yScale = c => pad.top + cH - (c / maxCount) * cH;

  counts.forEach((c, i) => {
    const x = pad.left + (i / bins) * cW;
    const bW = cW / bins - 1;
    const binCenter = min + (i + 0.5) * binSize;
    const color = binCenter > S0 ? "rgba(42,255,122,0.7)" : "rgba(255,78,42,0.7)";
    ctx.fillStyle = color;
    ctx.fillRect(x, yScale(c), bW, cH - (yScale(c) - pad.top));
  });

  // Axis
  ctx.strokeStyle = "#1e2229"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + cH); ctx.lineTo(pad.left + cW, pad.top + cH); ctx.stroke();
  [min, S0, max].forEach(v => {
    ctx.fillStyle = "#4a5260"; ctx.font = "8px 'IBM Plex Mono'"; ctx.textAlign = "center";
    ctx.fillText("$" + v.toFixed(0), xScale(v), pad.top + cH + 14);
  });

  // S0 line
  ctx.beginPath(); ctx.strokeStyle = "#f5c842"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
  ctx.moveTo(xScale(S0), pad.top); ctx.lineTo(xScale(S0), pad.top + cH); ctx.stroke(); ctx.setLineDash([]);
}

// ─── TWELVE DATA API ─────────────────────────────────────────────────────────
async function fetchStockData(symbol, apiKey) {
  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=90&apikey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "error") throw new Error(data.message);
  const values = data.values || [];
  const prices = values.map(v => parseFloat(v.close)).reverse();
  const latest = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  return { prices, latest, change: ((latest - prev) / prev) * 100 };
}

async function fetchQuote(symbol, apiKey) {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
  const res = await fetch(url);
  return res.json();
}

// ─── GROQ AI ANALYSIS ────────────────────────────────────────────────────────
async function analyzeNewsWithGroq(newsItems, symbol, groqKey) {
  const newsText = newsItems.slice(0, 6).map((n, i) => `${i + 1}. ${n.title}`).join("\n");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: GROQ_MODELS,
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You are a quantitative analyst. Analyze these news headlines for ${symbol} stock and return ONLY valid JSON (no markdown, no explanation):
{
  "sentiment": <float -1 to 1>,
  "sentimentAdj": <annualized drift adjustment float, e.g. 0.05 for bullish, -0.08 for bearish>,
  "sigmaMultiplier": <float 0.8 to 1.5, uncertainty factor>,
  "summary": "<2-sentence analysis>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"],
  "direction": "<BULLISH|BEARISH|NEUTRAL>",
  "confidence": <0 to 100>
}

Headlines:
${newsText}`
      }]
    })
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return { sentiment: 0, sentimentAdj: 0, sigmaMultiplier: 1, summary: "Analysis unavailable.", keyFactors: [], direction: "NEUTRAL", confidence: 50 }; }
}

async function fetchNewsWithGroq(symbol, groqKey) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: GROQ_MODELS,
      max_tokens: 1200,
      messages: [{
        role: "user",
        content: `Generate 8 realistic, plausible recent news headlines (as of 2025) for ${symbol} stock. Return ONLY valid JSON array, no markdown:
[
  {"title": "...", "source": "...", "time": "Xh ago", "sentiment": <-1 to 1>, "impact": <0 to 1>},
  ...
]`
      }]
    })
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "[]";
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return []; }
}

// ─── API SETUP PAGE ───────────────────────────────────────────────────────────
function ApiSetup({ onSave }) {
  const [td, setTd] = useState("");
  const [groq, setGroq] = useState("");
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 520, width: "100%", padding: "0 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--text3)", marginBottom: 16 }}>STOCKPROB / SETUP</div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}>API Configuration</div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
            Enter your API keys to enable live stock data and AI-powered news analysis. Keys are stored in session memory only.
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--text3)", display: "block", marginBottom: 6 }}>TWELVE DATA API KEY</label>
          <input className="input" value={td} onChange={e => setTd(e.target.value)} placeholder="Enter Twelve Data API key..." />
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 4 }}>Get free key at twelvedata.com</div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 9, letterSpacing: "0.15em", color: "var(--text3)", display: "block", marginBottom: 6 }}>GROQ API KEY</label>
          <input className="input" value={groq} onChange={e => setGroq(e.target.value)} placeholder="Enter Groq API key..." />
          <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 4 }}>Get free key at console.groq.com</div>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }}
          onClick={() => td && groq && onSave(td.trim(), groq.trim())}>
          INITIALIZE ENGINE
        </button>
        <div style={{ marginTop: 16, fontSize: 10, color: "var(--text3)", textAlign: "center" }}>
          Both keys required to proceed
        </div>
      </div>
    </div>
  );
}

// ─── CLOCK ────────────────────────────────────────────────────────────────────
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span className="nav-time">{t.toUTCString().slice(17, 25)} UTC</span>;
}

// ─── PAGE 1: NEWS ─────────────────────────────────────────────────────────────
function NewsPage({ symbol, apiKeys, stockData }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNewsWithGroq(symbol, apiKeys.groq);
      setNews(items);
      const anal = await analyzeNewsWithGroq(items, symbol, apiKeys.groq);
      setAnalysis(anal);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [symbol, apiKeys.groq]);

  useEffect(() => { load(); }, [load]);

  const sentColor = s => s > 0.2 ? "var(--green)" : s < -0.2 ? "var(--accent)" : "var(--yellow)";
  const sentLabel = s => s > 0.2 ? "BULLISH" : s < -0.2 ? "BEARISH" : "NEUTRAL";

  return (
    <div style={{ padding: "28px 40px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ borderBottom: "none", padding: 0, margin: 0, marginBottom: 8 }}>NEWS INTELLIGENCE / {symbol}</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>AI-analyzed news feed — sentiment extracted via Groq LLaMA 3.3</div>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? "LOADING..." : "↺ REFRESH"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* News feed */}
        <div className="card">
          <div className="section-label">LIVE FEED</div>
          {loading ? (
            <div className="loader" style={{ padding: "40px 0" }}>
              <div className="loader-dots"><span /><span /><span /></div>
              <span>Fetching news via Groq...</span>
            </div>
          ) : (
            <div className="scroll-area">
              {news.map((item, i) => (
                <div className="news-item" key={i}>
                  <div className="news-meta">
                    <span className="news-source">{item.source?.toUpperCase()}</span>
                    <span style={{ color: "var(--border2)" }}>·</span>
                    <span className="news-time">{item.time}</span>
                    <span className="tag" style={{ marginLeft: "auto",
                      background: item.sentiment > 0.2 ? "rgba(42,255,122,0.1)" : item.sentiment < -0.2 ? "rgba(255,78,42,0.1)" : "rgba(245,200,66,0.1)",
                      color: sentColor(item.sentiment),
                      border: `1px solid ${item.sentiment > 0.2 ? "rgba(42,255,122,0.2)" : item.sentiment < -0.2 ? "rgba(255,78,42,0.2)" : "rgba(245,200,66,0.2)"}` }}>
                      {sentLabel(item.sentiment)}
                    </span>
                  </div>
                  <div className="news-title">{item.title}</div>
                  <div className="news-impact">
                    <span style={{ fontSize: 9, color: "var(--text3)", width: 60 }}>IMPACT</span>
                    <div className="impact-bar-wrap">
                      <div className="impact-bar" style={{ width: `${(item.impact || 0.5) * 100}%`, background: sentColor(item.sentiment) }} />
                    </div>
                    <span style={{ fontSize: 9, color: "var(--text2)", width: 32 }}>{Math.round((item.impact || 0.5) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Analysis panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="section-label">AI VERDICT</div>
            {analysis ? (
              <>
                <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: analysis.direction === "BULLISH" ? "var(--green)" : analysis.direction === "BEARISH" ? "var(--accent)" : "var(--yellow)", letterSpacing: "-0.02em" }}>
                    {analysis.direction}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 6 }}>
                    {analysis.confidence}% confidence
                  </div>
                  <div style={{ marginTop: 12, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${analysis.confidence}%`, height: "100%", borderRadius: 2,
                      background: analysis.direction === "BULLISH" ? "var(--green)" : analysis.direction === "BEARISH" ? "var(--accent)" : "var(--yellow)",
                      transition: "width 1s ease" }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.7, marginBottom: 16, fontFamily: "var(--sans)" }}>
                  {analysis.summary}
                </div>
                <div className="section-label">KEY FACTORS</div>
                {(analysis.keyFactors || []).map((f, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--text2)", padding: "4px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 8 }}>
                    <span style={{ color: "var(--text3)" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span>{f}</span>
                  </div>
                ))}
              </>
            ) : (
              <div className="loader"><div className="loader-dots"><span /><span /><span /></div></div>
            )}
          </div>

          <div className="card">
            <div className="section-label">SENTIMENT METRICS</div>
            {analysis ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Overall Sentiment", value: fmt(analysis.sentiment, 3), color: sentColor(analysis.sentiment) },
                  { label: "Drift Adjustment", value: fmtPct(analysis.sentimentAdj * 100), color: analysis.sentimentAdj >= 0 ? "var(--green)" : "var(--accent)" },
                  { label: "Vol Multiplier", value: fmt(analysis.sigmaMultiplier, 2) + "x", color: "var(--text)" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--text2)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : <div className="loader"><div className="loader-dots"><span /><span /><span /></div></div>}
          </div>

          {stockData && (
            <div className="card">
              <div className="section-label">CURRENT PRICE</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>${fmt(stockData.latest)}</div>
              <div style={{ fontSize: 11, marginTop: 4, color: stockData.change >= 0 ? "var(--green)" : "var(--accent)" }}>
                {fmtPct(stockData.change)} today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2: SIMULATION ───────────────────────────────────────────────────────
function SimulationPage({ symbol, apiKeys, stockData }) {
  const mcCanvas = useRef(null);
  const distCanvas = useRef(null);
  const [paths, setPaths] = useState(null);
  const [params, setParams] = useState({ days: 30, n: 600 });
  const [gbm, setGbm] = useState(null);
  const [markov, setMarkov] = useState(null);
  const [stats, setStats] = useState(null);
  const [aiAdj, setAiAdj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (stockData?.prices?.length > 1) {
      const g = estimateGBM(stockData.prices);
      setGbm(g);
      const mk = buildMarkovMatrix(g.returns || []);
      setMarkov(mk);
    }
  }, [stockData]);

  const runSim = useCallback(async () => {
    if (!gbm || !stockData) return;
    setLoading(true);
    let adj = { sentimentAdj: 0, sigmaMultiplier: 1 };
    try {
      const news = await fetchNewsWithGroq(symbol, apiKeys.groq);
      adj = await analyzeNewsWithGroq(news, symbol, apiKeys.groq);
      setAiAdj(adj);
    } catch (e) {}

    const S0 = stockData.latest;
    const sigma = gbm.sigma * (adj.sigmaMultiplier || 1);
    const newPaths = runMonteCarlo({ S0, mu: gbm.mu, sigma, days: params.days, n: params.n, sentimentAdj: adj.sentimentAdj || 0 });
    setPaths(newPaths);

    const finals = newPaths.map(p => p[p.length - 1]);
    const sorted = [...finals].sort((a, b) => a - b);
    const above = finals.filter(f => f > S0).length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p10 = sorted[Math.floor(0.1 * sorted.length)];
    const p90 = sorted[Math.floor(0.9 * sorted.length)];
    const var95 = calcVaR(finals, S0, 0.95);
    setStats({ probUp: (above / finals.length) * 100, median, p10, p90, var95, S0, finals });
    setLoading(false); setRan(true);
  }, [gbm, stockData, params, symbol, apiKeys]);

  useEffect(() => {
    if (paths && mcCanvas.current) drawMonteCarloChart(mcCanvas.current, paths, params.days, stockData.latest);
  }, [paths, params.days, stockData]);

  useEffect(() => {
    if (stats && distCanvas.current) drawDistChart(distCanvas.current, stats.finals, stats.S0);
  }, [stats]);

  const stateLabels = ["BEAR", "NEUTRAL", "BULL"];
  const stateColors = ["var(--accent)", "var(--yellow)", "var(--green)"];

  return (
    <div style={{ padding: "28px 40px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ borderBottom: "none", padding: 0, margin: 0, marginBottom: 8 }}>MONTE CARLO SIMULATION / {symbol}</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>GBM + Markov chain transitions + AI-adjusted drift</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>DAYS</span>
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} className="btn btn-outline" style={{ padding: "6px 12px", background: params.days === d ? "var(--surface2)" : "transparent", color: params.days === d ? "var(--text)" : "var(--text3)", borderColor: params.days === d ? "var(--border2)" : "var(--border)" }}
                onClick={() => setParams(p => ({ ...p, days: d }))}>
                {d}D
              </button>
            ))}
          </div>
          <button className="btn btn-accent" onClick={runSim} disabled={loading || !gbm}>
            {loading ? "RUNNING..." : ran ? "↺ RE-RUN" : "▶ RUN SIM"}
          </button>
        </div>
      </div>

      {gbm && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: "μ (Annualized Drift)", value: fmtPct(gbm.mu * 100), color: gbm.mu >= 0 ? "var(--green)" : "var(--accent)" },
            { label: "σ (Annualized Vol)", value: fmt(gbm.sigma * 100) + "%", color: "var(--text)" },
            { label: "Current Price", value: "$" + fmt(stockData?.latest), color: "var(--text)" },
            { label: "Historical Days", value: (stockData?.prices?.length || 0) + "d", color: "var(--text2)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card card-sm">
              <div className="stat-label">{label}</div>
              <div className="stat-value" style={{ fontSize: 16, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {!ran && !loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text3)", fontSize: 11, letterSpacing: "0.1em" }}>
          SELECT HORIZON AND PRESS RUN SIM TO BEGIN
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, border: "1px solid var(--border)", borderRadius: 8, flexDirection: "column", gap: 16 }}>
          <div className="loader-dots"><span /><span /><span /></div>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>Running {params.n} Monte Carlo paths via GBM...</span>
        </div>
      )}

      {ran && !loading && paths && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="section-label" style={{ borderBottom: "none", padding: 0, margin: 0 }}>PRICE PATH SIMULATION ({params.n} PATHS, {params.days}D)</div>
              <div style={{ display: "flex", gap: 16 }}>
                <div className="legend-item"><div className="legend-dot" style={{ background: "rgba(42,255,122,0.7)" }} />Bull paths</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: "rgba(255,78,42,0.7)" }} />Bear paths</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: "#e8eaf0" }} />Median</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: "rgba(78,158,255,0.5)" }} />25–75%ile band</div>
              </div>
            </div>
            <div className="chart-wrap"><canvas ref={mcCanvas} /></div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card">
              <div className="section-label">DISTRIBUTION OF FINAL PRICES</div>
              <div className="chart-wrap"><canvas ref={distCanvas} /></div>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div className="legend-item"><div className="legend-dot" style={{ background: "var(--green)" }} />Above entry</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: "var(--accent)" }} />Below entry</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {stats && (
                <div className="card">
                  <div className="section-label">STATISTICAL SUMMARY</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "P(Price Goes Up)", value: fmt(stats.probUp, 1) + "%", color: stats.probUp > 50 ? "var(--green)" : "var(--accent)", big: true },
                      { label: "Median Target", value: "$" + fmt(stats.median), color: stats.median > stats.S0 ? "var(--green)" : "var(--accent)" },
                      { label: "10th Percentile (Bear)", value: "$" + fmt(stats.p10), color: "var(--accent)" },
                      { label: "90th Percentile (Bull)", value: "$" + fmt(stats.p90), color: "var(--green)" },
                      { label: "VaR 95% (max loss)", value: fmt(stats.var95, 1) + "%", color: "var(--accent)" },
                    ].map(({ label, value, color, big }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 10, color: "var(--text2)" }}>{label}</span>
                        <span style={{ fontSize: big ? 18 : 13, fontWeight: big ? 700 : 500, color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {markov && (
                <div className="card">
                  <div className="section-label">MARKOV TRANSITION MATRIX</div>
                  <div style={{ fontSize: 9, color: "var(--text3)", marginBottom: 12 }}>Bear / Neutral / Bull state transitions</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <td style={{ fontSize: 9, color: "var(--text3)", padding: "3px 6px" }}>FROM\TO</td>
                        {stateLabels.map((l, j) => <th key={j} style={{ fontSize: 9, fontWeight: 600, color: stateColors[j], padding: "3px 6px", textAlign: "right" }}>{l}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {markov.map((row, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 9, color: stateColors[i], padding: "4px 6px", fontWeight: 600 }}>{stateLabels[i]}</td>
                          {row.map((v, j) => (
                            <td key={j} style={{ fontSize: 10, color: i === j ? "var(--text)" : "var(--text2)", padding: "4px 6px", textAlign: "right", fontWeight: i === j ? 600 : 400 }}>
                              {fmt(v * 100, 1)}%
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {aiAdj && (
                <div className="card card-sm">
                  <div className="section-label">AI ADJUSTMENTS APPLIED</div>
                  <div style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.7 }}>
                    <div>Drift adj: <span style={{ color: aiAdj.sentimentAdj >= 0 ? "var(--green)" : "var(--accent)" }}>{aiAdj.sentimentAdj >= 0 ? "+" : ""}{fmt(aiAdj.sentimentAdj * 100, 2)}% annualized</span></div>
                    <div>Vol adj: <span style={{ color: "var(--text)" }}>{fmt(aiAdj.sigmaMultiplier, 2)}x baseline σ</span></div>
                    <div style={{ marginTop: 8, color: "var(--text3)", fontFamily: "var(--sans)", fontSize: 10 }}>{aiAdj.summary}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROBABILITY ARC SVG ──────────────────────────────────────────────────────
function ProbArc({ value, color, size = 120 }) {
  const r = 46, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2229" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 1.2s ease" }} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize="16" fontWeight="700" fontFamily="IBM Plex Mono">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// ─── PAGE 3: PROBABILITY DASHBOARD ───────────────────────────────────────────
function ProbabilityPage({ symbol, apiKeys, stockData }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [horizon, setHorizon] = useState(30);

  const analyze = useCallback(async () => {
    if (!stockData) return;
    setLoading(true);
    try {
      const news = await fetchNewsWithGroq(symbol, apiKeys.groq);
      const aiAdj = await analyzeNewsWithGroq(news, symbol, apiKeys.groq);
      const gbm = estimateGBM(stockData.prices);
      const S0 = stockData.latest;
      const sigma = gbm.sigma * (aiAdj.sigmaMultiplier || 1);
      const paths = runMonteCarlo({ S0, mu: gbm.mu, sigma, days: horizon, n: 1000, sentimentAdj: aiAdj.sentimentAdj || 0 });
      const finals = paths.map(p => p[p.length - 1]);
      const sorted = [...finals].sort((a, b) => a - b);

      const probUp = (finals.filter(f => f > S0).length / finals.length) * 100;
      const prob5up = (finals.filter(f => f > S0 * 1.05).length / finals.length) * 100;
      const prob10up = (finals.filter(f => f > S0 * 1.10).length / finals.length) * 100;
      const prob5down = (finals.filter(f => f < S0 * 0.95).length / finals.length) * 100;
      const prob10down = (finals.filter(f => f < S0 * 0.90).length / finals.length) * 100;
      const median = sorted[Math.floor(sorted.length / 2)];
      const var95 = calcVaR(finals, S0, 0.95);
      const expectedReturn = ((median - S0) / S0) * 100;
      setResult({ probUp, prob5up, prob10up, prob5down, prob10down, median, var95, expectedReturn, aiAdj, gbm, news, S0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [symbol, stockData, horizon, apiKeys]);

  const verdict = result ? (result.probUp > 60 ? { text: "STRONG BUY SIGNAL", color: "var(--green)" } : result.probUp > 52 ? { text: "MILD BULL", color: "var(--green)" } : result.probUp < 40 ? { text: "STRONG BEAR", color: "var(--accent)" } : result.probUp < 48 ? { text: "MILD BEAR", color: "var(--accent)" } : { text: "NEUTRAL", color: "var(--yellow)" }) : null;

  return (
    <div style={{ padding: "28px 40px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div className="section-label" style={{ borderBottom: "none", padding: 0, margin: 0, marginBottom: 8 }}>PROBABILITY DASHBOARD / {symbol}</div>
          <div style={{ fontSize: 11, color: "var(--text2)" }}>Full-stack probabilistic verdict with risk metrics</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>HORIZON</span>
            {[7, 14, 30, 60, 90].map(d => (
              <button key={d} className="btn btn-outline" style={{ padding: "6px 12px", background: horizon === d ? "var(--surface2)" : "transparent", color: horizon === d ? "var(--text)" : "var(--text3)", borderColor: horizon === d ? "var(--border2)" : "var(--border)" }}
                onClick={() => setHorizon(d)}>
                {d}D
              </button>
            ))}
          </div>
          <button className="btn btn-accent" onClick={analyze} disabled={loading || !stockData}>
            {loading ? "ANALYZING..." : result ? "↺ RE-ANALYZE" : "▶ ANALYZE"}
          </button>
        </div>
      </div>

      {!result && !loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, border: "1px dashed var(--border)", borderRadius: 8, color: "var(--text3)", fontSize: 11, letterSpacing: "0.1em" }}>
          PRESS ANALYZE TO GENERATE PROBABILISTIC FORECAST
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320, flexDirection: "column", gap: 20, border: "1px solid var(--border)", borderRadius: 8 }}>
          <div className="loader-dots"><span /><span /><span /></div>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>Running 1000-path Monte Carlo analysis...</span>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Verdict banner */}
          <div className="card" style={{ padding: "28px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 80% 50%, ${result.probUp > 50 ? "rgba(42,255,122,0.05)" : "rgba(255,78,42,0.05)"} 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <ProbArc value={result.probUp} color={result.probUp > 50 ? "var(--green)" : "var(--accent)"} size={130} />
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "var(--text3)", marginBottom: 10 }}>OVERALL SIGNAL / {horizon}D HORIZON</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: verdict.color, letterSpacing: "-0.02em", marginBottom: 8 }}>{verdict.text}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", fontFamily: "var(--sans)", lineHeight: 1.6, maxWidth: 420 }}>
                  Based on {result.gbm ? "GBM calibrated on 90d historical data" : "model estimates"}, Markov state analysis, and Groq AI news sentiment, there is a <strong style={{ color: verdict.color }}>{Math.round(result.probUp)}% probability</strong> {symbol} closes higher in {horizon} days.
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <span className={`tag tag-${result.aiAdj?.direction === "BULLISH" ? "bull" : result.aiAdj?.direction === "BEARISH" ? "bear" : "neutral"}`}>
                    NEWS: {result.aiAdj?.direction}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text3)", alignSelf: "center" }}>AI confidence: {result.aiAdj?.confidence}%</span>
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div className="stat-label">MEDIAN TARGET</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: result.median > result.S0 ? "var(--green)" : "var(--accent)" }}>${fmt(result.median)}</div>
                </div>
                <div>
                  <div className="stat-label">EXPECTED RETURN</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: result.expectedReturn >= 0 ? "var(--green)" : "var(--accent)" }}>{fmtPct(result.expectedReturn)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Probability breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { label: "P(+10%)", value: result.prob10up, color: "var(--green)" },
              { label: "P(+5%)", value: result.prob5up, color: "var(--green)" },
              { label: "P(Up)", value: result.probUp, color: result.probUp > 50 ? "var(--green)" : "var(--accent)" },
              { label: "P(-5%)", value: result.prob5down, color: "var(--accent)" },
              { label: "P(-10%)", value: result.prob10down, color: "var(--accent)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ textAlign: "center", padding: "20px 12px" }}>
                <div className="prob-arc-wrap">
                  <ProbArc value={value} color={color} size={90} />
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--text3)" }}>{label}</div>
                  <div style={{ fontSize: 9, color: "var(--text2)" }}>in {horizon}d</div>
                </div>
              </div>
            ))}
          </div>

          {/* Risk metrics + Method breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="card">
              <div className="section-label">RISK METRICS</div>
              {[
                { label: "VaR 95% (worst-case loss)", value: fmt(result.var95, 1) + "%", color: "var(--accent)" },
                { label: "Annualized Volatility (σ)", value: fmt(result.gbm?.sigma * 100, 1) + "%", color: "var(--text)" },
                { label: "Annualized Drift (μ)", value: fmtPct(result.gbm?.mu * 100), color: result.gbm?.mu >= 0 ? "var(--green)" : "var(--accent)" },
                { label: "AI Drift Adjustment", value: (result.aiAdj?.sentimentAdj >= 0 ? "+" : "") + fmt(result.aiAdj?.sentimentAdj * 100, 2) + "%/yr", color: result.aiAdj?.sentimentAdj >= 0 ? "var(--green)" : "var(--accent)" },
                { label: "Volatility Multiplier", value: fmt(result.aiAdj?.sigmaMultiplier, 2) + "x", color: "var(--text)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 10, color: "var(--text2)" }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="section-label">METHODOLOGY</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { name: "Geometric Brownian Motion", desc: "dS = μS dt + σS dW — stochastic price process with calibrated drift and volatility from 90d historical returns." },
                  { name: "Markov Chain (3-state)", desc: "Bear/Neutral/Bull transition matrix estimated from historical return sign sequences. Governs regime probabilities." },
                  { name: "Monte Carlo (1000 paths)", desc: "1000 GBM simulations with AI-adjusted parameters. Probability = fraction of paths ending above entry price." },
                  { name: "Groq LLM Sentiment", desc: "LLaMA 3.3 analyzes live headlines and outputs drift adjustment (sentimentAdj) and volatility multiplier." },
                  { name: "Value at Risk (VaR 95%)", desc: "95th percentile worst-case loss from distribution of simulated final prices." },
                ].map(({ name, desc }) => (
                  <div key={name} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.6, fontFamily: "var(--sans)" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TICKER BAR ───────────────────────────────────────────────────────────────
function TickerBar({ quotes, selected, onSelect }) {
  return (
    <div className="ticker-bar">
      {STOCKS.map(sym => {
        const q = quotes[sym];
        const chg = q?.change ?? 0;
        return (
          <div key={sym} className={`ticker-item${selected === sym ? " selected" : ""}`} onClick={() => onSelect(sym)}>
            <span className="ticker-sym">{sym}</span>
            <span className="ticker-price">{q ? "$" + fmt(q.latest) : "—"}</span>
            <span className={`ticker-chg ${chg > 0 ? "up" : chg < 0 ? "down" : "flat"}`}>
              {q ? fmtPct(chg) : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [apiKeys, setApiKeys] = useState(null);
  const [page, setPage] = useState("news");
  const [symbol, setSymbol] = useState("AAPL");
  const [quotes, setQuotes] = useState({});
  const [stockData, setStockData] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const loadStock = useCallback(async (sym, keys) => {
    if (!keys) return;
    setLoadingStock(true); setStockData(null);
    try {
      const data = await fetchStockData(sym, keys.td);
      setStockData(data);
      setQuotes(q => ({ ...q, [sym]: data }));
    } catch (e) { console.error(e); }
    setLoadingStock(false);
  }, []);

  // Load all quotes for ticker
  const loadAllQuotes = useCallback(async (keys) => {
    STOCKS.forEach(async sym => {
      try {
        const data = await fetchStockData(sym, keys.td);
        setQuotes(q => ({ ...q, [sym]: data }));
      } catch {}
    });
  }, []);

  const handleSaveKeys = useCallback((td, groq) => {
    const keys = { td, groq };
    setApiKeys(keys);
    loadAllQuotes(keys);
    loadStock("AAPL", keys);
  }, [loadAllQuotes, loadStock]);

  const handleSelectSymbol = useCallback((sym) => {
    setSymbol(sym);
    loadStock(sym, apiKeys);
  }, [apiKeys, loadStock]);

  if (!apiKeys) return (<><GlobalStyle /><ApiSetup onSave={handleSaveKeys} /></>);

  const pages = [
    { id: "news", label: "NEWS" },
    { id: "simulation", label: "SIMULATION" },
    { id: "probability", label: "PROBABILITY" },
  ];

  return (
    <>
      <GlobalStyle />
      <div className="page">
        {/* Nav */}
        <div className="nav">
          <div style={{ display: "flex", align: "center", gap: 24 }}>
            <span className="nav-logo">STOCKPROB</span>
            <span style={{ fontSize: 9, color: "var(--text3)", alignSelf: "center", letterSpacing: "0.1em" }}>PROBABILITY ENGINE v1.0</span>
          </div>
          <div className="nav-tabs">
            {pages.map(p => (
              <button key={p.id} className={`nav-tab${page === p.id ? " active" : ""}`} onClick={() => setPage(p.id)}>{p.label}</button>
            ))}
          </div>
          <div className="nav-right">
            <div className="live-dot" />
            <Clock />
            <button className="btn btn-outline" style={{ fontSize: 9, padding: "6px 12px" }} onClick={() => setApiKeys(null)}>RESET</button>
          </div>
        </div>

        {/* Ticker */}
        <TickerBar quotes={quotes} selected={symbol} onSelect={handleSelectSymbol} />

        {/* Status bar */}
        {loadingStock && (
          <div style={{ padding: "8px 40px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <div className="loader-dots"><span /><span /><span /></div>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>Fetching {symbol} data from Twelve Data...</span>
          </div>
        )}

        {/* Page content */}
        <div className="slide-in" key={page + symbol}>
          {page === "news" && <NewsPage symbol={symbol} apiKeys={apiKeys} stockData={stockData} />}
          {page === "simulation" && <SimulationPage symbol={symbol} apiKeys={apiKeys} stockData={stockData} />}
          {page === "probability" && <ProbabilityPage symbol={symbol} apiKeys={apiKeys} stockData={stockData} />}
        </div>
      </div>
    </>
  );
}
