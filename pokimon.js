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
});

// Load autocomplete suggestions based on selected search type
function loadSuggestions() {
  return new Promise((resolve) => {
    const searchChoice = document.getElementById("search_choice").value;
    const input = document.getElementById("searchInput");
    const datalist = document.getElementById("suggestions");

    input.value = ""; // clear input on search type change

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

// Update datalist with suggestions
function updateDatalist(list) {
  const datalist = document.getElementById("suggestions");
  datalist.innerHTML = list.map(name => `<option value="${name}">`).join("");
}

// Search Pokémon based on input and type
function searchPokimon() {
  const searchChoice = document.getElementById("search_choice").value;
  const value = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = `<img src="Hourglass.gif" alt="Loading..." style="width:64px;height:64px;">`;

  localStorage.setItem("lastSearch", JSON.stringify({ searchChoice, value }));

  let lastResults = [];

  // By name or ID
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

    // Partial name match
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

  // By type or ability
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

// Clean data for saving to localStorage
function cleanPokemonData(poke) {
  return {
    id: poke.id,
    name: poke.name,
    sprites: { front_default: poke.sprites.front_default },
    types: poke.types,
    abilities: poke.abilities
  };
}

// Display a Pokémon card on the screen
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
      <button class="favorite" onclick='addToFavorites(${JSON.stringify(pokemon)})'>❤️ Add to Favorites</button>
      <button onclick="goToDetails(${pokemon.id})">More Info ℹ️</button>
    </div>
  `;
  container.appendChild(card);
}

// Add Pokémon to favorites (local + server)
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

  if (!favorites.find(p => p.id === pokemon.id)) {
    favorites.push({
      id: pokemon.id,
      name: pokemon.name,
      sprites: pokemon.sprites,
      types: pokemon.types,
      abilities: pokemon.abilities
    });
    localStorage.setItem(key, JSON.stringify(favorites));

    fetch(`http://localhost:3000/users/${user.id}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: pokemon.id,
        name: pokemon.name,
        sprites: pokemon.sprites,
        types: pokemon.types,
        abilities: pokemon.abilities
      }),
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

// Load last search and results
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

// Navigate to favorites page
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

// Navigate to Pokémon details page
function goToDetails(pokemonId) {
  window.location.href = `Poke_Details.html?id=${pokemonId}`;
}

// Logout user
function logout() {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
  window.location.href = "homepage.html";
}

// Display logout or home button in top-left corner
document.addEventListener("DOMContentLoaded", () => {
  const userData = sessionStorage.getItem("user");
  const headerArea = document.createElement("div");
  headerArea.style.position = "fixed";
  headerArea.style.top = "10px";
  headerArea.style.left = "10px";
  headerArea.style.zIndex = "999";

  if (userData) {
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🔓 Logout";
    logoutBtn.onclick = logout;
    headerArea.appendChild(logoutBtn);
  } else {
    const homeBtn = document.createElement("button");
    homeBtn.textContent = "🏠 Back to Homepage";
    homeBtn.onclick = () => window.location.href = "homepage.html";
    headerArea.appendChild(homeBtn);
  }

  document.body.appendChild(headerArea);
});
