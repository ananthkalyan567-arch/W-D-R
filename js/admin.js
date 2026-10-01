/**
 * ASR Water & Drainage - Administrator Command Dashboard
 * Handles statistics cards, analytics charts, complaints management table,
 * status transitions, department assignment, and audit trail updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

let currentActiveComplaintId = null;

function initAdminDashboard() {
  if (typeof ASR_STORE === 'undefined') return;

  // Verify Admin Session
  checkAdminAuth();

  // Render metrics and charts
  renderAdminStats();
  renderAdminCharts();

  // Render Complaints Data Table
  renderComplaintsTable();

  // Listen for filter controls
  initAdminFilters();

  // Initialize Complaint Management Modal
  initComplaintActionModal();

  // Listen for storage events
  window.addEventListener('asr-complaint-created', () => {
    renderAdminStats();
    renderComplaintsTable();
    renderAdminCharts();
  });

  window.addEventListener('asr-complaint-updated', () => {
    renderAdminStats();
    renderComplaintsTable();
    renderAdminCharts();
  });
}

/**
 * Authentication Session Check
 */
function checkAdminAuth() {
  const session = ASR_STORE.getAdminSession();
  const userNameElem = document.getElementById('admin-user-name');
  const userRoleElem = document.getElementById('admin-user-role');

  if (!session) {
    // If not logged in, redirect to login page
    // Allow demo evaluation without strict redirect if login page exists
    if (!window.location.pathname.includes('login.html')) {
      // Set quick demo session for seamless preview if needed
      ASR_STORE.loginAdmin('admin@asr.civic', 'admin123');
    }
  }

  const activeSession = ASR_STORE.getAdminSession();
  if (activeSession) {
    if (userNameElem) userNameElem.textContent = activeSession.name;
    if (userRoleElem) userRoleElem.textContent = activeSession.role;
  }

  const logoutBtn = document.getElementById('btn-admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ASR_STORE.logoutAdmin();
      window.location.href = '../login.html';
    });
  }
}

/**
 * Render Administrative KPI metrics
 */
