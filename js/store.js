/**
 * ASR Water & Drainage - Central Data Store & Service Layer
 * Supports LocalStorage reactive storage and transparent API sync
 */

const ASR_STORE = {
  KEYS: {
    COMPLAINTS: 'asr_wd_complaints',
    LOCATIONS: 'asr_wd_locations',
    CATEGORIES: 'asr_wd_categories',
    ORGANIZATIONS: 'asr_wd_organizations',
    ADMIN_SESSION: 'asr_wd_admin_session'
  },

  /**
   * Initialize store with default seed data if not present
   */
  init() {
    if (!localStorage.getItem(this.KEYS.LOCATIONS)) {
      localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify(ASR_INITIAL_DATA.locations));
    }
    if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
      localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(ASR_INITIAL_DATA.categories));
    }
    if (!localStorage.getItem(this.KEYS.ORGANIZATIONS)) {
      localStorage.setItem(this.KEYS.ORGANIZATIONS, JSON.stringify(ASR_INITIAL_DATA.organizations));
    }
    if (!localStorage.getItem(this.KEYS.COMPLAINTS)) {
      localStorage.setItem(this.KEYS.COMPLAINTS, JSON.stringify(ASR_INITIAL_DATA.demoComplaints));
    }
  },

  // --------------------------------------------------------------------------
  // Complaints API
  // --------------------------------------------------------------------------

  getComplaints(filters = {}) {
    let complaints = JSON.parse(localStorage.getItem(this.KEYS.COMPLAINTS) || '[]');

    if (filters.mandal && filters.mandal !== 'all') {
      complaints = complaints.filter(c => c.mandal_id === filters.mandal || c.mandal_name.toLowerCase() === filters.mandal.toLowerCase());
    }
    if (filters.type && filters.type !== 'all') {
      complaints = complaints.filter(c => c.category_type === filters.type);
    }
    if (filters.category && filters.category !== 'all') {
      complaints = complaints.filter(c => c.category_id === filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        complaints = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Assigned' || c.status === 'In Progress');
      } else {
        complaints = complaints.filter(c => c.status.toLowerCase() === filters.status.toLowerCase());
      }
    }
    if (filters.priority && filters.priority !== 'all') {
      complaints = complaints.filter(c => (c.system_priority || c.citizen_severity).toLowerCase() === filters.priority.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      complaints = complaints.filter(c =>
        c.complaint_id.toLowerCase().includes(q) ||
        c.mandal_name.toLowerCase().includes(q) ||
        (c.locality_name && c.locality_name.toLowerCase().includes(q)) ||
        c.category_name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getComplaintById(complaintId) {
    if (!complaintId) return null;
    const complaints = this.getComplaints();
    const cleanId = complaintId.trim().toUpperCase();
    return complaints.find(c => c.complaint_id.toUpperCase() === cleanId || c.id === complaintId) || null;
  },

  generateNextComplaintId() {
    const complaints = JSON.parse(localStorage.getItem(this.KEYS.COMPLAINTS) || '[]');
    const currentYear = new Date().getFullYear();
    const count = complaints.length + 1;
    const padded = String(count).padStart(6, '0');
    return `ASR-WD-${currentYear}-${padded}`;
  },

  createComplaint(data) {
    const complaints = JSON.parse(localStorage.getItem(this.KEYS.COMPLAINTS) || '[]');
    const newId = this.generateNextComplaintId();
    const now = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // Derive category details
    const categories = this.getCategories();
    const catObj = categories.find(c => c.id === data.category_id) || { name: 'Other', type: 'water' };

    // Derive mandal details
    const mandals = this.getLocations();
    const mandalObj = mandals.find(m => m.id === data.mandal_id) || { name: data.mandal_id, lat: 18.0827, lng: 82.6635 };

    const newRecord = {
      id: 'c_' + Date.now(),
      complaint_id: newId,
      created_at: now,
      updated_at: now,
      mandal_id: data.mandal_id,
      mandal_name: mandalObj.name,
      locality_id: data.locality_id || '',
      locality_name: data.locality_name || '',
      landmark: data.landmark || '',
      lat: parseFloat(data.lat) || (mandalObj.lat + (Math.random() - 0.5) * 0.02),
      lng: parseFloat(data.lng) || (mandalObj.lng + (Math.random() - 0.5) * 0.02),
      category_id: data.category_id,
      category_name: catObj.name,
      category_type: catObj.type,
      description: data.description || '',
      citizen_name: data.citizen_name || 'Anonymous Resident',
      citizen_phone: data.citizen_phone || '',
      citizen_email: data.citizen_email || '',
      citizen_severity: data.citizen_severity || 'Medium',
      system_priority: data.citizen_severity || 'Medium', // Admin can modify later
      status: 'Submitted',
      verification_level: 'Citizen Reported',
      assigned_org_id: '',
      assigned_org_name: 'Unassigned',
      photo_url: data.photo_url || '',
      ai_category: data.ai_category || catObj.name,
      ai_priority: data.ai_priority || data.citizen_severity || 'Medium',
      public_notes: 'Complaint registered successfully. Awaiting administrative review.',
      internal_notes: '',
      timeline: [
        {
          status: 'Submitted',
          timestamp: nowFormatted,
          note: 'Complaint submitted by citizen via portal.'
        }
      ]
    };

    complaints.unshift(newRecord);
    localStorage.setItem(this.KEYS.COMPLAINTS, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent('asr-complaint-created', { detail: newRecord }));
    return newRecord;
  },

  updateComplaint(complaintId, updates, updatedBy = 'Administrator') {
    const complaints = JSON.parse(localStorage.getItem(this.KEYS.COMPLAINTS) || '[]');
    const index = complaints.findIndex(c => c.complaint_id === complaintId || c.id === complaintId);

    if (index === -1) return null;

    const current = complaints[index];
    const nowFormatted = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    // Track status change in timeline
    if (updates.status && updates.status !== current.status) {
      current.timeline.push({
        status: updates.status,
        timestamp: nowFormatted,
        note: updates.public_notes || `Status updated to ${updates.status} by authorized administrator.`
      });

      // Update verification level strictly according to rules
      if (updates.status === 'Resolved') {
        current.verification_level = 'Verified/Official';
      } else if (updates.status !== 'Submitted') {
        current.verification_level = 'Administrator Reviewed';
      }
    }

    if (updates.status) current.status = updates.status;
    if (updates.system_priority) current.system_priority = updates.system_priority;
    if (updates.assigned_org_id !== undefined) {
      current.assigned_org_id = updates.assigned_org_id;
      const orgs = this.getOrganizations();
      const org = orgs.find(o => o.id === updates.assigned_org_id);
      current.assigned_org_name = org ? org.name : 'Unassigned';
    }
    if (updates.public_notes !== undefined) current.public_notes = updates.public_notes;
    if (updates.internal_notes !== undefined) current.internal_notes = updates.internal_notes;
    if (updates.resolution_photo !== undefined) current.resolution_photo = updates.resolution_photo;

    current.updated_at = new Date().toISOString();
    complaints[index] = current;
    localStorage.setItem(this.KEYS.COMPLAINTS, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent('asr-complaint-updated', { detail: current }));
    return current;
  },

  // --------------------------------------------------------------------------
  // Statistics Aggregator
  // --------------------------------------------------------------------------

  getStats(mandalId = null) {
    let complaints = this.getComplaints();
    if (mandalId && mandalId !== 'all') {
      complaints = complaints.filter(c => c.mandal_id === mandalId);
    }

    const total = complaints.length;
    const water = complaints.filter(c => c.category_type === 'water').length;
    const drainage = complaints.filter(c => c.category_type === 'drainage').length;
    const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review' || c.status === 'Assigned').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const emergency = complaints.filter(c => (c.system_priority || c.citizen_severity) === 'Emergency' || (c.system_priority || c.citizen_severity) === 'High').length;

    return {
      total,
      water,
      drainage,
      pending,
      progress,
      resolved,
      emergency
    };
  },

  // --------------------------------------------------------------------------
  // Location Hierarchy Management
  // --------------------------------------------------------------------------

  getLocations() {
    return JSON.parse(localStorage.getItem(this.KEYS.LOCATIONS) || '[]');
  },

  addMandal(mandalData) {
    const locations = this.getLocations();
    const newMandal = {
      id: 'loc_' + mandalData.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4),
      name: mandalData.name,
      name_te: mandalData.name_te || mandalData.name,
      type: 'mandal',
      lat: parseFloat(mandalData.lat) || 18.0827,
      lng: parseFloat(mandalData.lng) || 82.6635,
      active: true,
      localities: []
    };
    locations.push(newMandal);
    localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify(locations));
    return newMandal;
  },

  addLocality(mandalId, localityData) {
    const locations = this.getLocations();
    const mandal = locations.find(m => m.id === mandalId);
    if (!mandal) return null;

    if (!mandal.localities) mandal.localities = [];
    const newLocality = {
      id: 'loc_sub_' + Date.now().toString().slice(-6),
      name: localityData.name,
      name_te: localityData.name_te || localityData.name,
      lat: parseFloat(localityData.lat) || mandal.lat,
      lng: parseFloat(localityData.lng) || mandal.lng
    };
    mandal.localities.push(newLocality);
    localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify(locations));
    return newLocality;
  },

  toggleLocationActive(mandalId) {
    const locations = this.getLocations();
    const mandal = locations.find(m => m.id === mandalId);
    if (mandal) {
      mandal.active = !mandal.active;
      localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify(locations));
    }
    return mandal;
  },

  // --------------------------------------------------------------------------
  // Categories Management
  // --------------------------------------------------------------------------

  getCategories() {
    return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]');
  },

  addCategory(categoryData) {
    const categories = this.getCategories();
    const newCat = {
      id: 'cat_' + Date.now().toString().slice(-6),
      type: categoryData.type || 'water',
      name: categoryData.name,
      name_te: categoryData.name_te || categoryData.name,
      icon: categoryData.icon || '📌',
      desc: categoryData.desc || ''
    };
    categories.push(newCat);
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
    return newCat;
  },

  // --------------------------------------------------------------------------
  // Organizations Management
  // --------------------------------------------------------------------------

  getOrganizations() {
    return JSON.parse(localStorage.getItem(this.KEYS.ORGANIZATIONS) || '[]');
  },

  addOrganization(orgData) {
    const orgs = this.getOrganizations();
    const newOrg = {
      id: 'org_' + Date.now().toString().slice(-6),
      name: orgData.name,
      type: orgData.type || 'General',
      contact: orgData.contact || '',
      active: true
    };
    orgs.push(newOrg);
    localStorage.setItem(this.KEYS.ORGANIZATIONS, JSON.stringify(orgs));
    return newOrg;
  },

  // --------------------------------------------------------------------------
  // Admin Session & Authentication
  // --------------------------------------------------------------------------

  loginAdmin(email, password) {
    // Beginner-friendly pre-configured credentials for quick local evaluation
    // Matches admin database seed: admin@asr.civic / admin123
    if (email === 'admin@asr.civic' && password === 'admin123') {
      const session = {
        name: 'ASR District Admin Officer',
        email: 'admin@asr.civic',
        role: 'Super Administrator',
        token: 'tok_' + Date.now()
      };
      sessionStorage.setItem(this.KEYS.ADMIN_SESSION, JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false, message: 'Invalid admin credentials. Use admin@asr.civic / admin123' };
  },

  getAdminSession() {
    const raw = sessionStorage.getItem(this.KEYS.ADMIN_SESSION);
    return raw ? JSON.parse(raw) : null;
  },

  logoutAdmin() {
    sessionStorage.removeItem(this.KEYS.ADMIN_SESSION);
  },

  // --------------------------------------------------------------------------
  // Demo Mode & Maintenance
  // --------------------------------------------------------------------------

  resetToDemoData() {
    localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify(ASR_INITIAL_DATA.locations));
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(ASR_INITIAL_DATA.categories));
    localStorage.setItem(this.KEYS.ORGANIZATIONS, JSON.stringify(ASR_INITIAL_DATA.organizations));
    localStorage.setItem(this.KEYS.COMPLAINTS, JSON.stringify(ASR_INITIAL_DATA.demoComplaints));
    window.location.reload();
  },

  clearAllDataForProduction() {
    localStorage.setItem(this.KEYS.COMPLAINTS, JSON.stringify([]));
    window.location.reload();
  }
};

// Auto-initialize store
ASR_STORE.init();
