const state = {
  listings: [],
  selectedListing: null,
  arv: 0,
  arvMeta: null,
  flipSignal: null,
  pendingContactAction: null,
  galleryOpen: false,
  galleryListingId: null,
  galleryIndex: 0,
  searchPage: 1,
  pageSize: 30,
  hasMore: false,
  totalMatches: 0,
  searchSource: '',
  authUser: null,
  csrfToken: '',
  billing: null,
  adminUsers: [],
  adminAuditLogs: [],
  crmLeads: [],
  crmTasks: [],
  consentLogs: [],
  map: null,
  mapMarkers: null,
  mapCircle: null,
  mapPolygon: null,
  polygonDrawMode: false,
  polygonPoints: [],
  polygonTempLine: null,
  polygonVertexMarkers: [],
  assignmentFee: 5000,
  pipeline: [],
  currentAnalysis: null,
};

const PIPELINE_KEY = 'wholesale_pipeline_v1';

const els = {
  searchForm: document.getElementById('searchForm'),
  location: document.getElementById('location'),
  minPrice: document.getElementById('minPrice'),
  maxPrice: document.getElementById('maxPrice'),
  beds: document.getElementById('beds'),
  baths: document.getElementById('baths'),
  mapRadiusMiles: document.getElementById('mapRadiusMiles'),
  mapRadiusLabel: document.getElementById('mapRadiusLabel'),
  clearMapFilterBtn: document.getElementById('clearMapFilterBtn'),
  startPolygonBtn: document.getElementById('startPolygonBtn'),
  finishPolygonBtn: document.getElementById('finishPolygonBtn'),
  clearPolygonBtn: document.getElementById('clearPolygonBtn'),
  polygonStatus: document.getElementById('polygonStatus'),
  mapView: document.getElementById('mapView'),
  results: document.getElementById('results'),
  resultsStatus: document.getElementById('resultsStatus'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
  arvDisplay: document.getElementById('arvDisplay'),
  arvRangeGrid: document.getElementById('arvRangeGrid'),
  arvAutoStatus: document.getElementById('arvAutoStatus'),
  assignmentFee: document.getElementById('assignmentFee'),
  feeButtons: document.getElementById('feeButtons'),
  confirmedFee: document.getElementById('confirmedFee'),
  flipSignal: document.getElementById('flipSignal'),
  calcGrid: document.getElementById('calcGrid'),
  diagnosis: document.getElementById('diagnosis'),
  kpiResults: document.getElementById('kpiResults'),
  kpiMao: document.getElementById('kpiMao'),
  kpiScore: document.getElementById('kpiScore'),
  aiTools: document.getElementById('aiTools'),
  valueTools: document.getElementById('valueTools'),
  costTools: document.getElementById('costTools'),
  pipelineTools: document.getElementById('pipelineTools'),
  dataStatus: document.getElementById('dataStatus'),
  sourceHealthBadges: document.getElementById('sourceHealthBadges'),
  allowSampleFallback: document.getElementById('allowSampleFallback'),
  onlyZillowPhotos: document.getElementById('onlyZillowPhotos'),
  authStatus: document.getElementById('authStatus'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  registerBtn: document.getElementById('registerBtn'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  requestVerifyBtn: document.getElementById('requestVerifyBtn'),
  verifyTokenInput: document.getElementById('verifyTokenInput'),
  verifyEmailBtn: document.getElementById('verifyEmailBtn'),
  requestResetBtn: document.getElementById('requestResetBtn'),
  resetTokenInput: document.getElementById('resetTokenInput'),
  newPasswordInput: document.getElementById('newPasswordInput'),
  resetPasswordBtn: document.getElementById('resetPasswordBtn'),
  authActionStatus: document.getElementById('authActionStatus'),
  billingStatus: document.getElementById('billingStatus'),
  startTrialCheckoutBtn: document.getElementById('startTrialCheckoutBtn'),
  openBillingPortalBtn: document.getElementById('openBillingPortalBtn'),
  refreshBillingBtn: document.getElementById('refreshBillingBtn'),
  billingActionStatus: document.getElementById('billingActionStatus'),
  saveSearchCloudBtn: document.getElementById('saveSearchCloudBtn'),
  saveDealCloudBtn: document.getElementById('saveDealCloudBtn'),
  refreshCloudBtn: document.getElementById('refreshCloudBtn'),
  savedSearchesList: document.getElementById('savedSearchesList'),
  savedDealsList: document.getElementById('savedDealsList'),
  sourceHealthHistoryGrid: document.getElementById('sourceHealthHistoryGrid'),
  refreshConsentLogsBtn: document.getElementById('refreshConsentLogsBtn'),
  consentLogsList: document.getElementById('consentLogsList'),
  adminPanel: document.getElementById('adminPanel'),
  refreshAdminBtn: document.getElementById('refreshAdminBtn'),
  adminSecurityBtn: document.getElementById('adminSecurityBtn'),
  adminBackupBtn: document.getElementById('adminBackupBtn'),
  adminRestoreBtn: document.getElementById('adminRestoreBtn'),
  adminStripeCheckBtn: document.getElementById('adminStripeCheckBtn'),
  adminReadinessBtn: document.getElementById('adminReadinessBtn'),
  adminStatusLine: document.getElementById('adminStatusLine'),
  adminUsersList: document.getElementById('adminUsersList'),
  adminAuditList: document.getElementById('adminAuditList'),
  createLeadFromSelectedBtn: document.getElementById('createLeadFromSelectedBtn'),
  refreshCrmBtn: document.getElementById('refreshCrmBtn'),
  crmLeadsList: document.getElementById('crmLeadsList'),
  crmTasksList: document.getElementById('crmTasksList'),
  photoSelect: document.getElementById('photoSelect'),
  gradePhotoBtn: document.getElementById('gradePhotoBtn'),
  gradeAllPhotosBtn: document.getElementById('gradeAllPhotosBtn'),
  savePipelineBtn: document.getElementById('savePipelineBtn'),
  photoGradeStatus: document.getElementById('photoGradeStatus'),
  photoGradeGrid: document.getElementById('photoGradeGrid'),
  pipelineBoard: document.getElementById('pipelineBoard'),
  compareGrid: document.getElementById('compareGrid'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  exportStatus: document.getElementById('exportStatus'),
  toolOutput: document.getElementById('toolOutput'),
  contactInfoGrid: document.getElementById('contactInfoGrid'),
  contactActionStatus: document.getElementById('contactActionStatus'),
  msgOwnerBtn: document.getElementById('msgOwnerBtn'),
  msgAgentBtn: document.getElementById('msgAgentBtn'),
  emailOwnerBtn: document.getElementById('emailOwnerBtn'),
  emailAgentBtn: document.getElementById('emailAgentBtn'),
  callOwnerBtn: document.getElementById('callOwnerBtn'),
  callAgentBtn: document.getElementById('callAgentBtn'),
  confirmModal: document.getElementById('confirmModal'),
  confirmTitle: document.getElementById('confirmTitle'),
  confirmSubtitle: document.getElementById('confirmSubtitle'),
  confirmPreview: document.getElementById('confirmPreview'),
  cancelSendBtn: document.getElementById('cancelSendBtn'),
  confirmSendBtn: document.getElementById('confirmSendBtn'),
  galleryModal: document.getElementById('galleryModal'),
  galleryTitle: document.getElementById('galleryTitle'),
  galleryCounter: document.getElementById('galleryCounter'),
  galleryStatus: document.getElementById('galleryStatus'),
  galleryPhotoSource: document.getElementById('galleryPhotoSource'),
  galleryImage: document.getElementById('galleryImage'),
  galleryThumbs: document.getElementById('galleryThumbs'),
  prevPhotoBtn: document.getElementById('prevPhotoBtn'),
  nextPhotoBtn: document.getElementById('nextPhotoBtn'),
  closeGalleryBtn: document.getElementById('closeGalleryBtn'),
};

const feePresets = [5000, 10000, 15000, 25000];

const toolCatalog = {
  ai: [
    { title: 'Marketing Flyer', desc: 'Generate a marketing flyer layout.', tags: ['dispo', 'marketing'] },
    { title: 'Offer Message Generator', desc: 'Generate offer email templates.', tags: ['templates', 'offers'] },
    { title: 'Cold Calling Scripts', desc: 'Generate and browse cold-calling scripts.', tags: ['scripts', 'calling', 'templates'] },
    { title: 'Buyer Message Generator', desc: 'Generate disposition-ready buyer outreach messages.', tags: ['buyers', 'messaging', 'dispo'] },
  ],
  value: [
    { title: 'ARV Estimator', desc: 'Estimate ARV using comps + condition delta.', tags: ['calculator', 'arv', 'comps'] },
    { title: 'MAO Calculator', desc: 'Maximum Allowable Offer using 70% rule or custom formula.', tags: ['calculator', 'mao', 'wholesaling'] },
    { title: 'Offer Price Calculator', desc: 'Calculate offer price backward from target profit.', tags: ['calculator', 'offer', 'profit'] },
  ],
  cost: [
    { title: 'Repair Estimator', desc: 'Quick or detailed rehab estimate.', tags: ['calculator', 'repairs', 'rehab'] },
    { title: 'Closing Costs Estimator', desc: 'Quick closing cost approximation for deals.', tags: ['calculator', 'closing', 'estimate'] },
    { title: 'Holding Costs Estimator', desc: 'Estimate monthly and total holding costs.', tags: ['calculator', 'holding', 'flip'] },
    { title: 'Selling Costs Estimator', desc: 'Estimate costs when selling a property.', tags: ['calculator', 'selling', 'flip'] },
  ],
  pipeline: [
    { title: 'Sales Comparables', desc: 'Find and analyze comparables to validate ARV.', tags: ['comps', 'analysis', 'valuation'] },
    { title: 'Deal Comparison', desc: 'Compare two deals side by side.', tags: ['analysis', 'compare'] },
    { title: 'Deal Pipeline', desc: 'Track and manage your deal flow.', tags: ['crm', 'pipeline'] },
  ],
};

function formatUSD(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function listingPhotos(listing) {
  if (!listing || !Array.isArray(listing.photos)) return [];
  return listing.photos.filter(Boolean);
}

function photoSourceLabel(url) {
  try {
    const host = new URL(String(url || '')).hostname.toLowerCase();
    if (host.includes('zillowstatic.com') || host.includes('zillow.com')) return 'Zillow';
    if (host.includes('rdcpix.com') || host.includes('realtor.com')) return 'Realtor';
    if (host.includes('redfin.com')) return 'Redfin';
    if (host.includes('paragonrels.com')) return 'MLS';
    return host || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function patchListingPhotos(listingId, photos) {
  state.listings = state.listings.map((item) =>
    item.id === listingId ? { ...item, photos, photoCount: photos.length } : item
  );
  if (state.selectedListing?.id === listingId) {
    state.selectedListing = { ...state.selectedListing, photos, photoCount: photos.length };
  }
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function currentSearchPayload() {
  return {
    location: els.location.value.trim(),
    minPrice: els.minPrice.value.trim(),
    maxPrice: els.maxPrice.value.trim(),
    beds: els.beds.value.trim(),
    baths: els.baths.value.trim(),
    allowSampleFallback: els.allowSampleFallback.checked,
    onlyZillowPhotos: els.onlyZillowPhotos.checked,
  };
}

function setBillingActionStatus(message) {
  if (!els.billingActionStatus) return;
  els.billingActionStatus.textContent = message || '';
}

function setAdminStatus(message) {
  if (!els.adminStatusLine) return;
  els.adminStatusLine.textContent = message || '';
}

function renderConsentLogs(items = []) {
  if (!els.consentLogsList) return;
  if (!state.authUser) {
    els.consentLogsList.innerHTML = '<p class="header-sub">Login required.</p>';
    return;
  }
  if (!items.length) {
    els.consentLogsList.innerHTML = '<p class="header-sub">No outreach consent/activity logs yet.</p>';
    return;
  }
  els.consentLogsList.innerHTML = items
    .slice(0, 120)
    .map((row) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${row.eventType}</strong>
          <span class="meta">${new Date(row.createdAt || Date.now()).toLocaleString()}</span>
        </div>
        <div class="meta">channel: ${row.payload?.channel || 'n/a'} • target: ${row.payload?.target || 'n/a'} • address: ${row.payload?.address || 'n/a'}</div>
      </div>
    `)
    .join('');
}

async function refreshConsentLogs() {
  if (!state.authUser) {
    state.consentLogs = [];
    renderConsentLogs([]);
    return;
  }
  const res = await apiFetch('/api/user/outreach-consent-logs?limit=120');
  if (!res.ok) {
    state.consentLogs = [];
    renderConsentLogs([]);
    return;
  }
  const data = await res.json();
  state.consentLogs = data.items || [];
  renderConsentLogs(state.consentLogs);
}

async function initPublicMonitoring() {
  try {
    const res = await apiFetch('/api/public-config');
    if (!res.ok) return;
    const cfg = await res.json();
    const sentryCfg = cfg?.sentry || {};
    if (sentryCfg.enabled && sentryCfg.dsn && window.Sentry) {
      window.Sentry.init({
        dsn: sentryCfg.dsn,
        tracesSampleRate: 0.2,
      });
      window.Sentry.setTag('app', 'wholesale-deal-finder');
    }
  } catch {}
}

function parseCookie(name) {
  const needle = `${name}=`;
  const parts = document.cookie.split(';').map((s) => s.trim());
  const row = parts.find((p) => p.startsWith(needle));
  if (!row) return '';
  return decodeURIComponent(row.slice(needle.length));
}

async function ensureCsrfToken() {
  if (state.csrfToken) return state.csrfToken;
  const cookieToken = parseCookie('wdf_csrf');
  if (cookieToken) {
    state.csrfToken = cookieToken;
    return cookieToken;
  }
  try {
    const res = await fetch('/api/auth/csrf');
    const data = await res.json();
    state.csrfToken = data?.token || parseCookie('wdf_csrf') || '';
  } catch {
    state.csrfToken = parseCookie('wdf_csrf') || '';
  }
  return state.csrfToken;
}

async function apiFetch(url, options = {}) {
  const opts = { ...options };
  const method = String(opts.method || 'GET').toUpperCase();
  const headers = { ...(opts.headers || {}) };
  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = await ensureCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;
  }
  opts.headers = headers;
  return fetch(url, opts);
}

function renderAuthStatus() {
  if (!els.authStatus) return;
  if (!state.authUser) {
    els.authStatus.textContent = 'Not signed in.';
    if (els.adminPanel) els.adminPanel.classList.add('hidden');
    return;
  }
  const verified = state.authUser.emailVerified ? 'Verified' : 'Unverified';
  const role = state.authUser.role || 'user';
  els.authStatus.textContent = `Signed in as ${state.authUser.email} • ${verified} • role: ${role}`;
  if (els.adminPanel) {
    if (String(role).toLowerCase() === 'admin') els.adminPanel.classList.remove('hidden');
    else els.adminPanel.classList.add('hidden');
  }
}

function setAuthActionStatus(message) {
  if (!els.authActionStatus) return;
  els.authActionStatus.textContent = message || '';
}

function renderBilling() {
  if (!els.billingStatus) return;
  if (!state.authUser || !state.billing) {
    els.billingStatus.textContent = 'Login to view your subscription and trial status.';
    return;
  }
  const b = state.billing;
  const trialText = b.trialDaysRemaining > 0 ? `${b.trialDaysRemaining} day(s) left` : 'trial ended';
  const renewText = b.renewsAt ? ` • renews ${new Date(b.renewsAt).toLocaleDateString()}` : '';
  els.billingStatus.textContent = `Plan: ${b.plan} • Status: ${b.status} • Trial: ${trialText}${renewText}`;
}

async function refreshBilling() {
  if (!state.authUser) {
    state.billing = null;
    renderBilling();
    return;
  }
  const res = await apiFetch('/api/billing/status');
  if (!res.ok) {
    state.billing = null;
    renderBilling();
    return;
  }
  const data = await res.json();
  state.billing = data.billing || null;
  renderBilling();
}

function renderCrmLeads(items = []) {
  if (!els.crmLeadsList) return;
  if (!state.authUser) {
    els.crmLeadsList.innerHTML = '<p class="header-sub">Login required.</p>';
    return;
  }
  if (!items.length) {
    els.crmLeadsList.innerHTML = '<p class="header-sub">No leads yet. Create one from selected property.</p>';
    return;
  }
  els.crmLeadsList.innerHTML = items
    .slice(0, 120)
    .map((lead) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${lead.address || 'Lead'}</strong>
          <div class="actions">
            <button class="ghost-btn" data-lead-next="${lead.id}" type="button">Advance Stage</button>
            <button class="ghost-btn" data-lead-delete="${lead.id}" type="button">Delete</button>
          </div>
        </div>
        <div class="meta">Stage: ${lead.stage} • Priority: ${lead.priority} • Next: ${lead.nextActionAt ? new Date(lead.nextActionAt).toLocaleString() : 'not set'}</div>
      </div>
    `)
    .join('');

  const stageOrder = ['new', 'contacted', 'underwriting', 'offer_sent', 'negotiation', 'contracted', 'dispo', 'closed'];
  els.crmLeadsList.querySelectorAll('[data-lead-next]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.leadNext;
      const row = state.crmLeads.find((l) => l.id === id);
      if (!row) return;
      const idx = stageOrder.indexOf(row.stage);
      const nextStage = stageOrder[Math.min(stageOrder.length - 1, idx + 1)] || row.stage;
      const res = await apiFetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stage: nextStage }),
      });
      if (res.ok) await refreshCrm();
    });
  });

  els.crmLeadsList.querySelectorAll('[data-lead-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.leadDelete;
      const res = await apiFetch(`/api/crm/leads?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) await refreshCrm();
    });
  });
}

function renderCrmTasks(items = []) {
  if (!els.crmTasksList) return;
  if (!state.authUser) {
    els.crmTasksList.innerHTML = '<p class="header-sub">Login required.</p>';
    return;
  }
  if (!items.length) {
    els.crmTasksList.innerHTML = '<p class="header-sub">No tasks yet.</p>';
    return;
  }
  els.crmTasksList.innerHTML = items
    .slice(0, 160)
    .map((task) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${task.completed ? '✓' : '○'} ${task.title}</strong>
          <div class="actions">
            <button class="ghost-btn" data-task-done="${task.id}" type="button">${task.completed ? 'Undo' : 'Done'}</button>
            <button class="ghost-btn" data-task-delete="${task.id}" type="button">Delete</button>
          </div>
        </div>
        <div class="meta">Due: ${task.dueAt ? new Date(task.dueAt).toLocaleString() : 'unscheduled'} • Lead: ${task.leadId || 'n/a'}</div>
      </div>
    `)
    .join('');

  els.crmTasksList.querySelectorAll('[data-task-done]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.taskDone;
      const row = state.crmTasks.find((t) => t.id === id);
      if (!row) return;
      const res = await apiFetch('/api/crm/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !row.completed }),
      });
      if (res.ok) await refreshCrm();
    });
  });

  els.crmTasksList.querySelectorAll('[data-task-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.taskDelete;
      const res = await apiFetch(`/api/crm/tasks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) await refreshCrm();
    });
  });
}

async function refreshCrm() {
  if (!state.authUser) {
    state.crmLeads = [];
    state.crmTasks = [];
    renderCrmLeads([]);
    renderCrmTasks([]);
    return;
  }
  const [leadRes, taskRes] = await Promise.all([
    apiFetch('/api/crm/leads'),
    apiFetch('/api/crm/tasks'),
  ]);
  const leadsData = leadRes.ok ? await leadRes.json() : { items: [] };
  const tasksData = taskRes.ok ? await taskRes.json() : { items: [] };
  state.crmLeads = leadsData.items || [];
  state.crmTasks = tasksData.items || [];
  renderCrmLeads(state.crmLeads);
  renderCrmTasks(state.crmTasks);
}

async function createLeadFromSelected() {
  if (!state.authUser) throw new Error('Login required');
  if (!state.selectedListing) throw new Error('Select a property first');
  const listing = state.selectedListing;
  const next = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const leadRes = await apiFetch('/api/crm/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listingId: listing.id || '',
      address: listing.address || '',
      stage: 'new',
      priority: (state.currentAnalysis?.dealScore || 0) >= 70 ? 'high' : 'medium',
      contactName: listing?.contacts?.owner?.name || '',
      contactPhone: listing?.contacts?.owner?.phone || '',
      contactEmail: listing?.contacts?.owner?.email || '',
      notes: `Auto-created from listing. Deal score: ${state.currentAnalysis?.dealScore || 'n/a'}`,
      nextActionAt: next,
    }),
  });
  const leadData = await leadRes.json();
  if (!leadRes.ok) throw new Error(leadData?.error || 'Could not create lead');
  await apiFetch('/api/crm/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId: leadData?.item?.id || '',
      title: 'Call owner and present first offer range',
      dueAt: next,
    }),
  });
  await refreshCrm();
}

function renderSavedSearches(items = []) {
  if (!els.savedSearchesList) return;
  if (!items.length) {
    els.savedSearchesList.innerHTML = '<p class="header-sub">No saved cloud searches yet.</p>';
    return;
  }
  els.savedSearchesList.innerHTML = items
    .map((item) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${item.name || 'Saved Search'}</strong>
          <div class="actions">
            <button class="ghost-btn" data-apply-search-id="${item.id}" type="button">Apply</button>
            <button class="ghost-btn" data-delete-search-id="${item.id}" type="button">Delete</button>
          </div>
        </div>
        <div class="meta">${new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString()}</div>
      </div>
    `)
    .join('');

  els.savedSearchesList.querySelectorAll('[data-apply-search-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = items.find((x) => x.id === btn.dataset.applySearchId);
      if (!item) return;
      const q = item.query || {};
      els.location.value = q.location || '';
      els.minPrice.value = q.minPrice || '';
      els.maxPrice.value = q.maxPrice || '';
      els.beds.value = q.beds || '';
      els.baths.value = q.baths || '';
      els.allowSampleFallback.checked = !!q.allowSampleFallback;
      els.onlyZillowPhotos.checked = !!q.onlyZillowPhotos;
      await runSearch();
    });
  });

  els.savedSearchesList.querySelectorAll('[data-delete-search-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const res = await apiFetch(`/api/user/saved-searches?id=${encodeURIComponent(btn.dataset.deleteSearchId)}`, { method: 'DELETE' });
      if (res.ok) await refreshCloudLibrary();
    });
  });
}

