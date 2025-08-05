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

  // Password validation
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
  if (!passwordRegex.test(passwordInput.value)) {
    valid = false;
    passwordInput.classList.add('is-invalid');
    passwordInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    passwordInput.classList.add('is-valid');
    passwordInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    valid = false;
    emailInput.classList.add('is-invalid');
    emailInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    emailInput.classList.add('is-valid');
    emailInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  if (!valid) return;

  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok || !result.token) {
      alert(result.message || 'Login failed');
      return;
    }

    // Save user and token in sessionStorage
    sessionStorage.setItem('user', JSON.stringify(result.user));
    sessionStorage.setItem('token', result.token);

    window.location.href = 'index';

  } catch (err) {
    console.error('Network error:', err);
    alert('Network error. Please try again later.');
  }
});
