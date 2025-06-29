// Fetch developers.json from the server and populate the list
// טען את רשימת המפתחים
fetch('developers.json')
  .then(response => {
    if (!response.ok) throw new Error('Unable to load developers data');
    return response.json();
  })
  .then(developers => {
    const devList = document.getElementById('devList');
    developers.forEach(({ name, id }) => {
      const li = document.createElement('li');
      li.textContent = `${name} – ID: ${id}`;
      devList.appendChild(li);
    });
  })
  .catch(error => {
    console.error('Error fetching developers:', error);
    const devList = document.getElementById('devList');
    devList.innerHTML = '<li>Error loading developers list</li>';
  });


// תפעול משתמש
document.addEventListener("DOMContentLoaded", () => {
  const userData = sessionStorage.getItem("user");
  const nav = document.querySelector(".top-nav nav");
  const container = document.querySelector(".container");

  // הצגת שם משתמש אם מחובר
  if (userData) {
    const user = JSON.parse(userData);
    const welcome = document.createElement("span");
    welcome.textContent = `שלום, ${user.name}`;
    welcome.style.marginRight = "20px";
    welcome.style.fontWeight = "bold";
    nav.appendChild(welcome);

    // כפתור התנתקות
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🔓 התנתק";
    logoutBtn.style.marginRight = "10px";
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("user");
      window.location.href = "homepage.html";
    };
    nav.appendChild(logoutBtn);
  }

  /*// כפתור מעבר לחיפוש
  const toSearchBtn = document.createElement("button");
  toSearchBtn.textContent = "🔍 עבור לעמוד החיפוש";
  toSearchBtn.onclick = () => window.location.href = "index.html";
  container.appendChild(toSearchBtn);

  // כפתור מעבר למועדפים – רק אם מחובר
  const toFavoritesBtn = document.createElement("button");
  toFavoritesBtn.textContent = "💛 עבור למועדפים שלי";
  toFavoritesBtn.onclick = () => {
    if (!userData) {
      alert("יש להתחבר כדי לגשת למועדפים");
      window.location.href = "login.html";
    } else {
      window.location.href = "favorites.html";
    }
  };
  container.appendChild(toFavoritesBtn);*/
});
