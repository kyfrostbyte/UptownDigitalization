// ===== forms-wizard.js =====
// Handles navigation, routing, and page layout

// Map form keys to file paths and labels
export const FORM_DEFINITIONS = {
  purchase_agreement: { label: "Purchase Agreement", path: "/forms/purchase-agreement.html" },
  medical_history: { label: "Medical History", path: "/forms/medical-history.html" },
  informed_consent: { label: "Informed Consent", path: "/forms/informed-consent.html" },
  e_sign_consent: { label: "E-Sign Consent", path: "/forms/e-sign-consent.html" },
};
// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
console.log(token);
if (!token) {
  document.getElementById('formContainer').innerHTML = "<p>Error: No token provided in URL.</p>";
  throw new Error("No token provided");
}

// Get DOM elements
const nav = document.getElementById("formNav");
const container = document.getElementById("formContainer");
const title = document.getElementById("formTitle");
const landingLinks = document.getElementById("landingLinks");
const landingPage = document.getElementById("landingPage");
const layoutGrid = document.getElementById("layoutGrid");
const navToggle = document.getElementById("navToggle");

// Function to show landing page
function showLandingPage() {
  container.innerHTML = landingPage.outerHTML;
  title.textContent = "Welcome to the Form Wizard";
  nav.querySelectorAll("a").forEach(a => a.classList.remove("active"));
}

// Function to load form content
async function loadForm(key) {
  const formDef = FORM_DEFINITIONS[key];
  
  // Update active state
  nav.querySelectorAll("a").forEach(a => a.classList.remove("active"));
  const activeLink = nav.querySelector(`[data-form-key="${key}"]`);
  if (activeLink) activeLink.classList.add("active");
  
  // Update title
  title.textContent = formDef.label;
  
  // Load content
  try {
    const res = await fetch(formDef.path);
    if (!res.ok) throw new Error("Failed to load form");
    const html = await res.text();
    container.innerHTML = html;
    
    // Import and initialize form-specific logic
    // This will be handled by forms-common.js
    const event = new CustomEvent('formLoaded', { 
      detail: { formKey: key, formType: formDef.label }
    });
    document.dispatchEvent(event);
    
  } catch (err) {
    container.innerHTML = '<div class="error-message">Error loading form. Please try again.</div>';
    console.error(err);
  }
}

// Initialize the wizard
async function initializeWizard() {
  try {
    // Fetch available forms for this client
    const response = await fetch(`/client/${token}`);
    const data = await response.json();
    
    if (!data.form) {
      nav.innerHTML = "<p>No forms available.</p>";
      landingLinks.innerHTML = "<p>No forms available.</p>";
      return;
    }

    // Filter forms available to this client
    const clientForms = Object.keys(FORM_DEFINITIONS).filter(key => data.form[key]);

    if (!clientForms.length) {
      nav.innerHTML = "<p>No forms available.</p>";
      landingLinks.innerHTML = "<p>No forms available.</p>";
      return;
    }

    // Populate navigation links
    clientForms.forEach(key => {
      const formDef = FORM_DEFINITIONS[key];
      
      // Create nav link
      const link = document.createElement("a");
      link.href = "#";
      link.dataset.formKey = key;
      
      const icon = document.createElement("span");
      icon.classList.add("icon");
      icon.textContent = "📝";
      link.appendChild(icon);
      
      const text = document.createElement("span");
      text.classList.add("text");
      text.textContent = formDef.label;
      link.appendChild(text);
      
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        await loadForm(key);
      });
      
      nav.appendChild(link);
      
      // Create landing page button
      const btn = document.createElement("button");
      btn.textContent = formDef.label;
      btn.addEventListener("click", () => loadForm(key));
      landingLinks.appendChild(btn);
    });

    // Auto-open first form or stay on landing page
    // Uncomment next line to auto-open first form
    // await loadForm(clientForms[0]);
    
  } catch (err) {
    nav.innerHTML = "<p>Error loading forms.</p>";
    landingLinks.innerHTML = "<p>Error loading forms.</p>";
    console.error(err);
  }
}

// Toggle navigation
navToggle.addEventListener("click", () => {
  layoutGrid.classList.toggle("nav-expanded");
});

// Initialize on load
initializeWizard();

// Export for use in other modules
export { token, showLandingPage, loadForm };