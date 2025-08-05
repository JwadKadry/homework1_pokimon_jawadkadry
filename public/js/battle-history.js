document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user?.id) {
      alert("You must be logged in to view battles.");
      return window.location.href = "login";
    }
  
    fetch(`/users/${user.id}/battles`)
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("#battleTable tbody");
        if (!Array.isArray(data) || !data.length) {
          tbody.innerHTML = "<tr><td colspan='5'>No battles yet</td></tr>";
          return;
        }
  
        data.reverse().forEach((battle, idx) => {
          const tr = document.createElement("tr");
          const date = new Date(battle.date).toLocaleString('en-GB');
          const resultClass = battle.result === "win" ? "win"
                            : battle.result === "draw" ? "draw" : "loss";
  
          tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${date}</td>
            <td class="${resultClass}">${battle.result === "win" ? "Win" :
                                         battle.result === "draw" ? "Draw" : "Loss"}</td>
            <td>${battle.pokemonName || "-"}</td>
            <td>${battle.mode === "bot" ? "Bot 🤖" : "Player 🎮"}</td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Error loading battle history:", err);
        alert("Failed to load battle history");
      });
  });
  