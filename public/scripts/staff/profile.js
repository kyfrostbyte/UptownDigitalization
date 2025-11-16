const clientsTableBody = document.querySelector("#clientsTable tbody");
const formsList = document.getElementById("formsList");
const modal = document.getElementById("formsModal");
const closeBtn = modal.querySelector(".close");
const cancelBtn = document.getElementById("cancelBtn");
const formsCheckboxForm = document.getElementById("formsCheckboxForm");
const sentUrlContainer = document.getElementById("sentUrlContainer");
const sentUrlInput = document.getElementById("sentUrl");
const copyUrlBtn = document.getElementById("copyUrlBtn");
const clientNameSpan = document.getElementById("clientName");

let currentClientId = null;
let currentClientToken = null;
let currentClientName = "";

// Define forms matching the database columns
const FORM_DEFINITIONS = {
  purchase_agreement: { label: "Purchase Agreement" },
  medical_history: { label: "Medical History" },
  informed_consent: { label: "Informed Consent" },
  e_sign_consent: { label: "E-Sign Consent" },
};

// Close modal handlers
function closeModal() {
  modal.style.display = "none";
  sentUrlContainer.style.display = "none";
  currentClientId = null;
  currentClientToken = null;
  currentClientName = "";
}

closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;
window.onclick = (e) => { 
  if (e.target === modal) closeModal(); 
};

// Copy URL to clipboard
copyUrlBtn.onclick = () => {
  sentUrlInput.select();
  sentUrlInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(sentUrlInput.value).then(() => {
    const originalText = copyUrlBtn.textContent;
    copyUrlBtn.textContent = "Copied!";
    setTimeout(() => {
      copyUrlBtn.textContent = originalText;
    }, 2000);
  });
};

// Load clients
function loadClients() {
  fetch("/clients")
    .then(res => res.json())
    .then(clients => {
      clientsTableBody.innerHTML = "";
      clients.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${c.id}</td>
          <td>${c.first_name} ${c.last_name}</td>
          <td>${c.email || 'N/A'}</td>
          <td>${c.phone || 'N/A'}</td>
          <td>
            <button class="manage-btn" data-id="${c.id}" data-name="${c.first_name} ${c.last_name}" aria-label="Manage forms for ${c.first_name} ${c.last_name}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </td>
        `;
        clientsTableBody.appendChild(tr);
      });

      // Attach event listeners to manage buttons
      document.querySelectorAll(".manage-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          openFormsModal(btn.dataset.id, btn.dataset.name);
        });
      });
    })
    .catch(err => {
      console.error("Error loading clients:", err);
      clientsTableBody.innerHTML = "<tr><td colspan='5'>Error loading clients</td></tr>";
    });
}

// Open modal and load form checkboxes
function openFormsModal(clientId, clientName) {
  currentClientId = clientId;
  currentClientName = clientName;
  clientNameSpan.textContent = clientName;
  
  formsList.innerHTML = "<li>Loading...</li>";
  sentUrlContainer.style.display = "none";
  modal.style.display = "block";

  // Fetch the forms_status for this client
  fetch(`/forms/${clientId}`)
    .then(res => res.json())
    .then(forms => {
      if (!forms || forms.length === 0) {
        formsList.innerHTML = "<li>No forms found for this client</li>";
        return;
      }

      const formStatus = forms[0];
      currentClientToken = formStatus.token;

      // Build checkbox list
      formsList.innerHTML = "";
      Object.keys(FORM_DEFINITIONS).forEach(key => {
        const li = document.createElement("li");
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `form-${key}`;
        checkbox.name = key;
        checkbox.value = key;
        
        // Check the box if the DB value is true (1)
        if (formStatus[key] === 1) {
          checkbox.checked = true;
        }

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = FORM_DEFINITIONS[key].label;

        li.appendChild(checkbox);
        li.appendChild(label);
        formsList.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Error loading forms:", err);
      formsList.innerHTML = "<li>Error loading forms</li>";
    });
}

// Handle form submission - update database and generate URL
formsCheckboxForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentClientToken) {
    alert("Error: No client token found");
    return;
  }

  const saveBtn = document.getElementById("saveFormsBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    // Get all checkboxes
    const checkboxes = formsList.querySelectorAll("input[type=checkbox]");
    
    // Update each form field in the database
    const updatePromises = Array.from(checkboxes).map(checkbox => {
      const field = checkbox.value;
      const value = checkbox.checked;
      
      return fetch(`/forms/update/${currentClientToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value })
      }).then(res => {
        if (!res.ok) throw new Error(`Failed to update ${field}`);
        return res.json();
      });
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    // Generate and display the URL
    const url = `http://localhost:3000/pages/form-wizard.html?token=${encodeURIComponent(currentClientToken)}`;
    sentUrlInput.value = url;
    sentUrlContainer.style.display = "block";
    
    // Auto-select the URL for easy copying
    setTimeout(() => {
      sentUrlInput.select();
    }, 100);

    // Show success feedback
    saveBtn.textContent = "Saved!";
    setTimeout(() => {
      saveBtn.textContent = "Save & Generate Link";
      saveBtn.disabled = false;
    }, 2000);

  } catch (err) {
    console.error("Error saving forms:", err);
    alert("Error saving forms. Please try again.");
    saveBtn.textContent = "Save & Generate Link";
    saveBtn.disabled = false;
  }
});

// Initialize on page load
loadClients();