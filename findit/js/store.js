(function (global) {
  'use strict';

  const STORAGE_KEY = 'findit_platform_state_v1';

  function createStore() {
    const Data = global.FindIt.Data;
    const Utils = global.FindIt.Utils;
    const listeners = new Set();
    let toasts = [];

    function loadInitial() {
      try {
        const raw = global.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.reports) && Array.isArray(parsed.claims)) {
            return {
              reports: parsed.reports,
              claims: parsed.claims,
              notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
              activeUserId: Data.DEMO_USERS.some((u) => u.id === parsed.activeUserId)
                ? parsed.activeUserId
                : Data.DEMO_USERS[0].id,
              activeRole: parsed.activeRole === 'admin' ? 'admin' : 'user',
              theme: parsed.theme === 'dark' ? 'dark' : 'light',
            };
          }
        }
      } catch (err) {
        console.error('FindIt: failed to read localStorage, loading seed data.', err);
      }
      const seed = Data.createSeedData();
      persist(seed);
      return seed;
    }

    function persist(nextState) {
      try {
        const json = JSON.stringify(nextState);
        global.localStorage.setItem(STORAGE_KEY, json);
        return { ok: true };
      } catch (err) {
        const isQuota =
          (err && err.name === 'QuotaExceededError') ||
          (err && err.name === 'NS_ERROR_DOM_QUOTA_REACHED') ||
          (err && (err.code === 22 || err.code === 1014));
        return {
          ok: false,
          quotaExceeded: Boolean(isQuota),
          error: isQuota
            ? 'Browser localStorage limit reached. Try submitting without a photo, removing older photos, or exporting/resetting data.'
            : 'Unable to save to browser localStorage.',
        };
      }
    }

    let state = loadInitial();

    function applyTheme() {
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    applyTheme();

    function notifyListeners() {
      listeners.forEach((fn) => {
        try {
          fn(state);
        } catch (e) {
          console.error('FindIt listener error:', e);
        }
      });
    }

    function commit(nextState) {
      const saved = persist(nextState);
      if (!saved.ok) {
        addToast(saved.error, 'error');
        return saved;
      }
      state = nextState;
      applyTheme();
      notifyListeners();
      return { ok: true };
    }

    function nextId(items, prefix, base) {
      let max = base;
      for (let i = 0; i < items.length; i++) {
        const m = String(items[i].id || '').match(/(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > max) max = n;
        }
      }
      return `${prefix}-${max + 1}`;
    }

    function addToast(message, variant) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      toasts = [...toasts, { id, message, variant: variant || 'info' }];
      if (global.FindIt.Components && global.FindIt.Components.renderToasts) {
        global.FindIt.Components.renderToasts();
      }
      setTimeout(() => dismissToast(id), 4200);
    }

    function dismissToast(id) {
      toasts = toasts.filter((t) => t.id !== id);
      if (global.FindIt.Components && global.FindIt.Components.renderToasts) {
        global.FindIt.Components.renderToasts();
      }
    }

    function getToasts() {
      return toasts;
    }

    function getState() {
      return state;
    }

    function getActiveUser() {
      return Data.DEMO_USERS.find((u) => u.id === state.activeUserId) || Data.DEMO_USERS[0];
    }

    function isAdmin() {
      return state.activeRole === 'admin';
    }

    function getStorageStats() {
      try {
        const raw = global.localStorage.getItem(STORAGE_KEY) || '';
        const bytes = new Blob([raw]).size;
        const maxBytes = 5 * 1024 * 1024;
        return {
          bytes,
          kb: Math.round((bytes / 1024) * 10) / 10,
          percent: Math.min(100, Math.round((bytes / maxBytes) * 1000) / 10),
        };
      } catch (e) {
        return { bytes: 0, kb: 0, percent: 0 };
      }
    }

    function getStats() {
      const totalReports = state.reports.length;
      const lostReports = state.reports.filter((r) => r.type === 'lost').length;
      const foundReports = state.reports.filter((r) => r.type === 'found').length;
      const activeReports = state.reports.filter((r) => r.status === Data.ITEM_STATUSES.ACTIVE).length;
      const claimedReports = state.reports.filter((r) => r.status === Data.ITEM_STATUSES.CLAIMED).length;
      const returnedReports = state.reports.filter((r) => r.status === Data.ITEM_STATUSES.RETURNED).length;
      const pendingClaims = state.claims.filter((c) => c.status === Data.CLAIM_STATUSES.PENDING).length;
      const approvedClaims = state.claims.filter((c) => c.status === Data.CLAIM_STATUSES.APPROVED).length;
      const rejectedClaims = state.claims.filter((c) => c.status === Data.CLAIM_STATUSES.REJECTED).length;
      const activeClaims = pendingClaims + approvedClaims;
      const unreadNotifications = state.notifications.filter((n) => !n.read).length;
      const recoveryRate =
        totalReports > 0 ? Math.round(((returnedReports + claimedReports) / totalReports) * 100) : 0;

      return {
        totalReports,
        lostReports,
        foundReports,
        activeReports,
        claimedReports,
        returnedReports,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        activeClaims,
        totalClaims: state.claims.length,
        unreadNotifications,
        recoveryRate,
      };
    }

    function toggleTheme() {
      commit(Object.assign({}, state, { theme: state.theme === 'dark' ? 'light' : 'dark' }));
    }

    function setActiveUserId(userId) {
      const user = Data.DEMO_USERS.find((u) => u.id === userId);
      if (!user) return;
      commit(Object.assign({}, state, { activeUserId: user.id }));
      addToast(`Switched demo profile to ${user.name}`, 'info');
    }

    function setActiveRole(role) {
      const nextRole = role === 'admin' ? 'admin' : 'user';
      commit(Object.assign({}, state, { activeRole: nextRole }));
      addToast(
        nextRole === 'admin'
          ? 'Demo Switcher: Admin Mode enabled'
          : 'Demo Switcher: Standard User Mode enabled',
        'info'
      );
    }

    function createReport(formData) {
      const user = getActiveUser();
      const now = new Date().toISOString();
      const newId = nextId(state.reports, 'FI', 1000);
      const newReport = {
        id: newId,
        type: formData.type === 'found' ? 'found' : 'lost',
        title: String(formData.title || '').trim(),
        category: formData.category,
        description: String(formData.description || '').trim(),
        date: formData.date,
        location: formData.location,
        specificLocation: String(formData.specificLocation || '').trim(),
        color: formData.color,
        imageUrl: formData.imageUrl || '',
        status: Data.ITEM_STATUSES.ACTIVE,
        reporterId: user.id,
        reporterName: String(formData.reporterName || user.name).trim(),
        contactMethod: formData.contactMethod,
        contactValue: String(formData.contactValue || '').trim(),
        additionalNotes: String(formData.additionalNotes || '').trim(),
        privateVerificationHint: String(formData.privateVerificationHint || '').trim(),
        isDemoSample: false,
        createdAt: now,
        updatedAt: now,
      };

      const matches = Utils.findPotentialMatches(newReport, state.reports, { minScore: 52, limit: 3 });
      const matchNotifs = matches.map((m, idx) => ({
        id: `NT-${Date.now()}-${idx}`,
        type: 'match',
        title: `Potential Match Suggested (${m.score}% score)`,
        message: `"${newReport.title}" (${newReport.id}) may match "${m.report.title}" (${m.report.id}) at ${m.report.location}.`,
        reportId: newReport.id,
        claimId: null,
        read: false,
        createdAt: now,
      }));

      const nextState = Object.assign({}, state, {
        reports: [newReport, ...state.reports],
        notifications: [...matchNotifs, ...state.notifications],
      });

      const res = commit(nextState);
      if (!res.ok) return res;
      addToast(
        `${newReport.type === 'lost' ? 'Lost' : 'Found'} item report ${newReport.id} submitted!`,
        'success'
      );
      return { ok: true, report: newReport, matches };
    }

    function updateReport(reportId, updates) {
      const existing = state.reports.find((r) => r.id === reportId);
      if (!existing) return { ok: false, error: 'Report not found.' };
      if (existing.reporterId !== state.activeUserId && state.activeRole !== 'admin') {
        addToast('You can only edit reports belonging to the active demo profile.', 'error');
        return { ok: false, error: 'Not authorized for this demo profile.' };
      }
      const now = new Date().toISOString();
      const nextReports = state.reports.map((r) =>
        r.id === reportId
          ? Object.assign({}, r, {
              title: updates.title != null ? String(updates.title).trim() : r.title,
              category: updates.category || r.category,
              description:
                updates.description != null ? String(updates.description).trim() : r.description,
              date: updates.date || r.date,
              location: updates.location || r.location,
              specificLocation:
                updates.specificLocation != null
                  ? String(updates.specificLocation).trim()
                  : r.specificLocation,
              color: updates.color || r.color,
              imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : r.imageUrl,
              contactMethod: updates.contactMethod || r.contactMethod,
              contactValue:
                updates.contactValue != null ? String(updates.contactValue).trim() : r.contactValue,
              additionalNotes:
                updates.additionalNotes != null
                  ? String(updates.additionalNotes).trim()
                  : r.additionalNotes,
              privateVerificationHint:
                updates.privateVerificationHint != null
                  ? String(updates.privateVerificationHint).trim()
                  : r.privateVerificationHint,
              updatedAt: now,
            })
          : r
      );

      const res = commit(Object.assign({}, state, { reports: nextReports }));
      if (!res.ok) return res;
      addToast(`Report ${reportId} updated.`, 'success');
      return { ok: true };
    }

    function deleteReport(reportId) {
      const existing = state.reports.find((r) => r.id === reportId);
      if (!existing) return { ok: false, error: 'Report not found.' };
      if (existing.reporterId !== state.activeUserId && state.activeRole !== 'admin') {
        addToast('You can only delete reports belonging to the active demo profile.', 'error');
        return { ok: false, error: 'Not authorized for this demo profile.' };
      }
      const nextState = Object.assign({}, state, {
        reports: state.reports.filter((r) => r.id !== reportId),
        claims: state.claims.filter((c) => c.reportId !== reportId),
        notifications: state.notifications.filter((n) => n.reportId !== reportId),
      });
      const res = commit(nextState);
      if (res.ok) addToast(`Report ${reportId} deleted.`, 'info');
      return res;
    }

    function submitClaim(reportId, claimData) {
      const report = state.reports.find((r) => r.id === reportId);
      if (!report) return { ok: false, error: 'Item report no longer exists.' };
      if (report.status === Data.ITEM_STATUSES.RETURNED) {
        return { ok: false, error: 'This item has already been returned and cannot accept claims.' };
      }

      const user = getActiveUser();
      const duplicate = state.claims.find(
        (c) =>
          c.reportId === reportId &&
          c.claimantId === user.id &&
          (c.status === Data.CLAIM_STATUSES.PENDING || c.status === Data.CLAIM_STATUSES.APPROVED)
      );
      if (duplicate) {
        return {
          ok: false,
          error: `You already have an active request (${duplicate.id}) on this item.`,
        };
      }

      const now = new Date().toISOString();
      const newClaimId = nextId(state.claims, 'CL', 2000);
      const newClaim = {
        id: newClaimId,
        reportId,
        claimantId: user.id,
        claimantName: String(claimData.claimantName || user.name).trim(),
        contactMethod: claimData.contactMethod,
        contactValue: String(claimData.contactValue || '').trim(),
        claimType: report.type === 'found' ? 'ownership' : 'finder_handoff',
        itemDescription: String(claimData.itemDescription || '').trim(),
        verificationAnswer: String(claimData.verificationAnswer || '').trim(),
        lostContext: String(claimData.lostContext || '').trim(),
        status: Data.CLAIM_STATUSES.PENDING, // Never auto-approved!
        adminNote: '',
        createdAt: now,
        updatedAt: now,
      };

      const notif = {
        id: `NT-${Date.now()}`,
        type: 'claim_submitted',
        title:
          newClaim.claimType === 'ownership'
            ? 'Claim Request Submitted'
            : 'Finder Handoff Submitted',
        message: `${newClaim.claimantName} submitted ${newClaimId} for "${report.title}" (${report.id}). Pending admin review.`,
        reportId: report.id,
        claimId: newClaimId,
        read: false,
        createdAt: now,
      };

      const res = commit(
        Object.assign({}, state, {
          claims: [newClaim, ...state.claims],
          notifications: [notif, ...state.notifications],
        })
      );
      if (!res.ok) return res;
      addToast(`Claim ${newClaimId} submitted for review.`, 'success');
      return { ok: true, claim: newClaim };
    }

    function updateClaimStatus(claimId, nextStatus, adminNote) {
      if (state.activeRole !== 'admin') {
        addToast('Switch to Admin Demo Mode to review or update claims.', 'error');
        return { ok: false, error: 'Admin demo role required.' };
      }

      const claim = state.claims.find((c) => c.id === claimId);
      if (!claim) return { ok: false, error: 'Claim not found.' };
      const report = state.reports.find((r) => r.id === claim.reportId);
      if (!report) return { ok: false, error: 'Associated report not found.' };

      if (claim.status === nextStatus) {
        return { ok: false, error: `Claim is already ${nextStatus}.` };
      }

      // Guard invalid transitions & prevent duplicate return completion
      if (claim.status === Data.CLAIM_STATUSES.RETURNED) {
        addToast('Returned claims are finalized and cannot be changed.', 'error');
        return { ok: false, error: 'Claim already returned.' };
      }
      if (claim.status === Data.CLAIM_STATUSES.REJECTED) {
        addToast('Rejected claims cannot be reopened or marked returned.', 'error');
        return { ok: false, error: 'Invalid transition from Rejected.' };
      }
      if (report.status === Data.ITEM_STATUSES.RETURNED) {
        addToast('This item has already been marked as Returned.', 'error');
        return { ok: false, error: 'Duplicate return prevented.' };
      }

      if (nextStatus === Data.CLAIM_STATUSES.APPROVED) {
        if (claim.status !== Data.CLAIM_STATUSES.PENDING) {
          return { ok: false, error: 'Only Pending Review claims can be approved.' };
        }
        const conflict = state.claims.find(
          (c) =>
            c.reportId === claim.reportId &&
            c.id !== claim.id &&
            c.status === Data.CLAIM_STATUSES.APPROVED
        );
        if (conflict) {
          addToast(
            `Claim ${conflict.id} is already approved for this item. Reject it first before approving another.`,
            'error'
          );
          return { ok: false, error: 'Another claim is already approved.' };
        }
      }

      if (nextStatus === Data.CLAIM_STATUSES.RETURNED) {
        if (claim.status !== Data.CLAIM_STATUSES.APPROVED) {
          addToast('Approve the claim before marking the item as Returned.', 'error');
          return { ok: false, error: 'Claim must be Approved first.' };
        }
      }

      const now = new Date().toISOString();
      const cleanNote = String(adminNote || '').trim();

      let notifType = 'claim_approved';
      let notifTitle = 'Claim Approved';
      let notifMsg = `Claim ${claim.id} for "${report.title}" was approved and is ready for pickup.`;
      if (nextStatus === Data.CLAIM_STATUSES.REJECTED) {
        notifType = 'claim_rejected';
        notifTitle = 'Claim Rejected';
        notifMsg = `Claim ${claim.id} for "${report.title}" was not approved.${
          cleanNote ? ` Note: ${cleanNote}` : ''
        }`;
      } else if (nextStatus === Data.CLAIM_STATUSES.RETURNED) {
        notifType = 'item_returned';
        notifTitle = 'Item Marked Returned';
        notifMsg = `"${report.title}" (${report.id}) has been verified and returned via claim ${claim.id}.`;
      }

      const newNotif = {
        id: `NT-${Date.now()}`,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        reportId: report.id,
        claimId: claim.id,
        read: false,
        createdAt: now,
      };

      const nextClaims = state.claims.map((c) => {
        if (c.id === claimId) {
          return Object.assign({}, c, {
            status: nextStatus,
            adminNote: cleanNote || c.adminNote,
            updatedAt: now,
          });
        }
        if (
          nextStatus === Data.CLAIM_STATUSES.RETURNED &&
          c.reportId === claim.reportId &&
          c.status === Data.CLAIM_STATUSES.PENDING
        ) {
          return Object.assign({}, c, {
            status: Data.CLAIM_STATUSES.REJECTED,
            adminNote: 'Closed automatically because the item was returned to a verified owner.',
            updatedAt: now,
          });
        }
        return c;
      });

      const nextReports = state.reports.map((r) => {
        if (r.id !== claim.reportId) return r;
        if (nextStatus === Data.CLAIM_STATUSES.APPROVED) {
          return Object.assign({}, r, { status: Data.ITEM_STATUSES.CLAIMED, updatedAt: now });
        }
        if (nextStatus === Data.CLAIM_STATUSES.RETURNED) {
          return Object.assign({}, r, { status: Data.ITEM_STATUSES.RETURNED, updatedAt: now });
        }
        if (
          nextStatus === Data.CLAIM_STATUSES.REJECTED &&
          claim.status === Data.CLAIM_STATUSES.APPROVED
        ) {
          return Object.assign({}, r, { status: Data.ITEM_STATUSES.ACTIVE, updatedAt: now });
        }
        return r;
      });

      const res = commit(
        Object.assign({}, state, {
          reports: nextReports,
          claims: nextClaims,
          notifications: [newNotif, ...state.notifications],
        })
      );
      if (res.ok) addToast(`Claim ${claim.id} updated to ${nextStatus}.`, 'success');
      return res;
    }

    function markReportReturned(reportId, note) {
      const report = state.reports.find((r) => r.id === reportId);
      if (!report) return { ok: false, error: 'Report not found.' };
      if (report.reporterId !== state.activeUserId && state.activeRole !== 'admin') {
        addToast('Only the report owner or Admin can mark this item as Returned.', 'error');
        return { ok: false, error: 'Permission denied.' };
      }
      if (report.status === Data.ITEM_STATUSES.RETURNED) {
        addToast('This report is already marked as Returned.', 'error');
        return { ok: false, error: 'Duplicate return completion prevented.' };
      }

      const now = new Date().toISOString();
      const cleanNote = String(note || '').trim();
      const notif = {
        id: `NT-${Date.now()}`,
        type: 'item_returned',
        title: 'Item Marked as Returned',
        message: `"${report.title}" (${report.id}) has been resolved and marked as Returned.`,
        reportId: report.id,
        claimId: null,
        read: false,
        createdAt: now,
      };

      const nextReports = state.reports.map((r) =>
        r.id === reportId
          ? Object.assign({}, r, {
              status: Data.ITEM_STATUSES.RETURNED,
              additionalNotes: cleanNote
                ? `${r.additionalNotes ? r.additionalNotes + ' | ' : ''}Resolution: ${cleanNote}`
                : r.additionalNotes,
              updatedAt: now,
            })
          : r
      );

      const nextClaims = state.claims.map((c) => {
        if (c.reportId !== reportId) return c;
        if (c.status === Data.CLAIM_STATUSES.APPROVED) {
          return Object.assign({}, c, { status: Data.CLAIM_STATUSES.RETURNED, updatedAt: now });
        }
        if (c.status === Data.CLAIM_STATUSES.PENDING) {
          return Object.assign({}, c, {
            status: Data.CLAIM_STATUSES.REJECTED,
            adminNote: 'Closed because the item was marked as Returned.',
            updatedAt: now,
          });
        }
        return c;
      });

      const res = commit(
        Object.assign({}, state, {
          reports: nextReports,
          claims: nextClaims,
          notifications: [notif, ...state.notifications],
        })
      );
      if (res.ok) addToast(`Report ${reportId} marked as Returned!`, 'success');
      return res;
    }

    function markNotificationRead(id) {
      commit(
        Object.assign({}, state, {
          notifications: state.notifications.map((n) =>
            n.id === id ? Object.assign({}, n, { read: true }) : n
          ),
        })
      );
    }

    function markAllNotificationsRead() {
      commit(
        Object.assign({}, state, {
          notifications: state.notifications.map((n) => Object.assign({}, n, { read: true })),
        })
      );
      addToast('All notifications marked as read.', 'info');
    }

    function clearNotifications() {
      commit(Object.assign({}, state, { notifications: [] }));
      addToast('Notifications cleared.', 'info');
    }

    function exportData() {
      const payload = {
        application: 'FindIt Lost & Found Platform',
        exportedAt: new Date().toISOString(),
        version: 1,
        summary: getStats(),
        reports: state.reports,
        claims: state.claims,
        notifications: state.notifications,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `findit-records-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Exported FindIt records as JSON.', 'success');
    }

    function resetDemoData() {
      const fresh = Data.createSeedData();
      fresh.theme = state.theme;
      const res = commit(fresh);
      if (res.ok) addToast('Reset application to original demo data.', 'success');
      return res;
    }

    function subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }

    return {
      getState,
      getActiveUser,
      isAdmin,
      getStats,
      getStorageStats,
      getToasts,
      addToast,
      dismissToast,
      toggleTheme,
      setActiveUserId,
      setActiveRole,
      createReport,
      updateReport,
      deleteReport,
      submitClaim,
      updateClaimStatus,
      markReportReturned,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      exportData,
      resetDemoData,
      subscribe,
    };
  }

  global.FindIt = global.FindIt || {};
  global.FindIt.Store = createStore();
})(window);
