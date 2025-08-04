document.addEventListener("DOMContentLoaded", () => {
  const userData = sessionStorage.getItem("user");
  const nav = document.querySelector(".top-nav nav");

  // If user is logged in – add greeting and buttons
  if (userData) {
    const user = JSON.parse(userData);

    const welcome = document.createElement("span");
    welcome.textContent = `Hello, ${user.name}`;
    welcome.style.marginRight = "20px";
    welcome.style.fontWeight = "bold";
    nav.appendChild(welcome);

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🔓 Logout";
    logoutBtn.style.marginRight = "10px";
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("user");
      window.location.href = "homepage.html";
    };
    nav.appendChild(logoutBtn);

    const arenaBtn = document.createElement("button");
    arenaBtn.textContent = "🎮 Battle Arena";
    arenaBtn.style.marginRight = "10px";
    arenaBtn.onclick = () => {
      window.location.href = "arena.html";
    };
    nav.appendChild(arenaBtn);

    // Show arena button section
    document.getElementById("arenaButton").classList.remove("hidden");
  }

  // Load intro & overview from homepageData.json
  fetch("/api/homepage")
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const { intro, overview } = data;

    // Render intro
    const introEl = document.getElementById("intro");
    if (introEl && intro) {
      introEl.innerHTML = `
        <h2>${intro.title}</h2>
        <p>${intro.paragraph}</p>
      `;
    }

    // Render overview
    const overviewEl = document.getElementById("overview");
    if (overviewEl && overview) {
      const featuresList = (overview.features || [])
        .map(feature => `<li>${feature}</li>`)
        .join("");

      const techList = (overview.technologies || [])
        .map(tech => `<li>${tech}</li>`)
        .join("");

      overviewEl.innerHTML = `
        <h2>${overview.title}</h2>
        <p>${overview.description}</p>
        <h3>Key Features:</h3>
        <ul>${featuresList}</ul>
        <h3>Technologies:</h3>
        <ul>${techList}</ul>
      `;
    }
  })
  .catch(error => {
    console.error("❌ Failed to load homepage data:", error);
    const introEl = document.getElementById("intro");
    const overviewEl = document.getElementById("overview");

    if (introEl) {
      introEl.innerHTML = "<p style='color:red;'>Failed to load intro section.</p>";
    }
    if (overviewEl) {
      overviewEl.innerHTML = "<p style='color:red;'>Failed to load overview section.</p>";
    }
  });

  // Load developer list
  fetch('/api/developers')
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
