/**
 * ASR Water & Drainage - Problem Reporting Form Logic
 * Handles dynamic mandal/locality population, GPS capture, Photo upload & preview,
 * AI Classification Assistant, Telugu Voice Input, and Complaint Submission.
 */

document.addEventListener('DOMContentLoaded', () => {
  initReportForm();
});

let uploadedPhotoBase64 = '';
let speechRecognitionInstance = null;

function initReportForm() {
  const form = document.getElementById('report-problem-form');
  if (!form) return;

  populateMandalDropdown();
  populateCategoryDropdown();
  initLocalityWatcher();
  initGpsCapture();
  initPhotoUpload();
  initVoiceInput();
  initAiAssistant();
  initFormSubmission();
  initCategoryPreselect();
}

/**
 * Preselect category, location, and description from URL query params or AI Assistant staging
 */
function initCategoryPreselect() {
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('cat');
  const typeParam = params.get('type');
  const descParam = params.get('desc');
  const locParam = params.get('loc');

  // Check sessionStorage for staged complaint from AI Assistant (Section 8 & 35)
  let staged = null;
  try {
    const rawStaged = sessionStorage.getItem('asr_staged_complaint');
    if (rawStaged) {
      staged = JSON.parse(rawStaged);
      sessionStorage.removeItem('asr_staged_complaint');
    }
  } catch (e) {}

  // Set description
  const descToSet = (staged && staged.description) ? staged.description : descParam;
  if (descToSet) {
    const descEl = document.getElementById('problem-description');
    if (descEl) {
      descEl.value = descToSet;
    }
  }

  // Set Mandal / Location
  const locToSet = (staged && staged.location_id) ? staged.location_id : locParam;
  if (locToSet) {
    const mandalSelect = document.getElementById('location-mandal');
    if (mandalSelect) {
      // Find matching option
      setTimeout(() => {
        for (let i = 0; i < mandalSelect.options.length; i++) {
          if (mandalSelect.options[i].value == locToSet || mandalSelect.options[i].text.toLowerCase().includes(String(locToSet).toLowerCase())) {
            mandalSelect.selectedIndex = i;
            mandalSelect.dispatchEvent(new Event('change'));
            break;
          }
        }
      }, 100);
    }
  }

  // Set Category
  const catSelect = document.getElementById('problem-category');
  if (catSelect) {
    if (catParam) {
      catSelect.value = catParam;
    } else if (typeParam) {
      setTimeout(() => {
        for (let i = 0; i < catSelect.options.length; i++) {
          const optText = catSelect.options[i].text.toLowerCase();
          if (typeParam === 'drainage' && (optText.includes('drain') || optText.includes('sewage'))) {
            catSelect.selectedIndex = i;
            break;
          } else if (typeParam === 'water' && (optText.includes('supply') || optText.includes('leak') || optText.includes('water'))) {
            catSelect.selectedIndex = i;
            break;
          }
        }
      }, 150);
    }
  }
}

/**
 * Populate Mandals dropdown from ASR_STORE
 */
function populateMandalDropdown() {
  const mandalSelect = document.getElementById('location-mandal');
  if (!mandalSelect || typeof ASR_STORE === 'undefined') return;

  const locations = ASR_STORE.getLocations().filter(loc => loc.active !== false);
  const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';

  mandalSelect.innerHTML = `<option value="">-- ${currentLang === 'te' ? 'మండలాన్ని ఎంచుకోండి' : 'Select Mandal / Area'} --</option>`;

  locations.forEach(loc => {
    const displayName = currentLang === 'te' && loc.name_te ? `${loc.name_te} (${loc.name})` : loc.name;
    const opt = document.createElement('option');
    opt.value = loc.id;
    opt.textContent = displayName;
    mandalSelect.appendChild(opt);
  });
}

/**
 * Populate Village/Locality dropdown when a Mandal is selected
 */
