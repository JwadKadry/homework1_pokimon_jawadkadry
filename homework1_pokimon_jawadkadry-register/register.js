// Get form and input fields
let form = document.getElementById("registerForm");
let input_name = document.getElementById("name");
let input_email = document.getElementById("email");
let input_password = document.getElementById("password");
let confirm_pass = document.getElementById("confirm");

form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset all validation styles
    input_name.classList.remove("is-valid", "is-invalid");
    input_email.classList.remove("is-valid", "is-invalid");
    input_password.classList.remove("is-valid", "is-invalid");
    confirm_pass.classList.remove("is-valid", "is-invalid");

    let nameInvalidFeedback = input_name.parentElement.querySelector(".invalid-feedback");
    let nameValidFeedback = input_name.parentElement.querySelector(".valid-feedback");
    let emailInvalidFeedback = input_email.parentElement.querySelector(".invalid-feedback");
    let emailValidFeedback = input_email.parentElement.querySelector(".valid-feedback");
    let passwordInvalidFeedback = input_password.parentElement.querySelector(".invalid-feedback");
    let passwordValidFeedback = input_password.parentElement.querySelector(".valid-feedback");
    let confirmPassInvalidFeedback = confirm_pass.parentElement.querySelector(".invalid-feedback");
    let confirmPassValidFeedback = confirm_pass.parentElement.querySelector(".valid-feedback");

    nameInvalidFeedback.style.display = "none";
    nameValidFeedback.style.display = "none";
    emailInvalidFeedback.style.display = "none";
    emailValidFeedback.style.display = "none";
    passwordInvalidFeedback.style.display = "none";
    passwordValidFeedback.style.display = "none";
    confirmPassInvalidFeedback.style.display = "none";
    confirmPassValidFeedback.style.display = "none";

    let valid = true;

    // Name validation
    const nameRegex = /^[A-Za-z\s]+$/;
    if (input_name.value.length > 50 || !nameRegex.test(input_name.value)) {
        valid = false;
        input_name.classList.add("is-invalid");
        nameInvalidFeedback.style.display = "block";
    } else {
        input_name.classList.add("is-valid");
        nameValidFeedback.style.display = "block";
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{7,15}$/;
    if (!passwordRegex.test(input_password.value)) {
        valid = false;
        input_password.classList.add("is-invalid");
        passwordInvalidFeedback.style.display = "block";
    } else {
        input_password.classList.add("is-valid");
        passwordValidFeedback.style.display = "block";
    }

    // Confirm password
    if (confirm_pass.value !== input_password.value) {
        valid = false;
        confirm_pass.classList.add("is-invalid");
        confirmPassInvalidFeedback.style.display = "block";
    } else {
        confirm_pass.classList.add("is-valid");
        confirmPassValidFeedback.style.display = "block";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input_email.value)) {
        valid = false;
        input_email.classList.add("is-invalid");
        emailInvalidFeedback.style.display = "block";
    } else {
        input_email.classList.add("is-valid");
        emailValidFeedback.style.display = "block";
    }

    // Submit to server if valid
    if (valid) {
        fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName: input_name.value,
                email: input_email.value,
                password: input_password.value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("נרשמת בהצלחה! עובר למסך ההתחברות...");
                window.location.href = "login.html"; // מעבר למסך התחברות
            } else {
                alert("שגיאה: " + (data.message || "הרישום נכשל"));
            }

            form.reset();
            input_name.classList.remove("is-valid");
            input_email.classList.remove("is-valid");
            input_password.classList.remove("is-valid");
            confirm_pass.classList.remove("is-valid");
        })
        .catch(error => {
            console.error("Error submitting to server:", error);
            alert("שגיאת רשת בעת ניסיון רישום.");
        });
    }
});
