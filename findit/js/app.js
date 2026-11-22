(function (global) {
  'use strict';

  const U = () => global.FindIt.Utils;
  const S = () => global.FindIt.Store;
  const C = () => global.FindIt.Components;
  const P = () => global.FindIt.Pages;

  function parseRoute() {
    const raw = (global.location.hash || '#/').replace(/^#/, '');
    const [pathPart, queryPart] = raw.split('?');
    const path = pathPart && pathPart.startsWith('/') ? pathPart : '/';
    const params = new URLSearchParams(queryPart || '');
    return { path, params };
  }

  function navigate(hashPath) {
    if (global.location.hash === hashPath) {
      renderApp();
    } else {
      global.location.hash = hashPath;
    }
  }

  function renderApp(scrollTop) {
    const { path, params } = parseRoute();
    const main = document.getElementById('main-root');
    if (!main) return;

    C().renderNavbar(path);
    C().renderFooter();
    C().renderToasts();

    let html = '';
    if (path === '/' || path === '') {
      html = P().renderHome();
    } else if (path === '/explore') {
      html = P().renderExplore(params);
    } else if (path === '/report/lost') {
      html = P().renderReport('lost');
    } else if (path === '/report/found') {
      html = P().renderReport('found');
    } else if (path.startsWith('/item/')) {
      const id = decodeURIComponent(path.slice('/item/'.length));
      html = P().renderItemDetail(id);
    } else if (path === '/my-reports') {
      html = P().renderMyReports();
    } else if (path === '/admin') {
      html = P().renderAdmin();
    } else if (path === '/analytics') {
      html = P().renderAnalytics();
    } else {
      html = P().renderHome();
    }

    main.innerHTML = html;
    bindPageControls(path);
    if (scrollTop) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function bindPageControls(path) {
    // Home hero search
    const heroForm = document.getElementById('hero-search-form');
    if (heroForm) {
      heroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('hero-search-input');
        const q = input ? input.value.trim() : '';
        P().pageState.explore.q = q;
        navigate(q ? `#/explore?q=${encodeURIComponent(q)}` : '#/explore');
      });
    }

    // Explorer live filters (update results region without stealing input focus!)
    if (path === '/explore') {
      const searchEl = document.getElementById('explore-search');
      if (searchEl) {
        searchEl.addEventListener('input', (e) => {
          P().pageState.explore.q = e.target.value;
          const clr = document.getElementById('explore-search-clear');
          if (clr) clr.style.display = e.target.value ? 'block' : 'none';
          P().updateExploreResultsOnly();
        });
      }
      const bindSelect = (id, key, rerenderWhole) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', (e) => {
          P().pageState.explore[key] = e.target.value;
          if (rerenderWhole) renderApp();
          else P().updateExploreResultsOnly();
        });
      };
      bindSelect('explore-category', 'category');
      bindSelect('explore-location', 'location');
      bindSelect('explore-status', 'status');
      bindSelect('explore-sort', 'sort');
      bindSelect('explore-date-range', 'dateRange', true);
      bindSelect('explore-from', 'customFrom');
      bindSelect('explore-to', 'customTo');
    }

    // Report Lost / Found form submit (photo upload handled via delegated change event to preserve typed fields)
    if (path === '/report/lost' || path === '/report/found') {
      const reportForm = document.getElementById('item-report-form');
      if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(reportForm);
          const type = reportForm.getAttribute('data-report-type') || 'lost';
          const payload = {
            type,
            title: String(fd.get('title') || ''),
            category: String(fd.get('category') || ''),
            date: String(fd.get('date') || ''),
            location: String(fd.get('location') || ''),
            specificLocation: String(fd.get('specificLocation') || ''),
            color: String(fd.get('color') || P().pageState.report.selectedColor || 'Black'),
            description: String(fd.get('description') || ''),
            privateVerificationHint: String(fd.get('privateVerificationHint') || ''),
            reporterName: String(fd.get('reporterName') || ''),
            contactMethod: String(fd.get('contactMethod') || 'Campus Email'),
            contactValue: String(fd.get('contactValue') || ''),
            additionalNotes: String(fd.get('additionalNotes') || ''),
            imageUrl: P().pageState.report.photoDataUrl || '',
          };

          // Inline validation
          const errs = {};
          if (payload.title.trim().length < 3) errs.title = 'Please enter a descriptive item name (at least 3 characters).';
          if (!payload.category) errs.category = 'Please choose an item category.';
          if (!payload.date) errs.date = 'Please select the date.';
          else if (payload.date > U().getTodayInputDate()) errs.date = 'Date cannot be in the future.';
          if (!payload.location) errs.location = 'Please select a campus location.';
          if (payload.description.trim().length < 12) errs.description = 'Please enter a helpful description (at least 12 characters).';
          if (!payload.reporterName.trim()) errs.reporterName = 'Reporter name is required.';
          if (!payload.contactValue.trim()) errs.contactValue = 'Contact detail is required (kept private).';

          reportForm.querySelectorAll('[data-err]').forEach((el) => {
            const field = el.getAttribute('data-err');
            el.textContent = errs[field] || '';
          });

          if (Object.keys(errs).length > 0) {
            S().addToast('Please fix the highlighted fields before submitting.', 'error');
            return;
          }

          const result = S().createReport(payload);
          if (!result.ok) {
            if (result.quotaExceeded) {
              P().pageState.report.quotaError = true;
              P().pageState.report.lastPayload = payload;
              renderApp();
            }
            return;
          }

          P().pageState.report.photoDataUrl = '';
          P().pageState.report.photoSizeKb = 0;
          P().pageState.report.quotaError = false;
          P().pageState.report.lastPayload = null;
          P().pageState.report.submittedResult = {
            report: result.report,
            matches: result.matches || [],
          };
          renderApp(true);
        });
      }
    }

    // Admin live search & status filters
    if (path === '/admin') {
      const cSearch = document.getElementById('admin-claim-search');
      if (cSearch) {
        cSearch.addEventListener('input', (e) => {
          P().pageState.adminClaimSearch = e.target.value;
          P().updateAdminDynamicRegion();
        });
      }
      const cStatus = document.getElementById('admin-claim-status');
      if (cStatus) {
        cStatus.addEventListener('change', (e) => {
          P().pageState.adminClaimStatus = e.target.value;
          P().updateAdminDynamicRegion();
        });
      }
      const rSearch = document.getElementById('admin-report-search');
      if (rSearch) {
        rSearch.addEventListener('input', (e) => {
          P().pageState.adminReportSearch = e.target.value;
          P().updateAdminDynamicRegion();
        });
      }
      const rType = document.getElementById('admin-report-type');
      if (rType) {
        rType.addEventListener('change', (e) => {
          P().pageState.adminReportType = e.target.value;
          P().updateAdminDynamicRegion();
        });
      }
      const rCat = document.getElementById('admin-report-category');
      if (rCat) {
        rCat.addEventListener('change', (e) => {
          P().pageState.adminReportCategory = e.target.value;
          P().updateAdminDynamicRegion();
        });
      }
      const rStatus = document.getElementById('admin-report-status');
      if (rStatus) {
        rStatus.addEventListener('change', (e) => {
          P().pageState.adminReportStatus = e.target.value;
          P().updateAdminDynamicRegion();
        });
      }
    }
  }

  /* ========================================================================
     Global Delegated Event Handling (Clicks & Modal Forms)
     ======================================================================== */
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');

    // Close navbar popovers on outside click
    if (!e.target.closest('.popover-wrap')) {
      if (C().uiState.notifOpen || C().uiState.profileOpen) {
        C().uiState.notifOpen = false;
        C().uiState.profileOpen = false;
        C().renderNavbar(parseRoute().path);
      }
    }

    if (!target) return;
    const action = target.getAttribute('data-action');

    switch (action) {
      case 'toggle-theme':
        S().toggleTheme();
        break;
      case 'toggle-mobile-menu':
        C().uiState.mobileMenuOpen = !C().uiState.mobileMenuOpen;
        C().renderNavbar(parseRoute().path);
        break;
      case 'toggle-notif':
        C().uiState.notifOpen = !C().uiState.notifOpen;
        C().uiState.profileOpen = false;
        C().renderNavbar(parseRoute().path);
        break;
      case 'toggle-profile':
        C().uiState.profileOpen = !C().uiState.profileOpen;
        C().uiState.notifOpen = false;
        C().renderNavbar(parseRoute().path);
        break;
      case 'set-user':
        C().uiState.profileOpen = false;
        S().setActiveUserId(target.getAttribute('data-user'));
        break;
      case 'set-role':
        C().uiState.profileOpen = false;
        S().setActiveRole(target.getAttribute('data-role'));
        break;
      case 'read-all-notifs':
        S().markAllNotificationsRead();
        break;
      case 'confirm-clear-notifs':
        C().uiState.notifOpen = false;
        C().showConfirm({
          title: 'Clear all notifications?',
          message: 'This will remove all notifications from your local notification center.',
          confirmLabel: 'Clear All',
          onConfirm: () => S().clearNotifications(),
        });
        break;
      case 'open-notif': {
        const id = target.getAttribute('data-id');
        const repId = target.getAttribute('data-report');
        C().uiState.notifOpen = false;
        S().markNotificationRead(id);
        if (repId) navigate(`#/item/${encodeURIComponent(repId)}`);
        break;
      }
      case 'dismiss-toast':
        S().dismissToast(target.getAttribute('data-id'));
        break;
      case 'export-json':
        S().exportData();
        break;
      case 'confirm-reset-demo':
        C().showConfirm({
          title: 'Reset to original demo data?',
          message:
            'This will replace your current local reports, claims, and notifications with the original FindIt sample dataset.',
          confirmLabel: 'Reset Demo Data',
          onConfirm: () => {
            P().pageState.report.submittedResult = null;
            S().resetDemoData();
          },
        });
        break;
      case 'close-confirm':
        C().closeConfirm();
        break;
      case 'accept-confirm':
        C().acceptConfirm();
        break;
      case 'close-modal':
        C().closeModal();
        break;
      case 'open-lightbox':
        C().openLightbox(target.getAttribute('data-src'), target.getAttribute('data-title'));
        break;
      case 'close-lightbox':
        C().closeLightbox();
        break;

      // Explorer controls
      case 'explore-type':
        P().pageState.explore.type = target.getAttribute('data-val');
        renderApp();
        break;
      case 'explore-view':
        P().pageState.explore.view = target.getAttribute('data-val');
        renderApp();
        break;
      case 'clear-explore-search':
        P().pageState.explore.q = '';
        renderApp();
        break;
      case 'reset-explore':
        Object.assign(P().pageState.explore, {
          q: '',
          type: 'all',
          category: 'all',
          location: 'all',
          status: 'all',
          dateRange: 'all',
          customFrom: '',
          customTo: '',
        });
        navigate('#/explore');
        break;

      // Report form controls
      case 'pick-color': {
        const color = target.getAttribute('data-color');
        P().pageState.report.selectedColor = color;
        const hidden = document.getElementById('rep-color');
        if (hidden) hidden.value = color;
        document.querySelectorAll('#rep-color-chips .color-chip').forEach((btn) => {
          btn.classList.toggle('selected', btn.getAttribute('data-color') === color);
        });
        break;
      }
      case 'remove-report-photo': {
        P().pageState.report.photoDataUrl = '';
        P().pageState.report.photoSizeKb = 0;
        const zone = document.getElementById('report-upload-zone');
        if (zone) zone.innerHTML = P().renderReportUploadZoneHtml();
        break;
      }
      case 'report-another':
        P().pageState.report.submittedResult = null;
        P().pageState.report.photoDataUrl = '';
        renderApp(true);
        break;
      case 'retry-report-no-photo': {
        const last = P().pageState.report.lastPayload;
        if (!last) return;
        const res = S().createReport(Object.assign({}, last, { imageUrl: '' }));
        if (res.ok) {
          P().pageState.report.photoDataUrl = '';
          P().pageState.report.quotaError = false;
          P().pageState.report.lastPayload = null;
          P().pageState.report.submittedResult = {
            report: res.report,
            matches: res.matches || [],
          };
          renderApp(true);
        }
        break;
      }

      // Match breakdown toggle
      case 'toggle-match-breakdown': {
        const id = target.getAttribute('data-id');
        if (C().uiState.expandedMatches.has(id)) C().uiState.expandedMatches.delete(id);
        else C().uiState.expandedMatches.add(id);
        renderApp();
        break;
      }

      // Modals & Item Actions
      case 'open-claim-modal':
        C().openClaimModal(target.getAttribute('data-id'));
        break;
      case 'open-edit-modal':
        C().openEditModal(target.getAttribute('data-id'));
        break;
      case 'confirm-delete-report': {
        const id = target.getAttribute('data-id');
        C().showConfirm({
          title: `Delete report ${id}?`,
          message:
            'This permanently removes the item report and any associated claim requests from localStorage.',
          confirmLabel: 'Delete Report',
          onConfirm: () => {
            const res = S().deleteReport(id);
            if (res.ok && parseRoute().path === `/item/${id}`) {
              navigate('#/explore');
            }
          },
        });
        break;
      }
      case 'confirm-mark-returned': {
        const id = target.getAttribute('data-id');
        C().showConfirm({
          title: `Mark ${id} as Returned?`,
          message:
            'This marks the item as resolved and returned to its owner, closing any remaining pending claims. This cannot be undone.',
          confirmLabel: 'Confirm Return',
          variant: 'primary',
          onConfirm: () => S().markReportReturned(id, 'Confirmed return completed.'),
        });
        break;
      }

      // Tabs
      case 'my-reports-tab':
        P().pageState.myReportsTab = target.getAttribute('data-tab');
        renderApp();
        break;
      case 'admin-tab':
        P().pageState.adminTab = target.getAttribute('data-tab');
        renderApp();
        break;

      // Admin Claim Actions
      case 'admin-claim-status': {
        const id = target.getAttribute('data-id');
        const nextStatus = target.getAttribute('data-status');
        const noteEl = document.getElementById(`admin-note-${id}`);
        const note = noteEl ? noteEl.value : '';
        if (nextStatus === 'Rejected') {
          C().showConfirm({
            title: `Reject claim ${id}?`,
            message:
              'Rejected claims cannot be reopened. The claimant will receive a notification with your optional note.',
            confirmLabel: 'Reject Claim',
            onConfirm: () => S().updateClaimStatus(id, 'Rejected', note),
          });
        } else {
          S().updateClaimStatus(id, nextStatus, note);
        }
        break;
      }
      case 'confirm-claim-returned': {
        const id = target.getAttribute('data-id');
        const noteEl = document.getElementById(`admin-note-${id}`);
        const note = noteEl ? noteEl.value : '';
        C().showConfirm({
          title: `Complete return for claim ${id}?`,
          message:
            'This finalizes the claim and marks the item as Returned. Duplicate return completions are prevented once confirmed.',
          confirmLabel: 'Mark Returned',
          variant: 'primary',
          onConfirm: () => S().updateClaimStatus(id, 'Returned', note),
        });
        break;
      }
      default:
        break;
    }
  });

  // Delegated change handler for Report photo upload & Admin claim status dropdown
  document.addEventListener('change', async (e) => {
    if (e.target && e.target.id === 'rep-photo-input') {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const errEl = document.querySelector('[data-err="photo"]');
      if (errEl) errEl.textContent = '';
      try {
        const res = await U().resizeImageToDataUrl(file);
        P().pageState.report.photoDataUrl = res.dataUrl;
        P().pageState.report.photoSizeKb = res.sizeKb;
        const zone = document.getElementById('report-upload-zone');
        if (zone) zone.innerHTML = P().renderReportUploadZoneHtml();
      } catch (err) {
        if (errEl) errEl.textContent = err.message;
      }
      return;
    }

    const selectEl = e.target && e.target.closest('[data-claim-status-select]');
    if (selectEl) {
      const claimId = selectEl.getAttribute('data-claim-status-select');
      const nextStatus = selectEl.value;
      const noteEl = document.getElementById(`admin-note-${claimId}`);
      const note = noteEl ? noteEl.value : '';
      if (nextStatus === 'Rejected') {
        C().showConfirm({
          title: `Reject claim ${claimId}?`,
          message:
            'Rejected claims cannot be reopened. The claimant will receive a notification with your optional note.',
          confirmLabel: 'Reject Claim',
          onConfirm: () => S().updateClaimStatus(claimId, 'Rejected', note),
        });
        renderApp();
      } else if (nextStatus === 'Returned') {
        C().showConfirm({
          title: `Complete return for claim ${claimId}?`,
          message:
            'This finalizes the claim and marks the item as Returned. Duplicate return completions are prevented once confirmed.',
          confirmLabel: 'Mark Returned',
          variant: 'primary',
          onConfirm: () => S().updateClaimStatus(claimId, 'Returned', note),
        });
        renderApp();
      } else if (nextStatus === 'Approved') {
        S().updateClaimStatus(claimId, 'Approved', note);
      }
    }
  });

  // Delegated submit for Claim Modal & Edit Report Modal
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'claim-request-form') {
      e.preventDefault();
      const form = e.target;
      const reportId = form.getAttribute('data-report-id');
      const fd = new FormData(form);
      const data = {
        claimantName: String(fd.get('claimantName') || ''),
        contactMethod: String(fd.get('contactMethod') || 'Campus Email'),
        contactValue: String(fd.get('contactValue') || ''),
        itemDescription: String(fd.get('itemDescription') || ''),
        verificationAnswer: String(fd.get('verificationAnswer') || ''),
        lostContext: String(fd.get('lostContext') || ''),
      };

      const errBox = document.getElementById('claim-form-error');
      const showErr = (msg) => {
        if (errBox) {
          errBox.style.display = 'flex';
          errBox.innerHTML = `<span>${global.FindIt.icon('alertCircle')}</span><div>${U().escapeHtml(msg)}</div>`;
        }
      };

      if (!data.claimantName.trim()) return showErr('Please enter your full name.');
      if (!data.contactValue.trim()) return showErr('Please enter your private contact information.');
      if (data.itemDescription.trim().length < 12)
        return showErr('Please provide a clear description (at least 12 characters).');
      if (data.verificationAnswer.trim().length < 10)
        return showErr(
          'Please answer the private ownership-verification question with at least 10 characters.'
        );

      const res = S().submitClaim(reportId, data);
      if (!res.ok) return showErr(res.error);

      const content = document.getElementById('claim-modal-content');
      if (content) {
        content.innerHTML = `
          <div style="text-align:center;padding:12px 6px;">
            <div style="width:56px;height:56px;border-radius:16px;margin:0 auto;background:var(--emerald-50);color:var(--emerald-600);display:flex;align-items:center;justify-content:center;">
              ${global.FindIt.icon('checkCircle', 'icon-xl')}
            </div>
            <h3 style="margin:14px 0 6px;font-size:19px;">Claim Request Submitted</h3>
            <p class="text-sm text-muted">
              Reference <strong class="mono">${U().escapeHtml(res.claim.id)}</strong> is now <strong>Pending Review</strong>.
              Campus staff will manually verify your ownership details before approval.
            </p>
            <div class="callout callout-blue mt-4" style="text-align:left;">
              <span>${global.FindIt.icon('info')}</span>
              <div>Track status updates anytime in <strong>My Reports &rarr; My Submitted Claims</strong>, or switch to Admin Demo Mode to review it right away.</div>
            </div>
            <div class="hero-ctas mt-6">
              <a href="#/my-reports" class="btn btn-primary" data-action="close-modal">Track My Claim</a>
              <button type="button" class="btn btn-secondary" data-action="close-modal">Done</button>
            </div>
          </div>
        `;
      }
    }

    if (e.target && e.target.id === 'edit-report-form') {
      e.preventDefault();
      const form = e.target;
      const reportId = form.getAttribute('data-report-id');
      const fd = new FormData(form);
      const updates = {
        title: String(fd.get('title') || ''),
        category: String(fd.get('category') || ''),
        color: String(fd.get('color') || ''),
        date: String(fd.get('date') || ''),
        location: String(fd.get('location') || ''),
        specificLocation: String(fd.get('specificLocation') || ''),
        description: String(fd.get('description') || ''),
        privateVerificationHint:
          fd.get('privateVerificationHint') !== null
            ? String(fd.get('privateVerificationHint'))
            : undefined,
        contactMethod: String(fd.get('contactMethod') || ''),
        contactValue: String(fd.get('contactValue') || ''),
        additionalNotes: String(fd.get('additionalNotes') || ''),
        imageUrl: C().getEditImageDataUrl(),
      };

      const errBox = document.getElementById('edit-form-error');
      if (updates.title.trim().length < 3 || updates.description.trim().length < 10) {
        if (errBox) {
          errBox.style.display = 'flex';
          errBox.textContent = 'Please provide a valid title and description (at least 10 characters).';
        }
        return;
      }

      const res = S().updateReport(reportId, updates);
      if (res.ok) C().closeModal();
    }
  });

  // Escape key closes modals / lightbox / popovers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      C().closeLightbox();
      C().closeConfirm();
      C().closeModal();
      if (C().uiState.notifOpen || C().uiState.profileOpen) {
        C().uiState.notifOpen = false;
        C().uiState.profileOpen = false;
        C().renderNavbar(parseRoute().path);
      }
    }
  });

  // Re-render on route changes & store updates
  window.addEventListener('hashchange', () => {
    C().uiState.mobileMenuOpen = false;
    C().uiState.notifOpen = false;
    C().uiState.profileOpen = false;
    P().pageState.report.submittedResult = null;
    renderApp(true);
  });

  S().subscribe(() => {
    renderApp(false);
  });

  // Initial Boot
  if (!window.location.hash) {
    window.location.hash = '#/';
  }
  renderApp(false);
})(window);
