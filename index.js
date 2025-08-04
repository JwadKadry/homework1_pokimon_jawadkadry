// Load cached autocomplete suggestions or initialize empty
let cachedOptions = JSON.parse(localStorage.getItem("pokeSuggestions")) || {
  name: [],
  type: [],
  ability: []
};

// When the page loads
document.addEventListener("DOMContentLoaded", () => {
  loadLastSearch(); // load previous search if available
  document.getElementById("search_choice").addEventListener("change", loadSuggestions);

  // Add logout/home buttons
  const userData = sessionStorage.getItem("user");
  const headerArea = document.createElement("div");
  headerArea.style.position = "fixed";
  headerArea.style.top = "10px";
  headerArea.style.left = "10px";
  headerArea.style.zIndex = "999";
  headerArea.style.gap = "10px";

  if (userData) {
    const arenaBtn = document.createElement("button");
    arenaBtn.textContent = "🎮 Battle arena";
    arenaBtn.onclick = () => window.location.href = "arena.html";
    arenaBtn.classList.add("arena-button");
    headerArea.appendChild(arenaBtn);
  } else {
    const homeBtn = document.createElement("button");
    homeBtn.textContent = "🏠 Back to Homepage";
    homeBtn.onclick = () => window.location.href = "homepage.html";
    headerArea.appendChild(homeBtn);
  }

  document.body.appendChild(headerArea);
});

// Get auth headers
function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Load autocomplete suggestions
function loadSuggestions() {
  return new Promise((resolve) => {
    const searchChoice = document.getElementById("search_choice").value;
    const input = document.getElementById("searchInput");

    input.value = "";

    if (cachedOptions[searchChoice]?.length > 0) {
      updateDatalist(cachedOptions[searchChoice]);
      resolve();
      return;
    }

    const url = searchChoice === "name"
      ? "https://pokeapi.co/api/v2/pokemon?limit=10000"
      : `https://pokeapi.co/api/v2/${searchChoice}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const names = data.results.map(item => item.name);
        cachedOptions[searchChoice] = names;
        localStorage.setItem("pokeSuggestions", JSON.stringify(cachedOptions));
        updateDatalist(names);
        resolve();
      })
      .catch(err => {
        console.error("Error loading suggestions:", err);
        resolve();
      });
  });
}

// Update datalist
function updateDatalist(list) {
  const datalist = document.getElementById("suggestions");
  datalist.innerHTML = list.map(name => `<option value="${name}">`).join("");
}

// Search Pokémon
function searchPokimon() {
  const searchChoice = document.getElementById("search_choice").value;
  const value = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = `<img src="Hourglass.gif" alt="Loading..." style="width:64px;height:64px;">`;

  localStorage.setItem("lastSearch", JSON.stringify({ searchChoice, value }));

  let lastResults = [];

  if (searchChoice === "name") {
    if (!isNaN(value)) {
      fetch(`https://pokeapi.co/api/v2/pokemon/${value}`)
        .then(res => {
          if (!res.ok) throw new Error("No Pokémon found with this ID");
          return res.json();
        })
        .then(poke => {
          resultsDiv.innerHTML = "";
          displayPokemon(poke);
          lastResults.push(cleanPokemonData(poke));
          localStorage.setItem("lastSearchResults", JSON.stringify(lastResults));
        })
        .catch(err => {
          resultsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
        });
      return;
    }

    fetch("https://pokeapi.co/api/v2/pokemon?limit=10000")
      .then(res => res.json())
      .then(data => {
        const matches = data.results.filter(p => p.name.includes(value)).slice(0, 20);
        if (matches.length === 0) throw new Error("No Pokémon found");

        resultsDiv.innerHTML = "";

        let fetches = matches.map(match =>
          fetch(match.url)
            .then(res => res.json())
            .then(poke => {
              displayPokemon(poke);
              lastResults.push(cleanPokemonData(poke));
            })
        );

        Promise.all(fetches).then(() => {
          localStorage.setItem("lastSearchResults", JSON.stringify(lastResults));
        });
      })
      .catch(err => {
        resultsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
      });
  }

  else if (searchChoice === "type" || searchChoice === "ability") {
    fetch(`https://pokeapi.co/api/v2/${searchChoice}`)
      .then(res => res.json())
      .then(data => {
        const matches = data.results.filter(item => item.name.includes(value)).slice(0, 3);
        if (matches.length === 0) throw new Error("No matches found");

        resultsDiv.innerHTML = "";
        let fetches = [];

        matches.forEach(match => {
          fetches.push(
            fetch(match.url)
              .then(res => res.json())
              .then(data => {
                const list = data.pokemon || [];
                return Promise.all(
                  list.slice(0, 15).map(p =>
                    fetch(p.pokemon.url)
                      .then(res => res.json())
                      .then(poke => {
                        displayPokemon(poke);
                        lastResults.push(cleanPokemonData(poke));
                      })
                  )
                );
              })
          );
        });

        Promise.all(fetches).then(() => {
          localStorage.setItem("lastSearchResults", JSON.stringify(lastResults));
        });
      })
      .catch(err => {
        resultsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
      });
  }
}