function initLocalityWatcher() {
  const mandalSelect = document.getElementById('location-mandal');
  const localitySelect = document.getElementById('location-locality');
  if (!mandalSelect || !localitySelect) return;

  mandalSelect.addEventListener('change', () => {
    const mandalId = mandalSelect.value;
    const locations = ASR_STORE.getLocations();
    const selectedMandal = locations.find(l => l.id === mandalId);
    const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';

    localitySelect.innerHTML = `<option value="">-- ${currentLang === 'te' ? 'గ్రామం/కాలనీని ఎంచుకోండి' : 'Select Locality or Enter Below'} --</option>`;

    if (selectedMandal && selectedMandal.localities && selectedMandal.localities.length > 0) {
      selectedMandal.localities.forEach(loc => {
        const displayName = currentLang === 'te' && loc.name_te ? `${loc.name_te} (${loc.name})` : loc.name;
        const opt = document.createElement('option');
        opt.value = loc.id;
        opt.setAttribute('data-name', loc.name);
        opt.setAttribute('data-lat', loc.lat || selectedMandal.lat);
        opt.setAttribute('data-lng', loc.lng || selectedMandal.lng);
        opt.textContent = displayName;
        localitySelect.appendChild(opt);
      });
    }

    const otherOpt = document.createElement('option');
    otherOpt.value = 'other';
    otherOpt.textContent = currentLang === 'te' ? '+ ఇతర గ్రామం / కాలనీ' : '+ Other Locality (Not Listed)';
    localitySelect.appendChild(otherOpt);
  });

  // Watch for 'other' locality selection
  localitySelect.addEventListener('change', () => {
    const customWrap = document.getElementById('custom-locality-wrap');
    if (customWrap) {
      if (localitySelect.value === 'other') {
        customWrap.style.display = 'block';
        document.getElementById('custom-locality-input').focus();
      } else {
        customWrap.style.display = 'none';
      }
    }
  });
}

/**
 * Populate Category dropdown categorized by Water and Drainage
 */
function populateCategoryDropdown() {
  const catSelect = document.getElementById('problem-category');
  if (!catSelect || typeof ASR_STORE === 'undefined') return;

  const categories = ASR_STORE.getCategories();
  const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';

  const waterOptGroup = document.createElement('optgroup');
  waterOptGroup.label = currentLang === 'te' ? 'తాగునీటి సమస్యలు' : '💧 Drinking Water Problems';

  const drainOptGroup = document.createElement('optgroup');
  drainOptGroup.label = currentLang === 'te' ? 'డ్రైనేజీ & పారిశుధ్య సమస్యలు' : '🌿 Drainage & Sanitation Problems';

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    const name = currentLang === 'te' && cat.name_te ? `${cat.name_te} (${cat.name})` : cat.name;
    opt.textContent = `${cat.icon || '•'} ${name}`;

    if (cat.type === 'drainage') {
      drainOptGroup.appendChild(opt);
    } else {
      waterOptGroup.appendChild(opt);
    }
  });

  catSelect.innerHTML = `<option value="">-- ${currentLang === 'te' ? 'సమస్య వర్గాన్ని ఎంచుకోండి' : 'Select a Category'} --</option>`;
  catSelect.appendChild(waterOptGroup);
  catSelect.appendChild(drainOptGroup);
}

/**
 * GPS Location Capture
 */
