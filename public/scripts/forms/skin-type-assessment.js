// ===== skin-type-assessment.js =====
// Skin Type Assessment specific functionality

document.addEventListener('formLoaded', (e) => {
  if (e.detail.formKey !== 'skin_type_assessment') return;
  
  initializeSkinAssessment();
});

function initializeSkinAssessment() {
  const form = document.querySelector('#skinAssessmentForm');
  if (!form) return;

  const calculateBtn = form.querySelector('#calculateBtn');
  const resultsSection = form.querySelector('#resultsSection');

  const allQuestions = [
    'eyes', 'hair', 'skin', 'freckles',
    'sunBurn', 'tanDegree', 'tanSpeed', 'faceReaction',
    'lastExposure', 'areaExposure'
  ];

  if (calculateBtn) {
    calculateBtn.addEventListener('click', function() {
      let allAnswered = true;
      const unanswered = [];
      
      allQuestions.forEach(questionName => {
        const selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);
        if (!selectedOption) {
          allAnswered = false;
          unanswered.push(questionName);
        }
      });
      
      if (!allAnswered) {
        alert('Please answer all questions before calculating your score.');
        if (unanswered.length > 0) {
          const firstUnanswered = form.querySelector(`input[name="${unanswered[0]}"]`);
          if (firstUnanswered) {
            firstUnanswered.closest('.question-group').scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }
      
      let totalScore = 0;
      allQuestions.forEach(questionName => {
        const selectedOption = form.querySelector(`input[name="${questionName}"]:checked`);
        if (selectedOption) {
          totalScore += parseInt(selectedOption.value);
        }
      });
      
      form.querySelector('#totalScore').textContent = totalScore;
      updateSkinType(totalScore, form);
      
      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      calculateBtn.disabled = true;
      calculateBtn.textContent = 'Score Calculated';
    });
  }

  function updateSkinType(totalScore, form) {
    let skinType = '-';
    let description = '';
    
    if (totalScore >= 0 && totalScore <= 7) {
      skinType = 'I';
      description = 'Very fair skin, always burns, never tans. High sun sensitivity.';
    } else if (totalScore >= 8 && totalScore <= 16) {
      skinType = 'II';
      description = 'Fair skin, usually burns, tans minimally. Moderate to high sun sensitivity.';
    } else if (totalScore >= 17 && totalScore <= 25) {
      skinType = 'III';
      description = 'Medium skin, sometimes burns, tans uniformly. Moderate sun sensitivity.';
    } else if (totalScore >= 26 && totalScore <= 30) {
      skinType = 'IV';
      description = 'Olive skin, burns minimally, always tans well. Low sun sensitivity.';
    } else if (totalScore > 30) {
      skinType = 'V-VI';
      description = 'Brown to dark brown skin, rarely burns, tans very easily. Minimal sun sensitivity.';
    }
    
    form.querySelector('#skinType').textContent = skinType;
    form.querySelector('#skinTypeDescription').textContent = description;
  }
}