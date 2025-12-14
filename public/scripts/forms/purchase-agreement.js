// ===== purchase-agreement.js =====
// Purchase Agreement specific functionality
import { setTodayDate } from "./forms-common.js";

document.addEventListener("formLoaded", (e) => {
  if (e.detail.formKey !== "purchase_agreement") return;

  initializePurchaseAgreement();
  setTodayDate('input[name="dateSignature"]');
});

function initializePurchaseAgreement() {
  const form = document.querySelector("#purchaseAgreementForm");
  if (!form) return;

  // Service area pricing data
  const AREA_PRICING = {
    Abdomen: { monthly: 79, total: 1598 },
    Areola: { monthly: 25, total: 425 },
    "Arms (full)": { monthly: 96, total: 1992 },
    "Arms (half)": { monthly: 79, total: 1598 },
    "Back of Neck": { monthly: 33, total: 638 },
    "Back (half)": { monthly: 79, total: 1598 },
    "Back (full)": { monthly: 125, total: 1995 },
    "Bikini Line": { monthly: 79, total: 1598 },
    Brazilian: { monthly: 96, total: 1795 },
    Buttocks: { monthly: 79, total: 1598 },
    Chest: { monthly: 79, total: 1598 },
    "Chest/Abs": { monthly: 125, total: 2664 },
    Chin: { monthly: 33, total: 638 },
    Ears: { monthly: 25, total: 425 },
    Feet: { monthly: 25, total: 425 },
    "Full Face and Neck": { monthly: 79, total: 1598 },
    "Inner Thigh": { monthly: 33, total: 638 },
    Jawline: { monthly: 33, total: 638 },
    "Legs (full)": { monthly: 125, total: 2664 },
    "Legs (half)": { monthly: 96, total: 1795 },
    "Lip (upper)": { monthly: 33, total: 638 },
    "Peri-Anal": { monthly: 25, total: 425 },
    Shoulders: { monthly: 33, total: 1063 },
    Sideburns: { monthly: 33, total: 638 },
    Underarms: { monthly: 33, total: 638 },
    Unibrow: { monthly: 25, total: 425 },
    "Full Body": { monthly: 374, total: 7995 },
  };

  const addAreaBtn = form.querySelector("#addAreaBtn");
  const serviceAreasTable = form.querySelector("#serviceAreasTable tbody");
  const touchUpTable = form.querySelector("#touchUpTable tbody");
  const totalMonthly = form.querySelector("#totalMonthly");
  const totalCost = form.querySelector("#totalCost");
  const invoiceMonthly = form.querySelector("#invoiceMonthly");
  const invoiceTotal = form.querySelector("#invoiceTotal");
  const minorConsent = form.querySelector("#minorConsent");
  const minorInitialBox = form.querySelector("#minorInitialBox");
  const guardianFields = form.querySelector("#guardianFields");
  const minorInitial = form.querySelector("#minorInitial");
  const guardianName = form.querySelector("#guardianName");
  const guardianSignature = form.querySelector("#guardianSignature");
  const dateSignature = form.querySelector("#dateSignature");

  let selectedAreas = new Set();

  // Add new service area row
  function addServiceAreaRow() {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <select class="area-select" required>
          <option value="">Select Area</option>
          ${Object.keys(AREA_PRICING)
            .map(
              (area) =>
                `<option value="${area}" ${
                  selectedAreas.has(area) ? "disabled" : ""
                }>${area}</option>`
            )
            .join("")}
        </select>
      </td>
      <td class="monthly-cost">-</td>
      <td class="total-cost">-</td>
      <td>
        <button type="button" class="btn-remove" aria-label="Remove area">×</button>
      </td>
    `;

    const select = row.querySelector(".area-select");
    const removeBtn = row.querySelector(".btn-remove");

    select.addEventListener("change", (e) => {
      const area = e.target.value;
      if (area) {
        updateRowPricing(row, area);
        addTouchUpRow(area);
        updateTotals();
      }
    });

    removeBtn.addEventListener("click", () => {
      const selectedArea = select.value;
      if (selectedArea) {
        selectedAreas.delete(selectedArea);
        removeTouchUpRow(selectedArea);
        updateAllAreaSelects();
      }
      row.remove();
      updateTotals();
    });

    serviceAreasTable.appendChild(row);
  }

  function updateRowPricing(row, area) {
    const pricing = AREA_PRICING[area];
    row.querySelector(
      ".monthly-cost"
    ).textContent = `$${pricing.monthly}/month`;
    row.querySelector(
      ".total-cost"
    ).textContent = `$${pricing.total.toLocaleString()}`;
    selectedAreas.add(area);
    updateAllAreaSelects();
  }

  function updateAllAreaSelects() {
    form.querySelectorAll(".area-select").forEach((select) => {
      const currentValue = select.value;
      Array.from(select.options).forEach((option) => {
        if (option.value && option.value !== currentValue) {
          option.disabled = selectedAreas.has(option.value);
        }
      });
    });
  }

  function addTouchUpRow(area) {
    const pricing = AREA_PRICING[area];
    const touchUpMonthly = Math.round(pricing.monthly * 0.25);
    const touchUpTotal = Math.round(pricing.total * 0.25);

    const row = document.createElement("tr");
    row.dataset.area = area;
    row.innerHTML = `
      <td>${area}</td>
      <td>$${touchUpMonthly}/month</td>
      <td>$${touchUpTotal.toLocaleString()}</td>
    `;

    touchUpTable.appendChild(row);
  }

  function removeTouchUpRow(area) {
    const row = touchUpTable.querySelector(`tr[data-area="${area}"]`);
    if (row) row.remove();
  }

  function updateTotals() {
    let monthlySum = 0;
    let totalSum = 0;

    form.querySelectorAll("#serviceAreasTable tbody tr").forEach((row) => {
      const monthlyCost = row.querySelector(".monthly-cost").textContent;
      const totalCostText = row.querySelector(".total-cost").textContent;

      if (monthlyCost !== "-") {
        monthlySum += parseInt(monthlyCost.replace(/\D/g, ""));
        totalSum += parseInt(totalCostText.replace(/\D/g, ""));
      }
    });

    totalMonthly.textContent = `$${monthlySum}/month`;
    totalCost.textContent = `$${totalSum.toLocaleString()}`;
    invoiceMonthly.textContent = `$${monthlySum}/month`;
    invoiceTotal.textContent = `$${totalSum.toLocaleString()}`;
  }

  // Handle minor consent checkbox
  if (minorConsent) {
    minorConsent.addEventListener("change", (e) => {
      if (e.target.checked) {
        minorInitialBox.style.display = "block";
        guardianFields.style.display = "block";
        minorInitial.required = true;
        guardianName.required = true;
        guardianSignature.required = true;
      } else {
        minorInitialBox.style.display = "none";
        guardianFields.style.display = "none";
        minorInitial.required = false;
        guardianName.required = false;
        guardianSignature.required = false;
        minorInitial.value = "";
        guardianName.value = "";
        guardianSignature.value = "";
      }
    });
  }

  // Event listeners
  if (addAreaBtn) {
    addAreaBtn.addEventListener("click", addServiceAreaRow);
  }
}