// Clean Pokémon data
function cleanPokemonData(poke) {
  return {
    id: poke.id,
    name: poke.name,
    sprites: { front_default: poke.sprites?.front_default || "" },
    types: (poke.types || []).map(t =>
      t?.type?.name ? { type: { name: t.type.name } } :
      typeof t === "string" ? { type: { name: t } } : null
    ).filter(Boolean),
    abilities: (poke.abilities || []).map(a =>
      a?.ability?.name ? { ability: { name: a.ability.name } } :
      typeof a === "string" ? { ability: { name: a } } : null
    ).filter(Boolean),
    stats: (poke.stats || []).map(stat => ({
      base_stat: stat.base_stat,
      stat: { name: stat.stat?.name || "Unknown" }
    }))
  };
}

// Display Pokémon
function displayPokemon(pokemon) {
  const container = document.getElementById("results");
  const card = document.createElement("div");
  card.className = "pokemon-card";

  card.innerHTML = `
    <h3>${pokemon.name} (#${pokemon.id})</h3>
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <p><strong>Type: </strong> ${pokemon.types.map(t => t.type.name).join(", ")}</p>
    <p><strong>Ability: </strong> ${pokemon.abilities.map(a => a.ability.name).join(", ")}</p>
    <div class="button-group">
      <button class="favorite" onclick='addToFavorites(${JSON.stringify(pokemon)})'>❤ Add to Favorites</button>
      <button onclick="goToDetails(${pokemon.id})">More Info ℹ</button>
    </div>
  `;
  container.appendChild(card);
}

// Add to favorites
function addToFavorites(pokemon) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("You must be logged in to add to favorites");
    window.location.href = "login.html";
    return;
  }

  const key = `favorites_${user.id}`;
  let favorites = JSON.parse(localStorage.getItem(key) || "[]");
  //limit to 10 pokemon in favorite
  if (favorites.length >= 10) {
    alert("You can only have up to 10 favorite Pokémon.");
    return;
  }

  if (!favorites.find(p => p.id === pokemon.id)) {
    const simplified = cleanPokemonData(pokemon);
    favorites.push(simplified);
    localStorage.setItem(key, JSON.stringify(favorites));

    fetch(`http://localhost:3000/users/${user.id}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(simplified)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(`${pokemon.name} added to favorites!`);
        } else {
          console.error("Server error:", data.message);
        }
      })
      .catch(err => console.error("Network error:", err));
  }
}

// Load last search
function loadLastSearch() {
  const last = JSON.parse(localStorage.getItem("lastSearch"));
  const results = JSON.parse(localStorage.getItem("lastSearchResults"));

  if (last && results && Array.isArray(results)) {
    document.getElementById("search_choice").value = last.searchChoice;
    document.getElementById("searchInput").value = last.value;

    const container = document.getElementById("results");
    container.innerHTML = "";

    results.forEach(pokemon => displayPokemon(pokemon));
  }
}

// Go to favorites
function goToFavorites() {
  const user = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("You must be logged in to view favorites");
    window.location.href = "login.html";
    return;
  }

  window.location.href = "favorite.html";
}

// Go to Pokémon details
function goToDetails(pokemonId) {
  window.location.href = `Poke_Details.html?id=${pokemonId}`;
}

// Logout
function logout() {
  const token = sessionStorage.getItem("token");

  fetch("http://localhost:3000/logout", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log("✅ User logged out and set offline");
    } else {
      console.warn("⚠️ Logout failed on server");
    }
  })
  .catch(err => console.error("❌ Logout error:", err))
  .finally(() => {
    sessionStorage.clear();
    window.location.href = "login.html";
  });
}
