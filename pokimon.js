// get suggestions from localStorage or set empty arrays
let cachedOptions = JSON.parse(localStorage.getItem("pokeSuggestions")) || {
  name: [],
  type: [],
  ability: []
};

// בעת טעינת העמוד
document.addEventListener("DOMContentLoaded", () => {
  loadLastSearch();
  document.getElementById("search_choice").addEventListener("change", loadSuggestions);

  const userData = localStorage.getItem("user");
  const headerArea = document.createElement("div");
  headerArea.style.position = "fixed";
  headerArea.style.top = "10px";
  headerArea.style.left = "10px";
  headerArea.style.zIndex = "999";

  if (userData) {
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🔓 התנתק";
    logoutBtn.onclick = logout;
    headerArea.appendChild(logoutBtn);
  } else {
    const homeBtn = document.createElement("button");
    homeBtn.textContent = "🏠 חזור לדף הבית";
    homeBtn.onclick = () => window.location.href = "homepage.html";
    headerArea.appendChild(homeBtn);
  }

  document.body.appendChild(headerArea);
});

// טוען הצעות autocomplete לפי שיטת החיפוש
function loadSuggestions() {
  return new Promise((resolve) => {
    const searchChoice = document.getElementById("search_choice").value;
    const input = document.getElementById("searchInput");
    const datalist = document.getElementById("suggestions");

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
        console.error("שגיאה בטעינת הצעות:", err);
        resolve();
      });
  });
}

function updateDatalist(list) {
  const datalist = document.getElementById("suggestions");
  datalist.innerHTML = list.map(name => `<option value="${name}">`).join("");
}

function searchPokimon() {
  const searchChoice = document.getElementById("search_choice").value;
  const value = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = `<img src="Hourglass.gif" alt="טוען..." style="width:64px;height:64px;">`;
  localStorage.setItem("lastSearch", JSON.stringify({ searchChoice, value }));

  let lastResults = [];

  if (searchChoice === "name") {
    if (!isNaN(value)) {
      fetch(`https://pokeapi.co/api/v2/pokemon/${value}`)
        .then(res => {
          if (!res.ok) throw new Error("לא נמצא פוקימון עם מספר זה");
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
        if (matches.length === 0) throw new Error("לא נמצאו פוקימונים");
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
  } else if (searchChoice === "type" || searchChoice === "ability") {
    fetch(`https://pokeapi.co/api/v2/${searchChoice}`)
      .then(res => res.json())
      .then(data => {
        const matches = data.results
          .filter(item => item.name.includes(value))
          .slice(0, 3);

        if (matches.length === 0) throw new Error("לא נמצאו תוצאות");

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

function cleanPokemonData(poke) {
  return {
    id: poke.id,
    name: poke.name,
    sprites: { front_default: poke.sprites.front_default },
    types: poke.types,
    abilities: poke.abilities
  };
}

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
      <button class="favorite" onclick='addToFavorites(${JSON.stringify(pokemon)})'>💛 הוסף למועדפים</button>
      <button onclick='showDetails(${JSON.stringify(pokemon)})'>פרטים נוספים</button>
    </div>
  `;
  container.appendChild(card);
}

function addToFavorites(pokemon) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    alert("עליך להתחבר כדי להוסיף מועדפים");
    window.location.href = "login.html";
    return;
  }

  const clean = cleanPokemonData(pokemon);

  fetch(`http://localhost:3000/users/${userId}/favorites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(clean)
  })
    .then(res => {
      if (!res.ok) throw new Error("שגיאה בהוספת מועדף");
      alert(`${pokemon.name} נוסף למועדפים!`);
    })
    .catch(err => {
      console.error("שגיאה:", err);
      alert("לא ניתן להוסיף למועדפים");
    });
}

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

function gotothefavorites() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    alert("כדי לצפות במועדפים עליך להתחבר");
    window.location.href = "login.html";
    return;
  }

  window.location.href = "favorite.html";
}

function showDetails(pokemon) {
  const modal = document.getElementById("pokemonModal");
  const content = document.getElementById("modalDetails");

  const abilities = pokemon.abilities.map(a => a.ability.name).join("<br>");
  const types = pokemon.types.map(t => t.type.name).join(", ");

  content.innerHTML = `
    <h2>${pokemon.name} #${pokemon.id}</h2>
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <p><strong>סוגים:</strong> ${types}</p>
    <p><strong>יכולות:</strong><br>${abilities}</p>
    <p><strong>גובה:</strong> ${pokemon.height / 10} מטר</p>
    <p><strong>משקל:</strong> ${pokemon.weight / 10} ק"ג</p>
    <p><strong>סטטיסטיקות:</strong></p>
    ${pokemon.stats.map(s => `
      <div>
        ${s.stat.name}: ${s.base_stat}
        <div style="background:#eee; height:6px; border-radius:4px;">
          <div style="width:${s.base_stat}px; height:6px; background:blue;"></div>
        </div>
      </div>
    `).join("")}
  `;

  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("pokemonModal").style.display = "none";
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "homepage.html";
}
