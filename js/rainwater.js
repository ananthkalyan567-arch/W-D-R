/**
 * ASR Water & Drainage - Rainwater Module Frontend Script
 * Handles 3-choice interactive reporting (Available / Not Available / Not Sure),
 * condition analysis, complaint auto-generation (ASR-RW-XXXXXX), and live dashboard stats.
 */

document.addEventListener('DOMContentLoaded', () => {
  let selectedMandalId = null;
  let selectedChoice = null; // 'available' | 'not_available' | 'unknown'
  let selectedCondition = 'good'; // 'good' | 'partially_blocked' | 'blocked' | 'damaged' | 'unknown'

  // DOM Elements
  const mandalSelect = document.getElementById('rw-mandal');
  const localitySelect = document.getElementById('rw-locality');
  const landmarkInput = document.getElementById('rw-landmark');
  const btnGps = document.getElementById('btn-use-gps');
  const gpsStatusText = document.getElementById('gps-status-text');
  const latInput = document.getElementById('rw-latitude');
  const lngInput = document.getElementById('rw-longitude');

  const btnChoiceYes = document.getElementById('btn-choice-yes');
  const btnChoiceNo = document.getElementById('btn-choice-no');
  const btnChoiceNotSure = document.getElementById('btn-choice-notsure');
  const availStatusInput = document.getElementById('rw-availability-status');
  const condStatusInput = document.getElementById('rw-condition-status');

  const detailsPanel = document.getElementById('details-panel');
  const panelAvailable = document.getElementById('panel-available');
  const panelNotAvailable = document.getElementById('panel-not-available');
  const panelNotSure = document.getElementById('panel-not-sure');
  const problemPromptBox = document.getElementById('problem-prompt-box');
  const chkRaiseProblem = document.getElementById('chk-raise-problem');
  const submitBtnLabel = document.getElementById('submit-btn-label');
  const reportForm = document.getElementById('rainwater-report-form');

  // Success Modal Elements
  const successModalEl = document.getElementById('success-modal');
  const modalReportNumber = document.getElementById('modal-report-number');
  const modalComplaintRow = document.getElementById('modal-complaint-row');
  const modalComplaintNumber = document.getElementById('modal-complaint-number');
  const btnModalTrack = document.getElementById('btn-modal-track');

  // --------------------------------------------------------------------------
  // 1. Load Locations Hierarchy
  // --------------------------------------------------------------------------
  async function loadLocations() {
    try {
      const resp = await ASR_API.getLocations();
      if (resp && resp.data) {
        const mandals = resp.data.filter(l => l.parent_id === 1 || l.location_type === 'mandal');
        mandalSelect.innerHTML = '<option value="">-- Select Mandal / Area --</option>';
        mandals.forEach(m => {
          const opt = document.createElement('option');
          opt.value = m.id;
          opt.textContent = `${m.name} (${m.name_te || ''})`;
          mandalSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Could not load locations from API:', err);
    }
  }

  mandalSelect.addEventListener('change', async (e) => {
    selectedMandalId = e.target.value;
    localitySelect.innerHTML = '<option value="">-- Select Locality (or specify landmark) --</option>';
    if (!selectedMandalId) return;

    try {
      const resp = await ASR_API.getLocations({ parent_id: selectedMandalId });
      if (resp && resp.data && resp.data.length > 0) {
        resp.data.forEach(loc => {
          const opt = document.createElement('option');
          opt.value = loc.id;
          opt.textContent = `${loc.name} (${loc.name_te || ''})`;
          localitySelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.warn('Could not load localities:', err);
    }
  });

  // --------------------------------------------------------------------------
  // 2. GPS Geolocation
  // --------------------------------------------------------------------------
  if (btnGps) {
    btnGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      gpsStatusText.textContent = 'Acquiring GPS fix...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          latInput.value = pos.coords.latitude.toFixed(6);
          lngInput.value = pos.coords.longitude.toFixed(6);
          gpsStatusText.innerHTML = `✅ Lat: <strong>${latInput.value}</strong>, Lng: <strong>${lngInput.value}</strong> (±${Math.round(pos.coords.accuracy)}m)`;
          btnGps.textContent = '✅ GPS Captured';
          btnGps.classList.remove('btn-outline-primary');
          btnGps.classList.add('btn-success');
        },
        (err) => {
          gpsStatusText.textContent = 'GPS capture unavailable. Please specify landmark.';
          console.warn('GPS Error:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // --------------------------------------------------------------------------
  // 3. Three-Way Availability Choice Handling
  // --------------------------------------------------------------------------
  function selectChoice(choice) {
    selectedChoice = choice;
    availStatusInput.value = choice;

    // Reset styles
    [btnChoiceYes, btnChoiceNo, btnChoiceNotSure].forEach(b => b.classList.remove('selected'));
    panelAvailable.style.display = 'none';
    panelNotAvailable.style.display = 'none';
    panelNotSure.style.display = 'none';

    detailsPanel.style.display = 'block';

    if (choice === 'available') {
      btnChoiceYes.classList.add('selected');
      panelAvailable.style.display = 'block';
      updateConditionState(selectedCondition);
    } else if (choice === 'not_available') {
      btnChoiceNo.classList.add('selected');
      panelNotAvailable.style.display = 'block';
      condStatusInput.value = 'unknown';
      submitBtnLabel.textContent = '🚨 Raise a Problem & Generate Complaint ID';
    } else if (choice === 'unknown') {
      btnChoiceNotSure.classList.add('selected');
      panelNotSure.style.display = 'block';
      condStatusInput.value = 'unknown';
      submitBtnLabel.textContent = '📝 Submit Observation for Survey';
    }

    // Smooth scroll to details
    detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnChoiceYes.addEventListener('click', () => selectChoice('available'));
  btnChoiceNo.addEventListener('click', () => selectChoice('not_available'));
  btnChoiceNotSure.addEventListener('click', () => selectChoice('unknown'));

  // Condition Pills click
  const conditionPills = document.querySelectorAll('.condition-pill');
  conditionPills.forEach(pill => {
    pill.addEventListener('click', () => {
      conditionPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cond = pill.dataset.condition;
      updateConditionState(cond);
    });
  });

  function updateConditionState(cond) {
    selectedCondition = cond;
    condStatusInput.value = cond;

    if (cond === 'blocked' || cond === 'damaged' || cond === 'partially_blocked') {
      problemPromptBox.style.display = 'block';
      submitBtnLabel.textContent = '🚨 Raise a Problem & Submit Report';
    } else {
      problemPromptBox.style.display = 'none';
      submitBtnLabel.textContent = '🚀 Submit Rainwater Infrastructure Report';
    }
  }

  // --------------------------------------------------------------------------
  // 4. Form Submission
  // --------------------------------------------------------------------------
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const mandalId = mandalSelect.value;
    const localityId = localitySelect.value;
    const locationId = localityId || mandalId;
    const landmark = landmarkInput.value.trim();

    if (!locationId) {
      alert('Please select a Mandal / Area from the dropdown.');
      mandalSelect.focus();
      return;
    }

    if (!landmark) {
      alert('Please provide a landmark or street description.');
      landmarkInput.focus();
      return;
    }

    if (!selectedChoice) {
      alert('Please select whether a rainwater drip/drainage opening is available (YES / NO / NOT SURE).');
      return;
    }

    const description = document.getElementById('rw-description').value.trim();
    const severity = document.getElementById('rw-severity') ? document.getElementById('rw-severity').value : 'medium';
    const raiseProblem = (selectedChoice === 'not_available') || 
                         (selectedChoice === 'available' && chkRaiseProblem && chkRaiseProblem.checked && (selectedCondition === 'blocked' || selectedCondition === 'damaged' || selectedCondition === 'partially_blocked'));

    // Construct Payload
    const payload = {
      location_id: parseInt(locationId),
      availability_status: selectedChoice,
      condition_status: selectedCondition,
      landmark: landmark,
      description: description || null,
      latitude: latInput.value ? parseFloat(latInput.value) : null,
      longitude: lngInput.value ? parseFloat(lngInput.value) : null,
      citizen_severity: severity,
      raise_problem: raiseProblem
    };

    const submitBtn = document.getElementById('btn-submit-rw');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting...';

    try {
      const resp = await ASR_API.submitRainwaterReport(payload);
      if (resp && resp.success) {
        const reportData = resp.data;
        
        // Populate Success Modal
        modalReportNumber.textContent = reportData.report_number;
        if (reportData.complaint_number) {
          modalComplaintRow.style.display = 'flex';
          modalComplaintNumber.textContent = reportData.complaint_number;
          btnModalTrack.style.display = 'block';
          btnModalTrack.href = `track.html?number=${reportData.complaint_number}`;
        } else {
          modalComplaintRow.style.display = 'none';
          btnModalTrack.style.display = 'none';
        }

        // Show Modal
        const bsModal = new bootstrap.Modal(successModalEl);
        bsModal.show();

        // Reset Form
        reportForm.reset();
        detailsPanel.style.display = 'none';
        [btnChoiceYes, btnChoiceNo, btnChoiceNotSure].forEach(b => b.classList.remove('selected'));
        selectedChoice = null;
        selectedCondition = 'good';

        // Refresh dashboard
        loadDashboardStats();
      } else {
        alert(resp.message || 'Error submitting report.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit rainwater report: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '🚀 <span id="submit-btn-label">Submit Rainwater Report</span>';
    }
  });

  // --------------------------------------------------------------------------
  // 5. Live Dashboard Data Loader
  // --------------------------------------------------------------------------
  async function loadDashboardStats() {
    try {
      // 1. Load Analytics
      const analyticsResp = await ASR_API.getRainwaterAnalytics();
      if (analyticsResp && analyticsResp.success) {
        const a = analyticsResp.data;
        document.getElementById('dash-total').textContent = a.total_reports ?? 0;
        document.getElementById('dash-avail').textContent = a.available ?? 0;
        document.getElementById('dash-missing').textContent = a.not_available ?? 0;
        document.getElementById('dash-blocked').textContent = a.blocked ?? 0;
        document.getElementById('dash-damaged').textContent = a.damaged ?? 0;
        document.getElementById('dash-waterlogging').textContent = a.waterlogging ?? 0;
        document.getElementById('dash-verified').textContent = a.verified ?? 0;
        document.getElementById('dash-resolved').textContent = a.resolved_complaints ?? 0;

        // Populate Sidebar Live Pulse
        const sideTotal = document.getElementById('side-stat-total');
        if (sideTotal) sideTotal.textContent = a.total_reports ?? 0;
        const sideAvail = document.getElementById('side-stat-avail');
        if (sideAvail) sideAvail.textContent = a.available ?? 0;
        const sideMissing = document.getElementById('side-stat-missing');
        if (sideMissing) sideMissing.textContent = a.not_available ?? 0;
        const sideIssues = document.getElementById('side-stat-issues');
        if (sideIssues) sideIssues.textContent = (a.blocked ?? 0) + (a.damaged ?? 0);
      }

      // 2. Load Recent Reports
      const reportsResp = await ASR_API.getRainwaterReports({ limit: 10 });
      const tbody = document.getElementById('dash-reports-tbody');
      if (reportsResp && reportsResp.success && reportsResp.data && reportsResp.data.reports) {
        const reports = reportsResp.data.reports;
        if (reports.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3 text-muted">No rainwater observations registered yet.</td></tr>';
          return;
        }

        tbody.innerHTML = reports.map(r => {
          let availBadge = '<span class="badge bg-secondary">Unknown</span>';
          if (r.availability_status === 'available') availBadge = '<span class="badge bg-success">Available</span>';
          else if (r.availability_status === 'not_available') availBadge = '<span class="badge bg-danger">Not Available</span>';

          let condBadge = `<span class="badge bg-light text-dark border">${r.condition_status}</span>`;
          if (r.condition_status === 'blocked') condBadge = '<span class="badge bg-warning text-dark">Blocked</span>';
          else if (r.condition_status === 'damaged') condBadge = '<span class="badge bg-danger">Damaged</span>';

          const vBadgeClass = `badge-v-${r.verification_status || 'pending'}`;
          const vLabel = (r.verification_status || 'pending').replace('_', ' ');

          const compLink = r.complaint_number 
            ? `<a href="track.html?number=${r.complaint_number}" class="badge bg-primary text-decoration-none font-monospace">${r.complaint_number}</a>`
            : '<span class="text-muted small">None</span>';

          const dateStr = (r.created_at || '').substring(0, 10);

          return `
            <tr>
              <td><strong class="font-monospace text-dark">${r.report_number}</strong></td>
              <td>${r.location_name || 'ASR District'} <div class="text-muted small">${r.landmark || ''}</div></td>
              <td>${availBadge}</td>
              <td>${condBadge}</td>
              <td><span class="badge badge-verification ${vBadgeClass}">${vLabel}</span></td>
              <td>${compLink}</td>
              <td class="text-muted small">${dateStr}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Dashboard stats load error:', err);
    }
  }

  document.getElementById('btn-refresh-stats')?.addEventListener('click', loadDashboardStats);

  // Initialize
  loadLocations();
  loadDashboardStats();

  // Handle URL query parameters from AI Assistant (e.g. ?choice=available&cond=blocked)
  const urlParams = new URLSearchParams(window.location.search);
  const choiceParam = urlParams.get('choice');
  const condParam = urlParams.get('cond');
  if (choiceParam) {
    setTimeout(() => {
      const normalizedChoice = (choiceParam === 'notsure' || choiceParam === 'unknown') ? 'unknown' : choiceParam;
      selectChoice(normalizedChoice);
      if (condParam) {
        const pill = document.querySelector(`.condition-pill[data-condition="${condParam}"]`);
        if (pill) {
          pill.click();
        }
      }
    }, 200);
  }
});
