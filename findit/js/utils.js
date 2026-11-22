(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Unknown date';
    const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return isoStr;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatRelativeTime(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return '';
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(isoStr);
  }

  function getTodayInputDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getPublicReporterLabel(name) {
    if (!name) return 'Campus Member';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  function maskContactValue(value) {
    if (!value) return 'Protected';
    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      return `${local.slice(0, Math.min(2, local.length))}•••@${domain}`;
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 4) return `(•••) •••-${digits.slice(-4)}`;
    return '••••••';
  }

  function getFallbackPlaceholder(category, title) {
    const palette = {
      Electronics: ['#DBEAFE', '#1D4ED8'],
      'IDs & Cards': ['#E0E7FF', '#4338CA'],
      Keys: ['#CCFBF1', '#0F766E'],
      'Bags & Wallets': ['#E0F2FE', '#0369A1'],
      'Drinkware & Personal': ['#CCFBF1', '#0D9488'],
      'Books & Study': ['#E0E7FF', '#4F46E5'],
      'Clothing & Accessories': ['#DBEAFE', '#2563EB'],
      Other: ['#F1F5F9', '#475569'],
    };
    const [bg, fg] = palette[category] || palette.Other;
    const safeCat = escapeHtml(category || 'Item');
    const safeTitle = escapeHtml(String(title || 'No photo').slice(0, 28));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg}"/><stop offset="100%" stop-color="#F8FAFC"/></linearGradient></defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="400" cy="255" r="76" fill="${fg}" fill-opacity="0.12"/>
      <rect x="358" y="218" width="84" height="74" rx="18" fill="none" stroke="${fg}" stroke-width="5"/>
      <circle cx="400" cy="255" r="14" fill="${fg}" fill-opacity="0.7"/>
      <text x="400" y="378" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="${fg}">${safeCat}</text>
      <text x="400" y="414" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="500" fill="#64748B">${safeTitle}</text>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function resizeImageToDataUrl(file, options) {
    const opts = Object.assign({ maxWidth: 800, maxHeight: 600, quality: 0.74 }, options || {});
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        reject(new Error('Please choose a valid image file (JPG, PNG, or WebP).'));
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        reject(new Error('Image file exceeds 12 MB limit.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Unable to decode selected image.'));
        img.onload = () => {
          const ratio = Math.min(1, opts.maxWidth / img.width, opts.maxHeight / img.height);
          const width = Math.max(1, Math.round(img.width * ratio));
          const height = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/jpeg', opts.quality);
          if (dataUrl.length > 220000) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.56);
          }
          resolve({
            dataUrl,
            width,
            height,
            sizeKb: Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024)),
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ========================================================================
     Transparent Rule-Based Potential Matching Engine
     ======================================================================== */
  const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'near', 'from', 'that', 'this', 'have', 'been',
    'left', 'lost', 'found', 'item', 'campus', 'building', 'floor', 'room',
    'very', 'some', 'into', 'inside', 'about', 'around', 'still', 'looks', 'like',
  ]);

  const COLOR_GROUPS = {
    black: ['black', 'matte black', 'charcoal', 'dark'],
    white: ['white', 'off-white', 'ivory', 'cream'],
    gray: ['silver', 'gray', 'grey', 'silver / gray', 'metallic'],
    blue: ['blue', 'navy', 'navy blue', 'cobalt', 'royal blue', 'sky'],
    teal: ['teal', 'turquoise', 'cyan', 'mint'],
    indigo: ['indigo', 'violet', 'purple'],
    brown: ['brown', 'tan', 'leather', 'beige'],
    red: ['red', 'crimson', 'maroon', 'burgundy'],
    green: ['green', 'olive', 'emerald'],
    yellow: ['yellow', 'gold', 'yellow / gold', 'amber'],
  };

  function tokenize(text) {
    if (!text) return [];
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map((w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w))
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  }

  function getColorGroup(colorName) {
    const norm = String(colorName || '').toLowerCase().trim();
    const keys = Object.keys(COLOR_GROUPS);
    for (let i = 0; i < keys.length; i++) {
      if (COLOR_GROUPS[keys[i]].some((s) => norm.includes(s))) return keys[i];
    }
    return norm;
  }

  function getLocationZone(locationName) {
    const locs = (global.FindIt && global.FindIt.Data && global.FindIt.Data.LOCATIONS) || [];
    const found = locs.find(
      (l) => l.id.toLowerCase() === String(locationName || '').toLowerCase()
    );
    return found ? found.zone : null;
  }

  function computeMatchScore(reportA, reportB) {
    if (!reportA || !reportB || reportA.id === reportB.id || reportA.type === reportB.type) {
      return { score: 0, breakdown: [] };
    }

    const lostReport = reportA.type === 'lost' ? reportA : reportB;
    const foundReport = reportA.type === 'found' ? reportA : reportB;
    const breakdown = [];
    let total = 0;

    // 1. Category (max 35)
    const catPts = lostReport.category === foundReport.category ? 35 : 0;
    total += catPts;
    breakdown.push({
      factor: 'Category',
      points: catPts,
      max: 35,
      detail: catPts ? `Exact match (${lostReport.category})` : 'Different categories',
      matched: catPts > 0,
    });

    // 2. Keywords / Title similarity (max 25)
    const tokensA = new Set([...tokenize(lostReport.title), ...tokenize(lostReport.description)]);
    const tokensB = new Set([...tokenize(foundReport.title), ...tokenize(foundReport.description)]);
    const shared = [...tokensA].filter((t) => tokensB.has(t));
    const titleA = new Set(tokenize(lostReport.title));
    const titleB = new Set(tokenize(foundReport.title));
    const sharedTitle = [...titleA].filter((t) => titleB.has(t));

    let kwPts = 0;
    if (shared.length > 0) {
      const unionSize = Math.max(1, new Set([...tokensA, ...tokensB]).size);
      const jaccard = shared.length / unionSize;
      const titleBoost = Math.min(12, sharedTitle.length * 6);
      kwPts = Math.min(25, Math.round(jaccard * 35 + titleBoost));
    }
    total += kwPts;
    breakdown.push({
      factor: 'Keywords',
      points: kwPts,
      max: 25,
      detail: shared.length > 0 ? `Shared: ${shared.slice(0, 4).join(', ')}` : 'No shared keywords',
      matched: kwPts >= 8,
    });

    // 3. Color (max 15)
    const colA = String(lostReport.color || '').toLowerCase();
    const colB = String(foundReport.color || '').toLowerCase();
    let colPts = 0;
    let colDetail = 'Different colors';
    if (colA && colB && colA === colB) {
      colPts = 15;
      colDetail = `Exact match (${lostReport.color})`;
    } else if (colA && colB && getColorGroup(colA) === getColorGroup(colB)) {
      colPts = 10;
      colDetail = `Similar tone (${lostReport.color} / ${foundReport.color})`;
    }
    total += colPts;
    breakdown.push({
      factor: 'Color',
      points: colPts,
      max: 15,
      detail: colDetail,
      matched: colPts > 0,
    });

    // 4. Location (max 15)
    let locPts = 0;
    let locDetail = 'Different campus zones';
    if (lostReport.location === foundReport.location) {
      locPts = 15;
      locDetail = `Same location (${lostReport.location})`;
    } else {
      const zA = getLocationZone(lostReport.location);
      const zB = getLocationZone(foundReport.location);
      if (zA && zB && zA === zB) {
        locPts = 8;
        locDetail = `Same zone (${zA})`;
      }
    }
    total += locPts;
    breakdown.push({
      factor: 'Location',
      points: locPts,
      max: 15,
      detail: locDetail,
      matched: locPts > 0,
    });

    // 5. Date compatibility (max 10)
    const lostMs = new Date(`${lostReport.date}T12:00:00`).getTime();
    const foundMs = new Date(`${foundReport.date}T12:00:00`).getTime();
    let datePts = 0;
    let dateDetail = 'Dates far apart';
    if (!Number.isNaN(lostMs) && !Number.isNaN(foundMs)) {
      const diffDays = Math.round((foundMs - lostMs) / 86400000);
      if (diffDays >= 0 && diffDays <= 3) {
        datePts = 10;
        dateDetail = diffDays === 0 ? 'Same day' : `Found ${diffDays}d after lost`;
      } else if (diffDays > 3 && diffDays <= 14) {
        datePts = 7;
        dateDetail = `Found ${diffDays}d after lost`;
      } else if (diffDays >= -2 && diffDays < 0) {
        datePts = 5;
        dateDetail = 'Within 2 days';
      } else if (diffDays > 14 && diffDays <= 30) {
        datePts = 3;
        dateDetail = `Found ${diffDays}d later`;
      } else {
        dateDetail = diffDays < -2 ? 'Found before reported lost date' : 'More than 30 days apart';
      }
    }
    total += datePts;
    breakdown.push({
      factor: 'Date',
      points: datePts,
      max: 10,
      detail: dateDetail,
      matched: datePts >= 5,
    });

    return { score: Math.min(100, total), breakdown };
  }

  function findPotentialMatches(targetReport, allReports, options) {
    const opts = Object.assign({ minScore: 45, limit: 4 }, options || {});
    if (!targetReport || !Array.isArray(allReports)) return [];
    return allReports
      .filter(
        (c) =>
          c.id !== targetReport.id &&
          c.type !== targetReport.type &&
          c.status !== 'Returned'
      )
      .map((candidate) => {
        const res = computeMatchScore(targetReport, candidate);
        return { report: candidate, score: res.score, breakdown: res.breakdown };
      })
      .filter((entry) => entry.score >= opts.minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.limit);
  }

  function findAllMatchPairs(allReports, options) {
    const opts = Object.assign({ minScore: 55 }, options || {});
    const lost = (allReports || []).filter((r) => r.type === 'lost' && r.status !== 'Returned');
    const found = (allReports || []).filter((r) => r.type === 'found' && r.status !== 'Returned');
    const pairs = [];
    for (let i = 0; i < lost.length; i++) {
      for (let j = 0; j < found.length; j++) {
        const res = computeMatchScore(lost[i], found[j]);
        if (res.score >= opts.minScore) {
          pairs.push({
            id: `${lost[i].id}_${found[j].id}`,
            lost: lost[i],
            found: found[j],
            score: res.score,
            breakdown: res.breakdown,
          });
        }
      }
    }
    return pairs.sort((a, b) => b.score - a.score);
  }

  global.FindIt = global.FindIt || {};
  global.FindIt.Utils = {
    escapeHtml,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    getTodayInputDate,
    getPublicReporterLabel,
    maskContactValue,
    getFallbackPlaceholder,
    resizeImageToDataUrl,
    computeMatchScore,
    findPotentialMatches,
    findAllMatchPairs,
  };
})(window);