function renderSavedDeals(items = []) {
  if (!els.savedDealsList) return;
  if (!items.length) {
    els.savedDealsList.innerHTML = '<p class="header-sub">No saved cloud deals yet.</p>';
    return;
  }
  els.savedDealsList.innerHTML = items
    .map((item) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${item?.listing?.address || 'Saved Deal'}</strong>
          <div class="actions">
            <button class="ghost-btn" data-open-deal-id="${item.id}" type="button">Open</button>
            <button class="ghost-btn" data-delete-deal-id="${item.id}" type="button">Delete</button>
          </div>
        </div>
        <div class="meta">Score: ${item?.analysis?.dealScore || 'N/A'} • ${new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleString()}</div>
      </div>
    `)
    .join('');

  els.savedDealsList.querySelectorAll('[data-open-deal-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const item = items.find((x) => x.id === btn.dataset.openDealId);
      if (!item) return;
      state.selectedListing = item.listing || null;
      state.currentAnalysis = item.analysis || null;
      state.listings = state.selectedListing ? [state.selectedListing] : [];
      if (state.selectedListing) {
        await refreshAutoArvFromPhotos();
      }
      renderListings();
      renderAnalysis();
      renderPhotoOptions();
      renderCompare();
      renderContactInfo();
    });
  });

  els.savedDealsList.querySelectorAll('[data-delete-deal-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const res = await apiFetch(`/api/user/saved-deals?id=${encodeURIComponent(btn.dataset.deleteDealId)}`, { method: 'DELETE' });
      if (res.ok) await refreshCloudLibrary();
    });
  });
}

function renderSourceHealthHistory(items = []) {
  if (!els.sourceHealthHistoryGrid) return;
  if (!items.length) {
    els.sourceHealthHistoryGrid.innerHTML = '<p class="header-sub">No source health history yet.</p>';
    return;
  }
  els.sourceHealthHistoryGrid.innerHTML = items
    .slice(0, 30)
    .map((row) => {
      const ok = Array.isArray(row.sourceHealth) && row.sourceHealth.some((r) => r.ok);
      return `
        <div class="cloud-item">
          <div class="row">
            <strong>${row.location || 'n/a'} • ${row.source || 'unknown'}</strong>
            <span class="health-pill ${ok ? 'health-ok' : 'health-bad'}">${ok ? 'OK' : 'Fail'}</span>
          </div>
          <div class="meta">${new Date(row.createdAt || Date.now()).toLocaleString()} • mode: ${row.mode || 'unknown'}</div>
        </div>
      `;
    })
    .join('');
}

async function refreshCloudLibrary() {
  if (!state.authUser) {
    renderSavedSearches([]);
    renderSavedDeals([]);
    return;
  }
  const [searchRes, dealRes] = await Promise.all([
    apiFetch('/api/user/saved-searches'),
    apiFetch('/api/user/saved-deals'),
  ]);
  const searches = searchRes.ok ? (await searchRes.json()).items || [] : [];
  const deals = dealRes.ok ? (await dealRes.json()).items || [] : [];
  renderSavedSearches(searches);
  renderSavedDeals(deals);
}

function renderAdminUsers(items = []) {
  if (!els.adminUsersList) return;
  if (!items.length) {
    els.adminUsersList.innerHTML = '<p class="header-sub">No users found.</p>';
    return;
  }
  els.adminUsersList.innerHTML = items
    .slice(0, 120)
    .map((u) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${u.email}</strong>
          <span class="health-pill ${u.emailVerified ? 'health-ok' : 'health-bad'}">${u.emailVerified ? 'verified' : 'unverified'}</span>
        </div>
        <div class="meta">role: ${u.role || 'user'} • deals: ${u.savedDealCount || 0} • searches: ${u.savedSearchCount || 0}</div>
      </div>
    `)
    .join('');
}

