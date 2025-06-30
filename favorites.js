// בעת טעינת העמוד
document.addEventListener("DOMContentLoaded", () => {
  const user = sessionStorage.getItem("user");
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("כדי לגשת למועדפים עליך להתחבר");
    window.location.href = "login.html";
    return;
  }

  loadFavorites();
});

// פונקציה לקבלת headers עם טוקן
function getAuthHeaders() {
  const token = sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// טוען את המועדפים מהשרת ומציג אותם
function loadFavorites() {
  const sortBy = document.getElementById("sortSelect").value;
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user || !user.id) return;
  const key = `favorites_${user.id}`;

  fetch(`http://localhost:3000/users/${user.id}/favorites`)
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
      console.error("שגיאה בטעינת מועדפים מהשרת:", err);
    });
}



// מציג את רשימת הפוקימונים על המסך
function displayFavorites(favorites) {
  const container = document.getElementById("favoritesList");
  container.innerHTML = "";

  if (!favorites || favorites.length === 0) {
    container.innerHTML = "<p>אין פוקימונים מועדפים עדיין.</p>";
    return;
  }

  favorites.forEach(poke => {
    const imageUrl = poke.sprites?.front_default || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png";

    const types = Array.isArray(poke.types)
      ? poke.types
          .filter(t => t && t.type && t.type.name)
          .map(t => t.type.name)
          .join(", ")
      : "לא ידוע";

    const abilities = Array.isArray(poke.abilities)
      ? poke.abilities
          .filter(a => a && a.ability && a.ability.name)
          .map(a => a.ability.name)
          .join(", ")
      : "לא ידוע";

    const card = document.createElement("div");
    card.className = "card";
    card.id = `card-${poke.id}`;

    card.innerHTML = `
      <h3>${poke.name || "ללא שם"} (#${poke.id || "?"})</h3>
      <img src="${imageUrl}" alt="${poke.name}" />
      <p><strong>סוגים:</strong> ${types}</p>
      <p><strong>יכולות:</strong> ${abilities}</p>
      <button class="remove-btn" onclick="removeFromFavorites(${poke.id})">הסר</button>
    `;

    container.appendChild(card);
  });
}



// הסרת פוקימון מהמועדפים
function removeFromFavorites(pokemonId) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  if (!user) {
    alert("כדי להסיר ממועדפים עליך להתחבר");
    return;
  }

  const key = `favorites_${user.id}`;
  let favorites = JSON.parse(localStorage.getItem(key) || "[]");

  // הסרה מה-localStorage
  favorites = favorites.filter(p => p.id !== pokemonId);
  localStorage.setItem(key, JSON.stringify(favorites));

  // הסרה מהשרת
  fetch(`http://localhost:3000/users/${user.id}/favorites/${pokemonId}`, {
    method: "DELETE",
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("הפוקימון הוסר מהמועדפים!");

        // הסרה מה־DOM
        const card = document.getElementById(`card-${pokemonId}`);
        if (card) {
          card.remove();
        }
      } else {
        console.error("שגיאה:", data.message);
      }
    })
    .catch(err => {
      console.error("שגיאת רשת:", err);
    });
}

// חזרה לחיפוש
function goBack() {
  window.location.href = "index.html";
}

// הורדת JSON של מועדפים
function downloadFavoritesJSON() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const key = `favorites_${user.id}`;
  const favorites = JSON.parse(localStorage.getItem(key) || "[]");

  const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "favorites.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// הורדת CSV דרך השרת
function downloadFavorites() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("כדי להוריד את המועדפים עליך להתחבר");
    return;
  }

  fetch(`/users/${user.id}/favorites/download`, {
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favorites.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);
      alert("שגיאה בהורדת קובץ CSV");
    });
}

// יציאה מהמערכת
function logout() {
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("token");
  window.location.href = "homepage.html";
}

function downloadFavoritesCSV() {
  const user = JSON.parse(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("token");

  if (!user || !token) {
    alert("כדי להוריד את המועדפים עליך להתחבר");
    return;
  }

  fetch(`/users/${user.id}/favorites/download`, {
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "favorites.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);
      alert("שגיאה בהורדת קובץ CSV");
    });
}

