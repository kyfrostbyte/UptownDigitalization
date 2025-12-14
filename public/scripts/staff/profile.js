const clientsTableBody = document.querySelector("#clientsTable tbody");
const formsList = document.getElementById("formsList");
const modal = document.getElementById("formsModal");
const closeBtn = modal.querySelector(".close");
const cancelBtn = document.getElementById("cancelBtn");
const formsCheckboxForm = document.getElementById("formsCheckboxForm");
const clientNameSpan = document.getElementById("clientName");

let currentClientId = null;
let currentClientToken = null;
let currentClientName = "";
let currentClientPhone = null;

// Define forms matching the database columns
const FORM_DEFINITIONS = {
  purchase_agreement: { label: "Purchase Agreement" },
  medical_history: { label: "Medical History" },
  skin_type_assessment: { label: "Skin Type Assessment" },
  informed_consent: { label: "Informed Consent" },
  privacy_practices: { label: "Privacy Practices" },
  media_release: { label: "Media Release" }
};

// Close modal handlers
function closeModal() {
  modal.style.display = "none";
  currentClientId = null;
  currentClientToken = null;
  currentClientName = "";
  currentClientPhone = null;
}

closeBtn.onclick = closeModal;
cancelBtn.onclick = closeModal;
window.onclick = (e) => { 
  if (e.target === modal) closeModal(); 
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
            <button class="manage-btn" data-id="${c.id}" data-name="${c.first_name} ${c.last_name}" data-phone="${c.phone || ''}" aria-label="Manage forms for ${c.first_name} ${c.last_name}">
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
          openFormsModal(
            btn.dataset.id, 
            btn.dataset.name,
            btn.dataset.phone
          );
        });
      });
    })
    .catch(err => {
      console.error("Error loading clients:", err);
      clientsTableBody.innerHTML = "<tr><td colspan='5'>Error loading clients</td></tr>";
    });
}

// Open modal and load form checkboxes
function openFormsModal(clientId, clientName, phone) {
  currentClientId = clientId;
  currentClientName = clientName;
  currentClientPhone = phone;
  clientNameSpan.textContent = clientName;
  
  formsList.innerHTML = "<li>Loading...</li>";
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

// Handle form submission - update database and send via Twilio SMS
formsCheckboxForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!currentClientToken) {
    alert("Error: No client token found");
    return;
  }

  if (!currentClientPhone) {
    alert("Error: No phone number found for this client");
    return;
  }

  const saveBtn = document.getElementById("saveFormsBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Sending...";

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

    await Promise.all(updatePromises);

    // Send via Twilio SMS
    const url = `http://localhost:3000/pages/form-wizard.html?token=${encodeURIComponent(currentClientToken)}`;
    
    const sendResponse = await fetch("/send-forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: currentClientName,
        phone: currentClientPhone,
        url: url
      })
    });

    if (!sendResponse.ok) {
      throw new Error("Failed to send text message");
    }

    // Log text for demo purposes
    const data = await sendResponse.json();
    console.log(data.message);  // This is your full SMS text
    
    saveBtn.textContent = "Sent!";
    setTimeout(() => {
      closeModal();
      saveBtn.textContent = "Save & Text Forms";
      saveBtn.disabled = false;
    }, 1500);

  } catch (err) {
    console.error("Error saving/sending forms:", err);
    alert("Error saving or sending forms. Please try again.");
    saveBtn.textContent = "Save & Text Forms";
    saveBtn.disabled = false;
  }
});

// Initialize on page load
loadClients();