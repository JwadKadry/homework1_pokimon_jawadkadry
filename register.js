// Grab form and input elements
const form = document.getElementById('registerForm');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Reset validation states
  [nameInput, emailInput, passwordInput, confirmInput].forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
    const inv = input.parentElement.querySelector('.invalid-feedback');
    const val = input.parentElement.querySelector('.valid-feedback');
    if (inv) inv.style.display = 'none';
    if (val) val.style.display = 'none';
  });

  let valid = true;

  // --- Name validation ---
  const nameRegex = /^[A-Za-z\s]+$/;
  if (!nameRegex.test(nameInput.value.trim())) {
    valid = false;
    nameInput.classList.add('is-invalid');
    nameInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    nameInput.classList.add('is-valid');
    nameInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  // --- Email validation ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    valid = false;
    emailInput.classList.add('is-invalid');
    emailInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    emailInput.classList.add('is-valid');
    emailInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  // --- Password validation ---
  // 7–15 chars, at least one uppercase, one lowercase and one special
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
  if (!passwordRegex.test(passwordInput.value)) {
    valid = false;
    passwordInput.classList.add('is-invalid');
    passwordInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    passwordInput.classList.add('is-valid');
    passwordInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  // --- Confirm password ---
  if (confirmInput.value !== passwordInput.value) {
    valid = false;
    confirmInput.classList.add('is-invalid');
    confirmInput.parentElement.querySelector('.invalid-feedback').style.display = 'block';
  } else {
    confirmInput.classList.add('is-valid');
    confirmInput.parentElement.querySelector('.valid-feedback').style.display = 'block';
  }

  if (!valid) return;  // stop if any validation failed

  // Prepare payload
  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  // Send to server
  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.success) {
      alert('Registration successful! Redirecting to login...');
      window.location.href = 'login.html';
    } else {
      alert(`Error: ${result.message}`);
    }

    // Reset form & states
    form.reset();
    [nameInput, emailInput, passwordInput, confirmInput].forEach(i => i.classList.remove('is-valid'));
  } catch (err) {
    console.error('Network error:', err);
    alert('Network error. Please try again later.');
  }
});
