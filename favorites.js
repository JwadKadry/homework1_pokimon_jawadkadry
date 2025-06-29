document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!user || !userId || !token) {
    alert("כדי לגשת למועדפים עליך להתחבר");
    window.location.href = "login.html";
    return;
  }

  loadFavorites(userId, token);
});

async function loadFavorites(userId, token) {
  const sortBy = document.getElementById("sortSelect").value;

  try {
    const res = await fetch(`http://localhost:3000/users/${userId}/favorites`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("שגיאה בקבלת המועדפים");

    const favorites = await res.json();

    // מיון לפי סוג מיון נבחר
    if (sortBy === "name") {
      favorites.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "id") {
      favorites.sort((a, b) => a.id - b.id);
    }

    const container = document.getElementById("favoritesList");
    container.innerHTML = "";

    if (favorites.length === 0) {
      container.innerHTML = "<p>אין פוקימונים מועדפים עדיין.</p>";
      return;
    }

    favorites.forEach(poke => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${poke.name} (#${poke.id})</h3>
        <img src="${poke.sprites.front_default}" alt="${poke.name}">
        <p><strong>סוגים:</strong> ${poke.types.map(t => t.type.name).join(", ")}</p>
        <p><strong>יכולות:</strong> ${poke.abilities.map(a => a.ability.name).join(", ")}</p>
        <button class="remove-btn" onclick="removeFromFavorites(${poke.id})">הסר</button>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("שגיאה בטעינת מועדפים:", err);
  }
}

function removeFromFavorites(id) {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  fetch(`http://localhost:3000/users/${userId}/favorites/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(() => loadFavorites(userId, token))
    .catch(err => console.error("שגיאה בהסרה:", err));
}

function goBack() {
  window.location.href = "index.html";
}

function downloadFavorites() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  fetch(`http://localhost:3000/users/${userId}/favorites`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("שגיאה בקבלת קובץ JSON");
      return res.json();
    })
    .then(favorites => {
      const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "favorites.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    })
    .catch(err => console.error("שגיאה בהורדת המועדפים:", err));
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  localStorage.removeItem("token");
  window.location.href = "homepage.html";
}