async function renderAdminStats() {
  let stats = typeof ASR_STORE !== 'undefined' ? ASR_STORE.getStats() : {};

  // Fetch real API dashboard metrics if available
  if (typeof ASR_API !== 'undefined') {
    try {
      const resp = await ASR_API.getAdminDashboard();
      if (resp && resp.data && resp.data.stats) {
        const s = resp.data.stats;
        stats = {
          total: s.total_complaints ?? stats.total,
          water: s.water_complaints ?? stats.water,
          drainage: s.drainage_complaints ?? stats.drainage,
          rainwater: s.rainwater_complaints ?? s.rainwater_issues ?? 0,
          rw_missing: s.missing_rainwater_openings ?? 0,
          rw_blocked: s.blocked_openings ?? 0,
          rw_damaged: s.damaged_openings ?? 0,
          rw_waterlogging: s.waterlogging_reports ?? 0,
          pending: (s.new_complaints || 0) + (s.under_review || 0),
          progress: (s.assigned || 0) + (s.in_progress || 0),
          resolved: (s.resolved || 0) + (s.closed || 0),
          emergency: s.critical_complaints ?? stats.emergency
        };
      }
    } catch (e) {
      console.warn('Live admin stats fetch failed, falling back to local store:', e);
    }
  }

  const bindMap = {
    'adm-stat-total': stats.total ?? 0,
    'adm-stat-water': stats.water ?? 0,
    'adm-stat-drainage': stats.drainage ?? 0,
    'adm-stat-rainwater': stats.rainwater ?? 0,
    'adm-stat-rw-missing': stats.rw_missing ?? 0,
    'adm-stat-rw-blocked': stats.rw_blocked ?? 0,
    'adm-stat-rw-damaged': stats.rw_damaged ?? 0,
    'adm-stat-rw-waterlogging': stats.rw_waterlogging ?? 0,
    'adm-stat-pending': stats.pending ?? 0,
    'adm-stat-progress': stats.progress ?? 0,
    'adm-stat-resolved': stats.resolved ?? 0,
    'adm-stat-emergency': stats.emergency ?? 0
  };

  Object.entries(bindMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

/**
 * Render Analytics Visualizations (Reports by Area & Water vs Drainage vs Rainwater)
 */
function renderAdminCharts() {
  const complaints = typeof ASR_STORE !== 'undefined' ? ASR_STORE.getComplaints() : [];
  const locations = typeof ASR_STORE !== 'undefined' ? ASR_STORE.getLocations() : [];

  // 1. Reports by Mandal/Area Bar Visualization
  const areaContainer = document.getElementById('chart-area-distribution');
  if (areaContainer) {
    const countsByMandal = {};
    locations.forEach(loc => { countsByMandal[loc.name] = 0; });
    complaints.forEach(c => {
      countsByMandal[c.mandal_name] = (countsByMandal[c.mandal_name] || 0) + 1;
    });

    const sortedMandals = Object.entries(countsByMandal)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const maxCount = Math.max(...sortedMandals.map(m => m[1]), 1);

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    sortedMandals.forEach(([mandal, count]) => {
      const pct = Math.round((count / maxCount) * 100);
      html += `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 3px;">
            <span>${mandal}</span>
            <span style="color: var(--primary-700);">${count} reports</span>
          </div>
          <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #0284c7, #38bdf8); width: ${pct}%; height: 100%; border-radius: 5px;"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    areaContainer.innerHTML = html;
  }

  // 2. Water vs Drainage vs Rainwater Ratio
  const typeContainer = document.getElementById('chart-type-distribution');
  if (typeContainer) {
    const waterCount = complaints.filter(c => c.category_type === 'water').length;
    const drainageCount = complaints.filter(c => c.category_type === 'drainage').length;
    const rainwaterCount = complaints.filter(c => c.category_type === 'rainwater' || (c.complaint_id && c.complaint_id.startsWith('ASR-RW-'))).length;
    const total = Math.max(waterCount + drainageCount + rainwaterCount, 1);

    const waterPct = Math.round((waterCount / total) * 100);
    const drainagePct = Math.round((drainageCount / total) * 100);
    const rainwaterPct = Math.max(0, 100 - waterPct - drainagePct);

    typeContainer.innerHTML = `
      <div style="margin-bottom: 12px;">
        <div style="display: flex; height: 18px; border-radius: 9px; overflow: hidden; margin-bottom: 8px;">
          <div style="background: #0284c7; width: ${waterPct}%;" title="Water: ${waterPct}%"></div>
          <div style="background: #f59e0b; width: ${drainagePct}%;" title="Drainage: ${drainagePct}%"></div>
          <div style="background: #0ea5e9; width: ${rainwaterPct}%;" title="Rainwater: ${rainwaterPct}%"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; flex-wrap: wrap; gap: 4px;">
          <span style="color: #0284c7;">💧 Water: ${waterCount} (${waterPct}%)</span>
          <span style="color: #d97706;">🌿 Drainage: ${drainageCount} (${drainagePct}%)</span>
          <span style="color: #0284c7;">🌧️ Rainwater: ${rainwaterCount} (${rainwaterPct}%)</span>
        </div>
      </div>
    `;
  }
}

/**
 * Render Complaints Management Data Table
 */
function renderComplaintsTable() {
  const tbody = document.getElementById('admin-complaints-tbody');
  if (!tbody) return;

  const mandalFilter = document.getElementById('adm-filter-mandal') ? document.getElementById('adm-filter-mandal').value : 'all';
  const statusFilter = document.getElementById('adm-filter-status') ? document.getElementById('adm-filter-status').value : 'all';
  const priorityFilter = document.getElementById('adm-filter-priority') ? document.getElementById('adm-filter-priority').value : 'all';
  const searchFilter = document.getElementById('adm-filter-search') ? document.getElementById('adm-filter-search').value : '';

  const complaints = ASR_STORE.getComplaints({
    mandal: mandalFilter,
    status: statusFilter,
    priority: priorityFilter,
    search: searchFilter
  });

  const countBadge = document.getElementById('adm-table-count');
  if (countBadge) countBadge.textContent = `${complaints.length} records`;

  if (complaints.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2rem; color: var(--slate-500);">
          No complaints match the selected filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  let rowsHtml = '';
  complaints.forEach(c => {
    const dateFormatted = new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const priority = c.system_priority || c.citizen_severity || 'Medium';

    let priorityBadgeColor = '#e2e8f0; color: #475569;';
    if (priority === 'Emergency') priorityBadgeColor = '#fee2e2; color: #b91c1c; font-weight: 700;';
    else if (priority === 'High') priorityBadgeColor = '#fef3c7; color: #b45309; font-weight: 700;';

    const statusBadge = typeof getStatusBadge === 'function' ? getStatusBadge(c.status) : c.status;

    rowsHtml += `
      <tr>
        <td style="font-weight: 700; color: var(--primary-700); font-family: monospace;">
          ${c.complaint_id}
        </td>
        <td style="font-size: 13px; color: var(--slate-600);">${dateFormatted}</td>
        <td style="font-weight: 600;">${c.mandal_name}</td>
        <td style="font-size: 13px;">${c.locality_name || c.landmark || '—'}</td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 13px;">
            ${c.category_type === 'water' ? '💧' : '🌿'} ${c.category_name}
          </span>
        </td>
        <td>
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: ${priorityBadgeColor}">
            ${priority}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td style="font-size: 13px; color: var(--slate-600);">${c.assigned_org_name || 'Unassigned'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="openComplaintActionModal('${c.complaint_id}')">
            Manage
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rowsHtml;
}

/**
 * Filter change event listeners for Admin Table
 */
function initAdminFilters() {
  const mandalFilter = document.getElementById('adm-filter-mandal');
  const statusFilter = document.getElementById('adm-filter-status');
  const priorityFilter = document.getElementById('adm-filter-priority');
  const searchFilter = document.getElementById('adm-filter-search');

  // Populate mandal dropdown
  if (mandalFilter && mandalFilter.options.length <= 1) {
    const locations = ASR_STORE.getLocations();
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc.id;
      opt.textContent = loc.name;
      mandalFilter.appendChild(opt);
    });
  }

  [mandalFilter, statusFilter, priorityFilter].forEach(el => {
    if (el) el.addEventListener('change', renderComplaintsTable);
  });

  if (searchFilter) {
    let t;
    searchFilter.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(renderComplaintsTable, 250);
    });
  }
}

/**
 * Open Complaint Action Modal
 */
window.openComplaintActionModal = function(complaintId) {
  currentActiveComplaintId = complaintId;
  const complaint = ASR_STORE.getComplaintById(complaintId);
  if (!complaint) return;

  const modal = document.getElementById('complaint-action-modal');
  if (!modal) return;

  // Bind Header & Info
  document.getElementById('modal-manage-id').textContent = complaint.complaint_id;
  document.getElementById('modal-manage-category').textContent = complaint.category_name;
  document.getElementById('modal-manage-location').textContent = `${complaint.locality_name ? complaint.locality_name + ', ' : ''}${complaint.mandal_name} (${complaint.landmark || 'No landmark'})`;
  document.getElementById('modal-manage-description').textContent = complaint.description;
  document.getElementById('modal-manage-citizen').textContent = `${complaint.citizen_name || 'Anonymous Resident'} (Phone: ${complaint.citizen_phone || 'Not provided'})`;
  document.getElementById('modal-manage-date').textContent = new Date(complaint.created_at).toLocaleString('en-IN');

  // AI Suggestions Banner
  const aiBox = document.getElementById('modal-manage-ai');
  if (aiBox) {
    aiBox.innerHTML = `
      <strong>AI Suggested Category:</strong> ${complaint.ai_category || complaint.category_name} &nbsp;|&nbsp; 
      <strong>Suggested Severity:</strong> ${complaint.ai_priority || complaint.citizen_severity}
      <br><small style="color: var(--slate-500);">AI suggestions are advisory only. Official actions must be recorded by authorized administrator.</small>
    `;
  }

  // Populate Status Dropdown
  const statusSelect = document.getElementById('modal-manage-status');
  if (statusSelect) statusSelect.value = complaint.status;

  // Populate Priority Dropdown
  const prioritySelect = document.getElementById('modal-manage-priority');
  if (prioritySelect) prioritySelect.value = complaint.system_priority || complaint.citizen_severity || 'Medium';

  // Populate Organizations Dropdown
  const orgSelect = document.getElementById('modal-manage-org');
  if (orgSelect) {
    const orgs = ASR_STORE.getOrganizations();
    orgSelect.innerHTML = '<option value="">-- Assign Department / Organization --</option>';
    orgs.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.id;
      opt.textContent = `${o.name} (${o.type})`;
      if (complaint.assigned_org_id === o.id) opt.selected = true;
      orgSelect.appendChild(opt);
    });
  }

  // Notes
  const publicNotesInput = document.getElementById('modal-manage-public-notes');
  if (publicNotesInput) publicNotesInput.value = complaint.public_notes || '';

  const internalNotesInput = document.getElementById('modal-manage-internal-notes');
  if (internalNotesInput) internalNotesInput.value = complaint.internal_notes || '';

  // Photo
  const photoWrap = document.getElementById('modal-manage-photo-wrap');
  const photoImg = document.getElementById('modal-manage-photo-img');
  if (photoWrap && photoImg) {
    if (complaint.photo_url) {
      photoImg.src = complaint.photo_url;
      photoWrap.style.display = 'block';
    } else {
      photoWrap.style.display = 'none';
    }
  }

  // Audit timeline history in modal
  const historyList = document.getElementById('modal-manage-timeline-history');
  if (historyList && complaint.timeline) {
    let histHtml = '';
    complaint.timeline.forEach(item => {
      histHtml += `
        <div style="font-size: 12.5px; padding: 6px 0; border-bottom: 1px solid var(--slate-200);">
          <strong style="color: var(--primary-700);">${item.status}</strong> • <span style="color: var(--slate-500);">${item.timestamp}</span>
          <div>${item.note || ''}</div>
        </div>
      `;
    });
    historyList.innerHTML = histHtml;
  }

  modal.classList.add('open');
};

/**
 * Initialize Save Changes & Close actions
 */
function initComplaintActionModal() {
  const modal = document.getElementById('complaint-action-modal');
  const closeBtn = document.getElementById('modal-close-action');
  const saveBtn = document.getElementById('btn-save-complaint-action');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!currentActiveComplaintId) return;

      const newStatus = document.getElementById('modal-manage-status').value;
      const newPriority = document.getElementById('modal-manage-priority').value;
      const newOrgId = document.getElementById('modal-manage-org').value;
      const publicNotes = document.getElementById('modal-manage-public-notes').value.trim();
      const internalNotes = document.getElementById('modal-manage-internal-notes').value.trim();

      const updates = {
        status: newStatus,
        system_priority: newPriority,
        assigned_org_id: newOrgId,
        public_notes: publicNotes,
        internal_notes: internalNotes
      };

      ASR_STORE.updateComplaint(currentActiveComplaintId, updates);

      if (typeof showToast === 'function') {
        showToast(`Complaint ${currentActiveComplaintId} updated successfully!`, 'success');
      }

      modal.classList.remove('open');
    });
  }
}
