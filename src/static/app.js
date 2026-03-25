document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and existing options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML (matching screenshot style)
        let participantsHTML = "<ul class='participants-list'>";
        if (details.participants.length > 0) {
          details.participants.forEach((participant) => {
            participantsHTML += `
              <li>
                <span>${participant}</span>
                <button type='button' class='delete-participant' data-email='${participant}' title='Remove participant'>&#10006;</button>
              </li>
            `;
          });
        } else {
          participantsHTML += `<li class='no-participants'>No participants yet</li>`;
        }
        participantsHTML += "</ul>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add deletion handlers for participant buttons (event delegation)
        const deleteButtons = activityCard.querySelectorAll('.delete-participant');
        deleteButtons.forEach((btn) => {
          btn.addEventListener('click', async () => {
            const participantEmail = btn.dataset.email;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participantEmail)}`,
                { method: 'DELETE' }
              );
              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'success';
                await fetchActivities();
              } else {
                messageDiv.textContent = result.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
              }

              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (error) {
              messageDiv.textContent = 'Network error while removing participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              console.error('Error removing participant:', error);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        await fetchActivities();
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
