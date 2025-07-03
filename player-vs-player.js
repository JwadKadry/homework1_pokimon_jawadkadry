// player-vs-player.js

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user.id) {
      alert("עליך להיות מחובר כדי לשחק.");
      window.location.href = "login.html";
      return;
    }
  
    document.getElementById("findPlayerBtn")
            .addEventListener("click", () => startBattle(user));
  });
  
  async function startBattle(user) {
    try {
      // 1) YOUR favorites, from the server
      const meRes = await fetch(`http://localhost:3000/users/${user.id}/favorites`);
      if (!meRes.ok) {
        const err = await meRes.json();
        throw new Error(err.message || "אין פייבוריטים למשתמש זה");
      }
      const myFavorites = await meRes.json();
  
      // 2) OPPONENT + their favorites, from the server
      const oppRes = await fetch(`http://localhost:3000/users/random-opponent/${user.id}`);
      if (!oppRes.ok) {
        const err = await oppRes.json();
        throw new Error(err.error || "לא נמצא יריב מתאים כרגע");
      }
      const { id: oppId, name: oppName, favorites: oppFavorites } = await oppRes.json();
  
      // 3) pick one Pokémon at random from each array
      const myPoke  = pickRandom(myFavorites);
      const oppPoke = pickRandom(oppFavorites);
  
      // 4) error if either side has no favorites
      if (!myPoke || !oppPoke) {
        throw new Error("אחד השחקנים ללא פוקימון מועדף.");
      }
  
      // 5) show the battle
      displayBattle(user.name, myPoke, oppName, oppPoke);
  
    } catch (err) {
      console.error("❌ שגיאה בקרב מול שחקן:", err);
      alert(err.message || "שגיאה לא ידועה");
    }
  }
  
  // helper for random pick
  function pickRandom(arr) {
    return Array.isArray(arr) && arr.length
      ? arr[Math.floor(Math.random() * arr.length)]
      : null;
  }
  
  function calculateScore(pokemon) {
    if (!pokemon.stats || !Array.isArray(pokemon.stats)) return 0;
    return pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  }
  
  function displayBattle(player1, poke1, player2, poke2) {
    const container = document.getElementById("battleArena");
    const resultDiv = document.getElementById("battleResult");
    container.innerHTML = "";
    resultDiv.innerHTML = "";
  
    const score1 = calculateScore(poke1);
    const score2 = calculateScore(poke2);
  
    const card1 = generatePokemonCard(player1, poke1, score1);
    const card2 = generatePokemonCard(player2, poke2, score2);
    container.append(card1, card2);
  
    if (score1 > score2)      resultDiv.textContent = `🏆 ${player1} ניצח!`;
    else if (score2 > score1) resultDiv.textContent = `🏆 ${player2} ניצח!`;
    else                      resultDiv.textContent = "🔁 תיקו!";
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
      <p>ניקוד כולל: ${score}</p>
    `;
    return div;
  }
  