// Grab form and inputs
const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Reset validation visuals
  [emailInput, passwordInput].forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
    const inv = input.parentElement.querySelector('.invalid-feedback');
    const val = input.parentElement.querySelector('.valid-feedback');
    if (inv) inv.style.display = 'none';
    if (val) val.style.display = 'none';
  });

  let valid = true;

  // Password: 7–15 chars, 1 uppercase, 1 lowercase, 1 special
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
  if (!passwordRegex.test(passwordInput.value)) {
    valid = false;
    passwordInput.classList.add('is-invalid');
    passwordInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    passwordInput.classList.add('is-valid');
    passwordInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    valid = false;
    emailInput.classList.add('is-invalid');
    emailInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    emailInput.classList.add('is-valid');
    emailInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  if (!valid) return;  // stop if client-side validation failed

  // Prepare payload
  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  try {
    // Send login request
    const res = await fetch('http://localhost:3000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const result = await res.json();

    if (!result.success) {
      // login failed on the server
      alert(result.message || 'Invalid email or password');
      return;
    }

    // login succeeded → save user in sessionStorage
    localStorage.setItem('token', result.token);         // אם יש
    localStorage.setItem('userId', result.user.id);
    localStorage.setItem('user', JSON.stringify(result.user));

    // redirect to search page
    window.location.href = 'index.html';

  } catch (err) {
    console.error('Network error:', err);
    alert('Network error. Please try again later.');
  }
});

