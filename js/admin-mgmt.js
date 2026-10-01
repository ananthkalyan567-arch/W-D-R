/**
 * ASR Water & Drainage - Administrator Management Subsystem
 * Controls Dynamic Locations, Categories, Organizations, and System Data Resets.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check which page we are on
  const path = window.location.pathname;

  if (path.includes('locations.html')) {
    initLocationsManagement();
  } else if (path.includes('organizations.html')) {
    initOrganizationsManagement();
  } else if (path.includes('categories.html')) {
    initCategoriesManagement();
  }
});

// ----------------------------------------------------------------------------
// 1. Location Hierarchy Management
// ----------------------------------------------------------------------------
function initLocationsManagement() {
  const container = document.getElementById('locations-hierarchy-list');
  const addMandalForm = document.getElementById('form-add-mandal');
  const addLocalityForm = document.getElementById('form-add-locality');
  const mandalSelect = document.getElementById('select-mandal-for-locality');

  renderLocationsTree();

  if (addMandalForm) {
    addMandalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('mandal-name-input').value.trim();
      const name_te = document.getElementById('mandal-te-input').value.trim();
      const lat = parseFloat(document.getElementById('mandal-lat-input').value) || 18.0827;
      const lng = parseFloat(document.getElementById('mandal-lng-input').value) || 82.6635;

      if (!name) return;

      ASR_STORE.addMandal({ name, name_te, lat, lng });
      if (typeof showToast === 'function') showToast(`Mandal '${name}' added successfully!`, 'success');
      addMandalForm.reset();
      renderLocationsTree();
    });
  }

  if (addLocalityForm) {
    addLocalityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const mandalId = mandalSelect.value;
      const name = document.getElementById('locality-name-input').value.trim();
      const name_te = document.getElementById('locality-te-input').value.trim();

      if (!mandalId || !name) return;

      ASR_STORE.addLocality(mandalId, { name, name_te });
      if (typeof showToast === 'function') showToast(`Locality '${name}' added!`, 'success');
      addLocalityForm.reset();
      renderLocationsTree();
    });
  }

  function renderLocationsTree() {
    if (!container || typeof ASR_STORE === 'undefined') return;

    const locations = ASR_STORE.getLocations();

    // Populate mandal select for locality form
    if (mandalSelect) {
      mandalSelect.innerHTML = '<option value="">-- Choose Parent Mandal --</option>';
      locations.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.name_te || m.name})`;
        mandalSelect.appendChild(opt);
      });
    }

    let html = '';
    locations.forEach(mandal => {
      const locCount = mandal.localities ? mandal.localities.length : 0;
      const statusPill = mandal.active !== false
        ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">ACTIVE</span>'
        : '<span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">INACTIVE</span>';

      let localitiesListHtml = '';
      if (mandal.localities && mandal.localities.length > 0) {
        localitiesListHtml = '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">';
        mandal.localities.forEach(loc => {
          localitiesListHtml += `
            <span style="background: #ffffff; border: 1px solid var(--slate-200); border-radius: 4px; padding: 3px 8px; font-size: 12px; color: var(--slate-700);">
              📍 ${loc.name} ${loc.name_te ? `<span style="color: var(--slate-400);">(${loc.name_te})</span>` : ''}
            </span>
          `;
        });
        localitiesListHtml += '</div>';
      } else {
        localitiesListHtml = '<div style="font-size: 12px; color: var(--slate-400); margin-top: 6px;">No specific localities recorded yet.</div>';
      }

      html += `
        <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 14px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 16px; color: var(--slate-900);">${mandal.name}</strong> 
              <span style="font-size: 14px; color: var(--slate-500); margin-left: 6px;">(${mandal.name_te || ''})</span>
              <span style="margin-left: 8px;">${statusPill}</span>
              <span style="margin-left: 8px; font-size: 12px; color: var(--primary-700); font-weight: 600;">${locCount} Localities</span>
            </div>
            <div>
              <button class="btn btn-sm btn-secondary" onclick="toggleMandalStatus('${mandal.id}')">
                ${mandal.active !== false ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
          ${localitiesListHtml}
        </div>
      `;
    });

    container.innerHTML = html;
  }
}

window.toggleMandalStatus = function(mandalId) {
  ASR_STORE.toggleLocationActive(mandalId);
  if (typeof showToast === 'function') showToast('Location status updated!', 'info');
  const path = window.location.pathname;
  if (path.includes('locations.html')) initLocationsManagement();
};

// ----------------------------------------------------------------------------
// 2. Organization / Department Management
// ----------------------------------------------------------------------------
function initOrganizationsManagement() {
  const container = document.getElementById('organizations-list-tbody');
  const addForm = document.getElementById('form-add-org');

  renderOrganizations();

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('org-name-input').value.trim();
      const type = document.getElementById('org-type-input').value.trim();
      const contact = document.getElementById('org-contact-input').value.trim();

      if (!name) return;

      ASR_STORE.addOrganization({ name, type, contact });
      if (typeof showToast === 'function') showToast(`Organization '${name}' created!`, 'success');
      addForm.reset();
      renderOrganizations();
    });
  }

  function renderOrganizations() {
    if (!container || typeof ASR_STORE === 'undefined') return;
    const orgs = ASR_STORE.getOrganizations();

    let html = '';
    orgs.forEach(o => {
      html += `
        <tr>
          <td style="font-weight: 700; color: var(--slate-900);">${o.name}</td>
          <td><span style="background: var(--primary-100); color: var(--primary-800); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${o.type}</span></td>
          <td style="font-size: 13px; color: var(--slate-600);">${o.contact || '—'}</td>
          <td><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">ACTIVE</span></td>
        </tr>
      `;
    });
    container.innerHTML = html;
  }
}

// ----------------------------------------------------------------------------
// 3. Category Management
// ----------------------------------------------------------------------------
function initCategoriesManagement() {
  const container = document.getElementById('categories-list-tbody');
  const addForm = document.getElementById('form-add-category');

  renderCategories();

  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cat-name-input').value.trim();
      const name_te = document.getElementById('cat-te-input').value.trim();
      const type = document.getElementById('cat-type-select').value;
      const icon = document.getElementById('cat-icon-input').value.trim() || '📌';
      const desc = document.getElementById('cat-desc-input').value.trim();

      if (!name) return;

      ASR_STORE.addCategory({ name, name_te, type, icon, desc });
      if (typeof showToast === 'function') showToast(`Category '${name}' added!`, 'success');
      addForm.reset();
      renderCategories();
    });
  }

  function renderCategories() {
    if (!container || typeof ASR_STORE === 'undefined') return;
    const cats = ASR_STORE.getCategories();

    let html = '';
    cats.forEach(c => {
      html += `
        <tr>
          <td style="font-size: 18px; text-align: center;">${c.icon || '•'}</td>
          <td style="font-weight: 700;">${c.name}</td>
          <td style="color: var(--slate-600);">${c.name_te || '—'}</td>
          <td>
            <span style="background: ${c.type === 'water' ? '#e0f2fe; color: #0369a1;' : '#fef3c7; color: #92400e;'} padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${c.type}
            </span>
          </td>
          <td style="font-size: 13px; color: var(--slate-500);">${c.desc || '—'}</td>
        </tr>
      `;
    });
    container.innerHTML = html;
  }
}
