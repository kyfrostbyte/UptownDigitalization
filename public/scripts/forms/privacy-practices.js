// Privacy Practices Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('privacyPracticesForm');
  const resetBtn = document.getElementById('resetBtn');
  const otherRadio = document.querySelector('input[name="officeReason"][value="other"]');
  const otherReasonGroup = document.getElementById('otherReasonGroup');
  const radioButtons = document.querySelectorAll('input[name="officeReason"]');
  
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
  
  // Show/hide "other reason" textarea based on radio selection
  radioButtons.forEach(radio => {
    radio.addEventListener('change', function() {
      if (otherRadio.checked) {
        otherReasonGroup.style.display = 'block';
      } else {
        otherReasonGroup.style.display = 'none';
        document.querySelector('textarea[name="otherReason"]').value = '';
      }
    });
  });
  
  // Reset form
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the form? All information will be cleared.')) {
      form.reset();
      otherReasonGroup.style.display = 'none';
      
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
    
    // Check if "Other" is selected but no reason provided
    if (otherRadio.checked) {
      const otherReasonText = document.querySelector('textarea[name="otherReason"]').value.trim();
      if (!otherReasonText) {
        alert('Please specify the reason in the text area.');
        return;
      }
    }
    
    // Get form data
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // Here you would typically send the data to a server
    console.log('Form Data:', data);
    
    alert('Privacy Practices Acknowledgement submitted successfully!\n\nThank you.');
    
    // Optional: Reset form after submission or redirect
    // form.reset();
  });
});