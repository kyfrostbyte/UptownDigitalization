// ===== form-wizard.js =====
// Handles navigation, form loading, submission, and progression

export const FORM_DEFINITIONS = {
  purchase_agreement: {
    label: "Purchase Agreement",
    path: "/forms/purchase-agreement.html",
    icon: "📋",
  },
  medical_history: {
    label: "Medical History",
    path: "/forms/medical-history.html",
    icon: "🏥",
  },
  skin_type_assessment: {
    label: "Skin Type Assessment",
    path: "/forms/skin-type-assessment.html",
    icon: "✨",
  },
  informed_consent: {
    label: "Informed Consent",
    path: "/forms/informed-consent.html",
    icon: "✓",
  },
  privacy_practices: {
    label: "Privacy Practices",
    path: "/forms/privacy-practices.html",
    icon: "🔒",
  },
  media_release: {
    label: "Media Release",
    path: "/forms/media-release.html",
    icon: "📸",
  },
};

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
// Extract token from URL path: /form-wizard/{token} OR from query param: ?token=xxx
const pathParts = window.location.pathname.split('/');
const tokenFromPath = pathParts[pathParts.length - 1];
// Check if token is in path (and not empty/html file) or fall back to query param
const token = (tokenFromPath && tokenFromPath !== 'form-wizard.html' && !tokenFromPath.includes('.html')) 
  ? tokenFromPath 
  : urlParams.get("token");
const singleFormParam = urlParams.get("form"); // Check if we should show only one form

