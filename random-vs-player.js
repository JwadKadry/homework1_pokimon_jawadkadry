function getRandomId() {
  return Math.floor(Math.random() * 151) + 1; // פוקימונים ראשונים
}

async function getPokemonData(id) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await response.json();
  return {
    name: data.name,
    img: data.sprites.front_default,
    stats: {
      hp: data.stats.find(s => s.stat.name === 'hp').base_stat,
      attack: data.stats.find(s => s.stat.name === 'attack').base_stat,
      defense: data.stats.find(s => s.stat.name === 'defense').base_stat,
      speed: data.stats.find(s => s.stat.name === 'speed').base_stat
    }
  };
}

function calculateScore(stats) {
  return (
    stats.hp * 0.3 +
    stats.attack * 0.4 +
    stats.defense * 0.2 +
    stats.speed * 0.1
  );
}

function displayPokemon(containerId, pokemon, score) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <h3>${pokemon.name}</h3>
    <img src="${pokemon.img}" alt="${pokemon.name}" />
    <p>HP: ${pokemon.stats.hp}</p>
    <p>Attack: ${pokemon.stats.attack}</p>
    <p>Defense: ${pokemon.stats.defense}</p>
    <p>Speed: ${pokemon.stats.speed}</p>
    <p><strong>Score: ${score.toFixed(2)}</strong></p>
  `;
}

document.getElementById('battle-btn').addEventListener('click', async () => {
  const p1 = await getPokemonData(getRandomId());
  const p2 = await getPokemonData(getRandomId());

  const score1 = calculateScore(p1.stats);
  const score2 = calculateScore(p2.stats);

  displayPokemon('player1', p1, score1);
  displayPokemon('player2', p2, score2);

  const result = document.getElementById('result');
  if (score1 > score2) {
    result.textContent = `${p1.name} ניצח!`;
  } else if (score2 > score1) {
    result.textContent = `${p2.name} ניצח!`;
  } else {
    result.textContent = "תיקו!";
  }
});