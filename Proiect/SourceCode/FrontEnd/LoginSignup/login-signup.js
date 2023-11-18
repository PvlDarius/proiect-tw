function validateLogin() {
  // Reset validation message
  document.getElementById("validation-message").innerHTML = "";

  // Your login validation logic
  if (document.formFill.email.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please enter your email!";
    return false;
  } else if (document.formFill.password.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please enter a password!";
    return false;
  }

  // Submit the login form if validation is successful
  document.getElementById("loginForm").submit();

  return false;
}

function validateSignup() {
  // Reset validation message
  document.getElementById("validation-message").innerHTML = "";

  // Your signup validation logic
  if (document.formFill.first_name.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please enter your first name!";
    return false;
  } else if (document.formFill.last_name.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please enter your last name!";
    return false;
  } else if (document.formFill.email.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please enter your email!";
    return false;
  } else if (document.formFill.password.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please enter a password!";
    return false;
  } else if (document.formFill.confirmPassword.value == "") {
    document.getElementById("validation-message").innerHTML =
      "Please confirm your password!";
    return false;
  } else if (
    document.formFill.password.value !== document.formFill.confirmPassword.value
  ) {
    document.getElementById("validation-message").innerHTML =
      "The entered passwords do not match!";
    return false;
  } else if (document.formFill.password.value.length < 6) {
    document.getElementById("validation-message").innerHTML =
      "Password must be at least 6 characters long!";
    return false;
  }

  // Submit the signup form if validation is successful
  document.getElementById("signupForm").submit();

  return false;
}

function submitForm(formData, formType) {
  // Send form data to server using Fetch API
  fetch(`/auth/${formType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      // Handle the response from the server
      if (data.error) {
        // Handle error
        document.getElementById("validation-message").innerHTML = data.error;
      } else if (data.success) {
        // Handle success
        document.getElementById("success-message").innerHTML = data.success;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      // Handle specific error for login form
      if (formType === "login") {
        document.getElementById("validation-message").innerHTML =
          "Invalid credentials";
      }
    });
}

// Other functions...

function validateAndSubmitLogin() {
  // Call the login validation function
  const isValidationPassed = validateLogin();

  // Call the submitForm function only if validation passed
  if (isValidationPassed) {
    const formData = {
      email: document.formFill.email.value,
      password: document.formFill.password.value,
    };
    submitForm(formData, "login");
  } else {
    // If validation fails, prevent the form submission
    return false;
  }
}

function validateAndSubmitSignup() {
  // Call the signup validation function
  const isValidationPassed = validateSignup();

  // Call the submitForm function only if validation passed
  if (isValidationPassed) {
    const formData = {
      first_name: document.formFill.first_name.value,
      last_name: document.formFill.last_name.value,
      email: document.formFill.email.value,
      password: document.formFill.password.value,
      confirmPassword: document.formFill.confirmPassword.value,
    };
    submitForm(formData, "signup");
  } else {
    // If validation fails, prevent the form submission
    return false;
  }
}

function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

const errorMessage = getQueryParam("errorMessage");
const successMessage = getQueryParam("successMessage");

if (errorMessage) {
  document.getElementById("validation-message").innerText = errorMessage;
}

if (successMessage) {
  document.getElementById("success-message").innerText = successMessage;
}
