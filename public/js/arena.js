function startBotBattle() {
  window.location.href = "player-vs-player";
}

function startRandomBattle() {
  window.location.href = "random-vs-player";
}

function viewBattleHistory() {
  window.location.href = "battle-history";
}

function showRanking() {
  window.location.href = "leaderboard";
}

function goBack(){
  window.location.href="index";
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const status = document.getElementById("battleStatus");

  if (!user || !user.id) {
    status.textContent = "⚠️ You must be logged in to view your battle status.";
    return;
  }

  try {
    const res = await fetch(`/users/${user.id}/battles-today`);
    const data = await res.json();
    status.textContent = `🗓️ Battles today: ${data.count} / 5`;
  } catch (err) {
    console.error("❌ Failed to fetch battle status:", err);
    status.textContent = "Error loading battle status.";
  }
});

