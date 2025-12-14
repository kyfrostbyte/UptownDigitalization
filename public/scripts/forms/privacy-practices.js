// ===== privacy-practices.js =====
// Privacy Practices specific functionality

import { setupNameAutofill, setTodayDate } from './forms-common.js';

document.addEventListener('formLoaded', (e) => {
  if (e.detail.formKey !== 'privacy_practices') return;
  
  initializePrivacyPractices();
});

function initializePrivacyPractices() {
  const form = document.querySelector('#privacyPracticesForm');
  if (!form) return;

  // Set today's date
  setTodayDate('input[name="signatureDate"]');

  // Auto-fill printed name
  setupNameAutofill('input[name="clientName"]', 'input[name="namePrinted"]');

  // Handle "Other" reason field
  const otherRadio = form.querySelector('input[name="officeReason"][value="other"]');
  const otherReasonGroup = form.querySelector('#otherReasonGroup');
  const radioButtons = form.querySelectorAll('input[name="officeReason"]');
  
  if (otherRadio && otherReasonGroup) {
    radioButtons.forEach(radio => {
      radio.addEventListener('change', function() {
        if (otherRadio.checked) {
          otherReasonGroup.style.display = 'block';
        } else {
          otherReasonGroup.style.display = 'none';
          const otherReasonTextarea = form.querySelector('textarea[name="otherReason"]');
          if (otherReasonTextarea) {
            otherReasonTextarea.value = '';
          }
        }
      });
    });
  }
}