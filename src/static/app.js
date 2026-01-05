document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginBtn = document.getElementById("login-btn");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const userStatus = document.getElementById("user-status");
  const authNotice = document.getElementById("auth-notice");
  const signupSubmitBtn = document.getElementById("signup-submit-btn");

  // Store teacher credentials in memory
  let teacherCredentials = null;

  // Update UI based on login status
  function updateAuthUI() {
    if (teacherCredentials) {
      userStatus.textContent = `Logged in as ${teacherCredentials.username}`;
      userStatus.classList.remove("hidden");
      loginBtn.innerHTML = '<span class="user-icon">🚪</span>';
      loginBtn.title = "Logout";
      authNotice.classList.add("hidden");
      signupSubmitBtn.disabled = false;
    } else {
      userStatus.classList.add("hidden");
      loginBtn.innerHTML = '<span class="user-icon">👤</span>';
      loginBtn.title = "Teacher Login";
      authNotice.classList.remove("hidden");
      signupSubmitBtn.disabled = true;
    }
  }

  // Login button click handler
  loginBtn.addEventListener("click", () => {
    if (teacherCredentials) {
      // Logout
      teacherCredentials = null;
      updateAuthUI();
      showMessage("Logged out successfully", "success");
    } else {
      // Show login modal
      loginModal.classList.remove("hidden");
    }
  });

  // Close modal
  const closeBtn = loginModal.querySelector(".close");
  closeBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
    loginMessage.classList.add("hidden");
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.classList.add("hidden");
      loginForm.reset();
      loginMessage.classList.add("hidden");
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Store credentials
    teacherCredentials = {
      username: username,
      password: password,
    };

    // Close modal and update UI
    loginModal.classList.add("hidden");
    loginForm.reset();
    updateAuthUI();
    showMessage(`Welcome, ${username}!`, "success");
  });

  // Helper function to show messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    if (!teacherCredentials) {
      showMessage("Please log in as a teacher to unregister students", "error");
      return;
    }

    const authHeader = "Basic " + btoa(teacherCredentials.username + ":" + teacherCredentials.password);

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": authHeader,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else if (response.status === 401) {
        showMessage("Invalid credentials. Please log in again.", "error");
        teacherCredentials = null;
        updateAuthUI();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!teacherCredentials) {
      showMessage("Please log in as a teacher to register students", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    const authHeader = "Basic " + btoa(teacherCredentials.username + ":" + teacherCredentials.password);

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            "Authorization": authHeader,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else if (response.status === 401) {
        showMessage("Invalid credentials. Please log in again.", "error");
        teacherCredentials = null;
        updateAuthUI();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  updateAuthUI();
  fetchActivities();
});
