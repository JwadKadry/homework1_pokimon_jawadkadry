// Fetch developers.json from the server and populate the list
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