function renderAdminAudit(items = []) {
  if (!els.adminAuditList) return;
  if (!items.length) {
    els.adminAuditList.innerHTML = '<p class="header-sub">No audit logs found.</p>';
    return;
  }
  els.adminAuditList.innerHTML = items
    .slice(0, 160)
    .map((row) => `
      <div class="cloud-item">
        <div class="row">
          <strong>${row.eventType || 'event'}</strong>
          <span class="meta">${new Date(row.createdAt || Date.now()).toLocaleString()}</span>
        </div>
        <div class="meta">${row.userEmail || 'system'} • ${(row.ip || '').slice(0, 80)}</div>
      </div>
    `)
    .join('');
}

async function refreshAdminData() {
  if (!state.authUser || String(state.authUser.role || '').toLowerCase() !== 'admin') {
    state.adminUsers = [];
    state.adminAuditLogs = [];
    renderAdminUsers([]);
    renderAdminAudit([]);
    return;
  }
  const [usersRes, auditRes] = await Promise.all([
    apiFetch('/api/admin/users?limit=200'),
    apiFetch('/api/admin/audit-logs?limit=240'),
  ]);
  const usersData = usersRes.ok ? await usersRes.json() : { items: [] };
  const auditData = auditRes.ok ? await auditRes.json() : { items: [] };
  state.adminUsers = usersData.items || [];
  state.adminAuditLogs = auditData.items || [];
  renderAdminUsers(state.adminUsers);
  renderAdminAudit(state.adminAuditLogs);
}

async function refreshSourceHealthHistory() {
  const res = await apiFetch('/api/source-health-history?limit=80');
  if (!res.ok) return;
  const data = await res.json();
  renderSourceHealthHistory(data.items || []);
}

async function refreshAuth() {
  try {
    const res = await apiFetch('/api/auth/me');
    const data = await res.json();
    state.authUser = data?.authenticated ? data.user : null;
    state.csrfToken = data?.csrfToken || parseCookie('wdf_csrf') || state.csrfToken;
  } catch {
    state.authUser = null;
  }
  renderAuthStatus();
  await refreshCloudLibrary();
  await refreshBilling();
  await refreshCrm();
  await refreshConsentLogs();
  await refreshAdminData();
}

async function registerAuth() {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Register failed');
  state.authUser = data.user || null;
  state.csrfToken = parseCookie('wdf_csrf') || state.csrfToken;
  renderAuthStatus();
  const verification = data?.verification || null;
  if (verification?.devToken) {
    setAuthActionStatus(`Registered. Verification token: ${verification.devToken}`);
  } else if (verification?.required) {
    setAuthActionStatus('Registered. Check your email for verification token.');
  } else {
    setAuthActionStatus('Registered successfully.');
  }
}

async function loginAuth() {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Login failed');
  state.authUser = data.user || null;
  state.csrfToken = parseCookie('wdf_csrf') || state.csrfToken;
  renderAuthStatus();
  setAuthActionStatus('Login successful.');
}

async function logoutAuth() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  state.authUser = null;
  renderAuthStatus();
  setAuthActionStatus('Logged out.');
}

async function requestPasswordReset() {
  const email = els.authEmail.value.trim();
  if (!email) throw new Error('Enter your email first');
  const res = await apiFetch('/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Password reset request failed');
  if (data?.devToken && els.resetTokenInput) els.resetTokenInput.value = data.devToken;
  const msg = data?.devToken
    ? `Reset token generated: ${data.devToken}`
    : 'If account exists, reset instructions were sent.';
  setAuthActionStatus(msg);
}

async function completePasswordReset() {
  const token = els.resetTokenInput.value.trim();
  const newPassword = els.newPasswordInput.value;
  if (!token) throw new Error('Enter reset token');
  if (!newPassword || newPassword.length < 8) throw new Error('New password must be at least 8 characters');
  const res = await apiFetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Password reset failed');
  if (els.newPasswordInput) els.newPasswordInput.value = '';
  setAuthActionStatus(data?.message || 'Password reset complete.');
}

async function requestEmailVerification() {
  const payload = state.authUser ? {} : { email: els.authEmail.value.trim() };
  const res = await apiFetch('/api/auth/request-email-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Verification request failed');
  if (data?.devToken && els.verifyTokenInput) els.verifyTokenInput.value = data.devToken;
  setAuthActionStatus(
    data?.devToken
      ? `Verification token generated: ${data.devToken}`
      : (data?.message || 'Verification request sent.')
  );
}

async function verifyEmailToken() {
  const token = els.verifyTokenInput.value.trim();
  if (!token) throw new Error('Enter verification token');
  const res = await apiFetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Verification failed');
  if (data?.user) state.authUser = data.user;
  renderAuthStatus();
  setAuthActionStatus('Email verified successfully.');
}

