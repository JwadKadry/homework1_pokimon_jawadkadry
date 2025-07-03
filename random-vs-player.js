document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) {
    alert("עליך להיות מחובר כדי לשחק.");
    window.location.href = "login.html";
    return;
  }

  document.getElementById("findPlayerBtn").addEventListener("click", () => startBattle(user));
});

function startBattle(user) {
  fetch(`http://localhost:3000/users/random-opponent/${user.id}`)
    .then(res => res.json())
    .then(opponent => {
      const myPokemon = pickRandomPokemonFromLocal(user.id);
      const opponentPokemon = pickRandomPokemonFromOpponent(opponent.favorites);
      displayBattle(user.name, myPokemon, opponent.name, opponentPokemon);
    })
    .catch(err => {
      console.error("❌ שגיאה באיתור יריב:", err);
      alert("לא נמצא יריב מתאים כרגע.");
    });
}

function pickRandomPokemonFromLocal(userId) {
  const favorites = JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];
  return favorites.length ? favorites[Math.floor(Math.random() * favorites.length)] : null;
}

function pickRandomPokemonFromOpponent(favs) {
  return favs.length ? favs[Math.floor(Math.random() * favs.length)] : null;
}

function calculateScore(pokemon) {
  return (pokemon.stats || []).reduce((sum, stat) => sum + stat.base_stat, 0);
}

function displayBattle(player1, poke1, player2, poke2) {
  const container = document.getElementById("battleArena");
  const resultDiv = document.getElementById("battleResult");
  container.innerHTML = "";
  resultDiv.innerHTML = "";

  if (!poke1 || !poke2) {
    resultDiv.innerHTML = "אחד השחקנים ללא פוקימון מועדף.";
    return;
  }

  const score1 = calculateScore(poke1);
  const score2 = calculateScore(poke2);

  const card1 = generatePokemonCard(player1, poke1, score1);
  const card2 = generatePokemonCard(player2, poke2, score2);

  container.appendChild(card1);
  container.appendChild(card2);

  if (score1 > score2) resultDiv.textContent = `🏆 ${player1} ניצח!`;
  else if (score2 > score1) resultDiv.textContent = `🏆 ${player2} ניצח!`;
  else resultDiv.textContent = "🔁 תיקו!";
}

function generatePokemonCard(playerName, pokemon, score) {
  const div = document.createElement("div");
  div.className = "pokemon-card";
  div.innerHTML = `
    <h3>${playerName}</h3>
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <p><strong>${pokemon.name}</strong></p>
    <p>Score: ${score}</p>
  `;
  return div;
}
