// ===== media-release.js =====
// Media Release specific functionality

import { setupNameAutofill, setTodayDate, setupUppercaseInput } from './forms-common.js';

document.addEventListener('formLoaded', (e) => {
  if (e.detail.formKey !== 'media_release') return;
  
  initializeMediaRelease();
});

function initializeMediaRelease() {
  const form = document.querySelector('#mediaReleaseForm');
  if (!form) return;

  // Set today's date
  setTodayDate('input[name="signatureDate"]');

  // Auto-fill printed name
  setupNameAutofill('input[name="clientName"]', 'input[name="namePrinted"]');

  // Auto-convert initials to uppercase
  setupUppercaseInput('.initial-input');

  // Handle mutual exclusivity of adult vs guardian initials
  const adultInitials = form.querySelector('input[name="adultInitials"]');
  const guardianInitials = form.querySelector('input[name="guardianInitials"]');
  
  if (adultInitials && guardianInitials) {
    adultInitials.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        guardianInitials.value = '';
        guardianInitials.style.backgroundColor = '#f5f5f5';
        guardianInitials.disabled = true;
        this.style.backgroundColor = '#fffef8';
      } else {
        guardianInitials.disabled = false;
        guardianInitials.style.backgroundColor = 'white';
      }
    });
    
    guardianInitials.addEventListener('input', function() {
      if (this.value.trim() !== '') {
        adultInitials.value = '';
        adultInitials.style.backgroundColor = '#f5f5f5';
        adultInitials.disabled = true;
        this.style.backgroundColor = '#fffef8';
      } else {
        adultInitials.disabled = false;
        adultInitials.style.backgroundColor = 'white';
      }
    });
  }
}