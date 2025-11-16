// Wait for the form to be loaded into the DOM
function initMedicalHistoryForm(shouldExist = false) {
  const form = document.getElementById("medicalHistoryForm");

 

  if (!form) {
    // Only log error if the form was expected to exist (i.e., user navigated to it)
    if (shouldExist) {
      console.error("Medical history form not found in DOM");
    }
    return;
  }

  // Track if form has been submitted at least once
  let formSubmitted = false;

// Show/hide conditional fields based on responses
function setupConditionalFields() {
  // Friend/Family referral
  document.getElementById("hearFriend").addEventListener("change", (e) => {
    document
      .getElementById("friendNameField")
      .classList.toggle("visible", e.target.checked);
  });

  // Physician referral
  document.getElementById("hearPhysician").addEventListener("change", (e) => {
    document
      .getElementById("physicianNameField")
      .classList.toggle("visible", e.target.checked);
  });

  // Previous treatments
  document
    .querySelectorAll('input[name="previousTreatments"]')
    .forEach((radio) => {
      radio.addEventListener("change", (e) => {
        document
          .getElementById("previousTreatmentsDetails")
          .classList.toggle("visible", e.target.value === "yes");
      });
    });

  // Women only section - show if gender is female
  document.querySelectorAll('input[name="gender"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.getElementById("womenOnlySection").style.display =
        e.target.value === "female" ? "block" : "none";
    });
  });

  // Skincare products
  document.querySelectorAll('input[name="useSkincare"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("skincareProductsField")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Physician care
  document.querySelectorAll('input[name="physicianCare"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("physicianCareDetails")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Hair removal date
  document.querySelectorAll('input[name="hairRemoval"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("hairRemovalDateField")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Hospitalized
  document.querySelectorAll('input[name="hospitalized"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("hospitalizedDetails")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Allergies
  document.querySelectorAll('input[name="allergies"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("allergiesList")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Oral medications
  document.querySelectorAll('input[name="oralMeds"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("oralMedsList")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Topical medications
  document.querySelectorAll('input[name="topicalMeds"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("topicalMedsList")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });

  // Tattoos
  document.querySelectorAll('input[name="tattoos"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document
        .getElementById("tattoosLocationField")
        .classList.toggle("visible", e.target.value === "yes");
    });
  });
}

// Phone number formatting
function formatPhoneNumber(input) {
  let value = input.value.replace(/\D/g, "");
  if (value.length >= 10) {
    value = value.substring(0, 10);
    input.value = value.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  } else {
    input.value = value;
  }
}

document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener("input", () => formatPhoneNumber(input));
});

// Add real-time validation for email after user starts typing
document.getElementById("email").addEventListener("blur", function() {
  if (formSubmitted && this.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const formGroup = this.closest(".form-group");
    if (!emailRegex.test(this.value)) {
      formGroup.classList.add("error");
    } else {
      formGroup.classList.remove("error");
    }
  }
});

// Remove error styling when user starts fixing required fields
form.querySelectorAll("[required]").forEach((field) => {
  field.addEventListener("input", function() {
    if (formSubmitted && this.value.trim()) {
      this.closest(".form-group").classList.remove("error");
    }
  });
});

// Form validation
function validateForm() {
  let isValid = true;
  const requiredFields = form.querySelectorAll("[required]");

  requiredFields.forEach((field) => {
    const formGroup = field.closest(".form-group");

    if (!field.value.trim()) {
      if (formSubmitted) {
        formGroup.classList.add("error");
      }
      isValid = false;
    } else {
      formGroup.classList.remove("error");
    }
  });

  // Email validation
  const emailField = document.getElementById("email");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailField.value && !emailRegex.test(emailField.value)) {
    if (formSubmitted) {
      emailField.closest(".form-group").classList.add("error");
    }
    isValid = false;
  } else if (emailField.value) {
    emailField.closest(".form-group").classList.remove("error");
  }

  // Age validation (must be at least 13 years old)
  const birthdateField = document.getElementById("birthdate");
  if (birthdateField.value) {
    const birthDate = new Date(birthdateField.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 13) {
      if (formSubmitted) {
        alert("Patient must be at least 13 years old.");
      }
      isValid = false;
    }
  }

  return isValid;
}

// Form submission
form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Mark that form has been submitted
  formSubmitted = true;

  if (!validateForm()) {
    alert("Please fill in all required fields correctly.");
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Collect checkbox groups
  const hearAbout = [];
  formData.getAll("hearAbout").forEach((val) => hearAbout.push(val));
  data.hearAbout = hearAbout;

  const skinProducts = [];
  formData.getAll("skinProducts").forEach((val) => skinProducts.push(val));
  data.skinProducts = skinProducts;

  const skinTreatments = [];
  formData.getAll("skinTreatments").forEach((val) => skinTreatments.push(val));
  data.skinTreatments = skinTreatments;

  const injectables = [];
  formData.getAll("injectables").forEach((val) => injectables.push(val));
  data.injectables = injectables;

  const conditions = [];
  formData.getAll("conditions").forEach((val) => conditions.push(val));
  data.conditions = conditions;

  const skinCancer = [];
  formData.getAll("skinCancer").forEach((val) => skinCancer.push(val));
  data.skinCancer = skinCancer;

  console.log("Form data:", data);

  // The form submission will be handled by forms-common.js
  // which listens for submit events on the container
});

// Cancel button
const cancelBtn = document.getElementById("cancelBtn");
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    if (
      confirm("Are you sure you want to cancel? All entered data will be lost.")
    ) {
      form.reset();
      // Clear any draft data
      localStorage.removeItem(autoSaveKey);
      // Just reset the form without navigating away
    }
  });
}

// Initialize conditional field handlers
setupConditionalFields();

// // Auto-save to localStorage (optional)
// const autoSaveKey = "medicalHistoryFormDraft";

// // Load saved draft
// const savedDraft = localStorage.getItem(autoSaveKey);
// if (savedDraft) {
//   if (confirm("A saved draft was found. Would you like to restore it?")) {
//     const data = JSON.parse(savedDraft);
//     Object.keys(data).forEach((key) => {
//       const field = form.elements[key];
//       if (field) {
//         if (field.type === "radio" || field.type === "checkbox") {
//           if (Array.isArray(data[key])) {
//             data[key].forEach((val) => {
//               const input = form.querySelector(
//                 `input[name="${key}"][value="${val}"]`
//               );
//               if (input) input.checked = true;
//             });
//           } else {
//             const input = form.querySelector(
//               `input[name="${key}"][value="${data[key]}"]`
//             );
//             if (input) input.checked = true;
//           }
//         } else {
//           field.value = data[key];
//         }
//       }
//     });
//   }
// }

// Save draft periodically
setInterval(() => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  localStorage.setItem(autoSaveKey, JSON.stringify(data));
}, 30000); // Save every 30 seconds

// Clear draft on successful submission
form.addEventListener("submit", () => {
  localStorage.removeItem(autoSaveKey);
});
}

// Listen for the form to be loaded by the form wizard
document.addEventListener('formLoaded', (e) => {
  if (e.detail.formKey === 'medical_history') {
    // Small delay to ensure DOM is fully updated
    setTimeout(() => initMedicalHistoryForm(true), 10);
  }
});

// Also initialize if the form is already in the DOM (for standalone usage)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMedicalHistoryForm);
} else {
  initMedicalHistoryForm();
}