async function saveSearchCloud() {
  if (!state.authUser) return alert('Login required to save cloud searches.');
  const query = currentSearchPayload();
  const name = query.location ? `Search: ${query.location}` : `Search ${new Date().toLocaleString()}`;
  const res = await apiFetch('/api/user/saved-searches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Save search failed');
  els.exportStatus.textContent = 'Saved search to cloud.';
  await refreshCloudLibrary();
}

async function saveDealCloud() {
  if (!state.authUser) return alert('Login required to save cloud deals.');
  if (!state.selectedListing || !state.currentAnalysis) return alert('Select a listing first.');
  const res = await apiFetch('/api/user/saved-deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      listing: state.selectedListing,
      analysis: state.currentAnalysis,
      notes: `Assignment fee ${state.assignmentFee}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Save deal failed');
  els.exportStatus.textContent = 'Saved selected deal to cloud.';
  await refreshCloudLibrary();
}

function circleBoundsForSearch() {
  if (state.mapPolygon) return null;
  if (!state.mapCircle) return null;
  const b = state.mapCircle.getBounds();
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  return { neLat: ne.lat, neLng: ne.lng, swLat: sw.lat, swLng: sw.lng };
}

function polygonParamForSearch() {
  if (!state.mapPolygon) return '';
  const latlngs = state.mapPolygon.getLatLngs?.()[0] || [];
  if (!latlngs.length) return '';
  return latlngs.map((ll) => `${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`).join(';');
}

function updateMapMarkers() {
  if (!state.map || !state.mapMarkers) return;
  state.mapMarkers.clearLayers();
  state.listings.forEach((item) => {
    if (item.lat == null || item.lng == null) return;
    const marker = L.marker([item.lat, item.lng]);
    marker.bindPopup(`<b>${item.address}</b><br/>${formatUSD(item.price)}<br/>${item.beds} bd / ${item.baths} ba`);
    state.mapMarkers.addLayer(marker);
  });
}

function initMap() {
  if (state.map || !els.mapView || typeof L === 'undefined') return;
  state.map = L.map(els.mapView).setView([39.5, -98.35], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(state.map);
  state.mapMarkers = L.layerGroup().addTo(state.map);

  state.map.on('click', (e) => {
    if (state.polygonDrawMode) {
      state.polygonPoints.push([e.latlng.lat, e.latlng.lng]);
      const marker = L.circleMarker([e.latlng.lat, e.latlng.lng], {
        radius: 4,
        color: '#f8b10a',
        fillColor: '#f8b10a',
        fillOpacity: 0.9,
      }).addTo(state.map);
      state.polygonVertexMarkers.push(marker);

      if (state.polygonTempLine) {
        state.polygonTempLine.setLatLngs(state.polygonPoints);
      } else {
        state.polygonTempLine = L.polyline(state.polygonPoints, {
          color: '#f8b10a',
          dashArray: '6,4',
        }).addTo(state.map);
      }

      els.polygonStatus.textContent = `Drawing polygon: ${state.polygonPoints.length} points`;
      return;
    }

    const miles = safeNum(els.mapRadiusMiles.value, 5);
    const meters = miles * 1609.34;
    if (state.mapPolygon) {
      state.map.removeLayer(state.mapPolygon);
      state.mapPolygon = null;
      els.polygonStatus.textContent = 'Polygon cleared (circle mode active)';
    }
    if (state.mapCircle) state.map.removeLayer(state.mapCircle);
    state.mapCircle = L.circle([e.latlng.lat, e.latlng.lng], {
      radius: meters,
      color: '#f8b10a',
      fillColor: '#f8b10a',
      fillOpacity: 0.13,
    }).addTo(state.map);
  });
}

function contactFromListing(listing) {
  const fallback = {
    owner: { name: 'Property Owner', phone: 'N/A', email: 'N/A' },
    agent: { name: 'Listing Agent', phone: 'N/A', email: 'N/A' },
  };
  if (!listing) return fallback;
  return {
    owner: listing?.contacts?.owner || fallback.owner,
    agent: listing?.contacts?.agent || fallback.agent,
  };
}

function renderContactInfo() {
  const listing = state.selectedListing;
  if (!listing) {
    els.contactInfoGrid.innerHTML = '<p class="header-sub">Select a house to view contact details.</p>';
    els.contactActionStatus.textContent = 'Select a house to load contact details.';
    return;
  }

  const contacts = contactFromListing(listing);
  els.contactInfoGrid.innerHTML = [
    ['Property', listing.address],
    ['Owner', contacts.owner.name || 'N/A'],
    ['Owner Phone', contacts.owner.phone || 'N/A'],
    ['Owner Email', contacts.owner.email || 'N/A'],
    ['Agent', contacts.agent.name || 'N/A'],
    ['Agent Phone', contacts.agent.phone || 'N/A'],
    ['Agent Email', contacts.agent.email || 'N/A'],
    ['Contact Source', listing?.contacts?.source || 'Demo / public-info placeholder'],
  ]
    .map(([label, value]) => `<div class="metric"><p>${label}</p><h3>${value}</h3></div>`)
    .join('');
}

function openConfirmModal({ title, subtitle, preview }) {
  els.confirmTitle.textContent = title;
  els.confirmSubtitle.textContent = subtitle;
  els.confirmPreview.textContent = preview;
  els.confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
  els.confirmModal.classList.add('hidden');
  state.pendingContactAction = null;
}

async function startContactAction(channel, target) {
  const listing = state.selectedListing;
  if (!listing) {
    alert('Select a house first.');
    return;
  }

  els.contactActionStatus.textContent = 'Generating AI outreach draft...';
  try {
  const res = await apiFetch('/api/contact-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'preview',
        channel,
        target,
        listing,
        analysis: state.currentAnalysis,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Preview request failed');

    state.pendingContactAction = { channel, target, listing, preview: data };
    const channelLabel = channel === 'voice_call' ? 'AI voice call' : channel.toUpperCase();
    openConfirmModal({
      title: `Send ${channelLabel}?`,
      subtitle: `Do you want to send to ${target}?`,
      preview: data.message || data.script || 'No content generated.',
    });
    els.contactActionStatus.textContent = `Draft ready for ${target}. Confirm to send.`;
  } catch (err) {
    console.error(err);
    els.contactActionStatus.textContent = 'Failed to generate outreach draft.';
  }
}

async function confirmContactSend() {
  const pending = state.pendingContactAction;
  if (!pending) return;

  els.confirmSendBtn.disabled = true;
  els.confirmSendBtn.textContent = 'Sending...';
  try {
  const res = await apiFetch('/api/contact-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'send',
        confirmed: true,
        consentConfirmed: true,
        channel: pending.channel,
        target: pending.target,
        listing: pending.listing,
        analysis: state.currentAnalysis,
        preparedMessage: pending.preview?.message || pending.preview?.script || '',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Send action failed');
    els.contactActionStatus.textContent = `Sent via ${data.delivery || 'simulated'} to ${pending.target}.`;
    closeConfirmModal();
  } catch (err) {
    console.error(err);
    els.contactActionStatus.textContent = err.message || 'Send failed. Check outreach provider settings.';
  } finally {
    els.confirmSendBtn.disabled = false;
    els.confirmSendBtn.textContent = 'Yes, Send';
  }
}

function rehabSignalsFromText(description) {
  const text = (description || '').toLowerCase();
  return {
    heavy: ['fire damage', 'foundation', 'mold', 'full rehab', 'cash only', 'water intrusion'].some((w) => text.includes(w)),
    medium: ['handyman', 'as-is', 'deferred maintenance', 'old hvac', 'roof', 'outdated'].some((w) => text.includes(w)),
    light: ['cosmetic', 'paint', 'flooring', 'move-in ready', 'updated'].some((w) => text.includes(w)),
    motivation: ['relocation', 'inherited', 'priced to sell quickly', 'fast close', 'cash only'].some((w) => text.includes(w)),
  };
}

function estimateRepairs(listing, arv) {
  const signals = rehabSignalsFromText(listing.description);
  const age = Math.max(0, new Date().getFullYear() - safeNum(listing.yearBuilt, 2000));
  const base = safeNum(arv) || safeNum(listing.price) * 1.4;

  let pct = 0.08;
  if (signals.light) pct += 0.03;
  if (signals.medium) pct += 0.07;
  if (signals.heavy) pct += 0.14;
  if (age > 55) pct += 0.06;
  if (safeNum(listing.photoCount) < 14) pct += 0.03;

  pct = Math.min(0.42, Math.max(0.06, pct));
  const cost = base * pct;

  let level = 'Light';
  if (pct >= 0.26) level = 'Heavy';
  else if (pct >= 0.16) level = 'Medium';

  return { cost, level, pct, signals };
}

function motivatedSellerScore(listing) {
  const signals = rehabSignalsFromText(listing.description);
  let score = 0;

  if (safeNum(listing.daysOnZillow) > 45) score += 22;
  if (safeNum(listing.daysOnZillow) > 90) score += 12;
  if (signals.motivation) score += 24;
  if (signals.medium || signals.heavy) score += 18;
  if (safeNum(listing.photoCount) < 15) score += 8;
  if (safeNum(listing.price) < 160000) score += 10;

  score = Math.min(100, score);
  const type = score >= 55 ? 'Need-to-sell (motivated)' : 'Want-to-sell (retail leaning)';

  return { score, type };
}

function analyzeDeal(listing, arv, assignmentFee) {
  const safeArv = safeNum(arv, safeNum(listing.price) * 1.35);
  const repairs = estimateRepairs(listing, safeArv);
  const closingCosts = safeArv * 0.03;
  const holdingCosts = safeArv * 0.01 * 6;

  const maoBuyer = safeArv * 0.7 - repairs.cost - closingCosts - holdingCosts;
  const contractValue = maoBuyer - assignmentFee;
  const offerLow = contractValue - 7000;
  const offerHigh = contractValue;

  const totalCostForBuyer = safeNum(listing.price) + repairs.cost + closingCosts + holdingCosts;
  const grossProfitIfFlip = safeArv - totalCostForBuyer;
  const annualizedReturnProxy = totalCostForBuyer > 0 ? (grossProfitIfFlip / totalCostForBuyer) * 2 * 100 : 0;

  const motivation = motivatedSellerScore(listing);
  const scoreBase = 50 + motivation.score * 0.35 + (maoBuyer > listing.price ? 15 : -15);
  const spreadBoost = Math.min(30, Math.max(0, (maoBuyer - listing.price) / 2500));
  const dealScore = Math.max(1, Math.min(100, Math.round(scoreBase + spreadBoost)));

  const buyerThought =
    repairs.level === 'Heavy'
      ? 'Flippers will demand a larger discount and bigger spread because scope risk is high.'
      : repairs.level === 'Medium'
      ? 'Most buyers will engage if spread is strong and title/major systems check out.'
      : 'Broad buyer pool. Move fast and focus on speed + certainty narrative.';

  const verdict = dealScore >= 70 ? 'Pursue aggressively' : dealScore >= 50 ? 'Pursue with caution' : 'Skip unless price drops';

  return {
    safeArv,
    repairs,
    closingCosts,
    holdingCosts,
    maoBuyer,
    contractValue,
    offerLow,
    offerHigh,
    grossProfitIfFlip,
    annualizedReturnProxy,
    motivation,
    buyerThought,
    verdict,
    dealScore,
  };
}

function evaluateFlipSignal(listing, analysis) {
  const apr = Number(analysis.annualizedReturnProxy) || 0;
  const spread = (Number(analysis.maoBuyer) || 0) - (Number(listing.price) || 0);
  const contractValue = Number(analysis.contractValue) || 0;
  const score = Number(analysis.dealScore) || 0;

  if (score >= 70 && apr >= 18 && spread >= 15000 && contractValue > 0) {
    return {
      status: 'approved',
      icon: '✓',
      title: 'Flip Approved',
      reason: `Strong setup: score ${score}/100, APR proxy ${apr.toFixed(1)}%, spread ${formatUSD(spread)}.`,
    };
  }

  if (score >= 55 && apr >= 10 && spread >= 5000 && contractValue > 0) {
    return {
      status: 'review',
      icon: '!',
      title: 'Review Deal',
      reason: `Decent but tighter margins: score ${score}/100, APR proxy ${apr.toFixed(1)}%, spread ${formatUSD(spread)}.`,
    };
  }

  return {
    status: 'reject',
    icon: 'x',
    title: 'Skip / Re-negotiate',
    reason: `Weak setup currently: score ${score}/100, APR proxy ${apr.toFixed(1)}%, spread ${formatUSD(spread)}.`,
  };
}

function savePipelineLocal() {
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(state.pipeline));
}

function loadPipelineLocal() {
  try {
    state.pipeline = JSON.parse(localStorage.getItem(PIPELINE_KEY) || '[]');
  } catch {
    state.pipeline = [];
  }
}

function renderToolSection(target, items) {
  target.innerHTML = items
    .map(
      (tool) => `
      <article class="tool-card">
        <h4>${tool.title}</h4>
        <p>${tool.desc}</p>
        <div class="tags">${tool.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
        <button data-tool="${tool.title}">Generate</button>
      </article>
    `
    )
    .join('');

  target.querySelectorAll('button[data-tool]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const selected = state.selectedListing;
      if (!selected) {
        alert('Select a property first so this tool can use live deal data.');
        return;
      }

      const promptData = {
        tool: btn.dataset.tool,
        listing: selected,
        analysis: state.currentAnalysis,
      };

      els.toolOutput.textContent = 'Generating...';

      try {
  const res = await apiFetch('/api/tool-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Tool generation failed');
        els.toolOutput.textContent = `[${data.source}] ${btn.dataset.tool}\n\n${data.output || ''}`;
      } catch (err) {
        console.error(err);
        els.toolOutput.textContent = err.message || 'Generation failed.';
      }
    });
  });
}

async function refreshAutoArvFromPhotos() {
  const listing = state.selectedListing;
  if (!listing) {
    els.arvAutoStatus.textContent = 'Select a property to calculate ARV from photos.';
    state.arvMeta = null;
    els.arvRangeGrid.innerHTML = '';
    return;
  }

  els.arvAutoStatus.textContent = 'Calculating ARV from photos...';
  try {
  const res = await apiFetch('/api/arv-from-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'ARV photo estimate request failed');

    state.arv = Math.max(0, safeNum(data.estimatedArv, Math.round((listing.price || 0) * 1.25)));
    state.arvMeta = data;
    const confidencePct = Math.round((Number(data.confidence) || 0) * 100);
    els.arvAutoStatus.textContent = `Auto ARV source: ${data.source || 'unknown'} | Confidence: ${confidencePct}% | ${data.rationale || ''}`;
    els.arvRangeGrid.innerHTML = [
      ['Conservative ARV', formatUSD(data.conservativeArv || state.arv)],
      ['Estimated ARV', formatUSD(data.estimatedArv || state.arv)],
      ['Aggressive ARV', formatUSD(data.aggressiveArv || state.arv)],
      ['Photos Used', String(data.photoCount || 0)],
    ]
      .map(([label, value]) => `<div class="metric"><p>${label}</p><h3>${value}</h3></div>`)
      .join('');
  } catch (err) {
    console.error(err);
    state.arv = Math.round((listing.price || 0) * 1.25);
    state.arvMeta = {
      conservativeArv: Math.round((listing.price || 0) * 1.18),
      estimatedArv: state.arv,
      aggressiveArv: Math.round((listing.price || 0) * 1.33),
      source: 'fallback',
      confidence: 0.45,
      rationale: 'Fallback from listing price.',
      photoCount: 0,
    };
    els.arvAutoStatus.textContent = `Auto ARV fallback used. ${err.message || ''}`.trim();
    els.arvRangeGrid.innerHTML = [
      ['Conservative ARV', formatUSD(state.arvMeta.conservativeArv)],
      ['Estimated ARV', formatUSD(state.arvMeta.estimatedArv)],
      ['Aggressive ARV', formatUSD(state.arvMeta.aggressiveArv)],
      ['Photos Used', '0'],
    ]
      .map(([label, value]) => `<div class="metric"><p>${label}</p><h3>${value}</h3></div>`)
      .join('');
  }
}

function renderFeeButtons() {
  els.feeButtons.innerHTML = feePresets
    .map((fee) => `<button data-fee="${fee}" class="${state.assignmentFee === fee ? 'active' : ''}">${formatUSD(fee)}</button>`)
    .join('');

  els.feeButtons.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.assignmentFee = safeNum(btn.dataset.fee, 5000);
      els.assignmentFee.value = String(state.assignmentFee);
      renderFeeButtons();
      renderAnalysis();
      renderCompare();
    });
  });
}

function renderListings() {
  const selectedId = state.selectedListing?.id;

  if (!state.listings.length) {
    if (state.searchSource === 'live-unavailable') {
      els.results.innerHTML = '<p class="header-sub">No live listings returned. Enable "Allow Sample Fallback" above to display backup demo listings.</p>';
      return;
    }
    els.results.innerHTML = '<p class="header-sub">No properties found. Try broader filters or browse all sample homes.</p><button class="ghost-btn" id="browseAllBtn">Browse All Homes</button>';
    const browseBtn = document.getElementById('browseAllBtn');
    if (browseBtn) {
      browseBtn.addEventListener('click', async () => {
        els.location.value = '';
        await runSearch();
      });
    }
    return;
  }

  els.results.innerHTML = state.listings
    .map((item) => {
      const isActive = selectedId === item.id;
      const signal = isActive ? state.flipSignal : null;
      const image = item.photos?.[0] || '';
      const selectedLabel = !isActive
        ? 'Analyze Deal'
        : signal?.status === 'approved'
        ? 'Selected ✓'
        : signal?.status === 'review'
        ? 'Selected !'
        : signal?.status === 'reject'
        ? 'Selected x'
        : 'Selected';
      const verifiedBadge = item.verifiedMarket
        ? '<span class="listing-badge listing-badge-good">Verified Market Listing</span>'
        : '<span class="listing-badge listing-badge-warn">Unverified / Sample</span>';
      const verifiedTime = item.lastVerifiedAt
        ? `Verified ${new Date(item.lastVerifiedAt).toLocaleString()}`
        : 'Verification time unavailable';
      const firstPhotoSource = image ? photoSourceLabel(image) : 'Unknown';

      return `
      <article class="listing-card">
        <button class="listing-photo-btn" data-open-gallery="${item.id}" aria-label="Open photo gallery for ${item.address}">
          ${
            image
              ? `<img src="${image}" alt="${item.address}" loading="lazy" /><span>View Photos</span>`
              : `<div class="no-photo">No verified photo</div><span>No Photos</span>`
          }
        </button>
        <div class="listing-meta">
          <div class="listing-badges-row">${verifiedBadge}</div>
          <h4>${item.address}</h4>
          <div class="price">${formatUSD(item.price)}</div>
          <div class="small">${item.beds || 0} bd • ${item.baths || 0} ba • ${safeNum(item.sqft, 0).toLocaleString()} sqft • Built ${item.yearBuilt || 'N/A'}</div>
          <div class="small">${item.daysOnZillow || 0} days on market • ${item.photoCount || 0} photos • ${verifiedTime}</div>
          <div class="small">Photo Source: ${firstPhotoSource}</div>
          <div class="actions">
            <button class="mini-btn ${isActive ? 'active' : ''}" data-select-id="${item.id}">${selectedLabel}</button>
            <a class="mini-btn" href="${item.url}" target="_blank" rel="noopener">View Source</a>
          </div>
        </div>
      </article>
      `;
    })
    .join('');

  els.results.querySelectorAll('button[data-select-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const listing = state.listings.find((x) => x.id === btn.dataset.selectId);
      if (!listing) return;

      state.selectedListing = listing;
      await refreshAutoArvFromPhotos();
      renderListings();
      renderAnalysis();
      renderPhotoOptions();
      renderCompare();
      renderContactInfo();
    });
  });

  els.results.querySelectorAll('button[data-open-gallery]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const listing = state.listings.find((x) => x.id === btn.dataset.openGallery);
      if (!listing) return;
      state.selectedListing = listing;
      await openGalleryForListing(listing, 0);
      await refreshAutoArvFromPhotos();
      renderAnalysis();
      renderPhotoOptions();
      renderCompare();
      renderContactInfo();
      renderListings();
    });
  });
}

function renderSourceHealthBadges(sourceHealth = []) {
  if (!els.sourceHealthBadges) return;
  if (!Array.isArray(sourceHealth) || !sourceHealth.length) {
    els.sourceHealthBadges.innerHTML = '';
    return;
  }
  els.sourceHealthBadges.innerHTML = sourceHealth
    .map((row) => {
      const cls = row.ok ? 'health-ok' : 'health-bad';
      const label = row.ok
        ? `${row.provider}: live (${row.rows || 0})`
        : `${row.provider}: failed`;
      const title = row.ok ? 'Provider healthy' : String(row.error || 'Provider unavailable');
      return `<span class="health-pill ${cls}" title="${title.replace(/"/g, '&quot;')}">${label}</span>`;
    })
    .join('');
}

