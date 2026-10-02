(() => {
  'use strict';

  const state = {
    authenticated: false,
    profile: null,
    dashboard: null,
    referrals: [],
    rewards: [],
    tiers: [],
    program: { products: [], assets: [], settings: {} },
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
    $('.tab-content').forEach(el => { el.style.display = ''; });
    if (typeof original.switchTab === 'function') original.switchTab('overview');
  }

  function clearDemoRegistrationValues() {
    const demo = {
      regVorname: '', regNachname: '', regEmail: '', regPassword: '', regPasswordConfirm: '', regOwnerReference: ''
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
        ${compact ? '' : `<td class="py-3 px-3 text-brand-gray">${escapeHtml(r.productName || '—')}${r.orderNumber ? `<div class="text-[10px] font-mono mt-1">${escapeHtml(r.orderNumber)}</div>` : ''}</td>`}
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
        <div class="min-w-0 pr-3"><p class="text-xs font-bold text-brand-black truncate">${escapeHtml(contact)}</p><p class="text-[11px] text-brand-gray">${escapeHtml(r.productName || date(r.registeredAt || r.createdAt))}</p>${r.orderNumber ? `<p class="text-[10px] font-mono text-brand-gray">${escapeHtml(r.orderNumber)}</p>` : ''}</div>
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
    const [profile, dashboard, referrals, rewards, tiers, program] = await Promise.all([
      api('/api/profile'),
      api('/api/referral/me'),
      api('/api/referral/list'),
      api('/api/rewards'),
      api('/api/tiers'),
      api('/api/program'),
    ]);
    Object.assign(state, { profile, dashboard, referrals, rewards, tiers, program, authenticated: true });
    setLoggedInUI();
    bindProfile();
    bindMetrics();
    bindReferralLists();
    bindTier();
    renderMemberV2();
  }

  function localizedField(obj, base) {
    const l = locale().toLowerCase();
    const key = l.startsWith('zh') ? base + '_zh' : l.startsWith('en') ? base + '_en' : base + '_de';
    return obj?.[key] || obj?.[base + '_de'] || '';
  }

  function renderMemberV2() {
    if (!state.authenticated || !state.dashboard) return;
    const d = state.dashboard;
    const pendingReward = state.rewards
      .filter(r => ['pending'].includes(r.status))
      .reduce((s, r) => s + Number(r.reward_amount || 0), 0);

    const overview = $('#tab-overview');
    if (overview) {
      let hero = $('#memberEarningsHero');
      if (!hero) {
        hero = document.createElement('div');
        hero.id = 'memberEarningsHero';
        overview.prepend(hero);
      }
      hero.innerHTML = `
        <div class="rounded-2xl border border-oppo/20 bg-white p-5 sm:p-6 shadow-sm mb-5">
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div class="text-[11px] font-bold uppercase tracking-wider text-oppo">${escapeHtml(t('Meine Empfehlungsprämie'))}</div>
              <div class="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-black">${escapeHtml(money(d.availableReward))}</div>
              <div class="mt-2 text-xs text-brand-gray">${escapeHtml(t('Aktuell verfügbar'))} · ${escapeHtml(t('Gesamt verdient'))}: ${escapeHtml(money(d.totalRewardAmount))}</div>
            </div>
            <div class="grid grid-cols-2 gap-3 min-w-[260px]">
              <div class="rounded-xl bg-surface-card border border-surface-border p-3">
                <div class="text-[10px] uppercase tracking-wider text-brand-gray font-semibold">${escapeHtml(t('Offen'))}</div>
                <div class="text-lg font-extrabold mt-1">${escapeHtml(money(pendingReward))}</div>
              </div>
              <div class="rounded-xl bg-surface-card border border-surface-border p-3">
                <div class="text-[10px] uppercase tracking-wider text-brand-gray font-semibold">${escapeHtml(t('Erfolgreiche Empfehlungen'))}</div>
                <div class="text-lg font-extrabold mt-1">${Number(d.successfulReferrals || 0)}</div>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-surface-border flex flex-col sm:flex-row gap-2 sm:items-center">
            <div class="flex-1 min-w-0">
              <div class="text-[10px] text-brand-gray uppercase tracking-wider font-semibold">${escapeHtml(t('Mein Empfehlungslink'))}</div>
              <div class="text-xs font-mono font-semibold text-brand-black truncate mt-1">${escapeHtml(d.referralLink)}</div>
            </div>
            <button class="px-4 py-2.5 rounded-xl bg-oppo text-white text-xs font-semibold" onclick="copyMyReferralLink()">${escapeHtml(t('Link kopieren'))}</button>
          </div>
        </div>`;
    }

    const productsTab = $('#tab-products');
    if (productsTab) {
      const products = state.program?.products || [];
      productsTab.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold tracking-tight text-brand-black">${escapeHtml(t('Produkte & Empfehlungsprämien'))}</h1>
            <p class="text-sm text-brand-gray mt-1">${escapeHtml(t('Sie sehen vor dem Teilen genau, wie hoch Ihre Prämie je Modell ist.'))}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          ${products.map(p => {
            const name = [p.model_name, p.variant].filter(Boolean).join(' · ');
            const productCopy = localizedField(p, 'copy');
            return `
              <div class="bg-white rounded-2xl border border-surface-border p-5 flex flex-col justify-between shadow-sm">
                <div>
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="text-[10px] font-mono text-brand-gray">${escapeHtml(p.sku || '')}</div>
                    <span class="text-xs font-extrabold text-oppo bg-oppo-subtle px-2.5 py-1 rounded-lg border border-oppo/20">+${escapeHtml(money(p.referrer_reward))}</span>
                  </div>
                  ${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="" class="w-full h-36 object-contain rounded-xl bg-surface-card mb-4">` : `<div class="h-28 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center mb-4"><span class="text-xs font-mono font-bold text-brand-gray">${escapeHtml(name)}</span></div>`}
                  <h3 class="text-base font-bold text-brand-black">${escapeHtml(name)}</h3>
                  <div class="mt-2 grid grid-cols-2 gap-2">
                    <div class="rounded-xl bg-oppo-subtle p-3">
                      <div class="text-[10px] text-brand-gray">${escapeHtml(t('Ihre Prämie'))}</div>
                      <div class="text-lg font-extrabold text-oppo">${escapeHtml(money(p.referrer_reward))}</div>
                    </div>
                    <div class="rounded-xl bg-surface-card p-3">
                      <div class="text-[10px] text-brand-gray">${escapeHtml(t('Vorteil für Freund'))}</div>
                      <div class="text-lg font-extrabold text-brand-black">${escapeHtml(money(p.friend_discount))}</div>
                    </div>
                  </div>
                  ${p.retail_price != null ? `<p class="text-xs text-brand-gray mt-3">UVP ${escapeHtml(money(p.retail_price))}</p>` : ''}
                  ${productCopy ? `<p class="text-xs text-brand-gray leading-relaxed mt-3">${escapeHtml(productCopy)}</p>` : ''}
                </div>
                <button class="w-full mt-4 py-3 rounded-xl bg-oppo text-white font-semibold text-xs hover:bg-oppo-hover transition" onclick="copyProductReferral('${p.id}')">${escapeHtml(t('Empfehlung kopieren'))}</button>
              </div>`;
          }).join('')}
        </div>`;
    }

    const knowledgeTab = $('#tab-knowledge');
    if (knowledgeTab) {
      const assets = state.program?.assets || [];
      knowledgeTab.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <h1 class="text-2xl lg:text-3xl font-bold tracking-tight text-brand-black">${escapeHtml(t('Werbematerial zum direkten Teilen'))}</h1>
            <p class="text-sm text-brand-gray mt-1">${escapeHtml(t('Ein Klick kopiert die fertige Vorlage inklusive Ihres persönlichen Empfehlungslinks.'))}</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${assets.map(a => {
            const title = localizedField(a, 'title');
            const assetCopy = localizedField(a, 'copy');
            const product = (state.program?.products || []).find(p => p.id === a.product_id);
            const productName = product ? [product.model_name, product.variant].filter(Boolean).join(' · ') : '';
            return `
              <div class="bg-white rounded-2xl border border-surface-border p-5 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="text-[10px] uppercase tracking-wider font-bold text-oppo">${escapeHtml(a.asset_type || 'copy')}</div>
                    <h3 class="text-base font-bold text-brand-black mt-1">${escapeHtml(title)}</h3>
                    ${productName ? `<div class="text-[11px] text-brand-gray mt-1">${escapeHtml(productName)}</div>` : ''}
                  </div>
                  <button class="px-3 py-2 rounded-xl bg-brand-black text-white text-xs font-semibold shrink-0" onclick="copyMarketingAsset('${a.id}')">${escapeHtml(t('Alles kopieren'))}</button>
                </div>
                ${a.asset_url && ['image','banner'].includes(a.asset_type) ? `<img src="${escapeHtml(a.asset_url)}" alt="" class="w-full max-h-52 object-contain bg-surface-card rounded-xl mt-4">` : ''}
                ${assetCopy ? `<div class="mt-4 text-xs text-brand-charcoal leading-relaxed whitespace-pre-wrap">${escapeHtml(assetCopy)}</div>` : ''}
                ${a.asset_url ? `<a href="${escapeHtml(a.asset_url)}" target="_blank" rel="noopener" class="inline-block mt-3 text-xs font-semibold text-oppo underline underline-offset-4">${escapeHtml(t('Material öffnen'))}</a>` : ''}
              </div>`;
          }).join('')}
          ${assets.length ? '' : `<div class="text-sm text-brand-gray">${escapeHtml(t('Noch keine Werbematerialien verfügbar.'))}</div>`}
        </div>`;
    }

    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  window.copyMyReferralLink = async function() {
    if (!state.dashboard?.referralLink) return;
    await window.copyToClipboard(state.dashboard.referralLink, 'Empfehlungslink kopiert.');
  };

  window.copyMarketingAsset = async function(assetId) {
    const asset = (state.program?.assets || []).find(a => a.id === assetId);
    if (!asset || !state.dashboard) return;
    const body = localizedField(asset, 'copy');
    const parts = [body, state.dashboard.referralLink, asset.asset_url].filter(Boolean);
    await window.copyToClipboard(parts.join('\n\n'), 'Werbematerial kopiert.');
  };

  window.copyProductReferral = async function(productId) {
    const product = (state.program?.products || []).find(p => p.id === productId);
    if (!product || !state.dashboard) return;
    const body = localizedField(product, 'copy');
    const parts = [body, state.dashboard.referralLink, product.product_url].filter(Boolean);
    await window.copyToClipboard(parts.join('\n\n'), 'Produktempfehlung kopiert.');
  };

  async function bootstrap() {
    try {
      const session = await api('/api/auth/session');
      if (session.role === 'admin' || session.role === 'super_admin') {
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
          <p id="loginInfo" class="hidden text-[11px] text-oppo bg-oppo-subtle border border-oppo/20 rounded-lg p-2.5"></p>
          <p id="loginError" class="hidden text-[11px] text-red-600"></p>
          <button type="submit" class="w-full py-3 rounded-xl bg-oppo text-white text-xs font-semibold hover:bg-oppo-hover">Anmelden</button>
          <button type="button" id="resendConfirmation" class="w-full py-2.5 rounded-xl bg-white text-brand-gray text-[11px] font-semibold border border-surface-border">Bestätigungs-E-Mail erneut senden</button>
          <button type="button" id="magicLinkLogin" class="w-full py-3 rounded-xl bg-surface-card text-brand-black text-xs font-semibold border border-surface-border">Magic Link per E-Mail senden</button>
          <div class="pt-3 mt-3 border-t border-surface-border">
            <p class="text-[10px] uppercase tracking-wider text-brand-gray font-semibold mb-1">OPPO Mitarbeiter / Admin</p>
            <p class="text-[11px] text-brand-gray leading-relaxed">Mitarbeiter und Administratoren melden sich ebenfalls oben mit E-Mail und Passwort an.</p>
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
        if (result.role === 'admin' || result.role === 'super_admin') {
          window.location.assign('/admin');
          return;
        }
        if (result.role === 'employee') {
          window.location.assign('/staff');
          return;
        }
        window.location.assign('/my-referrals');
        return;
      } catch (e) {
        errorEl.textContent = e.message === 'EMAIL_NOT_CONFIRMED'
          ? 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Sie können die Bestätigungs-E-Mail unten erneut senden.'
          : e.message === 'INVALID_EMAIL_OR_PASSWORD'
            ? 'E-Mail oder Passwort ist nicht korrekt.'
            : e.message;
        errorEl.classList.remove('hidden');
      }
    });
    $('#resendConfirmation').addEventListener('click', async () => {
      const email = $('#loginEmail').value.trim();
      if (!email) return toast('Bitte zuerst Ihre E-Mail eingeben.');
      try {
        await api('/api/auth/resend-confirmation', { method: 'POST', body: JSON.stringify({ email }) });
        const info = $('#loginInfo');
        info.textContent = 'Bestätigungs-E-Mail wurde erneut gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.';
        info.classList.remove('hidden');
      } catch (e) { toast(e.message); }
    });
    $('#magicLinkLogin').addEventListener('click', async () => {
      const email = $('#loginEmail').value.trim();
      if (!email) return toast('Bitte zuerst Ihre E-Mail eingeben.');
      try { await api('/api/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }); toast('Magic Link wurde per E-Mail gesendet.'); wrapper.classList.add('hidden'); }
      catch (e) { toast(e.message); }
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
    const passwordConfirm = $('#regPasswordConfirm')?.value || '';
    const termsAccepted = Boolean($('#regTermsAccepted')?.checked);
    if (!firstName || !lastName || !email || password.length < 8 || !termsAccepted) {
      return toast('Bitte Pflichtfelder vollständig ausfüllen und Teilnahmebedingungen akzeptieren.');
    }
    if (password !== passwordConfirm) {
      return toast('Die beiden Passwörter stimmen nicht überein.');
    }
    try {
      const result = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({
        email, password, passwordConfirm, firstName, lastName, country: 'AT', language: 'de', mode: 'password', termsAccepted,
        ownerVerificationReference: $('#regOwnerReference')?.value?.trim() || undefined,
      })});
      if (typeof original.closeRegisterModal === 'function') original.closeRegisterModal();
      if (result.confirmationRequired) {
        setGuestUI();
        ensureLoginModal();
        const modal = $('#realLoginModal');
        if (modal) modal.classList.remove('hidden');
        const loginEmail = $('#loginEmail');
        if (loginEmail) loginEmail.value = email;
        const info = $('#loginInfo');
        if (info) {
          info.textContent = 'Konto erstellt. Bitte bestätigen Sie jetzt Ihre E-Mail-Adresse. Danach können Sie sich direkt anmelden.';
          info.classList.remove('hidden');
        }
        toast('Registrierung erfolgreich. Bestätigungs-E-Mail wurde gesendet.');
      } else {
        window.location.assign('/my-referrals');
        return;
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
    $$('.tab-content').forEach(el => el.style.removeProperty('display'));
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
    renderMemberV2();
    window.ReferralI18n?.refresh?.();
  });

  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
})();
