(() => {
  'use strict';

  const state = {
    authenticated: false,
    profile: null,
    dashboard: null,
    referrals: [],
    rewards: [],
    tiers: [],
  };

  const original = {
    openRegisterModal: window.openRegisterModal,
    closeRegisterModal: window.closeRegisterModal,
    switchTab: window.switchTab,
    showToast: window.showToast,
  };

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const locale = () => window.ReferralI18n?.locale?.() || 'de-AT';
  const money = (v) => new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }).format(Number(v || 0));
  const date = (v) => v ? new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(v)) : '—';
  const sourceText = (el) => window.ReferralI18n?.sourceText?.(el) || el?.textContent?.trim() || '';
  const t = (value) => window.ReferralI18n?.t?.(value) || value;

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.success) {
      const err = new Error(body?.error?.message || `Request failed (${res.status})`);
      err.status = res.status;
      err.code = body?.error?.code;
      throw err;
    }
    return body.data;
  }

  function toast(msg) {
    const translated = t(msg);
    if (typeof original.showToast === 'function') original.showToast(translated);
    else alert(translated);
  }

  function setGuestUI() {
    state.authenticated = false;
    document.body.classList.remove('auth-pending', 'auth-user');
    document.body.classList.add('auth-guest');
    const guest = $('#guestLandingView');
    if (guest) guest.classList.remove('hidden');
    const logged = $('#authHeaderLoggedIn');
    if (logged) { logged.classList.add('hidden'); logged.classList.remove('flex'); }
    const guestHeader = $('#authHeaderGuest');
    if (guestHeader) { guestHeader.classList.remove('hidden'); guestHeader.classList.add('flex'); }
    // Do not write inline display:none to tab panels. The Stitch tab controller
    // relies on the .active class; an inline display:none would make every tab
    // stay blank even after the user clicks the navigation.
    $$('.tab-content').forEach(el => {
      el.classList.remove('active');
      el.style.removeProperty('display');
    });
    clearDemoRegistrationValues();

    // If a layout does not provide a guest landing view, keep Overview visible
    // instead of leaving the entire application shell blank.
    if (!guest) {
      const overview = $('#tab-overview');
      if (overview) overview.classList.add('active');
    }
  }

  function setLoggedInUI() {
    state.authenticated = true;
    document.body.classList.remove('auth-pending', 'auth-guest');
    document.body.classList.add('auth-user');
    const guest = $('#guestLandingView');
    if (guest) guest.classList.add('hidden');
    const logged = $('#authHeaderLoggedIn');
    if (logged) { logged.classList.remove('hidden'); logged.classList.add('flex'); }
    const guestHeader = $('#authHeaderGuest');
    if (guestHeader) { guestHeader.classList.add('hidden'); guestHeader.classList.remove('flex'); }
    $$$('.tab-content').forEach(el => { el.style.display = ''; });
    if (typeof original.switchTab === 'function') original.switchTab('overview');
  }

  function clearDemoRegistrationValues() {
    const demo = {
      regVorname: '', regNachname: '', regEmail: '', regPassword: '', regOwnerReference: ''
    };
    Object.entries(demo).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
    replaceText(document.body, 'LUKAS50', 'Wird generiert');
  }

  function replaceText(root, from, to) {
    if (!root || !from || from === to) return;
    if (window.ReferralI18n?.replaceSource?.(root, from, to)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => { if (n.nodeValue && n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.split(from).join(to); });
  }

  function initials(profile) {
    return `${profile?.first_name?.[0] || ''}${profile?.last_name?.[0] || ''}`.toUpperCase() || 'OP';
  }

  function bindProfile() {
    const p = state.profile;
    const d = state.dashboard;
    if (!p || !d) return;
    const first = p.first_name || 'OPPO';
    const full = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email;
    const short = p.last_name ? `${first} ${p.last_name[0]}.` : first;

    // Stitch demo identity replacement, preserving all existing visual classes.
    replaceText(document.body, 'Willkommen zurück, Lukas', `Willkommen zurück, ${first}`);
    replaceText(document.body, 'Hallo, Lukas', `Hallo, ${first}`);
    replaceText(document.body, 'Lukas Weber', full);
    replaceText(document.body, 'Lukas W.', short);
    replaceText(document.body, 'lukas.weber@example.at', p.email || '');
    replaceText(document.body, 'LUKAS50', d.referralCode);
    replaceText(document.body, 'Wird generiert', d.referralCode);
    replaceText(document.body, 'https://oppo.com/at/ref/lukas123', d.referralLink);
    replaceText(document.body, 'oppo.com/at/ref/lukas123', d.referralLink.replace(/^https?:\/\//, ''));

    // Header/avatar demo initials.
    $$('div').forEach(el => {
      const t = el.textContent?.trim();
      if ((t === 'LW' || t === 'L') && el.children.length === 0 && el.className.includes('rounded')) el.textContent = initials(p);
    });
  }

  function findCardByLabel(label) {
    const candidates = $$('span,div,p').filter(el => el.children.length === 0 && (sourceText(el).toLowerCase() === label.toLowerCase() || el.textContent?.trim().toLowerCase() === t(label).toLowerCase()));
    for (const labelEl of candidates) {
      let p = labelEl.parentElement;
      for (let i = 0; i < 4 && p; i++, p = p.parentElement) {
        if (p.className && String(p.className).includes('rounded')) return p;
      }
    }
    return null;
  }

  function setMetric(label, value) {
    const card = findCardByLabel(label);
    if (!card) return;
    const valueEl = $$('div,span', card).find(el => el.children.length === 0 && /^(€\s*)?[\d.,]+$/.test((el.textContent || '').trim()));
    if (valueEl) valueEl.textContent = value;
  }

  function bindMetrics() {
    const d = state.dashboard;
    if (!d) return;
    const pendingReward = state.rewards.filter(r => ['pending'].includes(r.status)).reduce((s, r) => s + Number(r.reward_amount || 0), 0);
    const redeemed = state.rewards.filter(r => ['redeemed'].includes(r.status)).reduce((s, r) => s + Number(r.reward_amount || 0), 0);
    const totalReferrals = state.referrals.length;

    setMetric('Bereit zur Auszahlung', money(d.availableReward));
    setMetric('Verdient', money(d.availableReward));
    setMetric('In Prüfung', money(pendingReward));
    setMetric('Ausstehend', money(pendingReward));
    setMetric('Empfehlungen', String(totalReferrals));
    setMetric('Bestätigte Käufe', String(d.successfulReferrals));
    setMetric('Erfolgreich', String(d.successfulReferrals));

    // common demo values repeated in summary cards/payout modal
    replaceText(document.body, '€300,00', money(d.availableReward));
    replaceText(document.body, '€300', money(d.availableReward));

    // Reward summary card in mobile/hub.
    const rewardSummary = $$('h2').find(el => sourceText(el).includes('Belohnungsübersicht'))?.parentElement?.parentElement;
    if (rewardSummary) {
      const values = $$('span', rewardSummary).filter(el => /^€/.test(el.textContent?.trim() || ''));
      if (values[0]) values[0].textContent = money(d.availableReward);
      if (values[1]) values[1].textContent = money(pendingReward);
      if (values[2]) values[2].textContent = money(redeemed);
    }
  }

  function statusMeta(status) {
    if (['qualified', 'rewarded'].includes(status)) return { label: t('Bestätigt'), key: 'bestätigt', cls: 'bg-oppo-light text-oppo' };
    if (['rejected', 'cancelled'].includes(status)) return { label: t('Storniert'), key: 'storniert', cls: 'bg-surface-card text-brand-gray' };
    return { label: t('Ausstehend'), key: 'ausstehend', cls: 'bg-amber-50 text-amber-700' };
  }

  function renderDesktopRows(rows, compact = false) {
    return rows.map(r => {
      const s = statusMeta(r.status);
      const contact = r.referredEmail || t('Noch nicht registriert');
      return `<tr class="referral-item hover:bg-surface-card/60 transition" data-status="${s.key}">
        <td class="py-3 px-3 font-semibold text-brand-black">${escapeHtml(contact)}</td>
        ${compact ? '' : '<td class="py-3 px-3 text-brand-gray">—</td>'}
        <td class="py-3 px-3 text-brand-gray font-mono">${escapeHtml(date(r.registeredAt || r.createdAt))}</td>
        <td class="py-3 px-3"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}">${s.label}</span></td>
        <td class="py-3 px-3 text-right font-bold text-brand-black">${r.reward ? '+' + money(r.reward) : '—'}</td>
      </tr>`;
    }).join('');
  }

  function renderMobileRows(rows) {
    return rows.map(r => {
      const s = statusMeta(r.status);
      const contact = r.referredEmail || t('Noch nicht registriert');
      return `<div class="referral-item p-3.5 flex items-center justify-between" data-status="${s.key}">
        <div class="min-w-0 pr-3"><p class="text-xs font-bold text-brand-black truncate">${escapeHtml(contact)}</p><p class="text-[11px] text-brand-gray">${escapeHtml(date(r.registeredAt || r.createdAt))}</p></div>
        <div class="text-right shrink-0"><span class="text-xs font-bold text-brand-black block">${r.reward ? '+' + money(r.reward) : '—'}</span><span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${s.cls}">${s.label}</span></div>
      </div>`;
    }).join('');
  }

  function bindReferralLists() {
    const rows = state.referrals;
    const full = $('#referralsListBody');
    if (full) {
      if (full.tagName === 'TBODY') full.innerHTML = renderDesktopRows(rows);
      else full.innerHTML = renderMobileRows(rows);
    }

    // Overview's recent referrals are a different static list in Stitch.
    const overview = $('#tab-overview');
    if (!overview) return;
    const recent = rows.slice(0, 3);
    const overviewTableBody = overview.querySelector('table tbody');
    if (overviewTableBody) overviewTableBody.innerHTML = renderDesktopRows(recent);
    const recentHeading = [...overview.querySelectorAll('h2')].find(h => /Letzte (Empfehlungen|Empfehlungsaktivitäten)/.test(sourceText(h))); 
    if (recentHeading && !overviewTableBody) {
      const card = recentHeading.closest('.rounded-2xl');
      const list = card ? [...card.querySelectorAll('div')].find(div => String(div.className).includes('divide-y')) : null;
      if (list) list.innerHTML = renderMobileRows(recent);
    }
  }

  function bindTier() {
    const d = state.dashboard;
    if (!d || !state.tiers.length) return;
    replaceText(document.body, 'OPPO Member', d.currentTier || 'Member');
    const sorted = [...state.tiers].sort((a,b) => a.minimum_referrals - b.minimum_referrals);
    const next = sorted.find(t => t.minimum_referrals > d.successfulReferrals);
    const statusCards = $$('div').filter(el => sourceText(el).includes('Ihr Status') && sourceText(el).includes('Empfehlungen'));
    for (const card of statusCards) {
      replaceText(card, '8 / 10 Empfehlungen', next ? `${d.successfulReferrals} / ${next.minimum_referrals} Empfehlungen` : `${d.successfulReferrals} Empfehlungen`);
      replaceText(card, 'Noch 2 bis', next ? `Noch ${Math.max(0, next.minimum_referrals - d.successfulReferrals)} bis` : 'Höchster Status erreicht');
      const progress = card.querySelector('[style*="width: 80%"]');
      if (progress) progress.style.width = next ? `${Math.min(100, (d.successfulReferrals / next.minimum_referrals) * 100)}%` : '100%';
    }
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  async function loadDashboard() {
    const [profile, dashboard, referrals, rewards, tiers] = await Promise.all([
      api('/api/profile'),
      api('/api/referral/me'),
      api('/api/referral/list'),
      api('/api/rewards'),
      api('/api/tiers'),
    ]);
    Object.assign(state, { profile, dashboard, referrals, rewards, tiers, authenticated: true });
    setLoggedInUI();
    bindProfile();
    bindMetrics();
    bindReferralLists();
    bindTier();
  }

  async function bootstrap() {
    try {
      const session = await api('/api/auth/session');
      if (session.role === 'admin') {
        window.location.replace('/admin');
        return;
      }
      if (session.role === 'employee') {
        window.location.replace('/staff');
        return;
      }
      await loadDashboard();
    } catch (e) {
      if (e.status === 401) {
        setGuestUI();
        if (new URLSearchParams(window.location.search).get('staff') === '1') {
          ensureLoginModal();
          $('#realLoginModal')?.classList.remove('hidden');
        }
      } else {
        console.error(e);
        setGuestUI();
        toast('Daten konnten nicht geladen werden.');
      }
    }
  }

  function ensureLoginModal() {
    if ($('#realLoginModal')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'realLoginModal';
    wrapper.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 hidden';
    wrapper.innerHTML = `
      <div class="modal-backdrop fixed inset-0" data-login-close></div>
      <div class="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 border border-surface-border">
        <div class="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
          <div><span class="text-[10px] font-bold uppercase tracking-wider text-oppo">OPPO Referral AT</span><h2 class="text-base font-bold text-brand-black">Anmelden</h2></div>
          <button data-login-close class="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center text-brand-gray">×</button>
        </div>
        <form id="realLoginForm" class="space-y-3">
          <div><label class="block text-[11px] font-medium text-brand-gray mb-1">E-Mail</label><input id="loginEmail" required type="email" autocomplete="email" class="w-full text-xs px-3 py-2.5 rounded-xl border border-surface-borderDark focus:outline-none focus:border-oppo text-brand-black"></div>
          <div><label class="block text-[11px] font-medium text-brand-gray mb-1">Passwort</label><input id="loginPassword" required minlength="8" type="password" autocomplete="current-password" class="w-full text-xs px-3 py-2.5 rounded-xl border border-surface-borderDark focus:outline-none focus:border-oppo text-brand-black"></div>
          <p id="loginError" class="hidden text-[11px] text-red-600"></p>
          <button type="submit" class="w-full py-3 rounded-xl bg-oppo text-white text-xs font-semibold hover:bg-oppo-hover">Anmelden</button>
          <button type="button" id="magicLinkLogin" class="w-full py-3 rounded-xl bg-surface-card text-brand-black text-xs font-semibold border border-surface-border">Magic Link per E-Mail senden</button>
          <div class="pt-3 mt-3 border-t border-surface-border">
            <p class="text-[10px] uppercase tracking-wider text-brand-gray font-semibold mb-2">OPPO Mitarbeiter / Admin</p>
            <button type="button" id="staffMagicLinkLogin" class="w-full py-3 rounded-xl bg-brand-black text-white text-xs font-semibold">Mitarbeiter-Login per Magic Link</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(wrapper);
    wrapper.querySelectorAll('[data-login-close]').forEach(x => x.addEventListener('click', () => wrapper.classList.add('hidden')));
    $('#realLoginForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const errorEl = $('#loginError'); errorEl.classList.add('hidden');
      try {
        const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#loginEmail').value.trim(), password: $('#loginPassword').value }) });
        wrapper.classList.add('hidden');
        if (result.role === 'admin') {
          window.location.assign('/admin');
          return;
        }
        if (result.role === 'employee') {
          window.location.assign('/staff');
          return;
        }
        await loadDashboard();
        toast('Erfolgreich angemeldet.');
      } catch (e) { errorEl.textContent = e.message; errorEl.classList.remove('hidden'); }
    });
    $('#magicLinkLogin').addEventListener('click', async () => {
      const email = $('#loginEmail').value.trim();
      if (!email) return toast('Bitte zuerst Ihre E-Mail eingeben.');
      try { await api('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }); toast('Magic Link wurde per E-Mail gesendet.'); wrapper.classList.add('hidden'); }
      catch (e) { toast(e.message); }
    });
    $('#staffMagicLinkLogin').addEventListener('click', async () => {
      const email = $('#loginEmail').value.trim();
      if (!email) return toast('Bitte zuerst Ihre E-Mail eingeben.');
      try {
        await api('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email, staff: true }) });
        toast('Mitarbeiter Magic Link wurde per E-Mail gesendet.');
        wrapper.classList.add('hidden');
      } catch (e) { toast(e.message); }
    });
  }

  window.loginDemo = function() {
    ensureLoginModal();
    $('#realLoginModal').classList.remove('hidden');
  };

  window.logoutDemo = async function() {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
    state.authenticated = false;
    setGuestUI();
    toast('Abgemeldet.');
  };

  window.openRegisterModal = function() {
    clearDemoRegistrationValues();
    if (typeof original.openRegisterModal === 'function') original.openRegisterModal();
  };

  window.completeRegistration = async function() {
    const firstName = $('#regVorname')?.value?.trim();
    const lastName = $('#regNachname')?.value?.trim();
    const email = $('#regEmail')?.value?.trim();
    const password = $('#regPassword')?.value || '';
    const termsAccepted = Boolean($('#regTermsAccepted')?.checked);
    if (!firstName || !lastName || !email || password.length < 8 || !termsAccepted) {
      return toast('Bitte Pflichtfelder vollständig ausfüllen und Teilnahmebedingungen akzeptieren.');
    }
    try {
      const result = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({
        email, password, firstName, lastName, country: 'AT', language: 'de', mode: 'password', termsAccepted,
        ownerVerificationReference: $('#regOwnerReference')?.value?.trim() || undefined,
      })});
      if (typeof original.closeRegisterModal === 'function') original.closeRegisterModal();
      if (result.confirmationRequired) {
        toast('Registrierung erstellt. Bitte bestätigen Sie Ihre E-Mail.');
        setGuestUI();
      } else {
        await loadDashboard();
        toast('Konto erfolgreich erstellt.');
      }
    } catch (e) { toast(e.message); }
  };

  window.copyToClipboard = async function(text, message) {
    let actual = text;
    if (state.dashboard) {
      if (/LUKAS50|Wird generiert/i.test(String(text))) actual = state.dashboard.referralCode;
      if (/oppo\.com\/at\/ref\/lukas123/i.test(String(text))) actual = state.dashboard.referralLink;
    }
    try { await navigator.clipboard.writeText(actual); toast(message ? message.replace(/LUKAS50/g, state.dashboard?.referralCode || '') : 'Kopiert.'); }
    catch (_) { toast('Kopieren nicht möglich.'); }
  };

  window.shareVia = function(channel) {
    if (!state.dashboard) return window.loginDemo();
    const link = state.dashboard.referralLink;
    const text = `Entdecke OPPO in Österreich und nutze meinen persönlichen Empfehlungslink: ${link}`;
    if (channel === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    else if (channel === 'email') window.location.href = `mailto:?subject=${encodeURIComponent('Meine OPPO Empfehlung')}&body=${encodeURIComponent(text)}`;
    else if (channel === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank', 'noopener');
    else window.copyToClipboard(link, 'Empfehlungslink kopiert.');
  };

  // Resilient tab bridge: always clear stale inline display rules before
  // delegating to the original Stitch navigation implementation.
  window.switchTab = function(tabName) {
    if (!state.authenticated) {
      setGuestUI();
      return;
    }
    $('.tab-content').forEach(el => el.style.removeProperty('display'));
    if (typeof original.switchTab === 'function') original.switchTab(tabName);
  };

  window.openQRModal = function() {
    toast('QR-Code wird nach der finalen Produktionsfreigabe aktiviert.');
  };

  window.openPayoutModal = function() {
    toast('Auszahlung ist in V1 noch nicht aktiviert. Ihr bestätigtes Guthaben bleibt im Konto sichtbar.');
  };
  window.confirmPayout = window.openPayoutModal;

  document.addEventListener('oppo:languagechange', () => {
    if (!state.authenticated) return;
    bindProfile();
    bindMetrics();
    bindReferralLists();
    bindTier();
    window.ReferralI18n?.refresh?.();
  });

  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
})();