function renderGallery() {
  const listing = state.listings.find((x) => x.id === state.galleryListingId) || state.selectedListing;
  const photos = listingPhotos(listing);
  if (!listing || !photos.length) {
    els.galleryStatus.textContent = 'No photos available for this listing.';
    closeGallery();
    return;
  }

  if (state.galleryIndex < 0) state.galleryIndex = photos.length - 1;
  if (state.galleryIndex >= photos.length) state.galleryIndex = 0;

  const activeUrl = photos[state.galleryIndex];
  const source = photoSourceLabel(activeUrl);
  els.galleryImage.src = activeUrl;
  els.galleryImage.alt = `${listing.address} photo ${state.galleryIndex + 1}`;
  els.galleryTitle.textContent = listing.address;
  els.galleryCounter.textContent = `${state.galleryIndex + 1} / ${photos.length}`;
  els.galleryPhotoSource.textContent = `Photo Source: ${source}`;

  els.galleryThumbs.innerHTML = photos
    .map((url, i) => {
      const active = i === state.galleryIndex ? 'active' : '';
      return `<button class="gallery-thumb ${active}" data-gallery-index="${i}" aria-label="Open photo ${i + 1}"><img src="${url}" alt="Thumbnail ${i + 1}" loading="lazy" /></button>`;
    })
    .join('');

  els.galleryThumbs.querySelectorAll('button[data-gallery-index]').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      state.galleryIndex = safeNum(thumb.dataset.galleryIndex, 0);
      renderGallery();
    });
  });
}

