//form-common.js

// Handles form-specific logic, validation, dynamic fields, and submissions

import { token, loadForm, FORM_DEFINITIONS } from './form-wizard.js';

const container = document.getElementById("formContainer");
const title = document.getElementById("formTitle");

// Listen for forms being loaded
document.addEventListener('formLoaded', (e) => {
  const { formKey, formType } = e.detail;
  console.log(`Form loaded: ${formKey}`);
  
  // Initialize form-specific features
  initializeFormFeatures(formKey);
});

// Initialize form-specific features based on form type
function initializeFormFeatures(formKey) {
  switch(formKey) {
    case 'medical_history':
      setupMedicalHistoryLogic();
      break;
    case 'informed_consent':
      setupInformedConsentLogic();
      break;
    case 'privacy_practices_notices':
      setupPrivacyPracticesLogic();
      break;
    case 'e_sign_consent':
      setupESignConsentLogic();
      break;
  }
}

// Example: Medical History form logic
function setupMedicalHistoryLogic() {
  const form = container.querySelector('form');
  if (!form) return;
  
  // Example: Show/hide additional fields based on selections
  const hasConditionsCheckbox = form.querySelector('#hasConditions');
  const conditionsDetails = form.querySelector('#conditionsDetails');
  
  if (hasConditionsCheckbox && conditionsDetails) {
    hasConditionsCheckbox.addEventListener('change', (e) => {
      conditionsDetails.style.display = e.target.checked ? 'block' : 'none';
    });
  }
  
  // Example: Dynamic medication list
  const addMedicationBtn = form.querySelector('#addMedication');
  const medicationList = form.querySelector('#medicationList');
  
  if (addMedicationBtn && medicationList) {
    addMedicationBtn.addEventListener('click', () => {
      const medicationItem = document.createElement('div');
      medicationItem.className = 'medication-item';
      medicationItem.innerHTML = `
        <input type="text" name="medication[]" placeholder="Medication name">
        <input type="text" name="dosage[]" placeholder="Dosage">
        <button type="button" class="remove-medication">Remove</button>
      `;
      medicationList.appendChild(medicationItem);
      
      // Add remove handler
      medicationItem.querySelector('.remove-medication').addEventListener('click', () => {
        medicationItem.remove();
      });
    });
  }
}

// Example: Informed Consent form logic
function setupInformedConsentLogic() {
  const form = container.querySelector('form');
  if (!form) return;
  
  // Example: Enable submit only after reading consent
  const consentCheckbox = form.querySelector('#agreeConsent');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (consentCheckbox && submitBtn) {
    submitBtn.disabled = true;
    consentCheckbox.addEventListener('change', (e) => {
      submitBtn.disabled = !e.target.checked;
    });
  }
  
  // Example: Track scroll to ensure user read the document
  const consentDocument = form.querySelector('.consent-document');
  if (consentDocument) {
    let hasScrolledToBottom = false;
    consentDocument.addEventListener('scroll', () => {
      const isAtBottom = consentDocument.scrollHeight - consentDocument.scrollTop <= consentDocument.clientHeight + 10;
      if (isAtBottom) {
        hasScrolledToBottom = true;
        form.querySelector('#scrollIndicator')?.remove();
      }
    });
  }
}

// Example: Privacy Practices form logic
function setupPrivacyPracticesLogic() {
  const form = container.querySelector('form');
  if (!form) return;
  
  // Add any privacy practices specific logic here
  console.log('Privacy practices form initialized');
}

// Example: E-Sign Consent form logic
function setupESignConsentLogic() {
  const form = container.querySelector('form');
  if (!form) return;
  
  // Example: Signature pad or typed signature validation
  const signatureInput = form.querySelector('#signature');
  const signaturePreview = form.querySelector('#signaturePreview');
  
  if (signatureInput && signaturePreview) {
    signatureInput.addEventListener('input', (e) => {
      signaturePreview.textContent = e.target.value;
      signaturePreview.style.fontFamily = 'cursive';
    });
  }
  
  // Example: Add timestamp
  const timestampField = form.querySelector('#timestamp');
  if (timestampField) {
    timestampField.value = new Date().toISOString();
  }
}

// Function to navigate to next form or show completion screen
async function navigateToNextFormOrComplete() {
  try {
    // Fetch latest client data to see which forms are still pending
    const response = await fetch(`/client/${token}`);
    const data = await response.json();

    if (!data.form) {
      showCompletionScreen();
      return;
    }

    // Get all available forms for this client
    const clientForms = Object.keys(FORM_DEFINITIONS).filter(key => data.form[key]);

    // Find forms that haven't been completed yet
    // (You'll need to track completion status on the server)
    // For now, we'll get the list of forms from the nav and find the next one
    const nav = document.getElementById("formNav");
    const navLinks = Array.from(nav.querySelectorAll("a[data-form-key]"));

    // Find the currently active form
    const activeLink = nav.querySelector("a.active");
    const currentIndex = navLinks.indexOf(activeLink);

    // Navigate to next form if available
    if (currentIndex >= 0 && currentIndex < navLinks.length - 1) {
      const nextLink = navLinks[currentIndex + 1];
      const nextFormKey = nextLink.dataset.formKey;
      await loadForm(nextFormKey);
    } else {
      // No more forms, show completion screen
      showCompletionScreen();
    }
  } catch (error) {
    console.error('Error navigating to next form:', error);
    showCompletionScreen();
  }
}

// Function to show completion screen
function showCompletionScreen() {
  const nav = document.getElementById("formNav");
  nav.querySelectorAll("a").forEach(a => a.classList.remove("active"));

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

// Handle form submission for all dynamically loaded forms
container.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formEl = e.target;
  
  // Show loading state
  const submitBtn = formEl.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // Collect form data
    const formData = new FormData(formEl);
    const formDataObj = Object.fromEntries(formData.entries());
    
    // Get form type from title
    const formType = title.textContent.toLowerCase().replace(/ /g, "_");
    
    // Submit to server
    const response = await fetch(`/submit-form/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formType: formType,
        data: formDataObj,
        timestamp: new Date().toISOString()
      }),
    });

    if (response.ok) {
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-message';
      successMsg.textContent = 'Form submitted successfully!';
      formEl.insertBefore(successMsg, formEl.firstChild);

      // Reset form
      formEl.reset();

      // Check for remaining forms and navigate
      setTimeout(async () => {
        successMsg.remove();
        await navigateToNextFormOrComplete();
      }, 1500);

    } else {
      throw new Error('Submission failed');
    }
  } catch (error) {
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.textContent = 'Error submitting form. Please try again.';
    formEl.insertBefore(errorMsg, formEl.firstChild);
    
    setTimeout(() => errorMsg.remove(), 3000);
    console.error(error);
  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Form validation helpers
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const re = /^[\d\s\-\(\)]+$/;
  return re.test(phone);
}

export function validateRequired(value) {
  return value && value.trim().length > 0;
}

// Export utilities for use in individual form pages if needed
export { setupMedicalHistoryLogic, setupInformedConsentLogic, setupPrivacyPracticesLogic, setupESignConsentLogic };