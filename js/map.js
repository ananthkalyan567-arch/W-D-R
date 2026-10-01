/**
 * ASR Water & Drainage - Problem Map Script
 * Uses Leaflet.js with custom markers and privacy-safe complaint markers.
 */

let mapInstance = null;
let markersLayerGroup = null;

document.addEventListener('DOMContentLoaded', () => {
  initProblemMap();
});

function initProblemMap() {
  const mapCanvas = document.getElementById('asr-map-canvas');
  if (!mapCanvas || typeof L === 'undefined' || typeof ASR_STORE === 'undefined') return;

  const district = ASR_INITIAL_DATA.district;

  // Initialize Leaflet Map
  mapInstance = L.map('asr-map-canvas', {
    center: [district.centerLat, district.centerLng],
    zoom: district.zoom,
    scrollWheelZoom: true
  });

  // OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap contributors | ASR Water & Drainage'
  }).addTo(mapInstance);

  markersLayerGroup = L.layerGroup().addTo(mapInstance);

  // Populate Filter Dropdowns
  populateMapFilters();

  // Initial markers render
  renderMapMarkers();

  // Watch for filter change events
  initFilterListeners();
}

/**
 * Populate Mandal dropdown filter
 */
function populateMapFilters() {
  const mandalSelect = document.getElementById('map-filter-mandal');
  if (!mandalSelect) return;

  const locations = ASR_STORE.getLocations();
  const currentLang = typeof ASR_I18N !== 'undefined' ? ASR_I18N.currentLang : 'en';

  locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc.id;
    opt.textContent = currentLang === 'te' && loc.name_te ? `${loc.name_te} (${loc.name})` : loc.name;
    mandalSelect.appendChild(opt);
  });
}

/**
 * Filter change event listeners
 */
function initFilterListeners() {
  const mandalSelect = document.getElementById('map-filter-mandal');
  const typeSelect = document.getElementById('map-filter-type');
  const statusSelect = document.getElementById('map-filter-status');
  const searchInput = document.getElementById('map-filter-search');

  [mandalSelect, typeSelect, statusSelect].forEach(el => {
    if (el) el.addEventListener('change', renderMapMarkers);
  });

  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(renderMapMarkers, 300);
    });
  }

  // Recenter button
  const recenterBtn = document.getElementById('btn-map-recenter');
  if (recenterBtn) {
    recenterBtn.addEventListener('click', () => {
      if (mapInstance) {
        mapInstance.setView([ASR_INITIAL_DATA.district.centerLat, ASR_INITIAL_DATA.district.centerLng], ASR_INITIAL_DATA.district.zoom);
      }
    });
  }
}

/**
 * Render filtered markers on map
 */