async function ensureListingPhotos(listing) {
  const current = listingPhotos(listing);
  if (current.length >= 10) return { photos: current, source: 'already-loaded' };

  try {
  const res = await apiFetch('/api/listing-photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing }),
    });
    if (!res.ok) throw new Error('Photo fetch failed');
    const data = await res.json();
    const photos = Array.isArray(data.photos) ? data.photos.filter(Boolean) : [];
    if (photos.length) {
      patchListingPhotos(listing.id, photos);
      return { photos, source: data.source || 'listing-photos-api' };
    }
  } catch (err) {
    console.error(err);
  }
  return { photos: current, source: 'fallback' };
}

async function openGalleryForListing(listing, startIndex = 0) {
  const photos = listingPhotos(listing);
  if (!photos.length) {
    els.galleryStatus.textContent = 'No verified listing photos yet. Trying to load from source...';
  }
  state.galleryOpen = true;
  state.galleryListingId = listing.id;
  state.galleryIndex = Math.max(0, Math.min(startIndex, photos.length - 1));
  els.galleryModal.classList.remove('hidden');
  els.galleryStatus.textContent = 'Loading property photos from source...';
  const hydrated = await ensureListingPhotos(listing);
  const loaded = hydrated.photos.length;
  if (!loaded) {
    els.galleryStatus.textContent = 'No verified property photos were found for this listing.';
    return;
  }
  state.galleryIndex = Math.max(0, Math.min(startIndex, loaded - 1));
  els.galleryStatus.textContent = `Showing ${loaded} photos (${hydrated.source}).`;
  renderGallery();
}

function closeGallery() {
  state.galleryOpen = false;
  els.galleryModal.classList.add('hidden');
}

function stepGallery(delta) {
  if (!state.galleryOpen) return;
  state.galleryIndex += delta;
  renderGallery();
}

function renderKpis() {
  const metrics = state.listings.map((l) => analyzeDeal(l, l.price * 1.3, state.assignmentFee));
  const total = metrics.length;
  const avgMao = total ? metrics.reduce((sum, m) => sum + m.maoBuyer, 0) / total : 0;
  const avgScore = total ? metrics.reduce((sum, m) => sum + m.dealScore, 0) / total : 0;

  els.kpiResults.textContent = String(total);
  els.kpiMao.textContent = formatUSD(avgMao);
  els.kpiScore.textContent = `${Math.round(avgScore)}/100`;
}

function renderAnalysis() {
  els.arvDisplay.textContent = formatUSD(state.arv);
  els.confirmedFee.textContent = `Confirmed: ${formatUSD(state.assignmentFee)}`;

  const listing = state.selectedListing;
  if (!listing) {
    els.flipSignal.innerHTML = '';
    els.calcGrid.innerHTML = '<p class="header-sub">Select a listing to calculate MAO, contract value, and offer range.</p>';
    els.diagnosis.innerHTML = '';
    state.currentAnalysis = null;
    state.flipSignal = null;
    return;
  }

  const analysis = analyzeDeal(listing, state.arv, state.assignmentFee);
  const signal = evaluateFlipSignal(listing, analysis);
  state.flipSignal = signal;
  state.currentAnalysis = analysis;

  els.flipSignal.innerHTML = `
    <div class="flip-signal ${signal.status}">
      <div class="flip-icon">${signal.icon}</div>
      <div>
        <h4>${signal.title}</h4>
        <p>${signal.reason}</p>
      </div>
    </div>
  `;

  els.calcGrid.innerHTML = [
    ['Selected Property', listing.address],
    ['Asking Price', formatUSD(listing.price)],
    ['House Specs', `${listing.beds || 0} bd • ${listing.baths || 0} ba • ${(listing.sqft || 0).toLocaleString()} sqft`],
    ['Days On Market', `${listing.daysOnZillow || 0} days`],
    ['Estimated ARV', formatUSD(analysis.safeArv)],
    ['Estimated Repairs', formatUSD(analysis.repairs.cost)],
    ['MAO (Buyer Max)', formatUSD(analysis.maoBuyer)],
    ['Contract Value (MAO - Fee)', formatUSD(analysis.contractValue)],
    ['Offer Range to Seller', `${formatUSD(analysis.offerLow)} - ${formatUSD(analysis.offerHigh)}`],
    ['Assignment Fee', formatUSD(state.assignmentFee)],
    ['Flip Profit (rough)', formatUSD(analysis.grossProfitIfFlip)],
    ['APR Proxy (Annualized)', `${analysis.annualizedReturnProxy.toFixed(1)}%`],
  ]
    .map(
      ([label, value]) => `
      <div class="metric">
        <p>${label}</p>
        <h3>${value}</h3>
      </div>
    `
    )
    .join('');

  els.diagnosis.innerHTML = [
    ['Repairs Needed', `${analysis.repairs.level} rehab likely (${(analysis.repairs.pct * 100).toFixed(0)}% of ARV).`],
    ['Rehab Level', analysis.repairs.level],
    ['What Buyers Will Think', analysis.buyerThought],
    ['Deal Verdict', `${analysis.verdict} (${analysis.dealScore}/100)`],
    ['Seller Type', `${analysis.motivation.type} (${analysis.motivation.score}/100)`],
    ['Rick/Zach Style Take', analysis.dealScore >= 65 ? 'Spread exists. Verify title, comps, and dispo buyers.' : 'Numbers are thin. Push discount hard or move on.'],
  ]
    .map(
      ([label, value]) => `
      <div class="metric">
        <p>${label}</p>
        <h4>${value}</h4>
      </div>
    `
    )
    .join('');

  renderListings();
}

function renderPhotoOptions() {
  const listing = state.selectedListing;
  if (!listing) {
    els.photoSelect.innerHTML = '';
    els.photoGradeStatus.textContent = 'Select a property and photo to run analysis.';
    els.photoGradeGrid.innerHTML = '';
    return;
  }

  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  if (!photos.length) {
    els.photoSelect.innerHTML = '';
    els.photoGradeStatus.textContent = 'No photos available for this listing.';
    els.photoGradeGrid.innerHTML = '';
    return;
  }

  els.photoSelect.innerHTML = photos.map((url, i) => `<option value="${url}">Photo ${i + 1}</option>`).join('');
  els.photoGradeStatus.textContent = 'Ready to analyze photo condition.';
}

function renderPhotoGradeResult(data) {
  const range = `${formatUSD(data.repairsEstimateLow || 0)} - ${formatUSD(data.repairsEstimateHigh || 0)}`;

  els.photoGradeGrid.innerHTML = [
    ['Rehab Level', data.rehabLevel || 'Unknown'],
    ['Repairs Range', range],
    ['Buyer Reaction', data.buyerReaction || 'N/A'],
    ['Deal Quality', data.dealQuality || 'N/A'],
    ['Motivation Signal', data.motivationSignal || 'N/A'],
    ['Confidence', `${Math.round((Number(data.confidence) || 0) * 100)}%`],
  ]
    .map(
      ([label, value]) => `
        <div class="metric">
          <p>${label}</p>
          <h3>${value}</h3>
        </div>
      `
    )
    .join('');
}

async function runPhotoGrade() {
  const listing = state.selectedListing;
  if (!listing) return alert('Select a property first.');

  const imageUrl = els.photoSelect.value;
  if (!imageUrl) return alert('Select a photo first.');

  els.gradePhotoBtn.disabled = true;
  els.gradePhotoBtn.textContent = 'Analyzing...';
  els.photoGradeStatus.textContent = 'Running AI photo analysis...';

  try {
  const res = await apiFetch('/api/photo-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing, imageUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Photo grade request failed');
    els.photoGradeStatus.textContent = `Photo analysis source: ${data.source || 'unknown'}`;
    renderPhotoGradeResult(data);
  } catch (err) {
    console.error(err);
    els.photoGradeStatus.textContent = err.message || 'Photo analysis failed.';
  } finally {
    els.gradePhotoBtn.disabled = false;
    els.gradePhotoBtn.textContent = 'Run AI Photo Grade';
  }
}

