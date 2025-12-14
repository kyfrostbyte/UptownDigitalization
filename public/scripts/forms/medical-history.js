// ===== medical-history.js =====
// Medical History specific functionality

import { setupConditionalField, setupConditionalCheckbox } from './forms-common.js';

document.addEventListener('formLoaded', (e) => {
  if (e.detail.formKey !== 'medical_history') return;
  
  initializeMedicalHistory();
});

function initializeMedicalHistory() {
  const form = document.querySelector('#medicalHistoryForm');
  if (!form) return;

  // Setup conditional fields for radio buttons
  const radioTriggers = {
    'previousTreatments': 'yes',
    'useSkincare': 'yes',
    'physicianCare': 'yes',
    'hairRemoval': 'yes',
    'hospitalized': 'yes',
    'allergies': 'yes',
    'oralMeds': 'yes',
    'topicalMeds': 'yes',
    'tattoos': 'yes'
  };

  Object.entries(radioTriggers).forEach(([name, triggerValue]) => {
    setupConditionalField(name, triggerValue, `.conditional-field[data-trigger="${name}"]`);
  });

  // Setup conditional fields for checkboxes
  setupConditionalCheckbox('input[name="hearAbout"][value="friend"]', '.conditional-field[data-trigger="friend"]');
  setupConditionalCheckbox('input[name="hearAbout"][value="physician"]', '.conditional-field[data-trigger="physician"]');

  // Handle gender-specific section
  const genderRadios = form.querySelectorAll('input[name="gender"]');
  const womenSection = form.querySelector('.form-section[data-gender="female"]');

  if (genderRadios.length && womenSection) {
    genderRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        womenSection.style.display = this.value === 'female' ? 'block' : 'none';
      });
    });
  }
}