function initGpsCapture() {
  const gpsBtn = document.getElementById('btn-get-gps');
  const gpsFeedback = document.getElementById('gps-feedback');
  if (!gpsBtn) return;

  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      if (typeof showToast === 'function') {
        showToast('Geolocation is not supported by your browser.', 'error');
      }
      return;
    }

    gpsBtn.disabled = true;
    gpsBtn.textContent = '📍 Acquiring GPS Coordinates...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);

        document.getElementById('hidden-lat').value = lat;
        document.getElementById('hidden-lng').value = lng;

        gpsBtn.disabled = false;
        gpsBtn.innerHTML = `✅ GPS Captured (${lat}, ${lng})`;
        gpsBtn.classList.add('btn-secondary');

        if (gpsFeedback) {
          gpsFeedback.textContent = `Accurate GPS coordinates pinned: Lat ${lat}, Lng ${lng}. (Public map displays approximate vicinity for privacy).`;
          gpsFeedback.style.display = 'block';
        }
      },
      (err) => {
        gpsBtn.disabled = false;
        gpsBtn.innerHTML = '📍 Use My Current GPS Location';
        if (gpsFeedback) {
          gpsFeedback.textContent = 'Unable to retrieve GPS automatically. You can select your Mandal and enter a landmark above.';
          gpsFeedback.style.display = 'block';
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/**
 * Photo Upload with Size & Type Validation and Live Preview
 */
function initPhotoUpload() {
  const dropZone = document.getElementById('photo-drop-zone');
  const fileInput = document.getElementById('photo-file-input');
  const previewWrap = document.getElementById('photo-preview-wrap');
  const previewImg = document.getElementById('photo-preview-img');
  const removeBtn = document.getElementById('btn-remove-photo');
  const dropPrompt = document.getElementById('photo-drop-prompt');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', (e) => {
    if (e.target !== removeBtn) {
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleImageFile(fileInput.files[0]);
    }
  });

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      uploadedPhotoBase64 = '';
      fileInput.value = '';
      previewWrap.style.display = 'none';
      dropPrompt.style.display = 'block';
    });
  }

  function handleImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert('Image exceeds the maximum allowed size of 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedPhotoBase64 = e.target.result;
      previewImg.src = uploadedPhotoBase64;
      previewWrap.style.display = 'inline-block';
      dropPrompt.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Telugu and English Voice Input via Web Speech API
 */
function initVoiceInput() {
  const voiceBtn = document.getElementById('voice-input-btn');
  const descTextarea = document.getElementById('problem-description');
  if (!voiceBtn || !descTextarea) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    voiceBtn.title = 'Speech recognition not supported in this browser. Please type description.';
    voiceBtn.style.opacity = '0.6';
    return;
  }

  speechRecognitionInstance = new SpeechRecognition();
  speechRecognitionInstance.continuous = false;
  speechRecognitionInstance.interimResults = false;

  let isRecording = false;

  voiceBtn.addEventListener('click', () => {
    if (isRecording) {
      speechRecognitionInstance.stop();
      return;
    }

    const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';
    speechRecognitionInstance.lang = currentLang === 'te' ? 'te-IN' : 'en-IN';

    try {
      speechRecognitionInstance.start();
      isRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.innerHTML = '⏹️ ' + (currentLang === 'te' ? 'రికార్డింగ్ ఆపు' : 'Stop Recording');
    } catch (e) {
      console.error(e);
    }
  });

  speechRecognitionInstance.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (descTextarea.value.trim()) {
      descTextarea.value += ' ' + transcript;
    } else {
      descTextarea.value = transcript;
    }
    // Trigger AI Assistant analysis on newly spoken text
    analyzeTextForAiSuggestions(descTextarea.value);
  };

  speechRecognitionInstance.onend = () => {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';
    voiceBtn.innerHTML = '🎙️ ' + (currentLang === 'te' ? 'మాట్లాడండి (Telugu / English)' : 'Speak (Telugu / English)');
  };

  speechRecognitionInstance.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    isRecording = false;
    voiceBtn.classList.remove('recording');
    const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';
    voiceBtn.innerHTML = '🎙️ ' + (currentLang === 'te' ? 'మాట్లాడండి' : 'Speak (Telugu / English)');
  };
}

/**
 * AI-Assisted Classification for Telugu & English
 */
function initAiAssistant() {
  const descTextarea = document.getElementById('problem-description');
  if (!descTextarea) return;

  let debounceTimer;
  descTextarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      analyzeTextForAiSuggestions(descTextarea.value);
    }, 400);
  });
}

