// Informed Consent Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('informedConsentForm');
  const resetBtn = document.getElementById('resetBtn');
  
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
  
  // Reset form
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the form? All information will be cleared.')) {
      form.reset();
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
    
    // Check all required checkboxes
    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    let allChecked = true;
    
    requiredCheckboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        allChecked = false;
      }
    });
    
    if (!allChecked) {
      alert('Please acknowledge all required sections by checking all boxes.');
      return;
    }
    
    // Check all required text inputs
    const requiredInputs = form.querySelectorAll('input[required]:not([type="checkbox"])');
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
    
    // Get form data
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // Here you would typically send the data to a server
    console.log('Form Data:', data);
    
    alert('Informed Consent submitted successfully!\n\nThank you for completing the consent form.');
    
    // Optional: Reset form after submission or redirect
    // form.reset();
  });
  
  // Add visual feedback for checkboxes
  const checkboxes = form.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const parent = this.closest('.acknowledgement');
      if (this.checked) {
        parent.style.backgroundColor = '#e8f5e9';
        parent.style.borderLeft = '4px solid #4caf50';
      } else {
        parent.style.backgroundColor = '#f0f4ff';
        parent.style.borderLeft = 'none';
      }
    });
  });
});