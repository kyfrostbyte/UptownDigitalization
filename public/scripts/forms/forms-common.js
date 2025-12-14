// ===== forms-common.js =====

// Auto-fill printed name from client name
export function setupNameAutofill(clientNameSelector, printedNameSelector) {
  const clientNameInput = document.querySelector(clientNameSelector);
  const printedNameInput = document.querySelector(printedNameSelector);
  
  if (clientNameInput && printedNameInput) {
    clientNameInput.addEventListener('input', function() {
      printedNameInput.value = this.value;
    });
  }
}

// Set date input to today
export function setTodayDate(dateInputSelector) {
  const dateInput = document.querySelector(dateInputSelector);
  if (!dateInput) return;

  const today = new Date();
  console.log(today);
  const localDate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
  dateInput.value = localDate;
}

// Convert input to uppercase
export function setupUppercaseInput(selector) {
  const inputs = document.querySelectorAll(selector);
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.toUpperCase();
    });
  });
}

// Show/hide conditional fields based on radio selection
export function setupConditionalField(radioName, triggerValue, conditionalSelector) {
  const radios = document.querySelectorAll(`input[name="${radioName}"]`);
  const conditionalField = document.querySelector(conditionalSelector);

  if (radios.length && conditionalField) {
    radios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === triggerValue && this.checked) {
          conditionalField.style.display = 'block';
        } else {
          conditionalField.style.display = 'none';
        }
      });
    });
  }
}

// Show/hide conditional fields based on checkbox selection
export function setupConditionalCheckbox(checkboxSelector, conditionalSelector) {
  const checkbox = document.querySelector(checkboxSelector);
  const conditionalField = document.querySelector(conditionalSelector);

  if (checkbox && conditionalField) {
    checkbox.addEventListener('change', function() {
      conditionalField.style.display = this.checked ? 'block' : 'none';
    });
  }
}

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

// Check if all required fields are filled
export function validateRequiredFields(formElement) {
  const requiredInputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');
  let allFilled = true;
  
  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      allFilled = false;
      input.style.borderColor = '#dc3545';
    } else {
      input.style.borderColor = '';
    }
  });
  
  if (!allFilled) {
    alert('Please fill in all required fields.');
  }
  
  return allFilled;
}