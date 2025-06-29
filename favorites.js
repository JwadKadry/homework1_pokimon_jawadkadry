// בעת טעינת העמוד
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  if (!token || !userId) {
    alert("כדי לגשת למועדפים עליך להתחבר");
    window.location.href = "login.html";
    return;
  }

  loadFavorites(); // טען מועדפים מהשרת
});

async function loadFavorites() {
  const sortBy = document.getElementById("sortSelect").value;
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  try {
    const res = await fetch(`/users/${userId}/favorites`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("שגיאה בקבלת המועדפים");
    let favorites = await res.json();

    // מיון
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
    console.error(err);
    alert("אירעה שגיאה בטעינת המועדפים");
  }
}

async function removeFromFavorites(id) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  try {
    await fetch(`/users/${userId}/favorites/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadFavorites(); // רענון
  } catch (err) {
    console.error(err);
    alert("שגיאה במחיקת מועדף");
  }
}

function goBack() {
  window.location.href = "index.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "homepage.html";
}

function downloadFavorites() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  fetch(`/users/${userId}/favorites/download`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.blob())
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
