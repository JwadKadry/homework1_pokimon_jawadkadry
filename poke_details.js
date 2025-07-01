// מקבל פרמטר מה-URL (למשל id של הפוקימון)
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// ניווט חזרה למועדפים
function goBackToFavorites() {
  window.location.href = "favorite.html";
}

// ניווט חזרה לעמוד החיפוש
function goBackToSearch() {
  window.location.href = "index.html";
}

// טוען פרטי פוקימון לפי מזהה מה-URL
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
        <button onclick="searchYoutube('${pokemon.name}')" class="action-btn">🎬 חפש סרטונים על ${pokemon.name} ביוטיוב</button>
      </div>
    `;

  } catch (error) {
    console.error("Error loading Pokémon data:", error);
    container.innerHTML = "<p>Failed to load Pokémon details.</p>";
  }
}

// פותח חיפוש ביוטיוב לפי שם הפוקימון
function searchYoutube(pokemonName) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(pokemonName)}+pokemon`;
  window.open(searchUrl, "_blank");
}

// טעינה אוטומטית של פרטי הפוקימון כאשר הדף נטען
window.onload = loadDetails;
