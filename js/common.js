
const STORAGE_KEY = "threeCushionTrainingLog_v1";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function escapeHTML(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



function getActivitySummary(game) {
  const type = game.activityType || "";
  const meta = game.activityMeta || {};
  if (!type) return "";
  if (type === "獨自練球") return `${type}｜${meta.practiceMode || ""}`;
  if (type === "單打無賭注") return `${type}｜對手：${meta.opponentName || ""}`;
  if (type === "單打有賭注") return `${type}｜對手：${meta.opponentName || ""}｜賭注：${meta.stakeAmount || ""}`;
  if (type === "多人追分") {
    const order = (meta.participants || []).map(p => `${p.order}.${p.name}`).join("、");
    return `${type}｜賭注：${meta.stakeAmount || ""}｜${order}`;
  }
  if (type === "正式比賽") return `${type}｜${meta.competitionName || ""}｜對手：${meta.opponentName || ""}`;
  return type;
}

function setDefaultDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const dateEl = document.getElementById("gameDate");
  const timeEl = document.getElementById("gameTime");
  if (dateEl) dateEl.value = `${yyyy}-${mm}-${dd}`;
  if (timeEl) timeEl.value = `${hh}:${mi}`;
}

function calculateStatsFromScores(scores) {
  const filled = (scores || []).filter(item => item.points !== "" && item.points !== null && item.points !== undefined);
  const totalPoints = filled.reduce((sum, item) => sum + Number(item.points), 0);
  const totalShots = filled.length;
  const avg = totalShots ? totalPoints / totalShots : 0;
  const highRun = filled.length ? Math.max(...filled.map(item => Number(item.points))) : 0;
  const zeroShots = filled.filter(item => Number(item.points) === 0).length;
  const zeroRate = totalShots ? zeroShots / totalShots : 0;
  return {
    totalPoints,
    totalShots,
    avg: Number(avg.toFixed(3)),
    highRun,
    zeroShots,
    zeroRate: Number(zeroRate.toFixed(4))
  };
}

function calculateHistoryStats(history) {
  const totalGames = history.length;
  const totalPoints = history.reduce((sum, game) => sum + Number(game.totalPoints || 0), 0);
  const totalShots = history.reduce((sum, game) => sum + Number(game.totalShots || 0), 0);
  const avg = totalShots ? totalPoints / totalShots : 0;
  const recent10 = history.slice(-10);
  const recent30 = history.slice(-30);
  const recent10Points = recent10.reduce((sum, game) => sum + Number(game.totalPoints || 0), 0);
  const recent10Shots = recent10.reduce((sum, game) => sum + Number(game.totalShots || 0), 0);
  const recent30Points = recent30.reduce((sum, game) => sum + Number(game.totalPoints || 0), 0);
  const recent30Shots = recent30.reduce((sum, game) => sum + Number(game.totalShots || 0), 0);
  const recent10Avg = recent10Shots ? recent10Points / recent10Shots : 0;
  const recent30Avg = recent30Shots ? recent30Points / recent30Shots : 0;
  const bestAvg = history.length ? Math.max(...history.map(game => Number(game.avg || 0))) : 0;
  const highRun = history.length ? Math.max(...history.map(game => Number(game.highRun || 0))) : 0;
  const zeroShots = history.reduce((sum, game) => sum + Number(game.zeroShots || 0), 0);
  const zeroRate = totalShots ? zeroShots / totalShots : 0;

  return {
    totalGames,
    totalPoints,
    totalShots,
    avg: Number(avg.toFixed(3)),
    recent10Avg: Number(recent10Avg.toFixed(3)),
    recent30Avg: Number(recent30Avg.toFixed(3)),
    bestAvg: Number(bestAvg.toFixed(3)),
    highRun,
    zeroShots,
    zeroRate: Number(zeroRate.toFixed(4))
  };
}

function exportWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet.data), sheet.name);
  });
  XLSX.writeFile(wb, filename);
}

function buildHistoryWorkbookData(history) {
  const stats = calculateHistoryStats(history);
  const summary = [
    ["3-Cushion Training System"],
    [],
    ["總局數", stats.totalGames],
    ["總得分", stats.totalPoints],
    ["總杆數", stats.totalShots],
    ["總 AVG", stats.avg.toFixed(3)],
    ["最近 10 局 AVG", stats.recent10Avg.toFixed(3)],
    ["最近 30 局 AVG", stats.recent30Avg.toFixed(3)],
    ["最高單局 AVG", stats.bestAvg.toFixed(3)],
    ["High Run", stats.highRun],
    ["空杆數", stats.zeroShots],
    ["空杆率", (stats.zeroRate * 100).toFixed(1) + "%"],
    [],
    ["局數", "日期", "時間", "地點", "活動類型", "活動資訊", "總得分", "杆數", "AVG", "High Run", "空杆數", "空杆率"]
  ];

  history.forEach((game, index) => {
    summary.push([
      index + 1,
      game.date || "",
      game.time || "",
      game.venue || "",
      game.activityType || "",
      getActivitySummary(game),
      game.totalPoints || 0,
      game.totalShots || 0,
      Number(game.avg || 0).toFixed(3),
      game.highRun || 0,
      game.zeroShots || 0,
      ((game.zeroRate || 0) * 100).toFixed(1) + "%"
    ]);
  });

  const details = [["局數", "日期", "時間", "地點", "活動類型", "活動資訊", "輪次", "得分"]];
  history.forEach((game, index) => {
    (game.scores || []).forEach(score => {
      details.push([index + 1, game.date || "", game.time || "", game.venue || "", score.inn, score.points]);
    });
  });

  return [
    { name: "歷史總覽", data: summary },
    { name: "逐輪明細", data: details }
  ];
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
  }
}

registerSW();
