document.addEventListener("DOMContentLoaded", () => {
  const userData = sessionStorage.getItem("user");
  const nav = document.querySelector(".top-nav nav");

  // If the user is logged in – show greeting and action buttons
  if (userData) {
    const user = JSON.parse(userData);

    // Display user name
    const welcome = document.createElement("span");
    welcome.textContent = `Hello, ${user.name}`;
    welcome.style.marginRight = "20px";
    welcome.style.fontWeight = "bold";
    nav.appendChild(welcome);

    // Logout button
    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🔓 Logout";
    logoutBtn.style.marginRight = "10px";
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("user");
      window.location.href = "homepage.html";
    };
    nav.appendChild(logoutBtn);

    // Arena button
    const arenaBtn = document.createElement("button");
    arenaBtn.textContent = "🎮 Battle Arena";
    arenaBtn.style.marginRight = "10px";
    arenaBtn.onclick = () => {
      window.location.href = "arena.html";
    };
    nav.appendChild(arenaBtn);
  }

  // Load developer list
  fetch('developers.json')
    .then(response => {
      if (!response.ok) throw new Error('Unable to load developers data');
      return response.json();
    })
    .then(developers => {
      const devList = document.getElementById('devList');
      devList.innerHTML = ''; // Clear to prevent duplicates
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