async function runBatchPhotoGrade() {
  const listing = state.selectedListing;
  if (!listing) return alert('Select a property first.');

  els.gradeAllPhotosBtn.disabled = true;
  els.gradeAllPhotosBtn.textContent = 'Analyzing All...';
  els.photoGradeStatus.textContent = 'Running batch AI photo analysis...';

  try {
  const res = await apiFetch('/api/photo-grade-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Batch photo grade request failed');
    els.photoGradeStatus.textContent = `Batch analysis source: ${data.source || 'unknown'} (${data.photoCount || 0} photos)`;
    renderPhotoGradeResult(data);
  } catch (err) {
    console.error(err);
    els.photoGradeStatus.textContent = err.message || 'Batch photo analysis failed.';
  } finally {
    els.gradeAllPhotosBtn.disabled = false;
    els.gradeAllPhotosBtn.textContent = 'Run Batch Photo Grade';
  }
}

function saveSelectedToPipeline() {
  if (!state.selectedListing || !state.currentAnalysis) {
    alert('Select and analyze a listing first.');
    return;
  }

  const existing = state.pipeline.find((p) => p.id === state.selectedListing.id);
  const item = {
    id: state.selectedListing.id,
    address: state.selectedListing.address,
    stage: existing?.stage || 'lead',
    score: state.currentAnalysis.dealScore,
    mao: state.currentAnalysis.maoBuyer,
    contractValue: state.currentAnalysis.contractValue,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, item);
  } else {
    state.pipeline.push(item);
  }

  savePipelineLocal();
  renderPipeline();
  renderCompare();
  els.exportStatus.textContent = 'Saved to pipeline.';
}

function movePipelineStage(id, stage) {
  const item = state.pipeline.find((x) => x.id === id);
  if (!item) return;
  item.stage = stage;
  item.updatedAt = new Date().toISOString();
  savePipelineLocal();
  renderPipeline();
  renderCompare();
}

function renderPipeline() {
  if (!state.pipeline.length) {
    els.pipelineBoard.innerHTML = '<p class="header-sub">No deals saved yet.</p>';
    return;
  }

  const stages = ['lead', 'underwrite', 'offer', 'contracted', 'dispo'];

  els.pipelineBoard.innerHTML = state.pipeline
    .sort((a, b) => b.score - a.score)
    .map((p) => {
      const select = `<select data-pipe-stage="${p.id}">${stages
        .map((s) => `<option value="${s}" ${p.stage === s ? 'selected' : ''}>${s}</option>`)
        .join('')}</select>`;

      return `
      <div class="metric">
        <p>${p.address}</p>
        <h3>${p.score}/100</h3>
        <p>MAO ${formatUSD(p.mao)}</p>
        <p>Contract ${formatUSD(p.contractValue)}</p>
        ${select}
      </div>
      `;
    })
    .join('');

  els.pipelineBoard.querySelectorAll('select[data-pipe-stage]').forEach((sel) => {
    sel.addEventListener('change', () => movePipelineStage(sel.dataset.pipeStage, sel.value));
  });
}

function renderCompare() {
  if (!state.selectedListing || !state.currentAnalysis) {
    els.compareGrid.innerHTML = '<p class="header-sub">Select a listing to compare deals.</p>';
    return;
  }

  const topPipeline = [...state.pipeline].sort((a, b) => b.score - a.score)[0];
  const current = state.currentAnalysis;

  if (!topPipeline) {
    els.compareGrid.innerHTML = [
      ['Selected Deal Score', `${current.dealScore}/100`],
      ['Selected MAO', formatUSD(current.maoBuyer)],
      ['Selected Contract Value', formatUSD(current.contractValue)],
    ]
      .map(
        ([k, v]) => `<div class="metric"><p>${k}</p><h3>${v}</h3></div>`
      )
      .join('');
    return;
  }

  const scoreDiff = current.dealScore - topPipeline.score;
  const maoDiff = current.maoBuyer - topPipeline.mao;

  els.compareGrid.innerHTML = [
    ['Selected Score', `${current.dealScore}/100`],
    ['Top Pipeline Score', `${topPipeline.score}/100`],
    ['Score Delta', `${scoreDiff >= 0 ? '+' : ''}${scoreDiff}`],
    ['Selected MAO', formatUSD(current.maoBuyer)],
    ['Top Pipeline MAO', formatUSD(topPipeline.mao)],
    ['MAO Delta', `${maoDiff >= 0 ? '+' : ''}${formatUSD(maoDiff)}`],
  ]
    .map(([k, v]) => `<div class="metric"><p>${k}</p><h3>${v}</h3></div>`)
    .join('');
}

function exportSelectedDealJson() {
  if (!state.selectedListing || !state.currentAnalysis) return;
  const payload = {
    listing: state.selectedListing,
    analysis: state.currentAnalysis,
    assignmentFee: state.assignmentFee,
    exportedAt: new Date().toISOString(),
  };

  downloadBlob(`deal-${state.selectedListing.id}.json`, JSON.stringify(payload, null, 2), 'application/json');
  els.exportStatus.textContent = 'Exported JSON.';
}

function exportSelectedDealCsv() {
  if (!state.selectedListing || !state.currentAnalysis) return;

  const rows = [
    ['id', state.selectedListing.id],
    ['address', state.selectedListing.address],
    ['price', state.selectedListing.price],
    ['arv', Math.round(state.currentAnalysis.safeArv)],
    ['repairs', Math.round(state.currentAnalysis.repairs.cost)],
    ['mao', Math.round(state.currentAnalysis.maoBuyer)],
    ['contractValue', Math.round(state.currentAnalysis.contractValue)],
    ['assignmentFee', state.assignmentFee],
    ['dealScore', state.currentAnalysis.dealScore],
    ['sellerType', state.currentAnalysis.motivation.type],
    ['verdict', state.currentAnalysis.verdict],
  ];

  const csv = rows.map(([k, v]) => `${k},"${String(v).replace(/"/g, '""')}"`).join('\n');
  downloadBlob(`deal-${state.selectedListing.id}.csv`, csv, 'text/csv;charset=utf-8');
  els.exportStatus.textContent = 'Exported CSV.';
}

function queryFromForm() {
  const p = new URLSearchParams();
  const entries = {
    location: els.location.value.trim(),
    minPrice: els.minPrice.value.trim(),
    maxPrice: els.maxPrice.value.trim(),
    beds: els.beds.value.trim(),
    baths: els.baths.value.trim(),
    page: String(state.searchPage),
    pageSize: String(state.pageSize),
    allowSampleFallback: els.allowSampleFallback.checked ? '1' : '',
    onlyZillowPhotos: els.onlyZillowPhotos.checked ? '1' : '',
  };

  Object.entries(entries).forEach(([k, v]) => {
    if (v !== '') p.set(k, v);
  });

  const bounds = circleBoundsForSearch();
  const polygon = polygonParamForSearch();
  if (bounds) {
    p.set('neLat', String(bounds.neLat));
    p.set('neLng', String(bounds.neLng));
    p.set('swLat', String(bounds.swLat));
    p.set('swLng', String(bounds.swLng));
  }
  if (polygon) p.set('polygon', polygon);

  return p.toString();
}

async function runSearch(options = {}) {
  const append = !!options.append;
  if (!append) state.searchPage = 1;
  const qs = queryFromForm();
  const res = await apiFetch(`/api/search?${qs}`);
  if (!res.ok) throw new Error('Search request failed');

  const data = await res.json();
  const incoming = data.results || [];
  state.listings = append ? state.listings.concat(incoming) : incoming;
  state.hasMore = !!data.hasMore;
  state.totalMatches = Number(data.total) || state.listings.length;
  els.loadMoreBtn.style.display = state.hasMore ? 'inline-block' : 'none';
  els.resultsStatus.textContent = `Showing ${state.listings.length} of ${state.totalMatches} homes`;
  const notes = Array.isArray(data.notes) ? data.notes : [];
  const source = data.source || 'unknown';
  state.searchSource = source;
  const noteText = [notes[0], notes[1]].filter(Boolean).join(' | ');
  els.dataStatus.textContent = `Data source: ${source}${noteText ? ` | ${noteText}` : ''}`;
  renderSourceHealthBadges(data.sourceHealth || []);
  refreshSourceHealthHistory().catch(() => {});

  state.selectedListing = state.selectedListing && append
    ? state.selectedListing
    : state.listings[0] || null;
  if (state.selectedListing) {
    await refreshAutoArvFromPhotos();
  }

  renderListings();
  renderKpis();
  renderAnalysis();
  renderPhotoOptions();
  renderCompare();
  renderContactInfo();
  updateMapMarkers();
}

function mountTools() {
  renderToolSection(els.aiTools, toolCatalog.ai);
  renderToolSection(els.valueTools, toolCatalog.value);
  renderToolSection(els.costTools, toolCatalog.cost);
  renderToolSection(els.pipelineTools, toolCatalog.pipeline);
}

