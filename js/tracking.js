/**
 * ASR Water & Drainage - Complaint Tracking Script
 * Renders verified timeline, status updates, and public administrative notes.
 */

document.addEventListener('DOMContentLoaded', () => {
  initComplaintTracking();
});

function initComplaintTracking() {
  const form = document.getElementById('tracking-form');
  const input = document.getElementById('track-search-input');
  const resultCard = document.getElementById('tracking-result-card');
  const emptyState = document.getElementById('tracking-empty-state');
  const notFoundState = document.getElementById('tracking-notfound-state');

  // Handle URL query parameter e.g. track.html?id=ASR-WD-2026-000001
  const params = new URLSearchParams(window.location.search);
  const queryId = params.get('id');

  if (queryId && input) {
    input.value = queryId;
    performTrackLookup(queryId);
  }

  // Handle Search Submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = input.value.trim();
      if (id) {
        performTrackLookup(id);
      }
    });
  }

  // Handle sample click buttons
  document.querySelectorAll('.sample-id-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-id');
      if (input) {
        input.value = id;
        performTrackLookup(id);
      }
    });
  });

  function performTrackLookup(complaintId) {
    if (typeof ASR_STORE === 'undefined') return;

    const complaint = ASR_STORE.getComplaintById(complaintId);

    if (!complaint) {
      if (resultCard) resultCard.style.display = 'none';
      if (emptyState) emptyState.style.display = 'none';
      if (notFoundState) {
        notFoundState.style.display = 'block';
        document.getElementById('notfound-query-text').textContent = complaintId;
      }
      return;
    }

    if (notFoundState) notFoundState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (resultCard) {
      renderComplaintDetails(complaint);
      resultCard.style.display = 'block';
    }
  }

  function renderComplaintDetails(c) {
    // Basic Details
    document.getElementById('disp-complaint-id').textContent = c.complaint_id;
    document.getElementById('disp-category').textContent = c.category_name;
    document.getElementById('disp-location').textContent = `${c.locality_name ? c.locality_name + ', ' : ''}${c.mandal_name} Mandal`;
    document.getElementById('disp-landmark').textContent = c.landmark || 'Not specified';
    document.getElementById('disp-date-submitted').textContent = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('disp-last-updated').textContent = new Date(c.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Status & Verification Badges
    const statusContainer = document.getElementById('disp-status-badge');
    if (statusContainer) {
      statusContainer.innerHTML = typeof getStatusBadge === 'function' ? getStatusBadge(c.status) : `<span class="status-badge">${c.status}</span>`;
    }

    const verifyContainer = document.getElementById('disp-verify-badge');
    if (verifyContainer) {
      verifyContainer.innerHTML = typeof getVerificationBadge === 'function' ? getVerificationBadge(c.verification_level) : '';
    }

    // Citizen Reported Severity
    const sevBadge = document.getElementById('disp-severity');
    if (sevBadge) {
      sevBadge.textContent = c.citizen_severity || 'Medium';
    }

    // Assigned Department
    const deptElem = document.getElementById('disp-assigned-org');
    if (deptElem) {
      deptElem.textContent = c.assigned_org_name || 'Pending Department Assignment';
    }

    // Public Administrator Note
    const publicNoteElem = document.getElementById('disp-public-notes');
    if (publicNoteElem) {
      publicNoteElem.textContent = c.public_notes || 'No administrative updates recorded yet.';
    }

    // Citizen Description
    const descElem = document.getElementById('disp-description');
    if (descElem) {
      descElem.textContent = c.description;
    }

    // Photo Attachment Preview
    const photoContainer = document.getElementById('disp-photo-container');
    const photoImg = document.getElementById('disp-photo-img');
    if (photoContainer && photoImg) {
      if (c.photo_url) {
        photoImg.src = c.photo_url;
        photoContainer.style.display = 'block';
      } else {
        photoContainer.style.display = 'none';
      }
    }

    // Resolution Evidence
    const resolutionWrap = document.getElementById('disp-resolution-evidence');
    if (resolutionWrap) {
      if (c.status === 'Resolved') {
        resolutionWrap.style.display = 'block';
        const resText = document.getElementById('disp-resolution-text');
        if (resText) resText.textContent = c.public_notes || 'Issue marked resolved by authorized administrator.';
      } else {
        resolutionWrap.style.display = 'none';
      }
    }

    // Render Timeline Steps
    renderVisualTimeline(c);
  }

  function renderVisualTimeline(c) {
    const timelineContainer = document.getElementById('tracking-timeline-flow');
    if (!timelineContainer) return;

    const standardSteps = [
      { key: 'Submitted', label: '1. Report Submitted', icon: '📝' },
      { key: 'Under Review', label: '2. Under Admin Review', icon: '🔍' },
      { key: 'Assigned', label: '3. Assigned to Department', icon: '🏢' },
      { key: 'In Progress', label: '4. Action In Progress', icon: '🛠️' },
      { key: 'Resolved', label: '5. Resolved & Verified', icon: '✅' }
    ];

    const currentStatusIndex = standardSteps.findIndex(s => s.key.toLowerCase() === c.status.toLowerCase());

    let html = '';

    standardSteps.forEach((step, index) => {
      let stepState = 'pending';
      let timestampText = '';
      let noteText = '';

      // Match step with actual timeline events in complaint
      const matchingEvent = c.timeline && c.timeline.find(t => t.status.toLowerCase() === step.key.toLowerCase());

      if (matchingEvent) {
        timestampText = matchingEvent.timestamp;
        noteText = matchingEvent.note;
      }

      if (currentStatusIndex !== -1) {
        if (index < currentStatusIndex) {
          stepState = 'completed';
        } else if (index === currentStatusIndex) {
          stepState = 'active';
        }
      } else if (c.status === 'Rejected' || c.status === 'Duplicate') {
        if (index === 0) stepState = 'completed';
        if (index === 1) stepState = 'active';
      }

      html += `
        <div class="timeline-step ${stepState}">
          <div class="timeline-dot">${stepState === 'completed' ? '✓' : step.icon}</div>
          <div class="timeline-content">
            <div class="timeline-header">
              <div class="timeline-title">${step.label}</div>
              <div class="timeline-date">${timestampText || (stepState === 'completed' ? 'Completed' : 'Pending')}</div>
            </div>
            ${noteText ? `<div class="timeline-note">${noteText}</div>` : ''}
          </div>
        </div>
      `;
    });

    timelineContainer.innerHTML = html;
  }
}
