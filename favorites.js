// On page load
document.addEventListener("DOMContentLoaded", () => {
  const user = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("You must be logged in to view favorites.");
    window.location.href = "login.html";
    return;
  }

  loadFavorites();
});

// Generate headers with token
function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Load favorites from server
function loadFavorites() {
  const sortBy = document.getElementById("sortSelect")?.value || "id";
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) return;

  const key = `favorites_${user.id}`;

  fetch(`http://localhost:3000/users/${user.id}/favorites`, {
    headers: getAuthHeaders()
  })
    .then(res => res.json())
    .then(favorites => {
      localStorage.setItem(key, JSON.stringify(favorites));
      if (sortBy === "name") {
        favorites.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === "id") {
        favorites.sort((a, b) => a.id - b.id);
      }
      displayFavorites(favorites);
    })
    .catch(err => {
      console.error("Error loading favorites from server:", err);
    });
}

// Display all favorite Pokémon
function displayFavorites(favorites) {
  const container = document.getElementById("favoritesList");
  container.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    container.innerHTML = "<p>No favorite Pokémon yet.</p>";
    return;
  }

  favorites.forEach(poke => {
    const imageUrl = poke.sprites?.front_default || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png";

    const types = Array.isArray(poke.types)
      ? poke.types.map(t => t?.type?.name || "Unknown").join(", ")
      : "Unknown";

    const abilities = Array.isArray(poke.abilities)
      ? poke.abilities.map(a => a?.ability?.name || "Unknown").join(", ")
      : "Unknown";

    const card = document.createElement("div");
    card.className = "card";
    card.id = `card-${poke.id}`;

    card.innerHTML = `
      <h3>${poke.name || "Unnamed"} (#${poke.id || "?"})</h3>
      <img src="${imageUrl}" alt="${poke.name}" />
      <p><strong>Type(s):</strong> ${types}</p>
      <p><strong>Abilities:</strong> ${abilities}</p>
      <div class="stats-container" id="stats-${poke.id}" style="display:none;"></div>
      <button onclick="loadStats(${poke.id})">📊 Stats</button>
      <button class="remove-btn" onclick="removeFromFavorites(${poke.id})">Remove</button>
      <button class="json-btn" onclick='downloadSingleJSON(${JSON.stringify(poke)})'>JSON 📄</button>
      <button class="csv-btn" onclick='downloadSingleCSV(${JSON.stringify(poke)})'>CSV 📊</button>
      <button class="info-btn" onclick="goToDetails(${poke.id})">More Info ℹ</button>
    `;

    container.appendChild(card);
  });
}

// Load Pokémon stats
function loadStats(pokemonId) {
  const statsContainer = document.getElementById(`stats-${pokemonId}`);
  if (!statsContainer) return;

  if (statsContainer.style.display === "block") {
    statsContainer.style.display = "none";
    statsContainer.innerHTML = "";
    return;
  }

  fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.stats) return;

      const statsList = data.stats.map(stat => {
        return `<li><strong>${stat.stat.name}:</strong> ${stat.base_stat}</li>`;
      }).join("");

      statsContainer.innerHTML = `
        <p><strong>Stats:</strong></p>
        <ul>${statsList}</ul>
      `;
      statsContainer.style.display = "block";
    })
    .catch(err => {
      console.error("Failed to load stats:", err);
      statsContainer.innerHTML = "<p style='color:red;'>Failed to load stats.</p>";
      statsContainer.style.display = "block";
    });
}

// Remove a Pokémon from favorites
function removeFromFavorites(pokemonId) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("You must be logged in to remove favorites.");
    return;
  }

  const key = `favorites_${user.id}`;
  let favorites = JSON.parse(localStorage.getItem(key) || "[]");
  favorites = favorites.filter(p => p.id !== pokemonId);
  localStorage.setItem(key, JSON.stringify(favorites));

  fetch(`http://localhost:3000/users/${user.id}/favorites/${pokemonId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Pokémon removed from favorites.");
        const card = document.getElementById(`card-${pokemonId}`);
        if (card) card.remove();
      } else {
        console.error("Server error:", data.message);
      }
    })
    .catch(err => {
      console.error("Network error:", err);
    });
}

// Download single Pokémon as JSON
function downloadSingleJSON(poke) {
  const blob = new Blob([JSON.stringify(poke, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${poke.name || "pokemon"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download single Pokémon as CSV
function downloadSingleCSV(poke) {
  const data = [
    ["ID", poke.id],
    ["Name", poke.name],
    ["Types", (poke.types || []).map(t => t.type?.name).join(", ")],
    ["Abilities", (poke.abilities || []).map(a => a.ability?.name).join(", ")],
    ["Height", poke.height],
    ["Weight", poke.weight],
    ["Base XP", poke.base_experience]
  ];

  const csvContent = data.map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${poke.name || "pokemon"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Go to Pokémon details
function goToDetails(pokemonId) {
  window.location.href = `Poke_Details.html?id=${pokemonId}`;
}

function goBack(){
  window.location.href="index.html";
}