function setupEvents() {
  els.searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = els.searchForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Searching...';

    try {
      await runSearch();
    } catch (err) {
      console.error(err);
      alert('Search failed. Check server logs and try again.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Search';
    }
  });

  els.loadMoreBtn.addEventListener('click', async () => {
    if (!state.hasMore) return;
    els.loadMoreBtn.disabled = true;
    els.loadMoreBtn.textContent = 'Loading...';
    try {
      state.searchPage += 1;
      await runSearch({ append: true });
    } catch (err) {
      console.error(err);
      state.searchPage = Math.max(1, state.searchPage - 1);
    } finally {
      els.loadMoreBtn.disabled = false;
      els.loadMoreBtn.textContent = 'Load More Houses';
    }
  });

  els.mapRadiusMiles.addEventListener('input', () => {
    const miles = safeNum(els.mapRadiusMiles.value, 5);
    els.mapRadiusLabel.textContent = `${miles} mi`;
    if (state.mapCircle) {
      state.mapCircle.setRadius(miles * 1609.34);
    }
  });

  els.clearMapFilterBtn.addEventListener('click', () => {
    if (state.map && state.mapCircle) {
      state.map.removeLayer(state.mapCircle);
      state.mapCircle = null;
    }
  });

  els.startPolygonBtn.addEventListener('click', () => {
    state.polygonDrawMode = true;
    state.polygonPoints = [];
    if (state.mapPolygon) {
      state.map.removeLayer(state.mapPolygon);
      state.mapPolygon = null;
    }
    if (state.mapCircle) {
      state.map.removeLayer(state.mapCircle);
      state.mapCircle = null;
    }
    if (state.polygonTempLine) {
      state.map.removeLayer(state.polygonTempLine);
      state.polygonTempLine = null;
    }
    state.polygonVertexMarkers.forEach((m) => state.map.removeLayer(m));
    state.polygonVertexMarkers = [];
    els.polygonStatus.textContent = 'Polygon draw ON: click map to add points';
  });

  els.finishPolygonBtn.addEventListener('click', () => {
    if (!state.polygonDrawMode || state.polygonPoints.length < 3) {
      els.polygonStatus.textContent = 'Need at least 3 points to finish polygon';
      return;
    }
    state.polygonDrawMode = false;
    if (state.polygonTempLine) {
      state.map.removeLayer(state.polygonTempLine);
      state.polygonTempLine = null;
    }
    state.mapPolygon = L.polygon(state.polygonPoints, {
      color: '#f8b10a',
      fillColor: '#f8b10a',
      fillOpacity: 0.16,
    }).addTo(state.map);
    state.polygonVertexMarkers.forEach((m) => state.map.removeLayer(m));
    state.polygonVertexMarkers = [];
    els.polygonStatus.textContent = `Polygon ready (${state.polygonPoints.length} points). Run search.`;
  });

  els.clearPolygonBtn.addEventListener('click', () => {
    state.polygonDrawMode = false;
    state.polygonPoints = [];
    if (state.mapPolygon) {
      state.map.removeLayer(state.mapPolygon);
      state.mapPolygon = null;
    }
    if (state.polygonTempLine) {
      state.map.removeLayer(state.polygonTempLine);
      state.polygonTempLine = null;
    }
    state.polygonVertexMarkers.forEach((m) => state.map.removeLayer(m));
    state.polygonVertexMarkers = [];
    els.polygonStatus.textContent = 'Polygon draw off';
  });

  els.assignmentFee.addEventListener('input', () => {
    state.assignmentFee = Math.max(0, safeNum(els.assignmentFee.value, 0));
    renderFeeButtons();
    renderAnalysis();
    renderCompare();
  });

  els.gradePhotoBtn.addEventListener('click', runPhotoGrade);
  els.gradeAllPhotosBtn.addEventListener('click', runBatchPhotoGrade);
  els.savePipelineBtn.addEventListener('click', saveSelectedToPipeline);
  els.exportJsonBtn.addEventListener('click', exportSelectedDealJson);
  els.exportCsvBtn.addEventListener('click', exportSelectedDealCsv);
  els.msgOwnerBtn.addEventListener('click', () => startContactAction('sms', 'owner'));
  els.msgAgentBtn.addEventListener('click', () => startContactAction('sms', 'agent'));
  els.emailOwnerBtn.addEventListener('click', () => startContactAction('email', 'owner'));
  els.emailAgentBtn.addEventListener('click', () => startContactAction('email', 'agent'));
  els.callOwnerBtn.addEventListener('click', () => startContactAction('voice_call', 'owner'));
  els.callAgentBtn.addEventListener('click', () => startContactAction('voice_call', 'agent'));
  els.cancelSendBtn.addEventListener('click', closeConfirmModal);
  els.confirmSendBtn.addEventListener('click', confirmContactSend);
  els.registerBtn.addEventListener('click', async () => {
    try {
      await registerAuth();
      await refreshAuth();
      els.authPassword.value = '';
    } catch (err) {
      alert(err.message || 'Register failed');
    }
  });
  els.loginBtn.addEventListener('click', async () => {
    try {
      await loginAuth();
      await refreshAuth();
      els.authPassword.value = '';
    } catch (err) {
      alert(err.message || 'Login failed');
    }
  });
  els.logoutBtn.addEventListener('click', async () => {
    await logoutAuth();
    await refreshAuth();
  });
  els.requestResetBtn.addEventListener('click', async () => {
    try {
      await requestPasswordReset();
    } catch (err) {
      alert(err.message || 'Password reset request failed');
    }
  });
  els.resetPasswordBtn.addEventListener('click', async () => {
    try {
      await completePasswordReset();
    } catch (err) {
      alert(err.message || 'Password reset failed');
    }
  });
  els.requestVerifyBtn.addEventListener('click', async () => {
    try {
      await requestEmailVerification();
    } catch (err) {
      alert(err.message || 'Verification request failed');
    }
  });
  els.verifyEmailBtn.addEventListener('click', async () => {
    try {
      await verifyEmailToken();
      await refreshAuth();
    } catch (err) {
      alert(err.message || 'Email verification failed');
    }
  });
  els.saveSearchCloudBtn.addEventListener('click', async () => {
    try {
      await saveSearchCloud();
    } catch (err) {
      alert(err.message || 'Cloud search save failed');
    }
  });
  els.saveDealCloudBtn.addEventListener('click', async () => {
    try {
      await saveDealCloud();
    } catch (err) {
      alert(err.message || 'Cloud deal save failed');
    }
  });
  els.refreshCloudBtn.addEventListener('click', async () => {
    await refreshCloudLibrary();
    await refreshConsentLogs();
    await refreshSourceHealthHistory();
  });
  els.startTrialCheckoutBtn.addEventListener('click', async () => {
    try {
      if (!state.authUser) throw new Error('Login required');
      const res = await apiFetch('/api/billing/create-checkout-session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not start checkout');
      if (!data?.url) throw new Error('Checkout URL missing');
      window.location.href = data.url;
    } catch (err) {
      setBillingActionStatus(err.message || 'Checkout failed');
    }
  });
  els.openBillingPortalBtn.addEventListener('click', async () => {
    try {
      if (!state.authUser) throw new Error('Login required');
      const res = await apiFetch('/api/billing/create-portal-session', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not open billing portal');
      if (!data?.url) throw new Error('Portal URL missing');
      window.location.href = data.url;
    } catch (err) {
      setBillingActionStatus(err.message || 'Portal failed');
    }
  });
  els.refreshBillingBtn.addEventListener('click', async () => {
    await refreshBilling();
  });
  els.createLeadFromSelectedBtn.addEventListener('click', async () => {
    try {
      await createLeadFromSelected();
      setAuthActionStatus('Lead + follow-up task created in CRM.');
    } catch (err) {
      alert(err.message || 'Could not create lead');
    }
  });
  els.refreshCrmBtn.addEventListener('click', async () => {
    await refreshCrm();
  });
  els.refreshConsentLogsBtn.addEventListener('click', async () => {
    await refreshConsentLogs();
  });
  els.refreshAdminBtn.addEventListener('click', async () => {
    await refreshAdminData();
  });
  els.adminSecurityBtn.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/admin/security-stats');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load security stats');
      setAdminStatus(`Locked logins: ${data.lockedLoginCount} • Rate buckets: ${data.rateLimitBucketCount}`);
    } catch (err) {
      setAdminStatus(err.message || 'Could not load security stats');
    }
  });
  els.adminBackupBtn.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/admin/export-db-backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Backup failed');
      setAdminStatus(`Backup created: ${data.file}`);
    } catch (err) {
      setAdminStatus(err.message || 'Backup failed');
    }
  });
  els.adminRestoreBtn.addEventListener('click', async () => {
    try {
      const listRes = await apiFetch('/api/admin/backups');
      const listData = await listRes.json();
      if (!listRes.ok) throw new Error(listData?.error || 'Could not list backups');
      const latest = (listData.items || [])[0];
      if (!latest) throw new Error('No backup files available');
      const ok = window.confirm(`Restore latest backup ${latest.file}? This overwrites current app DB.`);
      if (!ok) return;
      const res = await apiFetch('/api/admin/restore-db-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: latest.file }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Restore failed');
      setAdminStatus(`Restore complete: ${data.restored}`);
      await refreshAdminData();
    } catch (err) {
      setAdminStatus(err.message || 'Restore failed');
    }
  });
  els.adminStripeCheckBtn.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/admin/stripe-live-check');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Stripe check failed');
      const failed = (data.checks || []).filter((c) => !c.ok);
      if (failed.length) {
        setAdminStatus(`Stripe check issues: ${failed.map((f) => `${f.name}`).join(', ')}`);
      } else {
        setAdminStatus('Stripe live check passed.');
      }
    } catch (err) {
      setAdminStatus(err.message || 'Stripe check failed');
    }
  });
  els.adminReadinessBtn.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/admin/production-readiness');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Readiness check failed');
      const failed = (data.checks || []).filter((c) => !c.ok);
      if (!failed.length) {
        setAdminStatus(`Production ready (${data.requiredScore} required passed, ${data.score} total).`);
      } else {
        setAdminStatus(
          `Readiness ${data.requiredScore} required passed. Missing: ${failed
            .slice(0, 3)
            .map((f) => f.key)
            .join(', ')}`
        );
      }
    } catch (err) {
      setAdminStatus(err.message || 'Readiness check failed');
    }
  });
  els.closeGalleryBtn.addEventListener('click', closeGallery);
  els.prevPhotoBtn.addEventListener('click', () => stepGallery(-1));
  els.nextPhotoBtn.addEventListener('click', () => stepGallery(1));

  els.galleryModal.addEventListener('click', (event) => {
    if (event.target === els.galleryModal) closeGallery();
  });

  document.addEventListener('keydown', (event) => {
    if (!state.galleryOpen) return;
    if (event.key === 'Escape') closeGallery();
    if (event.key === 'ArrowLeft') stepGallery(-1);
    if (event.key === 'ArrowRight') stepGallery(1);
  });
}

async function init() {
  initMap();
  loadPipelineLocal();
  await initPublicMonitoring();
  await ensureCsrfToken();
  await refreshAuth();
  const params = new URLSearchParams(window.location.search);
  if (params.get('billing') === 'success' && params.get('session_id')) {
    try {
      const res = await apiFetch('/api/billing/confirm-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: params.get('session_id') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Billing confirmation failed');
      setBillingActionStatus('Subscription activated successfully.');
      await refreshBilling();
      const clean = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, '', clean);
    } catch (err) {
      setBillingActionStatus(err.message || 'Billing confirmation failed');
    }
  } else if (params.get('billing') === 'cancel') {
    setBillingActionStatus('Checkout canceled.');
    const clean = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, '', clean);
  }
  renderFeeButtons();
  mountTools();
  renderPipeline();
  renderContactInfo();
  await refreshSourceHealthHistory();
  setupEvents();
  els.loadMoreBtn.style.display = 'none';

  els.toolOutput.textContent = 'Use any AI-powered card to generate scripts and templates for the selected deal.';

  try {
    await runSearch();
  } catch (err) {
    console.error(err);
  }
}

init();



