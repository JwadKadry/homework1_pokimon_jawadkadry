document.addEventListener("DOMContentLoaded", () => {
    fetch('/arena/leaderboard')
      .then(res => res.json())
      .then(data => {
        const tbody = document.querySelector("#leaderboard tbody");
        tbody.innerHTML = "";
  
        data.forEach((user, index) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${user.name}</td>
            <td>${user.points}</td>
            <td>${user.battles}</td>
            <td>${user.wins}</td>
            <td>${user.draws}</td>
            <td>${user.losses}</td>
            <td>${user.successRate}%</td>
          `;
          tbody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Error loading leaderboard:", err);
      });
  });
  