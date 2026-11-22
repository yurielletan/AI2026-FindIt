(function (global) {
  'use strict';

  const icon = (name, cls) => global.FindIt.icon(name, cls);
  const U = () => global.FindIt.Utils;
  const D = () => global.FindIt.Data;
  const S = () => global.FindIt.Store;
  const C = () => global.FindIt.Components;

  const pageState = {
    explore: {
      q: '',
      type: 'all',
      category: 'all',
      location: 'all',
      status: 'all',
      dateRange: 'all',
      customFrom: '',
      customTo: '',
      sort: 'newest',
      view: 'grid',
    },
    report: {
      photoDataUrl: '',
      photoSizeKb: 0,
      selectedColor: 'Black',
      submittedResult: null,
      quotaError: false,
      lastPayload: null,
    },
    myReportsTab: 'reports',
    adminTab: 'claims',
    adminClaimSearch: '',
    adminClaimStatus: 'all',
    adminReportSearch: '',
    adminReportType: 'all',
    adminReportCategory: 'all',
    adminReportStatus: 'all',
    lastExploreHash: '',
  };

  /* ========================================================================
     1. HOME PAGE
     ======================================================================== */
  function renderHome() {
    const store = S();
    const state = store.getState();
    const stats = store.getStats();
    const recent = [...state.reports]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    const catCounts = {};
    state.reports.forEach((r) => {
      catCounts[r.category] = (catCounts[r.category] || 0) + 1;
    });
    const matchCount = U().findAllMatchPairs(state.reports, { minScore: 55 }).length;

    return `
      <div class="fade-in">
        <section class="hero">
          <div class="hero-glow" aria-hidden="true"></div>
          <div class="container">
            <div class="hero-inner">
              <div class="hero-eyebrow">
                <span style="color:var(--teal-600)">${icon('sparkles', 'icon-sm')}</span>
                Westbrook University · Centralized Lost &amp; Found Hub
              </div>
              <h1 class="hero-title">
                Lost Something? <span class="gradient-text">Let&apos;s Find It.</span>
              </h1>
              <p class="hero-desc">
                Report misplaced belongings, log found items safely, discover transparent match
                suggestions, and verify ownership with privacy-first claim reviews across campus.
              </p>

              <form id="hero-search-form" class="hero-search">
                <div class="hero-search-input-wrap">
                  <span class="hero-search-icon">${icon('search')}</span>
                  <input id="hero-search-input" type="text" placeholder="Search by item, color, or location (e.g. earbuds, Science Library, keys)..." />
                </div>
                <button type="submit" class="btn btn-primary">${icon('search')} Search Items</button>
              </form>

              <div class="hero-ctas">
                <a href="#/report/lost" class="btn btn-primary btn-lg">${icon('alertCircle')} Report Lost Item</a>
                <a href="#/report/found" class="btn btn-teal btn-lg">${icon('sparkles')} Report Found Item</a>
                <a href="#/explore" class="btn btn-secondary btn-lg">Browse Explorer ${icon('arrowRight')}</a>
              </div>
            </div>

            <div class="kpi-grid">
              <div class="card kpi-card">
                <div class="kpi-top">
                  <span class="kpi-label">Total Reported</span>
                  <div class="kpi-icon" style="background:var(--blue-50);color:var(--blue-600);">${icon('package')}</div>
                </div>
                <div class="kpi-value">${stats.totalReports}</div>
                <div class="kpi-sub">${stats.lostReports} lost · ${stats.foundReports} found</div>
              </div>

              <div class="card kpi-card">
                <div class="kpi-top">
                  <span class="kpi-label">Active Reports</span>
                  <div class="kpi-icon" style="background:var(--indigo-50);color:var(--indigo-600);">${icon('clock')}</div>
                </div>
                <div class="kpi-value">${stats.activeReports}</div>
                <div class="kpi-sub">${stats.claimedReports} claimed awaiting pickup</div>
              </div>

              <div class="card kpi-card">
                <div class="kpi-top">
                  <span class="kpi-label">Successfully Returned</span>
                  <div class="kpi-icon" style="background:var(--emerald-50);color:var(--emerald-600);">${icon('packageCheck')}</div>
                </div>
                <div class="kpi-value">${stats.returnedReports}</div>
                <div class="kpi-sub" style="color:var(--emerald-600);font-weight:600;">${stats.recoveryRate}% claimed or returned</div>
              </div>

              <div class="card kpi-card">
                <div class="kpi-top">
                  <span class="kpi-label">Suggested Matches</span>
                  <div class="kpi-icon" style="background:var(--teal-50);color:var(--teal-600);">${icon('compare')}</div>
                </div>
                <div class="kpi-value">${matchCount}</div>
                <div class="kpi-sub">Rule-based match pairs</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Category Shortcuts -->
        <section class="container page-section" style="padding-top:48px;">
          <div class="section-head">
            <div>
              <h2 class="section-title">Browse by Category</h2>
              <p class="section-subtitle">Jump straight to common lost &amp; found item categories.</p>
            </div>
            <a href="#/explore" class="btn btn-ghost btn-sm" style="color:var(--blue-600);">View all ${icon('arrowRight', 'icon-sm')}</a>
          </div>
          <div class="category-grid">
            ${D()
              .CATEGORIES.map((cat) => {
                const count = catCounts[cat.id] || 0;
                return `<a href="#/explore?category=${encodeURIComponent(cat.id)}" class="card card-hover category-card">
                  <div class="category-icon">${icon(cat.icon, 'icon-md')}</div>
                  <div style="min-width:0;">
                    <div class="category-name">${U().escapeHtml(cat.label)}</div>
                    <div class="category-count">${count} ${count === 1 ? 'report' : 'reports'}</div>
                  </div>
                </a>`;
              })
              .join('')}
          </div>
        </section>

        <!-- Recently Reported -->
        <section class="container page-section">
          <div class="section-head">
            <div>
              <h2 class="section-title">Recently Reported Items</h2>
              <p class="section-subtitle">Latest campus lost and found listings, updated live from your browser storage.</p>
            </div>
            <a href="#/explore" class="btn btn-secondary btn-sm">Explore All (${stats.totalReports}) ${icon('arrowRight', 'icon-sm')}</a>
          </div>

          ${
            recent.length === 0
              ? `<div class="card empty-state">
                  <div class="empty-icon">${icon('package', 'icon-lg')}</div>
                  <h3 style="margin:0;">No items reported yet</h3>
                  <p class="text-sm text-muted mt-2">Create the first lost or found report to get started.</p>
                  <div class="hero-ctas mt-4">
                    <a href="#/report/lost" class="btn btn-primary">Report Lost Item</a>
                    <a href="#/report/found" class="btn btn-teal">Report Found Item</a>
                  </div>
                </div>`
              : `<div class="items-grid">${recent.map((item) => C().itemCard(item, 'grid')).join('')}</div>`
          }
        </section>

        <!-- How It Works -->
        <section class="container">
          <div class="how-banner">
            <div style="max-width:600px;margin:0 auto;text-align:center;">
              <span class="badge badge-claimed">${icon('shieldCheck', 'icon-sm')} Simple, Safe &amp; Transparent</span>
              <h2 class="section-title mt-3" style="font-size:28px;">How FindIt Works</h2>
              <p class="section-subtitle">Built to return items faster while keeping personal details private and preventing false claims.</p>
            </div>
            <div class="steps-grid">
              <div class="card step-card">
                <div class="step-icon" style="background:var(--blue-600);">${icon('plusCircle', 'icon-md')}</div>
                <div class="text-xs mt-4" style="font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--blue-600);">Step 1</div>
                <h3 style="margin:4px 0 8px;font-size:16.5px;">Report Lost or Found</h3>
                <p class="text-sm text-muted" style="margin:0;">Log item details, location, date, and an optional resized photo. Finders keep hidden identifying details private to verify true ownership.</p>
              </div>
              <div class="card step-card">
                <div class="step-icon" style="background:var(--indigo-600);">${icon('compare', 'icon-md')}</div>
                <div class="text-xs mt-4" style="font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--indigo-600);">Step 2</div>
                <h3 style="margin:4px 0 8px;font-size:16.5px;">Rule-Based Match Suggestions</h3>
                <p class="text-sm text-muted" style="margin:0;">FindIt compares category, keywords, color, location, and dates to suggest likely pairs with a full, transparent score breakdown.</p>
              </div>
              <div class="card step-card">
                <div class="step-icon" style="background:var(--teal-600);">${icon('checkCircle', 'icon-md')}</div>
                <div class="text-xs mt-4" style="font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:var(--teal-600);">Step 3</div>
                <h3 style="margin:4px 0 8px;font-size:16.5px;">Verified Claim &amp; Return</h3>
                <p class="text-sm text-muted" style="margin:0;">Claimants answer private verification questions reviewed by campus staff before approval and safe pickup.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  /* ========================================================================
     2. LOST & FOUND EXPLORER
     ======================================================================== */
  function getFilteredExploreReports() {
    const f = pageState.explore;
    const reports = S().getState().reports;
    const q = f.q.trim().toLowerCase();
    const now = Date.now();

    const filtered = reports.filter((item) => {
      if (f.type !== 'all' && item.type !== f.type) return false;
      if (f.category !== 'all' && item.category !== f.category) return false;
      if (f.location !== 'all' && item.location !== f.location) return false;
      if (f.status === 'active' && item.status === 'Returned') return false;
      if (f.status === 'claimed' && item.status !== 'Claimed') return false;
      if (f.status === 'resolved' && item.status !== 'Returned') return false;

      if (f.dateRange !== 'all') {
        const ms = new Date(`${item.date}T12:00:00`).getTime();
        if (f.dateRange === '1d' && now - ms > 2 * 86400000) return false;
        if (f.dateRange === '7d' && now - ms > 8 * 86400000) return false;
        if (f.dateRange === '30d' && now - ms > 31 * 86400000) return false;
        if (f.dateRange === 'custom') {
          if (f.customFrom && item.date < f.customFrom) return false;
          if (f.customTo && item.date > f.customTo) return false;
        }
      }

      if (q) {
        const blob = [
          item.id,
          item.title,
          item.description,
          item.category,
          item.location,
          item.specificLocation,
          item.color,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (f.sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (f.sort === 'date_desc') return String(b.date).localeCompare(String(a.date));
      if (f.sort === 'title_asc') return String(a.title).localeCompare(String(b.title));
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function countActiveExploreFilters() {
    const f = pageState.explore;
    let c = 0;
    if (f.q.trim()) c++;
    if (f.type !== 'all') c++;
    if (f.category !== 'all') c++;
    if (f.location !== 'all') c++;
    if (f.status !== 'all') c++;
    if (f.dateRange !== 'all') c++;
    return c;
  }

  function renderExploreResultsHtml() {
    const list = getFilteredExploreReports();
    const activeFilters = countActiveExploreFilters();
    const view = pageState.explore.view;

    const countHtml = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm">
        <span class="text-muted">
          Showing <strong style="color:var(--text-primary)">${list.length}</strong> ${
            list.length === 1 ? 'report' : 'reports'
          }${activeFilters > 0 ? ` (${activeFilters} active ${activeFilters === 1 ? 'filter' : 'filters'})` : ''}
        </span>
        ${
          activeFilters > 0
            ? `<button type="button" class="btn btn-ghost btn-sm" data-action="reset-explore" style="color:var(--blue-600);">${icon('rotateCcw', 'icon-sm')} Reset all filters</button>`
            : ''
        }
      </div>
    `;

    if (list.length === 0) {
      return `${countHtml}
        <div class="card empty-state">
          <div class="empty-icon">${icon('search', 'icon-lg')}</div>
          <h3 style="margin:0;font-size:18px;">No matching items found</h3>
          <p class="text-sm text-muted mt-2" style="max-width:440px;margin-left:auto;margin-right:auto;">
            Try broadening your search terms or clearing active filters. If your item isn&apos;t listed yet, submit a report so FindIt can watch for matches.
          </p>
          <div class="hero-ctas mt-4">
            ${activeFilters > 0 ? `<button type="button" class="btn btn-secondary" data-action="reset-explore">${icon('rotateCcw')} Clear Filters</button>` : ''}
            <a href="#/report/lost" class="btn btn-primary">Report Lost Item</a>
            <a href="#/report/found" class="btn btn-teal">Report Found Item</a>
          </div>
        </div>
      `;
    }

    return `${countHtml}
      <div class="${view === 'list' ? 'items-list' : 'items-grid'}">
        ${list.map((item) => C().itemCard(item, view)).join('')}
      </div>
    `;
  }

  function renderExplore(params) {
    const currentHash = global.location.hash || '';
    if (params && currentHash !== pageState.lastExploreHash) {
      pageState.lastExploreHash = currentHash;
      if (params.get('q') !== null) pageState.explore.q = params.get('q');
      if (params.get('category') !== null) pageState.explore.category = params.get('category');
      if (params.get('type') !== null) pageState.explore.type = params.get('type');
    }
    const f = pageState.explore;

    return `
      <div class="container page-section fade-in">
        <div class="section-head">
          <div>
            <h1 class="section-title" style="font-size:28px;">Lost &amp; Found Explorer</h1>
            <p class="section-subtitle">Search and filter campus reports. Personal contact details stay shielded behind verified claims.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a href="#/report/lost" class="btn btn-primary btn-sm">${icon('plusCircle')} Report Lost</a>
            <a href="#/report/found" class="btn btn-teal btn-sm">${icon('plusCircle')} Report Found</a>
          </div>
        </div>

        <div class="card filter-bar">
          <div class="filter-top">
            <div class="search-box">
              <span class="search-icon">${icon('search')}</span>
              <input id="explore-search" class="input" type="text" value="${U().escapeHtml(f.q)}" placeholder="Search by title, description, color, location, or ID..." />
              <button type="button" id="explore-search-clear" class="search-clear" data-action="clear-explore-search" aria-label="Clear search" style="display:${f.q ? 'block' : 'none'};">${icon('x', 'icon-sm')}</button>
            </div>

            <div class="segmented" role="group" aria-label="Filter Lost or Found">
              <button type="button" class="seg-btn ${f.type === 'all' ? 'active' : ''}" data-action="explore-type" data-val="all">All</button>
              <button type="button" class="seg-btn ${f.type === 'lost' ? 'active' : ''}" data-action="explore-type" data-val="lost">Lost</button>
              <button type="button" class="seg-btn ${f.type === 'found' ? 'active' : ''}" data-action="explore-type" data-val="found">Found</button>
            </div>

            <select id="explore-sort" class="select" style="width:auto;min-width:190px;" aria-label="Sort results">
              <option value="newest" ${f.sort === 'newest' ? 'selected' : ''}>Sort: Newest Reported</option>
              <option value="oldest" ${f.sort === 'oldest' ? 'selected' : ''}>Sort: Oldest Reported</option>
              <option value="date_desc" ${f.sort === 'date_desc' ? 'selected' : ''}>Sort: Date Lost / Found</option>
              <option value="title_asc" ${f.sort === 'title_asc' ? 'selected' : ''}>Sort: Title (A–Z)</option>
            </select>

            <div class="segmented" role="group" aria-label="View mode">
              <button type="button" class="seg-btn ${f.view === 'grid' ? 'active' : ''}" data-action="explore-view" data-val="grid" title="Grid View" aria-label="Grid View">${icon('grid')}</button>
              <button type="button" class="seg-btn ${f.view === 'list' ? 'active' : ''}" data-action="explore-view" data-val="list" title="List View" aria-label="List View">${icon('list')}</button>
            </div>
          </div>

          <div class="filter-grid">
            <div>
              <label class="field-label" for="explore-category">Category</label>
              <select id="explore-category" class="select">
                <option value="all">All Categories</option>
                ${D().CATEGORIES.map((c) => `<option value="${U().escapeHtml(c.id)}" ${f.category === c.id ? 'selected' : ''}>${U().escapeHtml(c.label)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label" for="explore-location">Location</label>
              <select id="explore-location" class="select">
                <option value="all">All Campus Locations</option>
                ${D().LOCATIONS.map((l) => `<option value="${U().escapeHtml(l.id)}" ${f.location === l.id ? 'selected' : ''}>${U().escapeHtml(l.label)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label" for="explore-date-range">Date Range</label>
              <select id="explore-date-range" class="select">
                <option value="all" ${f.dateRange === 'all' ? 'selected' : ''}>Any Date</option>
                <option value="1d" ${f.dateRange === '1d' ? 'selected' : ''}>Last 24 Hours</option>
                <option value="7d" ${f.dateRange === '7d' ? 'selected' : ''}>Last 7 Days</option>
                <option value="30d" ${f.dateRange === '30d' ? 'selected' : ''}>Last 30 Days</option>
                <option value="custom" ${f.dateRange === 'custom' ? 'selected' : ''}>Custom Date Range...</option>
              </select>
            </div>
            <div>
              <label class="field-label" for="explore-status">Resolution Status</label>
              <select id="explore-status" class="select">
                <option value="all" ${f.status === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="active" ${f.status === 'active' ? 'selected' : ''}>Active (Not Returned)</option>
                <option value="claimed" ${f.status === 'claimed' ? 'selected' : ''}>Claimed (Awaiting Pickup)</option>
                <option value="resolved" ${f.status === 'resolved' ? 'selected' : ''}>Resolved (Returned)</option>
              </select>
            </div>

            ${
              f.dateRange === 'custom'
                ? `<div class="span-2">
                    <label class="field-label" for="explore-from">From Date</label>
                    <input id="explore-from" type="date" class="input" value="${U().escapeHtml(f.customFrom)}" />
                  </div>
                  <div class="span-2">
                    <label class="field-label" for="explore-to">To Date</label>
                    <input id="explore-to" type="date" class="input" value="${U().escapeHtml(f.customTo)}" />
                  </div>`
                : ''
            }
          </div>
        </div>

        <div id="explore-results-region">
          ${renderExploreResultsHtml()}
        </div>
      </div>
    `;
  }

  function updateExploreResultsOnly() {
    const region = document.getElementById('explore-results-region');
    if (region) region.innerHTML = renderExploreResultsHtml();
  }

  function renderReportUploadZoneHtml() {
    const rs = pageState.report;
    if (rs.photoDataUrl) {
      return `<div class="upload-preview">
        <img src="${U().escapeHtml(rs.photoDataUrl)}" alt="Upload preview" />
        <div style="flex:1;min-width:180px;">
          <div style="font-weight:700;font-size:14px;">Photo ready to attach</div>
          <p class="text-xs text-muted mt-2">Automatically resized &amp; compressed (~${rs.photoSizeKb} KB) for localStorage.</p>
          <div class="flex flex-wrap gap-2 mt-3">
            <label class="btn btn-secondary btn-sm">
              ${icon('upload', 'icon-sm')} Replace Photo
              <input id="rep-photo-input" type="file" accept="image/*" style="display:none;" />
            </label>
            <button type="button" class="btn btn-danger-outline btn-sm" data-action="remove-report-photo">${icon('trash', 'icon-sm')} Remove</button>
          </div>
        </div>
      </div>`;
    }
    return `<div>
      <div style="color:var(--blue-600);margin-bottom:8px;">${icon('upload', 'icon-lg')}</div>
      <div style="font-weight:700;font-size:14px;">Add an item photograph (optional)</div>
      <p class="text-xs text-muted mt-2" style="margin-bottom:14px;">PNG, JPG, or WebP · Resized client-side to keep storage light</p>
      <label class="btn btn-secondary btn-sm">
        ${icon('upload', 'icon-sm')} Choose Image File
        <input id="rep-photo-input" type="file" accept="image/*" style="display:none;" />
      </label>
    </div>`;
  }

  /* ========================================================================
     3. REPORT AN ITEM (TWO SEPARATE FORMS: LOST & FOUND)
     ======================================================================== */
  function renderReport(reportType) {
    const isFound = reportType === 'found';
    const user = S().getActiveUser();
    const rs = pageState.report;

    if (rs.submittedResult && rs.submittedResult.report.type === reportType) {
      const rep = rs.submittedResult.report;
      const matches = rs.submittedResult.matches || [];
      return `
        <div class="container page-section fade-in">
          <div class="form-shell">
            <div class="card card-pad" style="text-align:center;padding:38px 28px;">
              <div style="width:60px;height:60px;border-radius:18px;margin:0 auto;background:var(--emerald-50);color:var(--emerald-600);display:flex;align-items:center;justify-content:center;">
                ${icon('checkCircle', 'icon-xl')}
              </div>
              <h1 style="margin:16px 0 8px;font-size:24px;">${
                isFound ? 'Found Item Report Published!' : 'Lost Item Report Published!'
              }</h1>
              <p class="text-sm text-muted" style="max-width:500px;margin:0 auto;">
                Your report <strong>${U().escapeHtml(rep.title)}</strong> (<span class="mono">${U().escapeHtml(rep.id)}</span>) is now live in the Lost &amp; Found Explorer and saved in your browser.
              </p>

              <div class="hero-ctas mt-6">
                <a href="#/item/${U().escapeHtml(rep.id)}" class="btn btn-primary">View Report Details ${icon('arrowRight')}</a>
                <a href="#/explore" class="btn btn-secondary">Browse Explorer</a>
                <button type="button" class="btn btn-ghost" data-action="report-another">Submit Another Report</button>
              </div>
            </div>

            ${
              matches.length > 0
                ? `<div class="mt-6">
                    <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
                      <div>
                        <h2 style="margin:0;font-size:19px;">Immediate Potential Matches Found (${matches.length})</h2>
                        <p class="text-xs text-muted mt-2" style="margin-bottom:0;">Rule-based suggestions only — inspect details and submit a verified claim if one is yours.</p>
                      </div>
                      <span class="badge badge-claimed">${icon('sparkles', 'icon-sm')} Suggestion Only</span>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                      ${matches.map((m) => C().matchCard(m)).join('')}
                    </div>
                  </div>`
                : ''
            }
          </div>
        </div>
      `;
    }

    return `
      <div class="container page-section fade-in">
        <div class="form-shell">
          <!-- Separate Form Switcher -->
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 class="section-title" style="font-size:28px;">${
                isFound ? 'Report a Found Item' : 'Report a Lost Item'
              }</h1>
              <p class="section-subtitle">${
                isFound
                  ? 'Help return a misplaced belonging safely to its owner.'
                  : 'Provide details so finders and campus staff can spot a match.'
              }</p>
            </div>
            <div class="segmented">
              <a href="#/report/lost" class="seg-btn ${!isFound ? 'active' : ''}">A. Report Lost Item</a>
              <a href="#/report/found" class="seg-btn ${isFound ? 'active' : ''}">B. Report Found Item</a>
            </div>
          </div>

          ${
            isFound
              ? `<div class="callout callout-teal mb-4">
                  <span>${icon('shieldCheck', 'icon-md')}</span>
                  <div>
                    <strong>Protect Against False Ownership Claims:</strong> Do <em>not</em> publicly list unique identifying details (serial numbers, lock-screen images, exact wallet contents, or full ID numbers) in the public description below. Save 1–2 hidden details in the <strong>Private Verification Hint</strong> field so only the true owner can verify it.
                  </div>
                </div>`
              : `<div class="callout callout-blue mb-4">
                  <span>${icon('info', 'icon-md')}</span>
                  <div>
                    <strong>Privacy Protected:</strong> Your email or phone number is stored privately and never shown on public item cards. Posting as demo user <strong>${U().escapeHtml(user.name)}</strong>.
                  </div>
                </div>`
          }

          ${
            rs.quotaError
              ? `<div class="callout callout-rose mb-4" style="justify-content:space-between;align-items:center;flex-wrap:wrap;">
                  <div><strong>Storage Limit Reached:</strong> Browser localStorage is full with the attached photo. You can submit this report without a photo instead.</div>
                  <button type="button" class="btn btn-danger btn-sm" data-action="retry-report-no-photo">Submit Without Photo</button>
                </div>`
              : ''
          }

          <div class="card card-pad">
            <form id="item-report-form" data-report-type="${isFound ? 'found' : 'lost'}" novalidate>
              <div class="form-grid">
                <div class="span-2">
                  <label class="field-label" for="rep-title">Item Name *</label>
                  <input id="rep-title" name="title" class="input" placeholder="${
                    isFound
                      ? 'e.g. Black Wireless Earbuds in Charging Case'
                      : 'e.g. Matte Teal 32oz Stainless Water Bottle'
                  }" required />
                  <div class="field-error" data-err="title"></div>
                </div>

                <div>
                  <label class="field-label" for="rep-category">Item Category *</label>
                  <select id="rep-category" name="category" class="select" required>
                    <option value="">Select a category...</option>
                    ${D().CATEGORIES.map((c) => `<option value="${U().escapeHtml(c.id)}">${U().escapeHtml(c.label)}</option>`).join('')}
                  </select>
                  <div class="field-error" data-err="category"></div>
                </div>

                <div>
                  <label class="field-label" for="rep-date">Date ${isFound ? 'Found' : 'Lost'} *</label>
                  <input id="rep-date" name="date" type="date" max="${U().getTodayInputDate()}" value="${U().getTodayInputDate()}" class="input" required />
                  <div class="field-error" data-err="date"></div>
                </div>

                <div>
                  <label class="field-label" for="rep-location">General Location *</label>
                  <select id="rep-location" name="location" class="select" required>
                    <option value="">Select campus building / area...</option>
                    ${D().LOCATIONS.map((l) => `<option value="${U().escapeHtml(l.id)}">${U().escapeHtml(l.label)} (${U().escapeHtml(l.zone)})</option>`).join('')}
                  </select>
                  <div class="field-error" data-err="location"></div>
                </div>

                <div>
                  <label class="field-label" for="rep-specific">Specific Spot (Optional)</label>
                  <input id="rep-specific" name="specificLocation" class="input" placeholder="e.g. 2nd Floor Quiet Study Tables" />
                </div>

                <div class="span-2">
                  <label class="field-label">Item Color *</label>
                  <input type="hidden" id="rep-color" name="color" value="${U().escapeHtml(rs.selectedColor)}" />
                  <div class="color-chips" id="rep-color-chips">
                    ${D()
                      .COLORS.map(
                        (c) => `<button type="button" class="color-chip ${
                          rs.selectedColor === c.name ? 'selected' : ''
                        }" data-action="pick-color" data-color="${U().escapeHtml(c.name)}">
                          <span class="color-swatch" style="background:${c.hex};"></span>
                          ${U().escapeHtml(c.name)}
                        </button>`
                      )
                      .join('')}
                  </div>
                </div>

                <div class="span-2">
                  <label class="field-label" for="rep-description">${
                    isFound ? 'Public Description (keep unique identifiers hidden) *' : 'Detailed Description *'
                  }</label>
                  <textarea id="rep-description" name="description" class="textarea" placeholder="${
                    isFound
                      ? 'Describe general appearance, size, and where it was found without revealing private serial numbers or hidden marks...'
                      : 'Describe appearance, brand, distinguishing marks, stickers, or accessories...'
                  }" required></textarea>
                  <div class="field-error" data-err="description"></div>
                </div>

                ${
                  isFound
                    ? `<div class="span-2">
                        <div class="callout callout-indigo" style="flex-direction:column;gap:8px;">
                          <label class="field-label" for="rep-hint" style="margin:0;color:inherit;">Private Ownership-Verification Detail (Optional · Admin-Only)</label>
                          <p class="text-xs" style="margin:0;opacity:0.9;">Never shown on public listings. Helps campus staff verify legitimate owners during claim review.</p>
                          <textarea id="rep-hint" name="privateVerificationHint" class="textarea" style="min-height:70px;" placeholder="e.g. Scuff mark beside charging port, green key tag 'B-214', initials on inside cover..."></textarea>
                        </div>
                      </div>`
                    : ''
                }

                <!-- Photo Upload -->
                <div class="span-2">
                  <label class="field-label">Optional Photograph Upload (Resized locally for browser storage)</label>
                  <div class="upload-zone" id="report-upload-zone">
                    ${renderReportUploadZoneHtml()}
                  </div>
                  <div class="field-error" data-err="photo"></div>
                </div>

                <div>
                  <label class="field-label" for="rep-reporter">Reporter Name *</label>
                  <input id="rep-reporter" name="reporterName" class="input" value="${U().escapeHtml(user.name)}" required />
                  <div class="field-error" data-err="reporterName"></div>
                </div>

                <div>
                  <label class="field-label" for="rep-contact-method">Preferred Contact Method *</label>
                  <select id="rep-contact-method" name="contactMethod" class="select">
                    ${D().CONTACT_METHODS.map((m) => `<option value="${U().escapeHtml(m.id)}">${U().escapeHtml(m.label)}</option>`).join('')}
                  </select>
                </div>

                <div class="span-2">
                  <label class="field-label" for="rep-contact-value">Contact Detail (Kept Private) *</label>
                  <input id="rep-contact-value" name="contactValue" class="input" value="${U().escapeHtml(user.email)}" placeholder="name@westbrook.edu or phone number" required />
                  <div class="field-hint">Hidden from public listings; only used for verified handoffs and admin review.</div>
                  <div class="field-error" data-err="contactValue"></div>
                </div>

                <div class="span-2">
                  <label class="field-label" for="rep-notes">${
                    isFound ? 'Custody / Turn-In Location & Additional Notes (Optional)' : 'Additional Notes (Optional)'
                  }</label>
                  <input id="rep-notes" name="additionalNotes" class="input" placeholder="${
                    isFound
                      ? 'e.g. Turned in to Student Union Information Desk'
                      : 'e.g. Reward offered, or best time to coordinate pickup'
                  }" />
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-end gap-3 mt-6" style="padding-top:18px;border-top:1px solid var(--border-soft);">
                <a href="#/explore" class="btn btn-secondary">Cancel</a>
                <button type="submit" class="btn ${isFound ? 'btn-teal' : 'btn-primary'} btn-lg">
                  ${icon(isFound ? 'sparkles' : 'plusCircle')}
                  ${isFound ? 'Publish Found Item Report' : 'Publish Lost Item Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  /* ========================================================================
     4. ITEM DETAIL PAGE
     ======================================================================== */
  function renderItemDetail(reportId) {
    const store = S();
    const state = store.getState();
    const report = state.reports.find((r) => r.id === reportId);
    const user = store.getActiveUser();
    const admin = store.isAdmin();

    if (!report) {
      return `
        <div class="container page-section fade-in">
          <div class="card empty-state">
            <div class="empty-icon">${icon('alertCircle', 'icon-lg')}</div>
            <h2 style="margin:0;">Report Not Found</h2>
            <p class="text-sm text-muted mt-2">This item report may have been deleted or the ID is invalid.</p>
            <div class="mt-4"><a href="#/explore" class="btn btn-primary">Back to Explorer</a></div>
          </div>
        </div>
      `;
    }

    const isOwner = report.reporterId === user.id;
    const isFound = report.type === 'found';
    const isReturned = report.status === 'Returned';
    const myExistingClaim = state.claims.find(
      (c) =>
        c.reportId === report.id &&
        c.claimantId === user.id &&
        (c.status === 'Pending Review' || c.status === 'Approved')
    );
    const reportClaims = state.claims.filter((c) => c.reportId === report.id);
    const pendingCount = reportClaims.filter((c) => c.status === 'Pending Review').length;

    const potentialMatches = U().findPotentialMatches(report, state.reports, {
      minScore: 45,
      limit: 4,
    });
    const relatedReports = state.reports
      .filter(
        (r) =>
          r.id !== report.id &&
          (r.category === report.category || r.location === report.location)
      )
      .slice(0, 3);

    const imgSrc = report.imageUrl || U().getFallbackPlaceholder(report.category, report.title);

    return `
      <div class="container page-section fade-in">
        <div class="mb-4">
          <a href="#/explore" class="btn btn-ghost btn-sm" style="padding-left:0;">
            ${icon('arrowLeft', 'icon-sm')} Back to Lost &amp; Found Explorer
          </a>
        </div>

        <div class="detail-grid">
          <!-- Left: Photo + Description -->
          <div>
            <div class="detail-photo-wrap" data-action="open-lightbox" data-src="${U().escapeHtml(imgSrc)}" data-title="${U().escapeHtml(report.title)}">
              ${C().imgWithFallback(report)}
              <span class="zoom-hint">${icon('zoomIn', 'icon-sm')} Click to enlarge</span>
            </div>

            <div class="card card-pad mt-4">
              <h2 style="margin:0 0 10px;font-size:17px;">Detailed Description</h2>
              <p class="text-sm" style="margin:0;color:var(--text-secondary);line-height:1.7;">
                ${U().escapeHtml(report.description)}
              </p>

              ${
                report.additionalNotes
                  ? `<div class="mt-4" style="padding-top:14px;border-top:1px solid var(--border-soft);">
                      <div class="info-tile-label">Additional Notes</div>
                      <p class="text-sm mt-2" style="margin-bottom:0;color:var(--text-secondary);">${U().escapeHtml(report.additionalNotes)}</p>
                    </div>`
                  : ''
              }

              ${
                (isOwner || admin) && report.privateVerificationHint
                  ? `<div class="callout callout-indigo mt-4">
                      <span>${icon('lock')}</span>
                      <div>
                        <strong>Private Verification Hint (Visible only to ${admin ? 'Admin' : 'Report Owner'}):</strong><br/>
                        ${U().escapeHtml(report.privateVerificationHint)}
                      </div>
                    </div>`
                  : ''
              }
            </div>
          </div>

          <!-- Right: Metadata & Action Flow -->
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div class="card card-pad">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  ${C().typeBadge(report.type)}
                  ${C().statusBadge(report.status)}
                </div>
                <span class="mono text-xs text-muted">${U().escapeHtml(report.id)}${
                  report.isDemoSample ? ' · Demo' : ''
                }</span>
              </div>

              <h1 style="margin:14px 0 6px;font-size:24px;line-height:1.25;">${U().escapeHtml(report.title)}</h1>
              <p class="text-xs text-muted" style="margin:0;">
                Reported ${U().escapeHtml(U().formatDateTime(report.createdAt))} by <strong>${U().escapeHtml(
                  U().getPublicReporterLabel(report.reporterName)
                )}</strong>
              </p>

              <div class="info-grid">
                <div class="info-tile">
                  <div class="info-tile-label">Category</div>
                  <div class="info-tile-value">${U().escapeHtml(report.category)}</div>
                </div>
                <div class="info-tile">
                  <div class="info-tile-label">Primary Color</div>
                  <div class="info-tile-value">${U().escapeHtml(report.color || 'Not specified')}</div>
                </div>
                <div class="info-tile">
                  <div class="info-tile-label">General Location</div>
                  <div class="info-tile-value">${U().escapeHtml(report.location)}</div>
                  ${
                    report.specificLocation
                      ? `<div class="text-xs text-muted" style="margin-top:2px;">${U().escapeHtml(report.specificLocation)}</div>`
                      : ''
                  }
                </div>
                <div class="info-tile">
                  <div class="info-tile-label">Date ${isFound ? 'Found' : 'Lost'}</div>
                  <div class="info-tile-value">${U().escapeHtml(U().formatDate(report.date))}</div>
                </div>
              </div>

              <!-- Privacy-Shielded Contact Notice -->
              <div class="callout callout-blue mt-4">
                <span>${icon('lock')}</span>
                <div>
                  ${
                    isOwner || admin
                      ? `<strong>Private Contact (${admin ? 'Admin View' : 'Your Report'}):</strong> ${U().escapeHtml(
                          report.contactMethod
                        )} — <span class="mono">${U().escapeHtml(report.contactValue)}</span>`
                      : `<strong>Contact Protected:</strong> Direct email &amp; phone details are hidden publicly. Use the safe verification request below to coordinate return.`
                  }
                </div>
              </div>

              <!-- Primary Action Block -->
              <div class="mt-4" style="padding-top:16px;border-top:1px solid var(--border-soft);">
                ${
                  isReturned
                    ? `<div class="callout callout-emerald">
                        <span>${icon('packageCheck', 'icon-md')}</span>
                        <div><strong>Resolved &amp; Returned:</strong> This item has already been reunited with its owner. New claims are closed.</div>
                      </div>`
                    : myExistingClaim
                    ? `<div class="callout callout-amber">
                        <span>${icon('clock', 'icon-md')}</span>
                        <div style="flex:1;">
                          <strong>You have an active request (${U().escapeHtml(myExistingClaim.id)})</strong><br/>
                          Current status: <strong>${U().escapeHtml(myExistingClaim.status)}</strong>.
                          <div class="mt-2"><a href="#/my-reports" class="btn btn-secondary btn-sm">Track in My Reports</a></div>
                        </div>
                      </div>`
                    : isOwner
                    ? `<div class="flex flex-wrap gap-2">
                        <button type="button" class="btn btn-primary" data-action="open-edit-modal" data-id="${U().escapeHtml(report.id)}">${icon('edit')} Edit Report</button>
                        <button type="button" class="btn btn-emerald" data-action="confirm-mark-returned" data-id="${U().escapeHtml(report.id)}">${icon('packageCheck')} Mark as Returned</button>
                        <a href="#/my-reports" class="btn btn-secondary">Manage in My Reports</a>
                      </div>`
                    : `<div>
                        <button type="button" class="btn ${isFound ? 'btn-primary' : 'btn-teal'} btn-lg" style="width:100%;" data-action="open-claim-modal" data-id="${U().escapeHtml(report.id)}">
                          ${icon(isFound ? 'shieldCheck' : 'sparkles')}
                          ${isFound ? 'I Think This Is Mine' : 'I Found This Item'}
                        </button>
                        <p class="text-xs text-muted mt-2" style="text-align:center;margin-bottom:0;">
                          ${
                            isFound
                              ? 'Opens a private ownership-verification form reviewed by campus staff.'
                              : 'Opens a safe finder handoff request without exposing private contact info publicly.'
                          }
                        </p>
                      </div>`
                }

                ${
                  pendingCount > 0 && !isReturned
                    ? `<p class="text-xs text-muted mt-3" style="margin-bottom:0;">${icon('info', 'icon-sm')} Currently ${pendingCount} claim ${
                        pendingCount === 1 ? 'request' : 'requests'
                      } pending staff verification.</p>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Potential Matches Section -->
        <section class="mt-6" style="margin-top:38px;">
          <div class="section-head">
            <div>
              <h2 class="section-title" style="font-size:21px;">Potential Matches</h2>
              <p class="section-subtitle">
                Rule-based match suggestions comparing category, keywords, color, location, and date. <strong>Suggestions only — not confirmed ownership.</strong>
              </p>
            </div>
            <span class="badge badge-claimed">${icon('compare', 'icon-sm')} Transparent Rule Scoring</span>
          </div>

          ${
            potentialMatches.length === 0
              ? `<div class="card card-pad text-sm text-muted">
                  No high-confidence opposite reports matched above the 45% rule threshold yet. New reports are automatically checked as they arrive.
                </div>`
              : `<div style="display:flex;flex-direction:column;gap:14px;">
                  ${potentialMatches.map((m) => C().matchCard(m)).join('')}
                </div>`
          }
        </section>

        <!-- Related Reports -->
        ${
          relatedReports.length > 0
            ? `<section class="mt-6" style="margin-top:38px;">
                <div class="section-head">
                  <div>
                    <h2 class="section-title" style="font-size:21px;">Related Reports</h2>
                    <p class="section-subtitle">Other items in ${U().escapeHtml(report.category)} or near ${U().escapeHtml(report.location)}.</p>
                  </div>
                </div>
                <div class="items-grid">
                  ${relatedReports.map((item) => C().itemCard(item, 'grid')).join('')}
                </div>
              </section>`
            : ''
        }
      </div>
    `;
  }

  /* ========================================================================
     5. MY REPORTS DASHBOARD
     ======================================================================== */
  function renderMyReports() {
    const store = S();
    const state = store.getState();
    const user = store.getActiveUser();
    const tab = pageState.myReportsTab;

    const myReports = state.reports.filter((r) => r.reporterId === user.id);
    const myClaims = state.claims.filter((c) => c.claimantId === user.id);
    const myReportIds = new Set(myReports.map((r) => r.id));
    const incomingClaims = state.claims.filter((c) => myReportIds.has(c.reportId));

    const renderClaimProgress = (status) => {
      if (status === 'Rejected') {
        return `<div class="progress-steps">
          <span class="progress-pill done">1. Submitted</span>
          <span class="text-muted">&rarr;</span>
          <span class="progress-pill rejected">2. Rejected by Reviewer</span>
        </div>`;
      }
      const step = status === 'Returned' ? 3 : status === 'Approved' ? 2 : 1;
      return `<div class="progress-steps">
        <span class="progress-pill ${step > 1 ? 'done' : 'current'}">1. Pending Review</span>
        <span class="text-muted">&rarr;</span>
        <span class="progress-pill ${step > 2 ? 'done' : step === 2 ? 'current' : ''}">2. Approved</span>
        <span class="text-muted">&rarr;</span>
        <span class="progress-pill ${step === 3 ? 'done' : ''}">3. Returned</span>
      </div>`;
    };

    return `
      <div class="container page-section fade-in">
        <div class="section-head">
          <div>
            <h1 class="section-title" style="font-size:28px;">My Reports &amp; Claims</h1>
            <p class="section-subtitle">
              Viewing workspace for demo profile <strong>${U().escapeHtml(user.name)}</strong> (${U().escapeHtml(user.title)}). Switch demo profiles in the top-right header to test ownership permissions.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a href="#/report/lost" class="btn btn-primary btn-sm">${icon('plusCircle')} Report Lost</a>
            <a href="#/report/found" class="btn btn-teal btn-sm">${icon('plusCircle')} Report Found</a>
          </div>
        </div>

        <div class="tabs-bar">
          <button type="button" class="tab-btn ${tab === 'reports' ? 'active' : ''}" data-action="my-reports-tab" data-tab="reports">
            My Created Reports <span class="tab-count">${myReports.length}</span>
          </button>
          <button type="button" class="tab-btn ${tab === 'claims' ? 'active' : ''}" data-action="my-reports-tab" data-tab="claims">
            My Submitted Claims <span class="tab-count">${myClaims.length}</span>
          </button>
          <button type="button" class="tab-btn ${tab === 'incoming' ? 'active' : ''}" data-action="my-reports-tab" data-tab="incoming">
            Claims on My Items <span class="tab-count">${incomingClaims.length}</span>
          </button>
        </div>

        ${
          tab === 'reports'
            ? myReports.length === 0
              ? `<div class="card empty-state">
                  <div class="empty-icon">${icon('folder', 'icon-lg')}</div>
                  <h3 style="margin:0;">No reports created by ${U().escapeHtml(user.name)}</h3>
                  <p class="text-sm text-muted mt-2">Create a lost or found report, or switch demo profiles to view another user&apos;s reports.</p>
                  <div class="hero-ctas mt-4">
                    <a href="#/report/lost" class="btn btn-primary">Report Lost Item</a>
                    <a href="#/report/found" class="btn btn-teal">Report Found Item</a>
                  </div>
                </div>`
              : `<div style="display:flex;flex-direction:column;gap:14px;">
                  ${myReports
                    .map((r) => {
                      const claimCount = state.claims.filter((c) => c.reportId === r.id).length;
                      return `<div class="card card-pad">
                        <div class="flex flex-wrap items-center justify-between gap-4">
                          <div class="flex items-center gap-4" style="min-width:0;flex:1;">
                            <a href="#/item/${U().escapeHtml(r.id)}" style="width:96px;height:74px;border-radius:12px;overflow:hidden;flex-shrink:0;background:var(--bg-subtle);">
                              ${C().imgWithFallback(r)}
                            </a>
                            <div style="min-width:0;">
                              <div class="flex flex-wrap items-center gap-2">
                                ${C().typeBadge(r.type)}
                                ${C().statusBadge(r.status)}
                                <span class="mono text-xs text-muted">${U().escapeHtml(r.id)}</span>
                                ${claimCount > 0 ? `<span class="badge badge-pending">${claimCount} ${claimCount === 1 ? 'claim' : 'claims'}</span>` : ''}
                              </div>
                              <a href="#/item/${U().escapeHtml(r.id)}" style="display:block;font-weight:750;font-size:16px;margin-top:6px;">${U().escapeHtml(r.title)}</a>
                              <div class="text-xs text-muted mt-2">
                                ${U().escapeHtml(r.category)} · ${U().escapeHtml(r.location)} · ${U().escapeHtml(U().formatDate(r.date))}
                              </div>
                            </div>
                          </div>

                          <div class="flex flex-wrap items-center gap-2">
                            <a href="#/item/${U().escapeHtml(r.id)}" class="btn btn-secondary btn-sm">View</a>
                            <button type="button" class="btn btn-secondary btn-sm" data-action="open-edit-modal" data-id="${U().escapeHtml(r.id)}">${icon('edit', 'icon-sm')} Edit</button>
                            ${
                              r.status !== 'Returned'
                                ? `<button type="button" class="btn btn-emerald btn-sm" data-action="confirm-mark-returned" data-id="${U().escapeHtml(r.id)}">${icon('packageCheck', 'icon-sm')} Mark Returned</button>`
                                : ''
                            }
                            <button type="button" class="btn btn-danger-outline btn-sm" data-action="confirm-delete-report" data-id="${U().escapeHtml(r.id)}">${icon('trash', 'icon-sm')} Delete</button>
                          </div>
                        </div>
                      </div>`;
                    })
                    .join('')}
                </div>`
            : tab === 'claims'
            ? myClaims.length === 0
              ? `<div class="card empty-state">
                  <div class="empty-icon">${icon('shieldCheck', 'icon-lg')}</div>
                  <h3 style="margin:0;">No submitted claims yet</h3>
                  <p class="text-sm text-muted mt-2">When you click &ldquo;I Think This Is Mine&rdquo; on a found item, your claim progress appears here.</p>
                  <div class="mt-4"><a href="#/explore?type=found" class="btn btn-primary">Browse Found Items</a></div>
                </div>`
              : `<div style="display:flex;flex-direction:column;gap:14px;">
                  ${myClaims
                    .map((c) => {
                      const rep = state.reports.find((r) => r.id === c.reportId);
                      return `<div class="card claim-card">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <div class="flex flex-wrap items-center gap-2">
                            ${C().claimStatusBadge(c.status)}
                            <span class="mono text-xs text-muted">${U().escapeHtml(c.id)}</span>
                            <span class="text-xs text-muted">Submitted ${U().escapeHtml(U().formatDateTime(c.createdAt))}</span>
                          </div>
                          ${rep ? `<a href="#/item/${U().escapeHtml(rep.id)}" class="btn btn-secondary btn-sm">View Item ${icon('arrowRight', 'icon-sm')}</a>` : ''}
                        </div>
                        <h3 style="margin:10px 0 4px;font-size:16px;">${
                          rep ? U().escapeHtml(rep.title) : `Report ${U().escapeHtml(c.reportId)}`
                        }</h3>
                        <p class="text-sm text-muted" style="margin:0;"><strong>Your verification answer:</strong> ${U().escapeHtml(c.verificationAnswer)}</p>
                        ${renderClaimProgress(c.status)}
                        ${
                          c.adminNote
                            ? `<div class="callout callout-blue mt-3" style="padding:10px 12px;">
                                <span>${icon('info', 'icon-sm')}</span>
                                <div><strong>Reviewer Note:</strong> ${U().escapeHtml(c.adminNote)}</div>
                              </div>`
                            : ''
                        }
                      </div>`;
                    })
                    .join('')}
                </div>`
            : incomingClaims.length === 0
            ? `<div class="card empty-state">
                <div class="empty-icon">${icon('fileText', 'icon-lg')}</div>
                <h3 style="margin:0;">No incoming claims on your reports</h3>
                <p class="text-sm text-muted mt-2">When someone submits a claim on one of your listings, its review status will appear here.</p>
              </div>`
            : `<div style="display:flex;flex-direction:column;gap:14px;">
                ${incomingClaims
                  .map((c) => {
                    const rep = state.reports.find((r) => r.id === c.reportId);
                    return `<div class="card claim-card">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <div class="flex flex-wrap items-center gap-2">
                          ${C().claimStatusBadge(c.status)}
                          <span class="mono text-xs text-muted">${U().escapeHtml(c.id)}</span>
                        </div>
                        <span class="text-xs text-muted">${U().escapeHtml(U().formatDateTime(c.createdAt))}</span>
                      </div>
                      <h3 style="margin:8px 0 4px;font-size:15.5px;">${rep ? U().escapeHtml(rep.title) : U().escapeHtml(c.reportId)}</h3>
                      <p class="text-sm text-muted" style="margin:0;">
                        Submitted by <strong>${U().escapeHtml(U().getPublicReporterLabel(c.claimantName))}</strong> · Contact shielded until Admin review &amp; handoff.
                      </p>
                      ${
                        c.adminNote
                          ? `<p class="text-xs text-muted mt-2" style="margin-bottom:0;"><strong>Staff note:</strong> ${U().escapeHtml(c.adminNote)}</p>`
                          : ''
                      }
                    </div>`;
                  })
                  .join('')}
              </div>`
        }
      </div>
    `;
  }

  /* ========================================================================
     6. ADMIN DASHBOARD
     ======================================================================== */
  function renderAdminClaimsListHtml() {
    const state = S().getState();
    const q = pageState.adminClaimSearch.trim().toLowerCase();
    const statusFilter = pageState.adminClaimStatus;

    const claims = state.claims.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (q) {
        const rep = state.reports.find((r) => r.id === c.reportId);
        const blob = [
          c.id,
          c.reportId,
          c.claimantName,
          c.itemDescription,
          c.verificationAnswer,
          rep ? rep.title : '',
          rep ? rep.location : '',
        ]
          .join(' ')
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    if (claims.length === 0) {
      return `<div class="card empty-state">
        <div class="empty-icon">${icon('shieldCheck', 'icon-lg')}</div>
        <h3 style="margin:0;">No claims match this filter</h3>
        <p class="text-sm text-muted mt-2">Adjust the search or status filter to see other claim requests.</p>
      </div>`;
    }

    return `<div style="display:flex;flex-direction:column;gap:16px;">
      ${claims
        .map((c) => {
          const rep = state.reports.find((r) => r.id === c.reportId);
          const isPending = c.status === 'Pending Review';
          const isApproved = c.status === 'Approved';
          const isFinal = c.status === 'Rejected' || c.status === 'Returned';
          const itemReturned = rep && rep.status === 'Returned';

          return `<div class="card claim-card">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                ${C().claimStatusBadge(c.status)}
                <span class="mono text-xs text-muted">${U().escapeHtml(c.id)}</span>
                <span class="badge badge-neutral">${c.claimType === 'finder_handoff' ? 'Finder Handoff' : 'Ownership Claim'}</span>
                <span class="text-xs text-muted">${U().escapeHtml(U().formatDateTime(c.createdAt))}</span>
              </div>
              ${
                rep
                  ? `<a href="#/item/${U().escapeHtml(rep.id)}" class="btn btn-secondary btn-sm">Inspect Item (${U().escapeHtml(rep.id)})</a>`
                  : ''
              }
            </div>

            <div class="claim-compare-grid">
              <div class="compare-box">
                <div class="info-tile-label">Reported Item &amp; Private Verification Hint</div>
                <div style="font-weight:750;font-size:15px;margin-top:4px;">${rep ? U().escapeHtml(rep.title) : 'Deleted report'}</div>
                ${
                  rep
                    ? `<div class="text-xs text-muted mt-2">${U().escapeHtml(rep.category)} · ${U().escapeHtml(rep.location)} · ${U().escapeHtml(U().formatDate(rep.date))}</div>
                      <div class="mt-2 text-xs"><strong>Reporter:</strong> ${U().escapeHtml(rep.reporterName)} (${U().escapeHtml(rep.contactMethod)}: <span class="mono">${U().escapeHtml(rep.contactValue)}</span>)</div>
                      <div class="callout callout-indigo mt-2" style="padding:9px 11px;font-size:12.5px;">
                        <div><strong>Hidden Verification Hint:</strong> ${
                          rep.privateVerificationHint
                            ? U().escapeHtml(rep.privateVerificationHint)
                            : U().escapeHtml(rep.additionalNotes || 'No separate private hint provided.')
                        }</div>
                      </div>`
                    : ''
                }
              </div>

              <div class="compare-box">
                <div class="info-tile-label">Claimant Submission &amp; Verification Proof</div>
                <div style="font-weight:750;font-size:15px;margin-top:4px;">${U().escapeHtml(c.claimantName)}</div>
                <div class="text-xs text-muted mt-2">${U().escapeHtml(c.contactMethod)}: <span class="mono">${U().escapeHtml(c.contactValue)}</span></div>
                <div class="mt-2 text-xs"><strong>Description:</strong> ${U().escapeHtml(c.itemDescription)}</div>
                <div class="callout callout-blue mt-2" style="padding:9px 11px;font-size:12.5px;">
                  <div><strong>Ownership Proof Answer:</strong> ${U().escapeHtml(c.verificationAnswer)}</div>
                </div>
                ${c.lostContext ? `<div class="mt-2 text-xs text-muted"><strong>Context:</strong> ${U().escapeHtml(c.lostContext)}</div>` : ''}
              </div>
            </div>

            ${
              !isFinal && !itemReturned
                ? `<div class="mt-4" style="padding-top:14px;border-top:1px solid var(--border-soft);display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">
                    <input type="text" class="input" id="admin-note-${U().escapeHtml(c.id)}" value="${U().escapeHtml(c.adminNote || '')}" placeholder="Optional reviewer note (visible to claimant)..." style="flex:1;min-width:200px;" />
                    <div class="flex flex-wrap items-center gap-2">
                      <select class="select" style="width:auto;padding:7px 10px;font-size:12.5px;" data-claim-status-select="${U().escapeHtml(c.id)}" aria-label="Update claim status">
                        ${
                          isPending
                            ? `<option value="Pending Review" selected>Status: Pending Review</option>
                               <option value="Approved">Set: Approved</option>
                               <option value="Rejected">Set: Rejected</option>`
                            : `<option value="Approved" selected>Status: Approved</option>
                               <option value="Returned">Set: Returned</option>
                               <option value="Rejected">Set: Rejected</option>`
                        }
                      </select>
                      ${
                        isPending
                          ? `<button type="button" class="btn btn-indigo btn-sm" data-action="admin-claim-status" data-id="${U().escapeHtml(c.id)}" data-status="Approved">${icon('checkCircle', 'icon-sm')} Approve</button>
                             <button type="button" class="btn btn-danger-outline btn-sm" data-action="admin-claim-status" data-id="${U().escapeHtml(c.id)}" data-status="Rejected">${icon('xCircle', 'icon-sm')} Reject</button>`
                          : ''
                      }
                      ${
                        isApproved
                          ? `<button type="button" class="btn btn-emerald btn-sm" data-action="confirm-claim-returned" data-id="${U().escapeHtml(c.id)}">${icon('packageCheck', 'icon-sm')} Mark Returned</button>
                             <button type="button" class="btn btn-danger-outline btn-sm" data-action="admin-claim-status" data-id="${U().escapeHtml(c.id)}" data-status="Rejected">${icon('xCircle', 'icon-sm')} Reject</button>`
                          : ''
                      }
                    </div>
                  </div>`
                : `<div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted" style="padding-top:10px;border-top:1px solid var(--border-soft);">
                    <span><strong>Finalized Status:</strong> ${U().escapeHtml(c.status)}${c.adminNote ? ` — ${U().escapeHtml(c.adminNote)}` : ''}</span>
                    <span>Updated ${U().escapeHtml(U().formatDateTime(c.updatedAt))}</span>
                  </div>`
            }
          </div>`;
        })
        .join('')}
    </div>`;
  }

  function renderAdminReportsTableHtml() {
    const state = S().getState();
    const q = pageState.adminReportSearch.trim().toLowerCase();
    const typeF = pageState.adminReportType;
    const catF = pageState.adminReportCategory;
    const statusF = pageState.adminReportStatus;

    const list = state.reports.filter((r) => {
      if (typeF !== 'all' && r.type !== typeF) return false;
      if (catF !== 'all' && r.category !== catF) return false;
      if (statusF !== 'all' && r.status !== statusF) return false;
      if (q) {
        const blob = `${r.id} ${r.title} ${r.category} ${r.location} ${r.reporterName}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });

    if (list.length === 0) {
      return `<div class="card empty-state"><h3 style="margin:0;">No reports match this filter</h3></div>`;
    }

    return `
      <div class="card data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Location &amp; Date</th>
              <th>Reporter (Admin View)</th>
              <th>Status</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list
              .map((r) => {
                const isReturned = r.status === 'Returned';
                return `<tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <a href="#/item/${U().escapeHtml(r.id)}" style="width:46px;height:36px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg-subtle);">
                        ${C().imgWithFallback(r)}
                      </a>
                      <div>
                        <a href="#/item/${U().escapeHtml(r.id)}" style="font-weight:700;display:block;">${U().escapeHtml(r.title)}</a>
                        <span class="mono text-xs text-muted">${U().escapeHtml(r.id)} · ${U().escapeHtml(r.category)}</span>
                      </div>
                    </div>
                  </td>
                  <td>${C().typeBadge(r.type)}</td>
                  <td>
                    <div style="font-weight:600;">${U().escapeHtml(r.location)}</div>
                    <div class="text-xs text-muted">${U().escapeHtml(U().formatDate(r.date))}</div>
                  </td>
                  <td>
                    <div>${U().escapeHtml(r.reporterName)}</div>
                    <div class="mono text-xs text-muted">${U().escapeHtml(r.contactValue)}</div>
                  </td>
                  <td>${C().statusBadge(r.status)}</td>
                  <td style="text-align:right;white-space:nowrap;">
                    <div class="flex items-center gap-2" style="justify-content:flex-end;">
                      <button type="button" class="btn btn-secondary btn-sm" data-action="open-edit-modal" data-id="${U().escapeHtml(r.id)}" title="Edit">${icon('edit', 'icon-sm')}</button>
                      ${
                        !isReturned
                          ? `<button type="button" class="btn btn-emerald btn-sm" data-action="confirm-mark-returned" data-id="${U().escapeHtml(r.id)}" title="Mark Returned">${icon('packageCheck', 'icon-sm')} Return</button>`
                          : `<span class="text-xs text-muted">Completed</span>`
                      }
                      <button type="button" class="btn btn-danger-outline btn-sm" data-action="confirm-delete-report" data-id="${U().escapeHtml(r.id)}" title="Delete">${icon('trash', 'icon-sm')}</button>
                    </div>
                  </td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderAdmin() {
    const store = S();
    const admin = store.isAdmin();
    const stats = store.getStats();
    const storage = store.getStorageStats();

    if (!admin) {
      return `
        <div class="container page-section fade-in">
          <div class="card card-pad" style="max-width:620px;margin:28px auto;text-align:center;padding:42px 28px;">
            <div style="width:58px;height:58px;border-radius:16px;margin:0 auto;background:var(--indigo-50);color:var(--indigo-600);display:flex;align-items:center;justify-content:center;">
              ${icon('shield', 'icon-xl')}
            </div>
            <h1 style="margin:16px 0 8px;font-size:24px;">Admin Review Dashboard</h1>
            <p class="text-sm text-muted" style="max-width:460px;margin:0 auto;">
              You are currently browsing in <strong>Standard User Demo Mode</strong>. Switch to the clearly labeled Admin Demo Role to review pending claims, approve or reject ownership requests, mark items as returned, and manage records.
            </p>
            <div class="callout callout-amber mt-4" style="text-align:left;">
              <span>${icon('info')}</span>
              <div><strong>Demo Role Switcher Disclaimer:</strong> This role toggle is a local demonstration feature for MVP workflows and is not production authentication.</div>
            </div>
            <div class="mt-6">
              <button type="button" class="btn btn-indigo btn-lg" data-action="set-role" data-role="admin">
                ${icon('shield')} Switch to Admin Demo Mode
              </button>
            </div>
          </div>
        </div>
      `;
    }

    const tab = pageState.adminTab;
    return `
      <div class="container page-section fade-in">
        <div class="section-head">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="section-title" style="font-size:28px;">Admin Dashboard</h1>
              <span class="badge badge-claimed">${icon('shield', 'icon-sm')} Demo Admin Mode</span>
            </div>
            <p class="section-subtitle">Verify ownership claims, prevent false or duplicate returns, and manage all campus reports.</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-action="set-role" data-role="user">Switch Back to User Mode</button>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid" style="margin-top:0;margin-bottom:26px;">
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Total Lost Reports</span>
              <div class="kpi-icon" style="background:var(--rose-50);color:var(--rose-600);">${icon('search')}</div>
            </div>
            <div class="kpi-value">${stats.lostReports}</div>
            <div class="kpi-sub">Across all categories</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Total Found Reports</span>
              <div class="kpi-icon" style="background:var(--teal-50);color:var(--teal-600);">${icon('sparkles')}</div>
            </div>
            <div class="kpi-value">${stats.foundReports}</div>
            <div class="kpi-sub">Logged by campus finders</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Active Claims</span>
              <div class="kpi-icon" style="background:var(--amber-50);color:var(--amber-700);">${icon('clock')}</div>
            </div>
            <div class="kpi-value">${stats.activeClaims}</div>
            <div class="kpi-sub">${stats.pendingClaims} pending · ${stats.approvedClaims} approved</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-top">
              <span class="kpi-label">Successfully Returned</span>
              <div class="kpi-icon" style="background:var(--emerald-50);color:var(--emerald-600);">${icon('packageCheck')}</div>
            </div>
            <div class="kpi-value">${stats.returnedReports}</div>
            <div class="kpi-sub">${stats.recoveryRate}% claimed or returned</div>
          </div>
        </div>

        <div class="tabs-bar">
          <button type="button" class="tab-btn ${tab === 'claims' ? 'active' : ''}" data-action="admin-tab" data-tab="claims">
            Claim Requests <span class="tab-count">${stats.pendingClaims} pending</span>
          </button>
          <button type="button" class="tab-btn ${tab === 'reports' ? 'active' : ''}" data-action="admin-tab" data-tab="reports">
            All Reports <span class="tab-count">${stats.totalReports}</span>
          </button>
          <button type="button" class="tab-btn ${tab === 'data' ? 'active' : ''}" data-action="admin-tab" data-tab="data">
            Data &amp; Storage
          </button>
        </div>

        ${
          tab === 'claims'
            ? `<div class="card filter-bar">
                <div class="filter-top">
                  <div class="search-box">
                    <span class="search-icon">${icon('search')}</span>
                    <input id="admin-claim-search" class="input" value="${U().escapeHtml(pageState.adminClaimSearch)}" placeholder="Search claims by ID, claimant, item title, or answer..." />
                  </div>
                  <select id="admin-claim-status" class="select" style="width:auto;min-width:190px;">
                    <option value="all" ${pageState.adminClaimStatus === 'all' ? 'selected' : ''}>All Claim Statuses</option>
                    <option value="Pending Review" ${pageState.adminClaimStatus === 'Pending Review' ? 'selected' : ''}>Pending Review</option>
                    <option value="Approved" ${pageState.adminClaimStatus === 'Approved' ? 'selected' : ''}>Approved</option>
                    <option value="Returned" ${pageState.adminClaimStatus === 'Returned' ? 'selected' : ''}>Returned</option>
                    <option value="Rejected" ${pageState.adminClaimStatus === 'Rejected' ? 'selected' : ''}>Rejected</option>
                  </select>
                </div>
              </div>
              <div id="admin-claims-region">${renderAdminClaimsListHtml()}</div>`
            : tab === 'reports'
            ? `<div class="card filter-bar">
                <div class="filter-top">
                  <div class="search-box">
                    <span class="search-icon">${icon('search')}</span>
                    <input id="admin-report-search" class="input" value="${U().escapeHtml(pageState.adminReportSearch)}" placeholder="Search reports by ID, title, location, or reporter..." />
                  </div>
                  <select id="admin-report-type" class="select" style="width:auto;">
                    <option value="all" ${pageState.adminReportType === 'all' ? 'selected' : ''}>All Types</option>
                    <option value="lost" ${pageState.adminReportType === 'lost' ? 'selected' : ''}>Lost</option>
                    <option value="found" ${pageState.adminReportType === 'found' ? 'selected' : ''}>Found</option>
                  </select>
                  <select id="admin-report-category" class="select" style="width:auto;">
                    <option value="all">All Categories</option>
                    ${D().CATEGORIES.map((c) => `<option value="${U().escapeHtml(c.id)}" ${pageState.adminReportCategory === c.id ? 'selected' : ''}>${U().escapeHtml(c.label)}</option>`).join('')}
                  </select>
                  <select id="admin-report-status" class="select" style="width:auto;">
                    <option value="all" ${pageState.adminReportStatus === 'all' ? 'selected' : ''}>All Statuses</option>
                    <option value="Active" ${pageState.adminReportStatus === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Claimed" ${pageState.adminReportStatus === 'Claimed' ? 'selected' : ''}>Claimed</option>
                    <option value="Returned" ${pageState.adminReportStatus === 'Returned' ? 'selected' : ''}>Returned</option>
                  </select>
                </div>
              </div>
              <div id="admin-reports-region">${renderAdminReportsTableHtml()}</div>`
            : `<div class="charts-grid">
                <div class="card card-pad">
                  <h3 style="margin:0 0 8px;font-size:17px;">Browser localStorage Usage</h3>
                  <p class="text-sm text-muted" style="margin:0;">All reports, claims, resized photos, and notifications persist directly in your browser.</p>
                  <div class="mt-4">
                    <div class="flex items-center justify-between text-xs" style="font-weight:700;">
                      <span>Used: ${storage.kb} KB</span>
                      <span>${storage.percent}% of ~5 MB budget</span>
                    </div>
                    <div class="storage-bar-track">
                      <div class="storage-bar-fill" style="width:${Math.max(2, storage.percent)}%;"></div>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-6">
                    <button type="button" class="btn btn-primary" data-action="export-json">${icon('download')} Export Demo Records (JSON)</button>
                  </div>
                </div>

                <div class="card card-pad">
                  <h3 style="margin:0 0 8px;font-size:17px;">Reset Demo Application</h3>
                  <p class="text-sm text-muted" style="margin:0;">Restore FindIt to its original seeded demo reports, claims, and notifications. Any custom reports or status changes will be replaced.</p>
                  <div class="mt-6">
                    <button type="button" class="btn btn-danger-outline" data-action="confirm-reset-demo">${icon('rotateCcw')} Reset to Original Demo Data</button>
                  </div>
                </div>
              </div>`
        }
      </div>
    `;
  }

  function updateAdminDynamicRegion() {
    const claimsReg = document.getElementById('admin-claims-region');
    if (claimsReg) claimsReg.innerHTML = renderAdminClaimsListHtml();
    const repsReg = document.getElementById('admin-reports-region');
    if (repsReg) repsReg.innerHTML = renderAdminReportsTableHtml();
  }

  /* ========================================================================
     7. ACTIVITY & STATISTICS (LIVE PURE-SVG CHARTS)
     ======================================================================== */
  function buildSvgDonut(segments, centerLabel, centerValue) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const arcs =
      total === 0
        ? `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--bg-subtle)" stroke-width="20" />`
        : segments
            .filter((s) => s.value > 0)
            .map((s) => {
              const frac = s.value / total;
              const dash = frac * circumference;
              const gap = circumference - dash;
              const el = `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="${s.color}" stroke-width="20" stroke-dasharray="${dash.toFixed(
                2
              )} ${gap.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 80 80)"><title>${U().escapeHtml(
                s.label
              )}: ${s.value}</title></circle>`;
              offset += dash;
              return el;
            })
            .join('');

    return `
      <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${U().escapeHtml(centerLabel)}">
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--bg-subtle)" stroke-width="20" />
        ${arcs}
        <text x="80" y="76" text-anchor="middle" fill="var(--text-primary)" font-size="24" font-weight="800">${centerValue}</text>
        <text x="80" y="96" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-weight="600">${U().escapeHtml(centerLabel)}</text>
      </svg>
    `;
  }

  function renderAnalytics() {
    const store = S();
    const state = store.getState();
    const stats = store.getStats();

    // 1. Category distribution
    const catCounts = D().CATEGORIES.map((c) => ({
      label: c.label,
      color: c.color,
      count: state.reports.filter((r) => r.category === c.id).length,
    })).sort((a, b) => b.count - a.count);
    const maxCat = Math.max(1, ...catCounts.map((c) => c.count));

    // 2. Lost vs Found donut
    const lostFoundSegs = [
      { label: 'Lost Reports', value: stats.lostReports, color: '#E11D48' },
      { label: 'Found Reports', value: stats.foundReports, color: '#0D9488' },
    ];

    // 3. Active vs Claimed vs Returned donut
    const resolutionSegs = [
      { label: 'Active (Open)', value: stats.activeReports, color: '#2563EB' },
      { label: 'Claimed (Pickup)', value: stats.claimedReports, color: '#4F46E5' },
      { label: 'Returned (Resolved)', value: stats.returnedReports, color: '#059669' },
    ];

    // 4. Recent Activity Bar Chart (last 10 days bucketed into 5 two-day intervals or top dates)
    const buckets = [];
    for (let i = 4; i >= 0; i--) {
      const startDays = i * 2 + 1;
      const endDays = i * 2;
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - endDays);
      const label = i === 0 ? 'Last 2d' : `${endDays + 1}-${startDays + 1}d ago`;
      const reported = state.reports.filter((r) => {
        const diff = Math.floor((Date.now() - new Date(`${r.date}T12:00:00`).getTime()) / 86400000);
        return diff >= endDays && diff <= startDays;
      }).length;
      const returned = state.reports.filter((r) => {
        if (r.status !== 'Returned') return false;
        const diff = Math.floor((Date.now() - new Date(`${r.date}T12:00:00`).getTime()) / 86400000);
        return diff >= endDays && diff <= startDays;
      }).length;
      buckets.push({ label, reported, returned });
    }
    const maxBucket = Math.max(2, ...buckets.map((b) => Math.max(b.reported, b.returned)));

    // 5. Location Hotspots
    const locMap = {};
    state.reports.forEach((r) => {
      locMap[r.location] = (locMap[r.location] || 0) + 1;
    });
    const topLocations = Object.entries(locMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const maxLoc = Math.max(1, ...topLocations.map((l) => l.count));

    return `
      <div class="container page-section fade-in">
        <div class="section-head">
          <div>
            <h1 class="section-title" style="font-size:28px;">Activity &amp; Statistics</h1>
            <p class="section-subtitle">Real-time metrics and interactive visualizations calculated directly from saved FindIt records.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-secondary btn-sm" data-action="export-json">${icon('download', 'icon-sm')} Export JSON</button>
            <button type="button" class="btn btn-danger-outline btn-sm" data-action="confirm-reset-demo">${icon('rotateCcw', 'icon-sm')} Reset Demo Data</button>
          </div>
        </div>

        <div class="kpi-grid" style="margin-top:0;margin-bottom:24px;">
          <div class="card kpi-card">
            <div class="kpi-top"><span class="kpi-label">Total Reports</span><div class="kpi-icon" style="background:var(--blue-50);color:var(--blue-600);">${icon('package')}</div></div>
            <div class="kpi-value">${stats.totalReports}</div>
            <div class="kpi-sub">${stats.lostReports} lost · ${stats.foundReports} found</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-top"><span class="kpi-label">Items Returned</span><div class="kpi-icon" style="background:var(--emerald-50);color:var(--emerald-600);">${icon('packageCheck')}</div></div>
            <div class="kpi-value">${stats.returnedReports}</div>
            <div class="kpi-sub">Completed verified returns</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-top"><span class="kpi-label">Claim Requests</span><div class="kpi-icon" style="background:var(--indigo-50);color:var(--indigo-600);">${icon('shieldCheck')}</div></div>
            <div class="kpi-value">${stats.totalClaims}</div>
            <div class="kpi-sub">${stats.pendingClaims} pending review</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-top"><span class="kpi-label">Resolution Progress</span><div class="kpi-icon" style="background:var(--teal-50);color:var(--teal-600);">${icon('barChart')}</div></div>
            <div class="kpi-value">${stats.recoveryRate}%</div>
            <div class="kpi-sub">Claimed or returned items</div>
          </div>
        </div>

        <div class="charts-grid">
          <!-- Reports by Category -->
          <div class="card card-pad">
            <h2 style="margin:0 0 4px;font-size:17px;">Reports by Category</h2>
            <p class="text-xs text-muted" style="margin:0 0 18px;">Distribution across all lost and found item categories.</p>
            <div>
              ${catCounts
                .map(
                  (c) => `
                <div class="bar-row">
                  <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${U().escapeHtml(c.label)}</span>
                  <div class="bar-track">
                    <div class="bar-fill" style="width:${Math.round((c.count / maxCat) * 100)}%;background:${c.color};"></div>
                  </div>
                  <strong style="text-align:right;">${c.count}</strong>
                </div>`
                )
                .join('')}
            </div>
          </div>

          <!-- Lost vs Found Donut -->
          <div class="card card-pad">
            <h2 style="margin:0 0 4px;font-size:17px;">Lost vs Found Reports</h2>
            <p class="text-xs text-muted" style="margin:0 0 14px;">Comparison of reported missing items vs turned-in finds.</p>
            <div class="donut-layout">
              ${buildSvgDonut(lostFoundSegs, 'Total Items', stats.totalReports)}
              <div class="legend-list">
                ${lostFoundSegs
                  .map((s) => {
                    const pct = stats.totalReports ? Math.round((s.value / stats.totalReports) * 100) : 0;
                    return `<div class="legend-item">
                      <span class="meta-inline"><span class="legend-dot" style="background:${s.color};"></span><span>${s.label}</span></span>
                      <strong>${s.value} (${pct}%)</strong>
                    </div>`;
                  })
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Active vs Resolved Cases -->
          <div class="card card-pad">
            <h2 style="margin:0 0 4px;font-size:17px;">Active vs Resolved Cases</h2>
            <p class="text-xs text-muted" style="margin:0 0 14px;">Current lifecycle status across all reported items.</p>
            <div class="donut-layout">
              ${buildSvgDonut(resolutionSegs, 'Returned', stats.returnedReports)}
              <div class="legend-list">
                ${resolutionSegs
                  .map((s) => {
                    const pct = stats.totalReports ? Math.round((s.value / stats.totalReports) * 100) : 0;
                    return `<div class="legend-item">
                      <span class="meta-inline"><span class="legend-dot" style="background:${s.color};"></span><span>${s.label}</span></span>
                      <strong>${s.value} (${pct}%)</strong>
                    </div>`;
                  })
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Recent Activity & Returns SVG Bar Chart -->
          <div class="card card-pad">
            <h2 style="margin:0 0 4px;font-size:17px;">Recent Reports &amp; Returns</h2>
            <p class="text-xs text-muted" style="margin:0 0 14px;">Items reported vs returned over the last 10 days.</p>
            <svg viewBox="0 0 420 190" style="width:100%;height:auto;" role="img" aria-label="Recent reports and returns chart">
              <line x1="28" y1="150" x2="405" y2="150" stroke="var(--border)" stroke-width="1" />
              ${buckets
                .map((b, i) => {
                  const x = 44 + i * 74;
                  const hRep = Math.round((b.reported / maxBucket) * 110);
                  const hRet = Math.round((b.returned / maxBucket) * 110);
                  return `
                    <rect x="${x}" y="${150 - hRep}" width="22" height="${Math.max(2, hRep)}" rx="5" fill="#2563EB"><title>${b.label}: ${b.reported} reported</title></rect>
                    <rect x="${x + 26}" y="${150 - hRet}" width="22" height="${Math.max(2, hRet)}" rx="5" fill="#059669"><title>${b.label}: ${b.returned} returned</title></rect>
                    <text x="${x + 11}" y="${144 - hRep}" text-anchor="middle" fill="var(--text-muted)" font-size="10.5" font-weight="700">${b.reported}</text>
                    <text x="${x + 37}" y="${144 - hRet}" text-anchor="middle" fill="var(--emerald-600)" font-size="10.5" font-weight="700">${b.returned}</text>
                    <text x="${x + 24}" y="170" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-weight="600">${b.label}</text>
                  `;
                })
                .join('')}
            </svg>
            <div class="flex items-center gap-4 mt-2 text-xs text-muted" style="justify-content:center;">
              <span class="meta-inline"><span class="legend-dot" style="background:#2563EB;"></span> Reported</span>
              <span class="meta-inline"><span class="legend-dot" style="background:#059669;"></span> Returned</span>
            </div>
          </div>
        </div>

        <!-- Campus Location Hotspots -->
        <div class="card card-pad mt-6">
          <h2 style="margin:0 0 4px;font-size:17px;">Top Campus Locations</h2>
          <p class="text-xs text-muted" style="margin:0 0 18px;">Buildings and spaces with the highest lost &amp; found volume.</p>
          ${
            topLocations.length === 0
              ? `<p class="text-sm text-muted">No location data yet.</p>`
              : `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
                  ${topLocations
                    .map(
                      (loc) => `<div class="info-tile">
                        <div class="flex items-center justify-between text-sm">
                          <span style="font-weight:700;">${U().escapeHtml(loc.name)}</span>
                          <span class="badge badge-active">${loc.count} ${loc.count === 1 ? 'item' : 'items'}</span>
                        </div>
                        <div class="bar-track mt-2">
                          <div class="bar-fill" style="width:${Math.round((loc.count / maxLoc) * 100)}%;background:linear-gradient(90deg,var(--blue-600),var(--teal-600));"></div>
                        </div>
                      </div>`
                    )
                    .join('')}
                </div>`
          }
        </div>
      </div>
    `;
  }

  global.FindIt = global.FindIt || {};
  global.FindIt.Pages = {
    pageState,
    renderHome,
    renderExplore,
    updateExploreResultsOnly,
    renderReportUploadZoneHtml,
    renderReport,
    renderItemDetail,
    renderMyReports,
    renderAdmin,
    updateAdminDynamicRegion,
    renderAnalytics,
  };
})(window);
