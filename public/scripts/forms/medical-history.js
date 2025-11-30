// Medical History Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('medicalHistoryForm');
  const resetBtn = document.getElementById('resetBtn');

  // Handle conditional fields
  function setupConditionalFields() {
    // Radio button triggers
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

    Object.keys(radioTriggers).forEach(name => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const triggerValue = radioTriggers[name];
      const conditionalField = document.querySelector(`.conditional-field[data-trigger="${name}"]`);

      if (radios.length && conditionalField) {
        radios.forEach(radio => {
          radio.addEventListener('change', function() {
            if (this.value === triggerValue && this.checked) {
              conditionalField.classList.add('show');
            } else {
              conditionalField.classList.remove('show');
            }
          });
        });
      }
    });

    // Checkbox triggers for "How did you hear about us"
    const friendCheckbox = document.querySelector('input[name="hearAbout"][value="friend"]');
    const physicianCheckbox = document.querySelector('input[name="hearAbout"][value="physician"]');
    const friendField = document.querySelector('.conditional-field[data-trigger="friend"]');
    const physicianField = document.querySelector('.conditional-field[data-trigger="physician"]');

    if (friendCheckbox && friendField) {
      friendCheckbox.addEventListener('change', function() {
        friendField.classList.toggle('show', this.checked);
      });
    }

    if (physicianCheckbox && physicianField) {
      physicianCheckbox.addEventListener('change', function() {
        physicianField.classList.toggle('show', this.checked);
      });
    }
  }

  // Handle Women Only section visibility
  function setupGenderSection() {
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const womenSection = document.querySelector('.form-section[data-gender="female"]');

    if (genderRadios.length && womenSection) {
      genderRadios.forEach(radio => {
        radio.addEventListener('change', function() {
          if (this.value === 'female') {
            womenSection.style.display = 'block';
          } else {
            womenSection.style.display = 'none';
          }
        });
      });
    }
  }

  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Check required fields
    const requiredInputs = form.querySelectorAll('input[required]');
    let allFilled = true;

    requiredInputs.forEach(input => {
      if (!input.value.trim()) {
        allFilled = false;
        input.style.borderColor = '#dc3545';
      } else {
        input.style.borderColor = '#ddd';
      }
    });

    if (!allFilled) {
      alert('Please fill in all required fields (marked with *).');
      return;
    }

    // Get form data
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    // Here you would typically send the data to a server
    console.log('Form Data:', data);

    alert('Medical History Form submitted successfully!\n\nThank you for completing the form.');

    // Optional: Reset form or redirect
    // form.reset();
  });

  // Reset form
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the form? All information will be cleared.')) {
      form.reset();
      
      // Hide all conditional fields
      document.querySelectorAll('.conditional-field').forEach(field => {
        field.classList.remove('show');
      });

      // Hide women only section
      const womenSection = document.querySelector('.form-section[data-gender="female"]');
      if (womenSection) {
        womenSection.style.display = 'none';
      }
    }
  });

  // Initialize
  setupConditionalFields();
  setupGenderSection();
});