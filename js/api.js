/**
 * ASR Water & Drainage - Client API SDK
 * Connects frontend pages directly to REST API (/api/v1/) with graceful offline store fallback.
 */

const ASR_API = {
  BASE_URL: '/api/v1',
  TOKEN_KEY: 'asr_wd_auth_token',
  USER_KEY: 'asr_wd_auth_user',

  /**
   * Get stored bearer token
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Set bearer token & current user
   */
  setSession(token, user) {
    if (token) localStorage.setItem(this.TOKEN_KEY, token);
    if (user) localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /**
   * Get current authenticated user object
   */
  getCurrentUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Unified fetch wrapper with auth header and error normalization
   */
  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/csv')) {
        return await response.text();
      } else {
        data = { success: response.ok, message: await response.text() };
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status} Error`);
      }

      return data;
    } catch (err) {
      console.warn(`[ASR_API] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  },

  // --------------------------------------------------------------------------
  // Authentication
  // --------------------------------------------------------------------------

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  async login(email, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    if (res.success && res.data?.token) {
      this.setSession(res.data.token, res.data.user);
    }
    return res;
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore if session already expired
    } finally {
      this.clearSession();
    }
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // --------------------------------------------------------------------------
  // Complaints
  // --------------------------------------------------------------------------

  async submitComplaint(formDataOrObj) {
    return this.request('/complaints', {
      method: 'POST',
      body: formDataOrObj
    });
  },

  async getComplaints(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/complaints${qs ? '?' + qs : ''}`);
  },

  async trackComplaint(complaintNumber) {
    return this.request(`/complaints/track?number=${encodeURIComponent(complaintNumber)}`);
  },

  async getComplaintDetails(id) {
    return this.request(`/complaints/${id}`);
  },

  async getComplaintTimeline(id) {
    return this.request(`/complaints/${id}/timeline`);
  },

  async addComplaintUpdate(id, updateData) {
    return this.request(`/complaints/${id}/updates`, {
      method: 'POST',
      body: updateData
    });
  },

  // --------------------------------------------------------------------------
  // Map Geodata
  // --------------------------------------------------------------------------

  async getMapComplaints(filters = {}) {
    const qs = new URLSearchParams(filters).toString();
    return this.request(`/map/complaints${qs ? '?' + qs : ''}`);
  },

  // --------------------------------------------------------------------------
  // Locations & Categories
  // --------------------------------------------------------------------------

  async getLocations(parentId = null) {
    const qs = parentId ? `?parent_id=${parentId}` : '';
    return this.request(`/locations${qs}`);
  },

  async getCategories() {
    return this.request('/categories');
  },

  async getOrganizations() {
    return this.request('/organizations');
  },

  // --------------------------------------------------------------------------
  // Administrator Operations
  // --------------------------------------------------------------------------

  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  },

  async getAdminComplaints(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/complaints${qs ? '?' + qs : ''}`);
  },

  async assignComplaint(id, payload) {
    return this.request(`/admin/complaints/${id}/assign`, {
      method: 'POST',
      body: payload
    });
  },

  async updateComplaintStatus(id, payload) {
    return this.request(`/admin/complaints/${id}/status`, {
      method: 'POST',
      body: payload
    });
  },

  async resolveComplaint(id, resolutionNotes) {
    return this.request(`/admin/complaints/${id}/resolve`, {
      method: 'POST',
      body: { resolution_notes: resolutionNotes }
    });
  },

  async rejectComplaint(id, rejectionReason) {
    return this.request(`/admin/complaints/${id}/reject`, {
      method: 'POST',
      body: { rejection_reason: rejectionReason }
    });
  },

  async duplicateComplaint(id, originalComplaintId) {
    return this.request(`/admin/complaints/${id}/duplicate`, {
      method: 'POST',
      body: { original_complaint_id: originalComplaintId }
    });
  },

  async getAuditLogs(page = 1) {
    return this.request(`/admin/audit-logs?page=${page}`);
  },

  async getAnalytics(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/analytics${qs ? '?' + qs : ''}`);
  },

  async exportCsvReport(type = 'complaints') {
    return this.request(`/admin/reports/csv?type=${type}`);
  },

  // --------------------------------------------------------------------------
  // Rainwater Management Module
  // --------------------------------------------------------------------------

  async getRainwaterReports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/rainwater${qs ? '?' + qs : ''}`);
  },

  async submitRainwaterReport(reportData) {
    return this.request('/rainwater', {
      method: 'POST',
      body: reportData
    });
  },

  async getRainwaterReportById(id) {
    return this.request(`/rainwater/${id}`);
  },

  async getMyRainwaterReports() {
    return this.request('/my/rainwater');
  },

  async getRainwaterMapPoints() {
    return this.request('/map/rainwater');
  },

  async getAdminRainwaterReports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/rainwater${qs ? '?' + qs : ''}`);
  },

  async getAdminRainwaterReport(id) {
    return this.request(`/admin/rainwater/${id}`);
  },

  async verifyRainwaterReport(id, payload) {
    return this.request(`/admin/rainwater/${id}/verify`, {
      method: 'PATCH',
      body: payload
    });
  },

  async updateRainwaterStatus(id, payload) {
    return this.request(`/admin/rainwater/${id}/status`, {
      method: 'PATCH',
      body: payload
    });
  },

  async assignRainwaterReport(id, payload) {
    return this.request(`/admin/rainwater/${id}/assign`, {
      method: 'POST',
      body: payload
    });
  },

  async getRainwaterAnalytics() {
    return this.request('/admin/rainwater/analytics');
  },

  // --------------------------------------------------------------------------
  // AI Assistant ("Jala Mitra")
  // --------------------------------------------------------------------------

  async aiChat(payload) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: payload
    });
  },

  async aiFeedback(payload) {
    return this.request('/ai/feedback', {
      method: 'POST',
      body: payload
    });
  },

  async getAiAnalytics() {
    return this.request('/admin/ai/analytics');
  },

  async getAiSettings() {
    return this.request('/admin/ai/settings');
  }
};

// Make globally available in browser
if (typeof window !== 'undefined') {
  window.ASR_API = ASR_API;
}