if (!token) {
  document.getElementById("formContainer").innerHTML =
    "<p>Error: No token provided in URL.</p>";
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

// Show landing page
function showLandingPage() {
  container.innerHTML = landingPage.outerHTML;
  title.textContent = "Welcome to the Form Wizard";
  nav.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
}

// Load form content
async function loadForm(key) {
  const formDef = FORM_DEFINITIONS[key];

  // Update navigation
  nav.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
  const activeLink = nav.querySelector(`[data-form-key="${key}"]`);
  if (activeLink) activeLink.classList.add("active");

  // Update title
  title.textContent = formDef.label;

  // Close mobile nav
  if (window.innerWidth <= 768) {
    layoutGrid.classList.remove("nav-expanded");
  }

  // Load form HTML
  try {
    const res = await fetch(formDef.path);
    if (!res.ok) throw new Error("Failed to load form");
    const html = await res.text();
    container.innerHTML = html;
    container.scrollTop = 0;

    // Dispatch event for form-specific initialization
    const event = new CustomEvent("formLoaded", {
      detail: { formKey: key, formType: formDef.label },
    });
    document.dispatchEvent(event);
  } catch (err) {
    container.innerHTML =
      '<div class="error-message">Error loading form. Please try again.</div>';
    console.error(err);
  }
}

// Navigate to next form or completion screen
async function navigateToNextFormOrComplete() {
  // If this is a single-form mode, just show completion
  if (singleFormParam) {
    showCompletionScreen();
    return;
  }

  try {
    const response = await fetch(`/client/${token}`);
    const data = await response.json();

    if (!data.form) {
      showCompletionScreen();
      return;
    }

    const clientForms = Object.keys(FORM_DEFINITIONS).filter(
      (key) => data.form[key]
    );
    const navLinks = Array.from(nav.querySelectorAll("a[data-form-key]"));
    const activeLink = nav.querySelector("a.active");
    const currentIndex = navLinks.indexOf(activeLink);

    // Navigate to next form if available
    if (currentIndex >= 0 && currentIndex < navLinks.length - 1) {
      const nextLink = navLinks[currentIndex + 1];
      const nextFormKey = nextLink.dataset.formKey;
      await loadForm(nextFormKey);
    } else {
      showCompletionScreen();
    }
  } catch (error) {
    console.error("Error navigating to next form:", error);
    showCompletionScreen();
  }
}

// Show completion screen
function showCompletionScreen() {
  nav.querySelectorAll("a").forEach((a) => a.classList.remove("active"));
  title.textContent = "All Forms Completed!";

  container.innerHTML = `
    <div class="completion-screen">
      <div class="completion-icon">✓</div>
      <h2>Congratulations!</h2>
      <p>You have successfully completed all required forms.</p>
      <p>Thank you for providing all the necessary information.</p>
      <div class="completion-actions">
        <p>You may now close this window or wait for further instructions from our staff.</p>
      </div>
    </div>
  `;
}

// Handle form submissions
container.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formEl = e.target;

  const submitBtn = formEl.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const formData = new FormData(formEl);
    const formDataObj = Object.fromEntries(formData.entries());

    // Get the form type from the active navigation or single form param
    let formType;
    if (singleFormParam) {
      formType = singleFormParam;
    } else {
      formType = title.textContent.toLowerCase().replace(/ /g, "_");
    }

    const response = await fetch(`/submit-form/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formType: formType,
        data: formDataObj,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      // Update the forms_status table to mark this form as complete
      await fetch(`/forms/update/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: formType,
          value: true,
        }),
      });

      // Show success message
      const successMsg = document.createElement("div");
      successMsg.className = "success-message";
      successMsg.textContent = "Form submitted successfully!";
      formEl.insertBefore(successMsg, formEl.firstChild);

      // Navigate to next form after delay
      setTimeout(async () => {
        successMsg.remove();
        await navigateToNextFormOrComplete();
      }, 1500);
    } else {
      throw new Error("Submission failed");
    }
  } catch (error) {
    // Show error message
    const errorMsg = document.createElement("div");
    errorMsg.className = "error-message";
    errorMsg.textContent = "Error submitting form. Please try again.";
    formEl.insertBefore(errorMsg, formEl.firstChild);

    setTimeout(() => errorMsg.remove(), 3000);
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Initialize wizard on load
async function initializeWizard() {
  try {
    // If single form mode, only show that form
    if (singleFormParam) {
      // Validate the form exists
      if (!FORM_DEFINITIONS[singleFormParam]) {
        container.innerHTML = `
          <div class="error-message">
            Invalid form specified. Please contact support.
          </div>
        `;
        return;
      }

      // Hide navigation for single form mode
      nav.style.display = 'none';
      navToggle.style.display = 'none';

      // Create a single nav item (hidden but needed for form tracking)
      const formDef = FORM_DEFINITIONS[singleFormParam];
      const link = document.createElement("a");
      link.href = "#";
      link.dataset.formKey = singleFormParam;
      link.classList.add("active");
      nav.appendChild(link);

      // Load the single form directly
      await loadForm(singleFormParam);
      return;
    }

    // Normal multi-form wizard mode
    const response = await fetch(`/client/${token}`);
    const data = await response.json();

    if (!data.form) {
      nav.innerHTML =
        "<p style='padding: 1rem; color: rgba(255,255,255,0.7);'>No forms available.</p>";
      landingLinks.innerHTML = "<p>No forms available.</p>";
      return;
    }

    // Filter forms available to this client
    const clientForms = Object.keys(FORM_DEFINITIONS).filter(
      (key) => data.form[key]
    );

    if (!clientForms.length) {
      nav.innerHTML =
        "<p style='padding: 1rem; color: rgba(255,255,255,0.7);'>No forms available.</p>";
      landingLinks.innerHTML = "<p>No forms available.</p>";
      return;
    }

    // Populate navigation and landing page
    clientForms.forEach((key) => {
      const formDef = FORM_DEFINITIONS[key];

      // Create nav link
      const link = document.createElement("a");
      link.href = "#";
      link.dataset.formKey = key;

      const navIcon = document.createElement("span");
      navIcon.classList.add("icon");
      navIcon.textContent = formDef.icon;

      const navText = document.createElement("span");
      navText.classList.add("text");
      navText.textContent = formDef.label;

      link.append(navIcon, navText);

      link.addEventListener("click", async (e) => {
        e.preventDefault();
        await loadForm(key);
      });

      nav.appendChild(link);

      // Create landing page button WITH icon
      const btn = document.createElement("button");
      btn.classList.add("landing-btn");

      const btnIcon = document.createElement("span");
      btnIcon.classList.add("icon");
      btnIcon.textContent = formDef.icon;

      const btnText = document.createElement("span");
      btnText.classList.add("text");
      btnText.textContent = formDef.label;

      btn.append(btnIcon, btnText);
      btn.addEventListener("click", () => loadForm(key));

      landingLinks.appendChild(btn);
    });
  } catch (err) {
    nav.innerHTML =
      "<p style='padding: 1rem; color: rgba(255,255,255,0.7);'>Error loading forms.</p>";
    landingLinks.innerHTML = "<p>Error loading forms.</p>";
    console.error(err);
  }
}

// Toggle navigation
navToggle.addEventListener("click", () => {
  layoutGrid.classList.toggle("nav-expanded");
});

// Close nav when clicking outside on mobile
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768) {
    if (
      !nav.contains(e.target) &&
      !navToggle.contains(e.target) &&
      layoutGrid.classList.contains("nav-expanded")
    ) {
      layoutGrid.classList.remove("nav-expanded");
    }
  }
});

// Initialize
initializeWizard();

// Export for use in other modules
export { token, showLandingPage, loadForm };