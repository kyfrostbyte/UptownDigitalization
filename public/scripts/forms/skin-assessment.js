// Skin Type Assessment Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('skinAssessmentForm');
  const resetBtn = document.getElementById('resetBtn');
  
  // Section I question names
  const section1Questions = ['eyes', 'hair', 'skin', 'freckles'];
  
  // Section II question names
  const section2Questions = ['sunBurn', 'tanDegree', 'tanSpeed', 'faceReaction'];
  
  // Section III question names
  const section3Questions = ['lastExposure', 'areaExposure'];
  
  // Add event listeners to all radio buttons
  const allRadios = document.querySelectorAll('input[type="radio"]');
  allRadios.forEach(radio => {
    radio.addEventListener('change', calculateScores);
  });
  
  // Calculate scores function
  function calculateScores() {
    // Calculate Section I score
    const score1 = calculateSectionScore(section1Questions);
    document.getElementById('score1').textContent = score1;
    
    // Calculate Section II score
    const score2 = calculateSectionScore(section2Questions);
    document.getElementById('score2').textContent = score2;
    
    // Calculate Section III score
    const score3 = calculateSectionScore(section3Questions);
    document.getElementById('score3').textContent = score3;
    
    // Calculate total score
    const totalScore = score1 + score2 + score3;
    document.getElementById('totalScore').textContent = totalScore;
    
    // Determine Fitzpatrick skin type
    updateSkinType(totalScore);
  }
  
  // Calculate score for a section
  function calculateSectionScore(questions) {
    let score = 0;
    questions.forEach(questionName => {
      const selectedOption = document.querySelector(`input[name="${questionName}"]:checked`);
      if (selectedOption) {
        score += parseInt(selectedOption.value);
      }
    });
    return score;
  }
  
  // Update skin type based on total score
  function updateSkinType(totalScore) {
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
    
    document.getElementById('skinType').textContent = skinType;
    document.getElementById('skinTypeDescription').textContent = description;
  }
  
  // Reset form
  resetBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the form? All answers will be cleared.')) {
      form.reset();
      document.getElementById('score1').textContent = '0';
      document.getElementById('score2').textContent = '0';
      document.getElementById('score3').textContent = '0';
      document.getElementById('totalScore').textContent = '0';
      document.getElementById('skinType').textContent = '-';
      document.getElementById('skinTypeDescription').textContent = '';
    }
  });
  
  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Check if all questions are answered
    const allQuestions = [...section1Questions, ...section2Questions, ...section3Questions];
    let allAnswered = true;
    
    allQuestions.forEach(questionName => {
      const selectedOption = document.querySelector(`input[name="${questionName}"]:checked`);
      if (!selectedOption) {
        allAnswered = false;
      }
    });
    
    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    const totalScore = parseInt(document.getElementById('totalScore').textContent);
    const skinType = document.getElementById('skinType').textContent;
    alert(`Assessment Complete!\n\nTotal Score: ${totalScore}\nFitzpatrick Skin Type: ${skinType}\n\nThank you for completing the skin type assessment.`);
  });
});