function analyzeTextForAiSuggestions(text) {
  const suggestionBox = document.getElementById('ai-suggestion-box');
  const suggestionText = document.getElementById('ai-suggestion-text');
  const applyBtn = document.getElementById('btn-apply-ai-suggestion');
  if (!suggestionBox || !suggestionText || !text || text.trim().length < 8) {
    if (suggestionBox) suggestionBox.style.display = 'none';
    return;
  }

  const t = text.toLowerCase();
  let suggestedCat = null;
  let suggestedCatName = '';
  let suggestedSev = 'Medium';

  // Telugu & English Keyword Matcher
  if (t.includes('డ్రైనేజీ') || t.includes('మురుగు') || t.includes('overflow') || t.includes('drain') || t.includes('వాసన') || t.includes('రోడ్డుపైకి')) {
    if (t.includes('పొంగి') || t.includes('overflow') || t.includes('రోడ్డుపైకి')) {
      suggestedCat = 'drain_overflow';
      suggestedCatName = 'Drainage Overflow (డ్రైనేజీ పొంగిపొర్లడం)';
      suggestedSev = 'High';
    } else if (t.includes('బ్లాక్') || t.includes('పూడిక') || t.includes('blocked') || t.includes('చెత్త')) {
      suggestedCat = 'blocked_drain';
      suggestedCatName = 'Blocked Drain (డ్రైనేజీ పూడిక / మూసుకుపోవడం)';
      suggestedSev = 'Medium';
    } else {
      suggestedCat = 'stagnant_water';
      suggestedCatName = 'Stagnant Water (నిలిచిన మురుగునీరు)';
      suggestedSev = 'Medium';
    }
  } else if (t.includes('నీరు రావట్లేదు') || t.includes('no water') || t.includes('తాగునీరు') || t.includes('supply cut')) {
    suggestedCat = 'no_water';
    suggestedCatName = 'No Water Supply (తాగునీటి సరఫరా లేదు)';
    suggestedSev = 'High';
  } else if (t.includes('లీక్') || t.includes('leakage') || t.includes('పైపు') || t.includes('pipe')) {
    suggestedCat = 'water_leakage';
    suggestedCatName = 'Water Leakage (నీరు లీకేజీ)';
    suggestedSev = 'High';
  } else if (t.includes('కలుషిత') || t.includes('బురద') || t.includes('dirty') || t.includes('color') || t.includes('smell') || t.includes('పురుగులు')) {
    suggestedCat = 'water_quality';
    suggestedCatName = 'Water Quality Concern (కలుషిత నీరు)';
    suggestedSev = 'Emergency';
  }

  if (suggestedCat) {
    suggestionText.innerHTML = `<strong>Category:</strong> ${suggestedCatName} &nbsp;|&nbsp; <strong>Severity:</strong> ${suggestedSev}`;
    suggestionBox.style.display = 'flex';

    applyBtn.onclick = () => {
      const catSelect = document.getElementById('problem-category');
      if (catSelect) catSelect.value = suggestedCat;

      const sevRadio = document.querySelector(`input[name="citizen_severity"][value="${suggestedSev}"]`);
      if (sevRadio) sevRadio.checked = true;

      suggestionBox.style.display = 'none';
      if (typeof showToast === 'function') {
        showToast('AI suggestion applied! Administrators will review and confirm.', 'success');
      }
    };
  } else {
    suggestionBox.style.display = 'none';
  }
}

/**
 * Handle Complaint Form Submission
 */
