// Fetch the developers.json from the server and populate the list
fetch('developers.json')
  .then(res => {
    if (!res.ok) throw new Error('Unable to load developers data');
    return res.json();
  })
  .then(data => {
    const ul = document.getElementById('devList');
    data.forEach(dev => {
      const li = document.createElement('li');
      // Insert developer name and ID
      li.textContent = `${dev.name} – ת.ז: ${dev.id}`;
      ul.appendChild(li);
    });
  })
  .catch(err => {
    console.error(err);
    const ul = document.getElementById('devList');
    ul.innerHTML = '<li>שגיאה בטעינת רשימת המפתחים</li>';
  });
