(function (global) {
  'use strict';

  const icon = (name, cls) => global.FindIt.icon(name, cls);
  const U = () => global.FindIt.Utils;
  const D = () => global.FindIt.Data;
  const S = () => global.FindIt.Store;

  const uiState = {
    mobileMenuOpen: false,
    notifOpen: false,
    profileOpen: false,
    expandedMatches: new Set(),
  };

  function typeBadge(type) {
    const isLost = type === 'lost';
    return `<span class="badge ${isLost ? 'badge-lost' : 'badge-found'}">${icon(
      isLost ? 'search' : 'sparkles',
      'icon-sm'
    )} ${isLost ? 'LOST' : 'FOUND'}</span>`;
  }

  function statusBadge(status) {
    if (status === 'Returned') {
      return `<span class="badge badge-returned">${icon('packageCheck', 'icon-sm')} Returned</span>`;
    }
    if (status === 'Claimed') {
      return `<span class="badge badge-claimed">${icon('shieldCheck', 'icon-sm')} Claimed</span>`;
    }
    return `<span class="badge badge-active">${icon('clock', 'icon-sm')} Active</span>`;
  }

  function claimStatusBadge(status) {
    if (status === 'Approved') {
      return `<span class="badge badge-claimed">${icon('checkCircle', 'icon-sm')} Approved</span>`;
    }
    if (status === 'Rejected') {
      return `<span class="badge badge-rejected">${icon('xCircle', 'icon-sm')} Rejected</span>`;
    }
    if (status === 'Returned') {
      return `<span class="badge badge-returned">${icon('packageCheck', 'icon-sm')} Returned</span>`;
    }
    return `<span class="badge badge-pending">${icon('clock', 'icon-sm')} Pending Review</span>`;
  }

  function imgWithFallback(item, extraAttrs) {
    const fallback = U().getFallbackPlaceholder(item.category, item.title);
    const src = item.imageUrl ? U().escapeHtml(item.imageUrl) : fallback;
    return `<img src="${src}" alt="${U().escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}'" ${extraAttrs || ''} />`;
  }

  function itemCard(item, view) {
    const isList = view === 'list';
    return `
      <a href="#/item/${U().escapeHtml(item.id)}" class="card card-hover item-card ${isList ? 'item-card-list' : ''}">
        <div class="item-card-media">
          ${imgWithFallback(item)}
          <div class="item-card-badges">
            ${typeBadge(item.type)}
            ${statusBadge(item.status)}
          </div>
        </div>
        <div class="item-card-body">
          <div class="item-card-meta-top">
            <span class="badge badge-neutral">${icon('tag', 'icon-sm')} ${U().escapeHtml(item.category)}</span>
            <span class="mono text-xs text-muted">${U().escapeHtml(item.id)} ${
      item.isDemoSample ? '<span class="badge-demo">Demo</span>' : ''
    }</span>
          </div>
          <h3 class="item-card-title">${U().escapeHtml(item.title)}</h3>
          <p class="item-card-desc">${U().escapeHtml(item.description)}</p>
          <div class="item-card-footer">
            <div class="meta-inline">
              <span style="color:var(--blue-600)">${icon('mapPin', 'icon-sm')}</span>
              <span>${U().escapeHtml(item.location)}</span>
            </div>
            <div class="meta-row">
              <span class="meta-inline">
                <span style="color:var(--teal-600)">${icon('calendar', 'icon-sm')}</span>
                <span>${item.type === 'lost' ? 'Lost' : 'Found'} ${U().escapeHtml(U().formatDate(item.date))}</span>
              </span>
              <span style="color:var(--blue-600);font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                Details ${icon('arrowRight', 'icon-sm')}
              </span>
            </div>
          </div>
        </div>
      </a>
    `;
  }

  function matchCard(match) {
    const r = match.report;
    const expanded = uiState.expandedMatches.has(r.id);
    const scoreBadgeClass =
      match.score >= 80 ? 'badge-returned' : match.score >= 65 ? 'badge-claimed' : 'badge-active';

    return `
      <div class="card match-card">
        <div class="match-card-main">
          <a href="#/item/${U().escapeHtml(r.id)}" class="match-thumb">
            ${imgWithFallback(r)}
          </a>
          <div style="flex:1;min-width:0;">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                ${typeBadge(r.type)}
                ${statusBadge(r.status)}
                <span class="mono text-xs text-muted">${U().escapeHtml(r.id)}</span>
              </div>
              <span class="badge ${scoreBadgeClass}">${icon('sparkles', 'icon-sm')} ${match.score}% Suggested Match</span>
            </div>
            <a href="#/item/${U().escapeHtml(r.id)}" style="display:block;margin-top:8px;font-weight:750;font-size:15px;">
              ${U().escapeHtml(r.title)}
            </a>
            <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
              <span class="meta-inline">${icon('mapPin', 'icon-sm')} ${U().escapeHtml(r.location)}</span>
              <span class="meta-inline">${icon('calendar', 'icon-sm')} ${U().escapeHtml(U().formatDate(r.date))}</span>
              <span>Color: <strong>${U().escapeHtml(r.color)}</strong></span>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 mt-3">
              <button type="button" class="btn btn-ghost btn-sm" data-action="toggle-match-breakdown" data-id="${U().escapeHtml(r.id)}" style="padding-left:0;color:var(--indigo-600);">
                ${expanded ? 'Hide score breakdown' : 'Why this was suggested'}
                ${icon(expanded ? 'chevronUp' : 'chevronDown', 'icon-sm')}
              </button>
              <a href="#/item/${U().escapeHtml(r.id)}" style="font-size:12.5px;font-weight:700;color:var(--blue-600);display:inline-flex;align-items:center;gap:4px;">
                Inspect report ${icon('arrowRight', 'icon-sm')}
              </a>
            </div>
          </div>
        </div>
        ${
          expanded
            ? `<div class="match-breakdown fade-in">
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);">
                  Rule-Based Score Breakdown (Suggestion Only — Not Confirmed Ownership)
                </div>
                <div class="breakdown-grid">
                  ${match.breakdown
                    .map(
                      (row) => `
                    <div class="breakdown-row">
                      <div class="meta-inline" style="flex:1;min-width:0;">
                        <span style="color:${row.matched ? 'var(--emerald-600)' : 'var(--text-faint)'}">${icon(
                          row.matched ? 'check' : 'minus',
                          'icon-sm'
                        )}</span>
                        <strong>${U().escapeHtml(row.factor)}:</strong>
                        <span class="text-muted" title="${U().escapeHtml(row.detail)}">${U().escapeHtml(row.detail)}</span>
                      </div>
                      <span class="mono" style="font-weight:700;color:var(--indigo-600);font-size:11.5px;">+${row.points}/${row.max}</span>
                    </div>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }
      </div>
    `;
  }

  function renderNavbar(currentPath) {
    const root = document.getElementById('navbar-root');
    if (!root) return;
    const store = S();
    const state = store.getState();
    const stats = store.getStats();
    const user = store.getActiveUser();
    const admin = store.isAdmin();

    const links = [
      { hash: '#/explore', path: '/explore', label: 'Explore', ico: 'compass' },
      { hash: '#/report/lost', path: '/report', label: 'Report Item', ico: 'plusCircle' },
      { hash: '#/my-reports', path: '/my-reports', label: 'My Reports', ico: 'folder' },
      { hash: '#/analytics', path: '/analytics', label: 'Analytics', ico: 'barChart' },
      {
        hash: '#/admin',
        path: '/admin',
        label: 'Admin',
        ico: 'shield',
        count: stats.pendingClaims > 0 ? stats.pendingClaims : 0,
      },
    ];

    const linkHtml = (l) => {
      const active =
        l.path === '/report' ? currentPath.startsWith('/report') : currentPath === l.path;
      return `<a href="${l.hash}" class="nav-link ${active ? 'active' : ''}">
        <span style="display:inline-flex;align-items:center;gap:6px;">${icon(l.ico)} ${l.label}</span>
        ${l.count ? `<span class="nav-pill-count">${l.count}</span>` : ''}
      </a>`;
    };

    const notifMeta = (type) => {
      if (type === 'match') return { ico: 'sparkles', bg: 'var(--indigo-50)', fg: 'var(--indigo-600)' };
      if (type === 'claim_submitted') return { ico: 'fileText', bg: 'var(--amber-50)', fg: 'var(--amber-700)' };
      if (type === 'claim_approved') return { ico: 'checkCircle', bg: 'var(--blue-50)', fg: 'var(--blue-600)' };
      if (type === 'claim_rejected') return { ico: 'xCircle', bg: 'var(--rose-50)', fg: 'var(--rose-600)' };
      return { ico: 'packageCheck', bg: 'var(--emerald-50)', fg: 'var(--emerald-600)' };
    };

    root.innerHTML = `
      <div class="container navbar-inner">
        <a href="#/" class="brand-link">
          <div class="brand-mark">${icon('search', 'icon-md')}</div>
          <div>
            <div class="brand-title">Find<span>It</span></div>
            <span class="brand-sub">Campus Lost &amp; Found</span>
          </div>
        </a>

        <nav class="nav-links" aria-label="Main navigation">
          ${links.map(linkHtml).join('')}
        </nav>

        <div class="nav-actions">
          <div class="role-switcher" title="Demo Role Switcher (User vs Admin preview — not production auth)">
            <button type="button" class="role-btn ${!admin ? 'active-user' : ''}" data-action="set-role" data-role="user">User</button>
            <button type="button" class="role-btn ${admin ? 'active-admin' : ''}" data-action="set-role" data-role="admin">
              ${icon('shield', 'icon-sm')} Admin
            </button>
          </div>

          <!-- Notifications Popover -->
          <div class="popover-wrap">
            <button type="button" class="icon-btn" data-action="toggle-notif" aria-label="Notifications" title="Notifications">
              ${icon('bell')}
              ${
                stats.unreadNotifications > 0
                  ? `<span class="notif-dot">${stats.unreadNotifications > 9 ? '9+' : stats.unreadNotifications}</span>`
                  : ''
              }
            </button>
            ${
              uiState.notifOpen
                ? `<div class="popover-panel" role="region" aria-label="Notifications">
                    <div class="popover-header">
                      <div class="flex items-center gap-2">
                        <strong style="font-size:14px;">Notifications</strong>
                        ${
                          stats.unreadNotifications > 0
                            ? `<span class="badge badge-active">${stats.unreadNotifications} new</span>`
                            : ''
                        }
                      </div>
                      <div class="flex items-center gap-2">
                        ${
                          stats.unreadNotifications > 0
                            ? `<button type="button" class="btn btn-ghost btn-sm" data-action="read-all-notifs" style="padding:4px 8px;color:var(--blue-600);">${icon('checkCheck', 'icon-sm')} Read all</button>`
                            : ''
                        }
                        ${
                          state.notifications.length > 0
                            ? `<button type="button" class="icon-btn" style="width:28px;height:28px;" data-action="confirm-clear-notifs" title="Clear notifications" aria-label="Clear notifications">${icon('trash', 'icon-sm')}</button>`
                            : ''
                        }
                      </div>
                    </div>
                    <div class="popover-list">
                      ${
                        state.notifications.length === 0
                          ? `<div class="empty-state" style="padding:32px 16px;">
                              <div class="empty-icon" style="width:42px;height:42px;">${icon('bell')}</div>
                              <div style="font-weight:700;font-size:13.5px;">All caught up</div>
                              <p class="text-xs text-muted mt-2">Match suggestions and claim updates appear here.</p>
                            </div>`
                          : state.notifications
                              .map((n) => {
                                const m = notifMeta(n.type);
                                return `<button type="button" class="notif-item ${!n.read ? 'unread' : ''}" data-action="open-notif" data-id="${U().escapeHtml(n.id)}" data-report="${U().escapeHtml(n.reportId || '')}">
                                  <div class="notif-icon-box" style="background:${m.bg};color:${m.fg};">${icon(m.ico)}</div>
                                  <div style="flex:1;min-width:0;">
                                    <div class="flex items-center justify-between gap-2">
                                      <strong style="font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${U().escapeHtml(n.title)}</strong>
                                      <span class="text-xs text-muted" style="flex-shrink:0;">${U().escapeHtml(U().formatRelativeTime(n.createdAt))}</span>
                                    </div>
                                    <div class="text-xs text-muted" style="margin-top:3px;line-height:1.45;">${U().escapeHtml(n.message)}</div>
                                  </div>
                                </button>`;
                              })
                              .join('')
                      }
                    </div>
                  </div>`
                : ''
            }
          </div>

          <!-- Theme Toggle -->
          <button type="button" class="icon-btn" data-action="toggle-theme" aria-label="Toggle dark mode" title="${
            state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
          }">
            ${state.theme === 'dark' ? `<span style="color:#fbbf24">${icon('sun')}</span>` : icon('moon')}
          </button>

          <!-- Demo Profile Switcher -->
          <div class="popover-wrap">
            <button type="button" class="profile-btn" data-action="toggle-profile" aria-label="Switch demo profile">
              <div class="avatar ${user.avatarClass}">${U().escapeHtml(user.initials)}</div>
              <div class="profile-meta">
                <div class="profile-name">${U().escapeHtml(user.name)}</div>
                <div class="profile-sub">${admin ? 'Admin Demo' : 'Demo Profile'}</div>
              </div>
              ${icon('chevronDown', 'icon-sm')}
            </button>
            ${
              uiState.profileOpen
                ? `<div class="popover-panel" style="width:290px;padding:10px;">
                    <div style="padding:6px 10px 8px;">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-faint);">Demo Account Switcher</div>
                      <div class="text-xs text-muted" style="margin-top:2px;">Simulated profiles for MVP testing (no real login).</div>
                    </div>
                    ${D()
                      .DEMO_USERS.map((u) => {
                        const sel = u.id === user.id;
                        return `<button type="button" class="profile-option ${sel ? 'selected' : ''}" data-action="set-user" data-user="${u.id}">
                          <div class="avatar ${u.avatarClass}">${U().escapeHtml(u.initials)}</div>
                          <div style="flex:1;min-width:0;">
                            <div style="font-size:13.5px;font-weight:700;">${U().escapeHtml(u.name)}</div>
                            <div class="text-xs text-muted">${U().escapeHtml(u.title)}</div>
                          </div>
                          ${sel ? `<span style="color:var(--blue-600)">${icon('check')}</span>` : ''}
                        </button>`;
                      })
                      .join('')}
                    <div style="margin-top:8px;padding:10px 8px 4px;border-top:1px solid var(--border);">
                      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-faint);margin-bottom:8px;">Demo Role (Non-Auth Preview)</div>
                      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <button type="button" class="btn btn-sm ${!admin ? 'btn-primary' : 'btn-secondary'}" data-action="set-role" data-role="user">Standard User</button>
                        <button type="button" class="btn btn-sm ${admin ? 'btn-indigo' : 'btn-secondary'}" data-action="set-role" data-role="admin">Admin Mode</button>
                      </div>
                    </div>
                  </div>`
                : ''
            }
          </div>

          <button type="button" class="icon-btn mobile-menu-btn" data-action="toggle-mobile-menu" aria-label="Menu">
            ${icon(uiState.mobileMenuOpen ? 'x' : 'menu')}
          </button>
        </div>
      </div>

      ${
        uiState.mobileMenuOpen
          ? `<div class="mobile-drawer fade-in">
              <nav style="display:flex;flex-direction:column;gap:4px;">
                ${links.map(linkHtml).join('')}
              </nav>
            </div>`
          : ''
      }
    `;
  }

  function renderFooter() {
    const root = document.getElementById('footer-root');
    if (!root) return;
    const storage = S().getStorageStats();
    root.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="#/" class="brand-link">
              <div class="brand-mark" style="width:32px;height:32px;border-radius:10px;">${icon('search')}</div>
              <div class="brand-title" style="font-size:17px;">Find<span>It</span></div>
            </a>
            <p class="text-sm text-muted mt-3" style="max-width:440px;">
              A centralized Lost &amp; Found management platform designed for university campuses,
              offices, and public spaces. Runs 100% locally in your browser with privacy-first claim verification.
            </p>
            <div class="mt-3">
              <span class="badge badge-active">${icon('shieldCheck', 'icon-sm')} Private contact details are hidden on public item cards</span>
            </div>
          </div>

          <div>
            <h4 class="footer-heading">Platform</h4>
            <ul class="footer-links">
              <li><a href="#/explore">Browse Lost &amp; Found</a></li>
              <li><a href="#/report/lost">Report Lost Item</a></li>
              <li><a href="#/report/found">Report Found Item</a></li>
              <li><a href="#/analytics">Activity &amp; Statistics</a></li>
            </ul>
          </div>

          <div>
            <h4 class="footer-heading">Workspace &amp; Data</h4>
            <ul class="footer-links">
              <li><a href="#/my-reports">My Reports &amp; Claims</a></li>
              <li><a href="#/admin">Admin Review Queue</a></li>
              <li><button type="button" data-action="export-json" style="background:none;border:none;padding:0;color:inherit;font-size:inherit;">Export Records (JSON)</button></li>
              <li class="text-xs text-muted" style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                ${icon('database', 'icon-sm')} localStorage: ${storage.kb} KB used (${storage.percent}%)
              </li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>FindIt Campus MVP · Westbrook University Demo Environment</span>
          <span>Pure HTML, CSS &amp; JavaScript · Data saved in browser localStorage</span>
        </div>
      </div>
    `;
  }

  function renderToasts() {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const list = S().getToasts();
    root.innerHTML = list
      .map((t) => {
        const ico =
          t.variant === 'success' ? 'checkCircle' : t.variant === 'error' ? 'alertCircle' : 'info';
        const color =
          t.variant === 'success'
            ? 'var(--emerald-600)'
            : t.variant === 'error'
            ? 'var(--rose-600)'
            : 'var(--blue-600)';
        return `<div class="toast toast-${t.variant}">
          <span style="color:${color};margin-top:1px;">${icon(ico)}</span>
          <span style="flex:1;">${U().escapeHtml(t.message)}</span>
          <button type="button" data-action="dismiss-toast" data-id="${U().escapeHtml(t.id)}" style="background:none;border:none;color:var(--text-faint);padding:2px;" aria-label="Dismiss">${icon('x', 'icon-sm')}</button>
        </div>`;
      })
      .join('');
  }

  /* Confirmation Dialog */
  let pendingConfirmAction = null;
  function showConfirm(opts) {
    pendingConfirmAction = opts.onConfirm || null;
    const root = document.getElementById('confirm-root');
    if (!root) return;
    const isDanger = opts.variant !== 'primary';
    root.innerHTML = `
      <div class="modal-backdrop" data-action="close-confirm" role="dialog" aria-modal="true">
        <div class="modal-box modal-box-sm" onclick="event.stopPropagation()">
          <div class="modal-body" style="padding:24px;">
            <div style="display:flex;align-items:flex-start;gap:14px;">
              <div style="width:42px;height:42px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${
                isDanger ? 'var(--rose-50)' : 'var(--blue-50)'
              };color:${isDanger ? 'var(--rose-600)' : 'var(--blue-600)'};">
                ${icon('alertTriangle', 'icon-md')}
              </div>
              <div style="flex:1;">
                <h3 style="margin:0;font-size:16px;font-weight:750;">${U().escapeHtml(opts.title)}</h3>
                <p class="text-sm text-muted mt-2" style="margin-bottom:0;">${U().escapeHtml(opts.message)}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-action="close-confirm">Cancel</button>
            <button type="button" class="btn btn-sm ${isDanger ? 'btn-danger' : 'btn-primary'}" data-action="accept-confirm">${U().escapeHtml(opts.confirmLabel || 'Confirm')}</button>
          </div>
        </div>
      </div>
    `;
  }

  function closeConfirm() {
    pendingConfirmAction = null;
    const root = document.getElementById('confirm-root');
    if (root) root.innerHTML = '';
  }

  function acceptConfirm() {
    const fn = pendingConfirmAction;
    closeConfirm();
    if (typeof fn === 'function') fn();
  }

  /* Lightbox */
  function openLightbox(src, title) {
    const root = document.getElementById('lightbox-root');
    if (!root) return;
    root.innerHTML = `
      <div class="modal-backdrop" data-action="close-lightbox" style="background:rgba(2,6,23,0.86);">
        <div style="position:relative;text-align:center;" onclick="event.stopPropagation()">
          <button type="button" class="icon-btn" data-action="close-lightbox" style="position:absolute;top:-46px;right:0;background:rgba(255,255,255,0.14);color:#fff;border-color:rgba(255,255,255,0.25);" aria-label="Close photo">
            ${icon('x')}
          </button>
          <img src="${U().escapeHtml(src)}" alt="${U().escapeHtml(title || 'Photo')}" class="lightbox-img" />
          ${title ? `<p style="color:#e2e8f0;font-size:13.5px;margin-top:10px;font-weight:600;">${U().escapeHtml(title)}</p>` : ''}
        </div>
      </div>
    `;
  }

  function closeLightbox() {
    const root = document.getElementById('lightbox-root');
    if (root) root.innerHTML = '';
  }

  /* Claim Modal */
  function openClaimModal(reportId) {
    const report = S().getState().reports.find((r) => r.id === reportId);
    if (!report) return;
    const user = S().getActiveUser();
    const isFound = report.type === 'found';
    const root = document.getElementById('modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop" data-action="close-modal" role="dialog" aria-modal="true">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div class="modal-header" style="background:linear-gradient(90deg, var(--blue-50), var(--indigo-50));">
            <div class="flex items-center gap-3">
              <div style="width:40px;height:40px;border-radius:12px;background:var(--blue-600);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                ${icon('shieldCheck', 'icon-md')}
              </div>
              <div>
                <h2 style="margin:0;font-size:16.5px;font-weight:800;">${
                  isFound ? 'Submit Ownership Claim Request' : 'Report That You Found This Item'
                }</h2>
                <p class="text-xs text-muted" style="margin:2px 0 0;">For <strong>${U().escapeHtml(report.title)}</strong> (${U().escapeHtml(report.id)})</p>
              </div>
            </div>
            <button type="button" class="icon-btn" style="width:32px;height:32px;" data-action="close-modal" aria-label="Close">${icon('x')}</button>
          </div>

          <div id="claim-modal-content" class="modal-body">
            <div class="callout callout-blue mb-4">
              <span>${icon('lock')}</span>
              <div>
                <strong>Privacy &amp; Verification Safeguard:</strong> Your contact details and ownership verification details stay private for review staff. Claims are manually reviewed and never automatically approved.
              </div>
            </div>

            <div id="claim-form-error" class="callout callout-rose mb-4" style="display:none;"></div>

            <form id="claim-request-form" data-report-id="${U().escapeHtml(report.id)}">
              <div class="form-grid">
                <div>
                  <label class="field-label" for="claim-name">Your Full Name *</label>
                  <input id="claim-name" name="claimantName" class="input" value="${U().escapeHtml(user.name)}" required />
                </div>
                <div>
                  <label class="field-label" for="claim-method">Preferred Contact Method *</label>
                  <select id="claim-method" name="contactMethod" class="select">
                    ${D().CONTACT_METHODS.map((m) => `<option value="${U().escapeHtml(m.id)}">${U().escapeHtml(m.label)}</option>`).join('')}
                  </select>
                </div>
                <div class="span-2">
                  <label class="field-label" for="claim-contact">Contact Information (Private) *</label>
                  <input id="claim-contact" name="contactValue" class="input" value="${U().escapeHtml(user.email)}" placeholder="name@westbrook.edu or phone" required />
                </div>
                <div class="span-2">
                  <label class="field-label" for="claim-desc">${
                    isFound
                      ? 'Describe the item in your own words *'
                      : 'Describe the item you found and where it is safely stored *'
                  }</label>
                  <textarea id="claim-desc" name="itemDescription" class="textarea" placeholder="${
                    isFound
                      ? 'Brand, approximate size, accessories, or general wear...'
                      : 'Where you found it, its condition, and what campus desk has it...'
                  }" required></textarea>
                </div>
                <div class="span-2">
                  <div class="callout callout-indigo" style="flex-direction:column;gap:8px;">
                    <label class="field-label" for="claim-verify" style="margin:0;color:inherit;">
                      ${
                        isFound
                          ? 'Private Ownership-Verification Question *'
                          : 'Private Handoff Verification Detail *'
                      }
                    </label>
                    <p class="text-xs" style="margin:0;opacity:0.9;">
                      ${
                        isFound
                          ? 'Share at least one unique physical feature, hidden scratch, engraving, sticker, contents, or ID/tag code that is NOT publicly visible.'
                          : 'Include a unique mark on the found item or the desk locker reference so staff can verify the handoff.'
                      }
                    </p>
                    <textarea id="claim-verify" name="verificationAnswer" class="textarea" placeholder="e.g. Scuff mark next to USB-C port, green key tag B-214, initials inside flap..." required></textarea>
                  </div>
                </div>
                <div class="span-2">
                  <label class="field-label" for="claim-context">${
                    isFound
                      ? 'When & where did you likely lose it? (Optional)'
                      : 'Pickup / Handoff availability (Optional)'
                  }</label>
                  <input id="claim-context" name="lostContext" class="input" placeholder="e.g. Around 2 PM near Science Library 2nd floor" />
                </div>
              </div>

              <div class="modal-footer" style="padding:18px 0 0;margin-top:18px;">
                <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
                <button type="submit" class="btn btn-primary">${icon('shieldCheck')} ${
                  isFound ? 'Submit Claim for Review' : 'Submit Found Handoff'
                }</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  /* Edit Report Modal */
  let editImageDataUrl = null;
  function openEditModal(reportId) {
    const report = S().getState().reports.find((r) => r.id === reportId);
    if (!report) return;
    editImageDataUrl = report.imageUrl || '';
    const root = document.getElementById('modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="modal-backdrop" data-action="close-modal" role="dialog" aria-modal="true">
        <div class="modal-box" style="max-width:640px;" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 style="margin:0;font-size:16.5px;font-weight:800;">Edit Report (${U().escapeHtml(report.id)})</h2>
              <p class="text-xs text-muted" style="margin:2px 0 0;">Update your ${report.type === 'lost' ? 'Lost' : 'Found'} item listing details.</p>
            </div>
            <button type="button" class="icon-btn" style="width:32px;height:32px;" data-action="close-modal" aria-label="Close">${icon('x')}</button>
          </div>
          <div class="modal-body">
            <div id="edit-form-error" class="callout callout-rose mb-4" style="display:none;"></div>
            <form id="edit-report-form" data-report-id="${U().escapeHtml(report.id)}">
              <div class="form-grid">
                <div class="span-2">
                  <label class="field-label">Item Name *</label>
                  <input name="title" class="input" value="${U().escapeHtml(report.title)}" required />
                </div>
                <div>
                  <label class="field-label">Category *</label>
                  <select name="category" class="select">
                    ${D().CATEGORIES.map((c) => `<option value="${U().escapeHtml(c.id)}" ${c.id === report.category ? 'selected' : ''}>${U().escapeHtml(c.label)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="field-label">Primary Color *</label>
                  <select name="color" class="select">
                    ${D().COLORS.map((c) => `<option value="${U().escapeHtml(c.name)}" ${c.name === report.color ? 'selected' : ''}>${U().escapeHtml(c.name)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="field-label">Date ${report.type === 'lost' ? 'Lost' : 'Found'} *</label>
                  <input type="date" name="date" max="${U().getTodayInputDate()}" class="input" value="${U().escapeHtml(report.date)}" required />
                </div>
                <div>
                  <label class="field-label">General Location *</label>
                  <select name="location" class="select">
                    ${D().LOCATIONS.map((l) => `<option value="${U().escapeHtml(l.id)}" ${l.id === report.location ? 'selected' : ''}>${U().escapeHtml(l.label)}</option>`).join('')}
                  </select>
                </div>
                <div class="span-2">
                  <label class="field-label">Specific Area (Optional)</label>
                  <input name="specificLocation" class="input" value="${U().escapeHtml(report.specificLocation || '')}" />
                </div>
                <div class="span-2">
                  <label class="field-label">Public Description *</label>
                  <textarea name="description" class="textarea" required>${U().escapeHtml(report.description)}</textarea>
                </div>
                ${
                  report.type === 'found'
                    ? `<div class="span-2">
                        <label class="field-label" style="color:var(--indigo-600);">Private Verification Hint (Admin-only, hidden publicly)</label>
                        <textarea name="privateVerificationHint" class="textarea" style="min-height:66px;">${U().escapeHtml(report.privateVerificationHint || '')}</textarea>
                      </div>`
                    : ''
                }
                <div>
                  <label class="field-label">Contact Method</label>
                  <select name="contactMethod" class="select">
                    ${D().CONTACT_METHODS.map((m) => `<option value="${U().escapeHtml(m.id)}" ${m.id === report.contactMethod ? 'selected' : ''}>${U().escapeHtml(m.label)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="field-label">Contact Value (Private) *</label>
                  <input name="contactValue" class="input" value="${U().escapeHtml(report.contactValue || '')}" required />
                </div>
                <div class="span-2">
                  <label class="field-label">Additional Notes</label>
                  <input name="additionalNotes" class="input" value="${U().escapeHtml(report.additionalNotes || '')}" />
                </div>
                <div class="span-2">
                  <label class="field-label">Photograph</label>
                  <div class="flex flex-wrap items-center gap-3">
                    <img id="edit-photo-preview" src="${
                      editImageDataUrl
                        ? U().escapeHtml(editImageDataUrl)
                        : U().getFallbackPlaceholder(report.category, report.title)
                    }" alt="Preview" style="width:110px;height:82px;object-fit:cover;border-radius:10px;border:1px solid var(--border);" />
                    <label class="btn btn-secondary btn-sm">
                      ${icon('upload', 'icon-sm')} Replace Photo
                      <input type="file" id="edit-photo-input" accept="image/*" style="display:none;" />
                    </label>
                    <button type="button" class="btn btn-danger-outline btn-sm" id="edit-photo-remove">
                      ${icon('trash', 'icon-sm')} Remove Photo
                    </button>
                  </div>
                </div>
              </div>
              <div class="modal-footer" style="padding:18px 0 0;margin-top:18px;">
                <button type="button" class="btn btn-secondary" data-action="close-modal">Cancel</button>
                <button type="submit" class="btn btn-primary">${icon('check')} Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    const fileInput = document.getElementById('edit-photo-input');
    const preview = document.getElementById('edit-photo-preview');
    const removeBtn = document.getElementById('edit-photo-remove');

    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const resized = await U().resizeImageToDataUrl(file);
          editImageDataUrl = resized.dataUrl;
          preview.src = resized.dataUrl;
        } catch (err) {
          S().addToast(err.message, 'error');
        }
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        editImageDataUrl = '';
        preview.src = U().getFallbackPlaceholder(report.category, report.title);
      });
    }
  }

  function getEditImageDataUrl() {
    return editImageDataUrl;
  }

  function closeModal() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
  }

  global.FindIt = global.FindIt || {};
  global.FindIt.Components = {
    uiState,
    typeBadge,
    statusBadge,
    claimStatusBadge,
    imgWithFallback,
    itemCard,
    matchCard,
    renderNavbar,
    renderFooter,
    renderToasts,
    showConfirm,
    closeConfirm,
    acceptConfirm,
    openLightbox,
    closeLightbox,
    openClaimModal,
    openEditModal,
    getEditImageDataUrl,
    closeModal,
  };
})(window);
