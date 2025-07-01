document.addEventListener("DOMContentLoaded", () => {
  const userData = sessionStorage.getItem("user");
  const nav = document.querySelector(".top-nav nav");

  // אם המשתמש מחובר – הצג ברכה וכפתורי פעולה
  if (userData) {
    const user = JSON.parse(userData);

    // הצגת שם משתמש
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

    // כפתור זירת הקרבות
    const arenaBtn = document.createElement("button");
    arenaBtn.textContent = "🎮 זירת הקרבות";
    arenaBtn.style.marginRight = "10px";
    arenaBtn.onclick = () => {
      window.location.href = "arena.html";
    };
    nav.appendChild(arenaBtn);
  }

  // טען את רשימת המפתחים
  fetch('developers.json')
    .then(response => {
      if (!response.ok) throw new Error('Unable to load developers data');
      return response.json();
    })
    .then(developers => {
      const devList = document.getElementById('devList');
      devList.innerHTML = ''; // ניקוי קודם למניעת כפילות
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
});