function initFormSubmission() {
  const form = document.getElementById('report-problem-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const mandalSelect = document.getElementById('location-mandal');
    const localitySelect = document.getElementById('location-locality');
    const customLocality = document.getElementById('custom-locality-input');
    const categorySelect = document.getElementById('problem-category');
    const descInput = document.getElementById('problem-description');
    const landmarkInput = document.getElementById('problem-landmark');
    const submitBtn = document.getElementById('btn-submit-report');

    if (!mandalSelect.value) {
      alert('Please select your Mandal / Area.');
      mandalSelect.focus();
      return;
    }

    if (!categorySelect.value) {
      alert('Please select a problem category.');
      categorySelect.focus();
      return;
    }

    if (!descInput.value.trim() || descInput.value.trim().length < 10) {
      alert('Please provide a descriptive explanation (at least 10 characters) about the problem.');
      descInput.focus();
      return;
    }

    // Determine locality name
    let localityId = localitySelect.value;
    let localityName = '';

    if (localityId === 'other') {
      localityName = customLocality.value.trim() || 'Custom Locality';
    } else if (localitySelect.selectedIndex > 0) {
      localityName = localitySelect.options[localitySelect.selectedIndex].getAttribute('data-name') || localitySelect.options[localitySelect.selectedIndex].text;
    }

    // Extract selected severity radio
    const selectedSev = document.querySelector('input[name="citizen_severity"]:checked');
    const severityVal = selectedSev ? selectedSev.value : 'Medium';

    // Disable button during submission simulation
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering Complaint...';

    const complaintData = {
      mandal_id: mandalSelect.value,
      locality_id: localityId !== 'other' ? localityId : '',
      locality_name: localityName,
      landmark: landmarkInput ? landmarkInput.value.trim() : '',
      lat: document.getElementById('hidden-lat').value || null,
      lng: document.getElementById('hidden-lng').value || null,
      category_id: categorySelect.value,
      description: descInput.value.trim(),
      citizen_severity: severityVal,
      photo_url: uploadedPhotoBase64,
      citizen_name: document.getElementById('citizen-name') ? document.getElementById('citizen-name').value.trim() : '',
      citizen_phone: document.getElementById('citizen-phone') ? document.getElementById('citizen-phone').value.trim() : '',
      citizen_email: document.getElementById('citizen-email') ? document.getElementById('citizen-email').value.trim() : ''
    };

    setTimeout(() => {
      try {
        const created = ASR_STORE.createComplaint(complaintData);
        showSubmissionSuccessModal(created);
        form.reset();
        uploadedPhotoBase64 = '';
        const previewWrap = document.getElementById('photo-preview-wrap');
        const dropPrompt = document.getElementById('photo-drop-prompt');
        if (previewWrap) previewWrap.style.display = 'none';
        if (dropPrompt) dropPrompt.style.display = 'block';
      } catch (err) {
        console.error(err);
        alert('An error occurred while registering the complaint. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Complaint';
      }
    }, 600);
  });
}

/**
 * Show Success Modal with ID, Copy Button & Tracking Link
 */
function showSubmissionSuccessModal(complaint) {
  const modal = document.getElementById('submission-success-modal');
  if (!modal) {
    alert(`Complaint submitted successfully!\nYour Complaint ID: ${complaint.complaint_id}\nSave this ID to track status.`);
    window.location.href = `track.html?id=${complaint.complaint_id}`;
    return;
  }

  document.getElementById('modal-complaint-id').textContent = complaint.complaint_id;
  document.getElementById('modal-mandal').textContent = complaint.mandal_name;
  document.getElementById('modal-category').textContent = complaint.category_name;
  document.getElementById('modal-status').textContent = complaint.status;

  const trackBtn = document.getElementById('modal-btn-track');
  if (trackBtn) {
    trackBtn.href = `track.html?id=${complaint.complaint_id}`;
  }

  const copyBtn = document.getElementById('modal-btn-copy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(complaint.complaint_id).then(() => {
        copyBtn.textContent = 'Copied to Clipboard!';
        setTimeout(() => copyBtn.textContent = '📋 Copy ID', 2000);
      });
    };
  }

  modal.classList.add('open');
}
