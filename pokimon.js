// get suggestions from localStorage or set empty arrays
let cachedOptions = JSON.parse(localStorage.getItem("pokeSuggestions")) || {
  name: [],
  type: [],
  ability: []
};

// ברגע שהעמוד נטען:
document.addEventListener("DOMContentLoaded", () => {
  // טען חיפוש אחרון אם קיים
  loadLastSearch();

  // טען הצעות מחדש כאשר המשתמש מחליף שיטת חיפוש (שם / סוג / יכולת)
  document.getElementById("search_choice").addEventListener("change", loadSuggestions);
});

// טוען הצעות להשלמה אוטומטית לשדה החיפוש
function loadSuggestions() {
  return new Promise((resolve) => {
    const searchChoice = document.getElementById("search_choice").value;
    const input = document.getElementById("searchInput");
    const datalist = document.getElementById("suggestions");

    // אפס את שדה החיפוש כאשר משנים סוג חיפוש
    input.value = "";

    // אם כבר יש הצעות בזיכרון – טען משם
    if (cachedOptions[searchChoice]?.length > 0) {
      updateDatalist(cachedOptions[searchChoice]);
      resolve();
      return;
    }

    // URL בהתאם לשיטת החיפוש
    const url = searchChoice === "name"
      ? "https://pokeapi.co/api/v2/pokemon?limit=10000"
      : `https://pokeapi.co/api/v2/${searchChoice}`;

    // שלח בקשה ל־API
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
        resolve(); // גם במקרה של שגיאה נמשיך
      });
  });
}

// מעדכן את datalist עם ההצעות שקיבלנו
function updateDatalist(list) {
  const datalist = document.getElementById("suggestions");
  datalist.innerHTML = list.map(name => `<option value="${name}">`).join("");
}

// מבצע חיפוש לפי שם/מספר/סוג/יכולת
function searchPokimon() {
  const searchChoice = document.getElementById("search_choice").value;
  const value = document.getElementById("searchInput").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");

  // הצגת אנימציית טוען
  resultsDiv.innerHTML = `<img src="Hourglass.gif" alt="טוען..." style="width:64px;height:64px;">`;

  // שמירת חיפוש אחרון
  localStorage.setItem("lastSearch", JSON.stringify({ searchChoice, value }));

  let lastResults = []; // שמירה לתוצאות

  // חיפוש לפי שם או מספר
  if (searchChoice === "name") {
    if (!isNaN(value)) {
      // אם המשתמש הקליד מספר פוקימון
      fetch(`https://pokeapi.co/api/v2/pokemon/${value}`)
        .then(res => {
          if (!res.ok) throw new Error("לא נמצא פוקימון עם מספר זה");
          return res.json();
        })
        .then(poke => {
          resultsDiv.innerHTML = "";
          displayPokemon(poke);
          // שמירה
          lastResults.push(cleanPokemonData(poke));
          localStorage.setItem("lastSearchResults", JSON.stringify(lastResults));
        })
        .catch(err => {
          resultsDiv.innerHTML = `<p style="color:red;">${err.message}</p>`;
        });
      return;
    }

    // חיפוש לפי חלק משם
    fetch("https://pokeapi.co/api/v2/pokemon?limit=10000")
      .then(res => res.json())
      .then(data => {
        //
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
  }

  // חיפוש לפי סוג או יכולת
  else if (searchChoice === "type" || searchChoice === "ability") {
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

// מנקה אובייקט פוקימון לפני שמירה ב־localStorage
function cleanPokemonData(poke) {
  return {
    id: poke.id,
    name: poke.name,
    sprites: { front_default: poke.sprites.front_default },
    types: poke.types,
    abilities: poke.abilities
  };
}

// מציג כרטיס של פוקימון על המסך
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

// מוסיף פוקימון לרשימת מועדפים
function addToFavorites(pokemon) {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  fetch(`/users/${userId}/favorites`, {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(pokemon)
  })
  .then(res => {
    if (!res.ok) throw new Error('failed');
    alert(`${pokemon.name} נוסף למועדפים!`);
  });
}


// טוען את החיפוש האחרון מה־localStorage ומציג את התוצאות
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

// מעבר לעמוד המועדפים
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
  sessionStorage.removeItem("user");
  window.location.href = "homepage.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const userData = sessionStorage.getItem("user");
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
