// Gets a parameter from the URL (e.g., Pokémon ID)
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Navigate back to favorites
function goBackToFavorites() {
  window.location.href = "favorite";
}

// Navigate back to search page
function goBackToSearch() {
  window.location.href = "index";
}

// Loads Pokémon details by ID from the URL
async function loadDetails() {
  const id = getQueryParam("id");
  const container = document.getElementById("details");

  if (!id) {
    container.innerHTML = "<p>No Pokémon ID provided.</p>";
    return;
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemon = await response.json();

    const abilities = pokemon.abilities.map(a => a.ability.name).join(", ");
    const types = pokemon.types.map(t => t.type.name).join(", ");

    container.innerHTML = `
      <h2>${pokemon.name} (#${pokemon.id})</h2>
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
      <p><strong>Type(s):</strong> ${types}</p>
      <p><strong>Abilities:</strong> ${abilities}</p>
      <p><strong>Height:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
      <p><strong>Weight:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p>
      <p><strong>Stats:</strong></p>
      ${pokemon.stats.map(s => `
        <div>
          ${s.stat.name.toUpperCase()}: ${s.base_stat}
          <div style="background:#eee; height:6px; border-radius:4px; overflow:hidden;">
            <div style="width:${s.base_stat}px; height:6px; background:blue;"></div>
          </div>
        </div>
      `).join("")}

      <div style="margin-top: 20px;">
        <button onclick="searchYoutube('${pokemon.name}')" class="action-btn">
          🎬 Search YouTube for ${pokemon.name} videos
        </button>
      </div>
    `;

  } catch (error) {
    console.error("Error loading Pokémon data:", error);
    container.innerHTML = "<p>Failed to load Pokémon details.</p>";
  }
}

// Opens a YouTube search based on the Pokémon name
function searchYoutube(pokemonName) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(pokemonName)}+pokemon`;
  window.open(searchUrl, "_blank");
}

// Automatically load Pokémon details when the page loads
window.onload = loadDetails;