async function renderMapMarkers() {
  if (!markersLayerGroup) return;

  markersLayerGroup.clearLayers();

  const mandalFilter = document.getElementById('map-filter-mandal') ? document.getElementById('map-filter-mandal').value : 'all';
  const typeFilter = document.getElementById('map-filter-type') ? document.getElementById('map-filter-type').value : 'all';
  const statusFilter = document.getElementById('map-filter-status') ? document.getElementById('map-filter-status').value : 'all';
  const searchFilter = document.getElementById('map-filter-search') ? document.getElementById('map-filter-search').value : '';

  let visibleCount = 0;
  const bounds = [];

  // 1. Water & Drainage Complaints (when not filtering strictly for rainwater)
  if (typeFilter !== 'rainwater') {
    const isRwSpecialStatus = ['available', 'not_available', 'blocked', 'damaged'].includes(statusFilter);
    const complaints = ASR_STORE.getComplaints({
      mandal: mandalFilter,
      type: typeFilter,
      status: isRwSpecialStatus ? 'all' : statusFilter,
      search: searchFilter
    });

    visibleCount += complaints.length;

    complaints.forEach(c => {
      if (!c.lat || !c.lng) return;

      let markerColor = '#0284c7';
      let iconChar = '💧';

      if (c.status === 'Resolved') {
        markerColor = '#10b981';
        iconChar = '✓';
      } else if (c.citizen_severity === 'Emergency' || c.category_id === 'sewage_wastewater' || c.category_id === 'drain_overflow') {
        markerColor = '#ef4444';
        iconChar = '⚠️';
      } else if (c.category_type === 'drainage') {
        markerColor = '#f59e0b';
        iconChar = '🌿';
      }

      const customMarkerIcon = L.divIcon({
        className: 'asr-custom-pin',
        html: `
          <div style="
            background-color: ${markerColor};
            color: #ffffff;
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">
            <span style="transform: rotate(45deg); font-size: 13px; font-weight: bold;">${iconChar}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([c.lat, c.lng], { icon: customMarkerIcon });
      const statusBadge = typeof getStatusBadge === 'function' ? getStatusBadge(c.status) : c.status;
      const verifyBadge = typeof getVerificationBadge === 'function' ? getVerificationBadge(c.verification_level) : '';

      const popupHtml = `
        <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #0284c7; font-size: 13px;">${c.complaint_id}</strong>
            ${statusBadge}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
            ${c.category_name}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
            📍 ${c.locality_name ? c.locality_name + ', ' : ''}${c.mandal_name}
          </div>
          <div style="font-size: 11.5px; color: #64748b; margin-bottom: 8px;">
            ${c.description && c.description.length > 90 ? c.description.slice(0, 90) + '...' : (c.description || '')}
          </div>
          <div style="margin-bottom: 8px;">
            ${verifyBadge}
          </div>
          <a href="track.html?id=${c.complaint_id}" class="btn btn-sm btn-outline" style="display: block; text-align: center; font-size: 11.5px; padding: 4px 8px;">
            Track Full Complaint →
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerGroup.addLayer(marker);
      bounds.push([c.lat, c.lng]);
    });
  }

  // 2. Rainwater Infrastructure Points Layer (if typeFilter is 'all' or 'rainwater')
  if (typeFilter === 'all' || typeFilter === 'rainwater') {
    try {
      const rwResp = await (typeof ASR_API !== 'undefined' ? ASR_API.getRainwaterMapPoints() : Promise.resolve(null));
      const rwPoints = (rwResp && rwResp.data) ? (rwResp.data.points || rwResp.data) : [];

      rwPoints.forEach(r => {
        if (!r.latitude || !r.longitude) return;

        // Apply filters
        if (statusFilter === 'available' && r.availability_status !== 'available') return;
        if (statusFilter === 'not_available' && r.availability_status !== 'not_available') return;
        if (statusFilter === 'blocked' && r.condition_status !== 'blocked') return;
        if (statusFilter === 'damaged' && r.condition_status !== 'damaged') return;
        if (statusFilter === 'verified' && r.verification_status !== 'verified') return;
        if (statusFilter === 'pending' && r.verification_status !== 'pending') return;

        visibleCount++;

        let markerColor = '#0284c7';
        let iconChar = '💧';

        if (r.availability_status === 'not_available') {
          markerColor = '#ef4444';
          iconChar = '🚫';
        } else if (r.condition_status === 'blocked') {
          markerColor = '#f59e0b';
          iconChar = '🛑';
        } else if (r.condition_status === 'damaged') {
          markerColor = '#dc2626';
          iconChar = '💥';
        } else if (r.availability_status === 'available') {
          markerColor = '#10b981';
          iconChar = '🌧️';
        }

        const rwPin = L.divIcon({
          className: 'asr-custom-pin',
          html: `
            <div style="
              background-color: ${markerColor};
              color: #ffffff;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              <span style="transform: rotate(45deg); font-size: 13px; font-weight: bold;">${iconChar}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const vClass = r.verification_status === 'verified' ? 'badge bg-success' : 'badge bg-warning text-dark';
        const vLabel = (r.verification_status || 'pending').replace('_', ' ');

        const compBadge = r.complaint_number 
          ? `<div style="margin-top: 6px;"><a href="track.html?number=${r.complaint_number}" class="btn btn-sm btn-danger py-0 px-2 text-decoration-none" style="font-size: 11px;">Track ${r.complaint_number}</a></div>`
          : '';

        const popup = `
          <div style="min-width: 220px; font-family: 'Inter', sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="color: #0284c7; font-size: 13px;">${r.report_number}</strong>
              <span class="${vClass}" style="font-size: 11px; padding: 2px 6px; border-radius: 4px;">${vLabel}</span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
              ${(r.report_type || 'Rainwater Drip Opening').replace(/_/g, ' ')}
            </div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
              📍 ${r.location_name || 'ASR District'} ${r.landmark ? ' (' + r.landmark + ')' : ''}
            </div>
            <div style="font-size: 12px; color: #475569;">
              Availability: <strong>${r.availability_status}</strong> | Condition: <strong>${r.condition_status || 'unknown'}</strong>
            </div>
            ${compBadge}
            <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              Observation Date: ${(r.created_at || '').substring(0, 10)}
            </div>
          </div>
        `;

        const marker = L.marker([r.latitude, r.longitude], { icon: rwPin });
        marker.bindPopup(popup);
        markersLayerGroup.addLayer(marker);
        bounds.push([r.latitude, r.longitude]);
      });
    } catch (err) {
      console.warn('Could not load rainwater map points:', err);
    }
  }

  // Update visible count in UI
  const countDisplay = document.getElementById('map-active-count');
  if (countDisplay) {
    countDisplay.textContent = `${visibleCount} issues visible`;
  }

  // Fit bounds if mandal filter is selected and has points
  if (mandalFilter !== 'all' && bounds.length > 0) {
    mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }
}
