// Form Management JavaScript

// Define forms matching the database columns
const FORM_DEFINITIONS = {
  purchase_agreement: { label: "Purchase Agreement" },
  medical_history: { label: "Medical History" },
  skin_type_assessment: { label: "Skin Type Assessment" },
  informed_consent: { label: "Informed Consent" },
  privacy_practices: { label: "Privacy Practices" },
  media_release: { label: "Media Release" }
};

let allClientsData = [];
let currentFormData = null;
let currentClientId = null;
let currentFormType = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadClientsData();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', filterAndRenderTable);
  document.getElementById('filterForm').addEventListener('change', filterAndRenderTable);
  document.getElementById('sortBy').addEventListener('change', filterAndRenderTable);
  
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('saveBtn').addEventListener('click', saveFormChanges);
  
  // Close modal on outside click
  document.getElementById('formModal').addEventListener('click', function(e) {
    if (e.target.id === 'formModal') {
      closeModal();
    }
  });
}

// Load all clients and their forms data
async function loadClientsData() {
  try {
    const [clients, allSubmissions] = await Promise.all([
      fetch('/clients').then(r => r.json()),
      fetch('/api/all-submissions').then(r => r.json()).catch(() => [])
    ]);

    // Get forms status for each client
    const clientsWithForms = await Promise.all(
      clients.map(async (client) => {
        const forms = await fetch(`/forms/${client.id}`).then(r => r.json());
        const submissions = await fetch(`/client-forms/${client.id}`).then(r => r.json()).catch(() => []);
        
        return {
          ...client,
          forms: forms[0] || {},
          submissions: submissions
        };
      })
    );

    allClientsData = clientsWithForms;
    renderTable(allClientsData);
  } catch (err) {
    console.error('Error loading clients:', err);
    showError('Failed to load client data');
  }
}

// Filter and render table
function filterAndRenderTable() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filterType = document.getElementById('filterForm').value;
  const sortBy = document.getElementById('sortBy').value;

  let filtered = allClientsData.filter(client => {
    // Search filter
    const matchesSearch = 
      client.first_name.toLowerCase().includes(searchTerm) ||
      client.last_name.toLowerCase().includes(searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchTerm)) ||
      (client.phone && client.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    // Form completion filter
    if (filterType === 'completed') {
      return Object.keys(FORM_DEFINITIONS).every(key => client.forms[key]);
    } else if (filterType === 'incomplete') {
      return Object.keys(FORM_DEFINITIONS).some(key => !client.forms[key]);
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'name') {
      return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
    } else if (sortBy === 'email') {
      return (a.email || '').localeCompare(b.email || '');
    } else if (sortBy === 'recent') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    return 0;
  });

  renderTable(filtered);
}

