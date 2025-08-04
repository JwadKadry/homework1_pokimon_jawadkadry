document.addEventListener("DOMContentLoaded", init);

async function init() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user?.id) {
    alert("You must be logged in to play.");
    return window.location.href = "login.html";
  }

  const res = await fetch(`/users/${user.id}/favorites`);
  if (!res.ok) {
    const e = await res.json();
    return alert(e.message || "Error loading favorites");
  }
  const favs = await res.json();
  const grid = document.getElementById("favoritesGrid");
  favs.forEach(poke => {
    const card = generateCard(poke);
    card.addEventListener("click", () => selectPoke(card, poke));
    grid.appendChild(card);
  });

  document.getElementById("startBattleBtn")
          .addEventListener("click", () => startBattle(user));
}

let selectedPoke = null;
function selectPoke(card, poke) {
  document.querySelectorAll(".grid .pokemon-card")
          .forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedPoke = poke;
  document.getElementById("startBattleBtn").disabled = false;
}

async function checkDailyLimit(userId) {
  try {
    const res = await fetch(`/users/${userId}/battles-today`);
    const data = await res.json();
    if (data.count >= 5) {
      alert("❌ You've reached the daily limit of 5 battles.");
      return false;
    }
    return true;
  } catch (err) {
    console.error("❌ Failed to check daily battle limit:", err);
    return false;
  }
}


async function startBattle(user) {
  const allowed = await checkDailyLimit(user.id);
  if (!allowed) return;
  const btn = document.getElementById("startBattleBtn");
  const cd = document.getElementById("countdown");
  const gif = document.getElementById("countdownGif");
  const container = document.getElementById("countdownContainer");
  btn.disabled = true;
  // Show container and gif
  container.style.display = "flex";
  gif.style.display = "block";
  cd.textContent = "";
  // Countdown from 3 to 1
  for (let i = 3; i >= 1; i--) {
    cd.textContent = i;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Clear and hide
  cd.textContent = "";
  gif.style.display = "none";
  container.style.display = "none";
  // Send to server
  const res = await fetch("/arena/vs-bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, pokemon: selectedPoke })
  });

  if (!res.ok) {
    const e = await res.json();
    alert(e.message || "Battle error");
    return btn.disabled = false;
  }

  const { yourScore, opponentScore, winner, botPokemon, botName } = await res.json();
  displayBattle(user.name, selectedPoke, botName, botPokemon, yourScore, opponentScore, winner);

  if (winner === "you") {
    recordBattleResult(user.id, "win", selectedPoke.name, "bot");
  } else if (winner === "bot") {
    recordBattleResult(user.id, "loss", selectedPoke.name, "bot");
  } else {
    recordBattleResult(user.id, "draw", selectedPoke.name, "bot");
  }
}

function displayBattle(p1Name, p1, p2Name, p2, s1, s2, winner) {
  const arena = document.getElementById("battleArena");
  const result = document.getElementById("battleResult");
  arena.innerHTML = "";
  result.innerHTML = "";

  const card1 = generateCard(p1, s1, p1Name);
  const card2 = generateCard(p2, s2, p2Name);
  if (winner === "you") card1.classList.add("winner");
  else                  card2.classList.add("winner");

  arena.append(card1, card2);
  result.textContent = winner === "you"
    ? `🏆 ${p1Name} wins!`
    : `🏆 ${p2Name} wins!`;
}

function generateCard(poke, score, ownerName) {
  const div = document.createElement("div");
  div.className = "pokemon-card";

  div.innerHTML = `
    <h3>${poke.name || "Pokemon"}</h3>
    <img src="${poke.sprites?.front_default || poke.sprites?.back_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'}" />
  `;

  return div;
}

function recordBattleResult(userId, result, pokemonName, mode) {
  fetch(`http://localhost:3000/users/${userId}/add-battle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, pokemonName, mode })
  })
  .then(res => res.json())
  .then(data => console.log("✅ Bot battle saved:", data))
  .catch(err => console.error("❌ Failed to save bot battle:", err));
}
