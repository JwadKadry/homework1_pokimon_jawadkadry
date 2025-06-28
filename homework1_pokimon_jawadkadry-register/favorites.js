// ברגע שהעמוד נטען, טען את רשימת המועדפים והצג אותם
document.addEventListener("DOMContentLoaded", () => {
  loadFavorites();
});

// טוען את רשימת הפוקימונים המועדפים מה-localStorage ומציג אותם לפי סדר שנבחר
function loadFavorites() {
  const sortBy = document.getElementById("sortSelect").value; // לפי מה למיין (שם / מספר)
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]"); // טען את רשימת המועדפים

  // מיון הפוקימונים לפי שם או מספר מזהה
  if (sortBy === "name") {
    favorites.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "id") {
    favorites.sort((a, b) => a.id - b.id);
  }

  const container = document.getElementById("favoritesList");
  container.innerHTML = ""; // נקה תצוגה קודמת

  // אם אין מועדפים – הצג הודעה מתאימה
  if (favorites.length === 0) {
    container.innerHTML = "<p>אין פוקימונים מועדפים עדיין.</p>";
    return;
  }

  // עבור כל פוקימון במועדפים – צור כרטיס HTML והצג אותו
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
    container.appendChild(card); // הוסף את הכרטיס לתוך הדיב הראשי
  });
}

// מסיר פוקימון מהרשימה לפי מזהה (id)
function removeFromFavorites(id) {
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  favorites = favorites.filter(p => p.id !== id); // מסנן את הפוקימון שרוצים להסיר
  localStorage.setItem("favorites", JSON.stringify(favorites)); // שמור מחדש
  loadFavorites(); // רענן את התצוגה
}

// מחזיר לעמוד החיפוש
function goBack() {
  window.location.href = "index.html";
}

// יוצר קובץ JSON להורדה עם רשימת המועדפים
function downloadFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  // צור אלמנט קישור זמני להורדה
  const a = document.createElement("a");
  a.href = url;
  a.download = "favorites.json";
  document.body.appendChild(a);
  a.click(); // הפעל הורדה
  document.body.removeChild(a); // מחק את הקישור
  URL.revokeObjectURL(url); // שחרר את המשאב מהזיכרון
}
