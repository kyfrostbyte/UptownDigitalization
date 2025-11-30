// Media Release Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('mediaReleaseForm');
  const resetBtn = document.getElementById('resetBtn');
  const adultInitials = document.querySelector('input[name="adultInitials"]');
  const guardianInitials = document.querySelector('input[name="guardianInitials"]');
  
  // Set default date to today
  const dateInput = document.querySelector('input[name="signatureDate"]');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  // Auto-fill printed name when client name is entered
  const clientNameInput = document.querySelector('input[name="clientName"]');
  const namePrintedInput = document.querySelector('input[name="namePrinted"]');
  
  if (clientNameInput && namePrintedInput) {
    clientNameInput.addEventListener('input', function() {
      namePrintedInput.value = this.value;
    });
  }
  
  // Handle initial inputs - ensure only one is filled
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
  
  // Auto-convert initials to uppercase
  const initialInputs = document.querySelectorAll('.initial-input');
  initialInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  });
  
  // Reset form
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the form? All information will be cleared.')) {
      form.reset();
      
      // Re-enable both initial inputs
      if (adultInitials) {
        adultInitials.disabled = false;
        adultInitials.style.backgroundColor = 'white';
      }
      if (guardianInitials) {
        guardianInitials.disabled = false;
        guardianInitials.style.backgroundColor = 'white';
      }
      
      // Reset date to today
      if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
      }
    }
  });
  
  // Form validation and submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Check if at least one set of initials is provided
    const adultInitialsValue = adultInitials.value.trim();
    const guardianInitialsValue = guardianInitials.value.trim();
    
    if (!adultInitialsValue && !guardianInitialsValue) {
      alert('Please initial one of the paragraphs that applies to your situation.');
      return;
    }
    
    if (adultInitialsValue && guardianInitialsValue) {
      alert('Please initial only ONE paragraph that applies to your situation.');
      return;
    }
    
    // Check all required text inputs
    const requiredInputs = form.querySelectorAll('input[required]');
    let allFilled = true;
    
    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        allFilled = false;
      }
    });
    
    if (!allFilled) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // If guardian initials are provided, check if guardian information is filled
    if (guardianInitialsValue) {
      const guardianSignature = document.querySelector('input[name="guardianSignature"]').value.trim();
      const guardianNamePrinted = document.querySelector('input[name="guardianNamePrinted"]').value.trim();
      
      if (!guardianSignature || !guardianNamePrinted) {
        alert('Since you are signing as a parent/guardian, please fill in the Guardian Information section.');
        return;
      }
    }
    
    // Get form data
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // Determine which category was selected
    data.signerType = adultInitialsValue ? 'adult' : 'guardian';
    
    // Here you would typically send the data to a server
    console.log('Form Data:', data);
    
    const signerType = adultInitialsValue ? 'as an adult' : 'as a parent/legal guardian';
    alert(`Media Release Form submitted successfully!\n\nSigned ${signerType}.\n\nThank you for granting permission.`);
    
    // Optional: Reset form after submission or redirect
    // form.reset();
  });
});