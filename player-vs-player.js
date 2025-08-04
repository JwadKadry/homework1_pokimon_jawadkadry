document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) {
    alert("You must be logged in to play.");
    window.location.href = "login.html";
    return;
  }

  await loadOnlineUsers(user.id);
  document.getElementById("startBattleBtn")
          .addEventListener("click", () => startBattle(user));
});

async function loadOnlineUsers(currentUserId) {
  const select = document.getElementById("opponentSelect");
  try {
    const res = await fetch("http://localhost:3000/online-users");
    const users = await res.json();

    users.filter(u => u.id !== currentUserId).forEach(u => {
      const option = document.createElement("option");
      option.value = u.id;
      option.textContent = u.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to fetch online users:", err);
  }
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
  const opponentId = document.getElementById("opponentSelect").value;
  if (!opponentId) return alert("Please select an opponent.");

  const btn = document.getElementById("startBattleBtn");
  const cd = document.getElementById("countdown");
  const gif = document.getElementById("countdownGif");
  const container = document.getElementById("countdownContainer");

  btn.disabled = true;
  container.style.display = "flex";
  gif.style.display = "block";
  cd.textContent = "";

  for (let i = 3; i >= 1; i--) {
    cd.textContent = i;
    await new Promise(r => setTimeout(r, 1000));
  }

  gif.style.display = "none";
  container.style.display = "none";

  try {
    const [myRes, oppRes] = await Promise.all([
      fetch(`http://localhost:3000/users/${user.id}/favorites`),
      fetch(`http://localhost:3000/users/${opponentId}/favorites`)
    ]);

    const [myFavorites, oppFavorites] = await Promise.all([
      myRes.json(),
      oppRes.json()
    ]);

    if (!myFavorites.length || !oppFavorites.length) {
      throw new Error("Both players must have at least one favorite Pokémon.");
    }

    const myPoke = pickRandom(myFavorites);
    const oppPoke = pickRandom(oppFavorites);

    displayBattle(user.name, myPoke, document.getElementById("opponentSelect").selectedOptions[0].textContent, oppPoke, user.id, opponentId);

  } catch (err) {
    console.error("❌ Battle failed:", err);
    alert(err.message || "Unknown error");
  } finally {
    btn.disabled = false;
  }
}


function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function calculateScore(pokemon) {
  const weights = { hp: 0.3, attack: 0.4, defense: 0.2, speed: 0.1 };
  return pokemon.stats?.reduce((sum, s) => {
    const name = s.stat.name.toLowerCase();
    return sum + (weights[name] || 0) * s.base_stat;
  }, 0) ?? 0;
}

function displayBattle(player1, poke1, player2, poke2, user1Id, user2Id) {
  const arena = document.getElementById("battleArena");
  const resultDiv = document.getElementById("battleResult");
  arena.innerHTML = "";
  resultDiv.innerHTML = "";

  const score1 = calculateScore(poke1);
  const score2 = calculateScore(poke2);

  arena.append(generatePokemonCard(player1, poke1, score1));
  arena.append(generatePokemonCard(player2, poke2, score2));

  let result1 = "draw", result2 = "draw", resultText = "🔁 Draw!";
  if (score1 > score2) {
    result1 = "win";
    result2 = "loss";
    resultText = `🏆 ${player1} wins!`;
  } else if (score2 > score1) {
    result1 = "loss";
    result2 = "win";
    resultText = `🏆 ${player2} wins!`;
  }

  resultDiv.textContent = resultText;

  recordBattleResult(user1Id, result1, poke1.name, "player");
  recordBattleResult(user2Id, result2, poke2.name, "player");
}

function generatePokemonCard(playerName, pokemon, score) {
  const div = document.createElement("div");
  div.className = "pokemon-card";
  div.innerHTML = `
    <h3>${playerName}</h3>
    <img src="${pokemon.sprites?.front_default ||
               'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png'}"
         alt="${pokemon.name}">
    <p><strong>${pokemon.name}</strong></p>
    <p>Total Score: ${score.toFixed(2)}</p>
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
  .then(data => console.log("✅ Battle result recorded:", data))
  .catch(err => console.error("❌ Failed to record battle:", err));
}