// Render table
function renderTable(clients) {
  const tbody = document.getElementById('tableBody');
  const noResults = document.getElementById('noResults');

  if (clients.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  tbody.innerHTML = clients.map(client => {
    const formCells = Object.keys(FORM_DEFINITIONS).map(formKey => {
      const isSubmitted = client.forms[formKey];
      const submission = client.submissions.find(s => s.form_type === formKey);
      
      return `
        <td>
          <div 
            class="status-icon ${isSubmitted ? 'submitted' : 'not-submitted'}"
            ${isSubmitted ? `onclick="openFormModal(${client.id}, '${formKey}')"` : ''}
            title="${isSubmitted ? 'Click to view/edit' : 'Not submitted'}"
          >
            ${isSubmitted ? '✓' : '✗'}
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td><strong>${client.first_name} ${client.last_name}</strong></td>
        <td>${client.email || '-'}</td>
        <td>${client.phone || '-'}</td>
        ${formCells}
      </tr>
    `;
  }).join('');
}

// Open form modal
async function openFormModal(clientId, formType) {
  try {
    const client = allClientsData.find(c => c.id === clientId);
    const submission = client.submissions.find(s => s.form_type === formType);

    if (!submission) {
      alert('Form submission not found');
      return;
    }

    currentClientId = clientId;
    currentFormType = formType;
    currentFormData = submission.data;

    const formLabel = FORM_DEFINITIONS[formType].label;
    document.getElementById('modalTitle').textContent = `${formLabel} - ${client.first_name} ${client.last_name}`;

    // Load form template and populate
    await loadFormTemplate(formType, submission.data);

    document.getElementById('formModal').classList.add('show');
  } catch (err) {
    console.error('Error opening form:', err);
    alert('Failed to load form');
  }
}

// Load form template based on type
async function loadFormTemplate(formType, data) {
  const modalBody = document.getElementById('modalBody');
  
  // Map form types to their HTML file paths
  const formFiles = {
    purchase_agreement: '../../forms/purchase-agreement.html',
    medical_history: '../../forms/medical-history.html',
    skin_type_assessment: '../../forms/skin-type-assessment.html',
    informed_consent: '../../forms/informed-consent.html',
    privacy_practices: '../../forms/privacy-practices.html',
    media_release: '../../forms/media-release.html'
  };

  const formFile = formFiles[formType];
  
  if (!formFile) {
    modalBody.innerHTML = '<p>Form template not found</p>';
    return;
  }

  try {
    // Fetch the form HTML
    const response = await fetch(formFile);
    if (!response.ok) throw new Error('Failed to load form');
    
    const html = await response.text();
    
    // Parse the HTML and extract just the form content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const formContent = doc.querySelector('form');
    
    if (!formContent) {
      modalBody.innerHTML = '<p>Invalid form structure</p>';
      return;
    }

    // Remove submit buttons and form actions from the template
    const formActions = formContent.querySelector('.form-actions');
    if (formActions) formActions.remove();

    // Set the modal body content
    modalBody.innerHTML = formContent.innerHTML;

    // Populate the form with data
    populateFormData(data);

    // Disable reset button functionality in modal
    const resetBtn = modalBody.querySelector('#resetBtn');
    if (resetBtn) resetBtn.remove();

  } catch (err) {
    console.error('Error loading form template:', err);
    modalBody.innerHTML = '<p>Error loading form. Please try again.</p>';
  }
}

// Populate form fields with data
function populateFormData(data) {
  const modalBody = document.getElementById('modalBody');
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    // Handle text inputs, emails, dates, etc.
    const textInput = modalBody.querySelector(`input[name="${key}"][type="text"], input[name="${key}"][type="email"], input[name="${key}"][type="tel"], input[name="${key}"][type="date"]`);
    if (textInput && value) {
      textInput.value = value;
    }

    // Handle textareas
    const textarea = modalBody.querySelector(`textarea[name="${key}"]`);
    if (textarea && value) {
      textarea.value = value;
    }

    // Handle radio buttons
    const radio = modalBody.querySelector(`input[name="${key}"][value="${value}"]`);
    if (radio && radio.type === 'radio') {
      radio.checked = true;
    }

    // Handle checkboxes (single value - typically "on" for checked)
    const checkbox = modalBody.querySelector(`input[name="${key}"][type="checkbox"]`);
    if (checkbox && value === 'on') {
      checkbox.checked = true;
    }

    // Handle multiple checkboxes with same name (returns array or single value)
    const checkboxes = modalBody.querySelectorAll(`input[name="${key}"][type="checkbox"]`);
    if (checkboxes.length > 1) {
      // Multiple checkboxes with same name
      const values = Array.isArray(value) ? value : [value];
      checkboxes.forEach(cb => {
        if (values.includes(cb.value)) {
          cb.checked = true;
        }
      });
    }

    // Handle select dropdowns
    const select = modalBody.querySelector(`select[name="${key}"]`);
    if (select && value) {
      select.value = value;
    }
  });

  // Trigger conditional field logic if it exists
  triggerConditionalFields();
}

// Trigger conditional fields based on populated data
function triggerConditionalFields() {
  const modalBody = document.getElementById('modalBody');
  
  // Find all conditional fields
  const conditionalFields = modalBody.querySelectorAll('.conditional-field');
  
  conditionalFields.forEach(field => {
    const trigger = field.getAttribute('data-trigger');
    if (!trigger) return;

    // Check if trigger radio/checkbox is selected
    const triggerInput = modalBody.querySelector(`input[name="${trigger}"][value="yes"]`);
    if (triggerInput && triggerInput.checked) {
      field.classList.add('show');
    }

    // Also handle checkbox triggers (like friend/physician)
    const checkboxTrigger = modalBody.querySelector(`input[name="hearAbout"][value="${trigger}"]`);
    if (checkboxTrigger && checkboxTrigger.checked) {
      field.classList.add('show');
    }
  });

  // Handle gender-specific sections
  const femaleRadio = modalBody.querySelector('input[name="gender"][value="female"]');
  const womenSection = modalBody.querySelector('.form-section[data-gender="female"]');
  if (femaleRadio && femaleRadio.checked && womenSection) {
    womenSection.style.display = 'block';
  }
}

// Save form changes
async function saveFormChanges() {
  try {
    const modalBody = document.getElementById('modalBody');
    const inputs = modalBody.querySelectorAll('input, textarea, select');
    
    const updatedData = {};
    
    inputs.forEach(input => {
      const name = input.name || input.getAttribute('name');
      if (!name) return;

      if (input.type === 'checkbox') {
        // Handle checkboxes
        if (input.checked) {
          // Check if multiple checkboxes with same name exist
          const sameNameCheckboxes = modalBody.querySelectorAll(`input[name="${name}"][type="checkbox"]`);
          if (sameNameCheckboxes.length > 1) {
            // Multiple checkboxes - collect all checked values
            if (!updatedData[name]) updatedData[name] = [];
            if (Array.isArray(updatedData[name])) {
              updatedData[name].push(input.value);
            }
          } else {
            // Single checkbox - use 'on' convention
            updatedData[name] = 'on';
          }
        }
      } else if (input.type === 'radio') {
        // Handle radio buttons - only save if checked
        if (input.checked) {
          updatedData[name] = input.value;
        }
      } else {
        // Handle text inputs, textareas, selects, etc.
        updatedData[name] = input.value;
      }
    });

    // Find the submission ID
    const client = allClientsData.find(c => c.id === currentClientId);
    const submission = client.submissions.find(s => s.form_type === currentFormType);

    if (!submission) {
      alert('Submission not found');
      return;
    }

    const response = await fetch(`/submissions/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: updatedData })
    });

    if (!response.ok) throw new Error('Failed to save');

    alert('Changes saved successfully!');
    closeModal();
    loadClientsData(); // Reload data
  } catch (err) {
    console.error('Error saving form:', err);
    alert('Failed to save changes. Please try again.');
  }
}

// Close modal
function closeModal() {
  document.getElementById('formModal').classList.remove('show');
  currentClientId = null;
  currentFormType = null;
  currentFormData = null;
}

// Show error message
function showError(message) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="9" style="color: #dc3545;">${message}</td>
    </tr>
  `;
}

// Make function available globally
window.openFormModal = openFormModal;