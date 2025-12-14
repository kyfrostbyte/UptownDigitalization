// ===== informed-consent.js =====
// Informed Consent specific functionality

import { setupNameAutofill, setTodayDate } from './forms-common.js';

document.addEventListener('formLoaded', (e) => {
  if (e.detail.formKey !== 'informed_consent') return;
  
  initializeInformedConsent();
});

function initializeInformedConsent() {
  const form = document.querySelector('#informedConsentForm');
  if (!form) return;

  // Set today's date
  setTodayDate('input[name="signatureDate"]');

  // Auto-fill printed name
  setupNameAutofill('input[name="clientName"]', 'input[name="namePrinted"]');

  // Visual feedback for checkboxes
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const parent = this.closest('.acknowledgement');
      if (parent) {
        if (this.checked) {
          parent.style.backgroundColor = '#e8f5e9';
          parent.style.borderLeft = '4px solid #4caf50';
        } else {
          parent.style.backgroundColor = '#f0f4ff';
          parent.style.borderLeft = 'none';
        }
      }
    });
  });
}