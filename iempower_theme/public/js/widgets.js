/*
  iEmpPower Theme — shared UI widgets
  ------------------------------------------------------------
  Include after theme.css:
    <script src="/assets/iempower_theme/js/widgets.js"></script>

  Everything here is generic: it wraps plain DOM elements and
  takes callbacks/options, never a doctype name, field name, or
  API call. Pages keep their own data-fetching and business logic
  exactly as before — these functions only draw and wire up the
  chrome around it.

  All functions are namespaced on window.IET to avoid polluting
  the global scope.
*/
(function(){
  'use strict';
  if (window.IET) return; // already loaded on this page

  var IET = {};

  // Shared across every custom-select / date-picker instance on a page:
  // tracks whichever picker is currently open so opening a second one
  // explicitly closes the first, instead of leaving two floating panels
  // open at once.
  var activePickerClose = null;

  function esc(s){
    return (s == null ? '' : s.toString()).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* ============================================================
     Custom Select — wraps a native <select> without removing it
     from the DOM, so every existing 'change'/'input' listener on
     that element keeps firing exactly as before.

     ietInitCustomSelect(selectEl, opts)
       opts.placeholder — text shown when nothing is selected
     Returns { updateLabel } so the caller can force a refresh
     after changing select.value programmatically.
     ============================================================ */
  function ietInitCustomSelect(select, opts){
    opts = opts || {};
    if (!select || select.dataset.ietCsInit) return null;
    select.dataset.ietCsInit = '1';
    select.classList.add('iet-cs-native');

    var wrap = document.createElement('div');
    wrap.className = 'iet-cs-wrap';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'iet-cs-trigger';
    trigger.innerHTML = '<span class="iet-cs-label"></span>'
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    wrap.appendChild(trigger);

    var panel = document.createElement('div');
    panel.className = 'iet-cs-panel';
    wrap.appendChild(panel);

    function updateTrigger(){
      var opt = select.options[select.selectedIndex];
      var label = trigger.querySelector('.iet-cs-label');
      var isPlaceholder = !select.value;
      label.textContent = opt ? opt.text : (opts.placeholder || '');
      label.classList.toggle('iet-placeholder', isPlaceholder);
    }
    function renderPanel(){
      panel.innerHTML = '';
      Array.prototype.forEach.call(select.options, function(opt){
        var row = document.createElement('div');
        var isSelected = opt.value === select.value;
        row.className = 'iet-cs-option' + (isSelected ? ' iet-selected' : '');
        row.innerHTML = '<span>' + esc(opt.text) + '</span>'
          + (isSelected ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '');
        row.addEventListener('click', function(){
          select.value = opt.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          updateTrigger();
          closePanel();
        });
        panel.appendChild(row);
      });
    }
    function openPanel(){
      renderPanel();
      panel.classList.add('iet-open');
      trigger.classList.add('iet-open');
      document.addEventListener('click', outsideClick);
      activePickerClose = closePanel;
    }
    function closePanel(){
      panel.classList.remove('iet-open');
      trigger.classList.remove('iet-open');
      document.removeEventListener('click', outsideClick);
      if (activePickerClose === closePanel) activePickerClose = null;
    }
    function outsideClick(e){ if (!wrap.contains(e.target)) closePanel(); }

    trigger.addEventListener('click', function(e){
      e.stopPropagation();
      if (panel.classList.contains('iet-open')) {
        closePanel();
      } else {
        if (activePickerClose && activePickerClose !== closePanel) activePickerClose();
        openPanel();
      }
    });

    // Options can be populated after init (e.g. an async fetch) — a
    // MutationObserver keeps the trigger label in sync without the
    // caller having to remember to call updateTrigger() themselves.
    var observer = new MutationObserver(updateTrigger);
    observer.observe(select, { childList: true });

    updateTrigger();
    return { updateLabel: updateTrigger };
  }

  /* ============================================================
     Custom Date Picker — pill trigger + calendar popup, wraps a
     native <input type=date> without removing it.

     ietInitDatePicker(inputEl, opts)
       opts.placeholder — text shown when no date is picked
       opts.getMin() / opts.getMax() — optional functions returning
         an ISO date string; any day outside that bound renders
         disabled. Used to pair a From/To date pair so an invalid
         range can't be picked (see the From/To min/max examples
         throughout the portal's filter bars).
     Returns { updateLabel }.
     ============================================================ */
  function ietInitDatePicker(input, opts){
    opts = opts || {};
    if (!input || input.dataset.ietDpInit) return null;
    input.dataset.ietDpInit = '1';
    input.classList.add('iet-dp-native');

    var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    var wrap = document.createElement('div');
    wrap.className = 'iet-dp-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'iet-dp-trigger';
    trigger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
      + '<span class="iet-dp-label"></span>';
    wrap.appendChild(trigger);

    var panel = document.createElement('div');
    panel.className = 'iet-dp-panel';
    wrap.appendChild(panel);

    var view = null; // { y, m } — the month currently shown in the popup

    function pad(n){ return n < 10 ? '0' + n : '' + n; }
    function toISO(y, m, d){ return y + '-' + pad(m + 1) + '-' + pad(d); }
    function parseISO(s){ if (!s) return null; var p = s.split('-'); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; }
    function daysInMonth(y, m){ return new Date(y, m + 1, 0).getDate(); }

    function updateLabel(){
      var d = parseISO(input.value);
      var label = trigger.querySelector('.iet-dp-label');
      if (d) {
        label.textContent = pad(d.d) + '-' + pad(d.m + 1) + '-' + d.y;
        label.classList.remove('iet-placeholder');
      } else {
        label.textContent = opts.placeholder || 'Select date';
        label.classList.add('iet-placeholder');
      }
    }

    function renderPanel(){
      var y = view.y, m = view.m;
      var selIso = input.value;
      var minIso = opts.getMin ? (opts.getMin() || '') : '';
      var maxIso = opts.getMax ? (opts.getMax() || '') : '';
      var today = new Date();
      var todayIso = toISO(today.getFullYear(), today.getMonth(), today.getDate());

      var startWeekday = new Date(y, m, 1).getDay();
      var total = daysInMonth(y, m);
      var prevTotal = daysInMonth(y, m - 1);

      var cells = [];
      for (var i = startWeekday - 1; i >= 0; i--) {
        var pm = m === 0 ? 11 : m - 1, py = m === 0 ? y - 1 : y;
        cells.push({ d: prevTotal - i, muted: true, iso: toISO(py, pm, prevTotal - i) });
      }
      for (var d = 1; d <= total; d++) cells.push({ d: d, muted: false, iso: toISO(y, m, d) });
      var next = 1;
      while (cells.length < 42) {
        var nm = m === 11 ? 0 : m + 1, ny = m === 11 ? y + 1 : y;
        cells.push({ d: next, muted: true, iso: toISO(ny, nm, next) });
        next++;
      }

      var minY = minIso ? +minIso.split('-')[0] : null, minM = minIso ? +minIso.split('-')[1] - 1 : null;
      var atMin = minIso && ((y === minY && m === minM) || y < minY || (y === minY && m < minM));

      var html = '<div class="iet-dp-header">'
        + '<button type="button" class="iet-dp-nav" data-nav="-1"' + (atMin ? ' disabled' : '') + '>'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg></button>'
        + '<span class="iet-dp-title">' + MONTHS[m] + ' ' + y + '</span>'
        + '<button type="button" class="iet-dp-nav" data-nav="1">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg></button>'
        + '</div>'
        + '<div class="iet-dp-weekdays">' + WEEKDAYS.map(function(w){ return '<span>' + w + '</span>'; }).join('') + '</div>'
        + '<div class="iet-dp-days">';

      cells.forEach(function(c){
        if (c.muted) { html += '<div class="iet-dp-day iet-muted">' + c.d + '</div>'; return; }
        var disabled = (minIso && c.iso < minIso) || (maxIso && c.iso > maxIso);
        var cls = 'iet-dp-day'
          + (c.iso === selIso ? ' iet-selected' : '')
          + (c.iso === todayIso ? ' iet-today' : '');
        html += '<button type="button" class="' + cls + '" data-iso="' + c.iso + '"' + (disabled ? ' disabled' : '') + '>' + c.d + '</button>';
      });
      html += '</div>';
      panel.innerHTML = html;

      panel.querySelectorAll('[data-nav]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          view.m += parseInt(btn.getAttribute('data-nav'), 10);
          if (view.m < 0) { view.m = 11; view.y--; }
          if (view.m > 11) { view.m = 0; view.y++; }
          renderPanel();
        });
      });
      panel.querySelectorAll('.iet-dp-day[data-iso]:not(:disabled)').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          input.value = btn.getAttribute('data-iso');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          updateLabel();
          closePanel();
        });
      });
    }

    function openPanel(){
      var cur = parseISO(input.value) || (function(){ var t = new Date(); return { y: t.getFullYear(), m: t.getMonth() }; })();
      view = { y: cur.y, m: cur.m };
      renderPanel();
      panel.classList.add('iet-open');
      trigger.classList.add('iet-open');
      document.addEventListener('click', outsideClick);
      activePickerClose = closePanel;
    }
    function closePanel(){
      panel.classList.remove('iet-open');
      trigger.classList.remove('iet-open');
      document.removeEventListener('click', outsideClick);
      if (activePickerClose === closePanel) activePickerClose = null;
    }
    function outsideClick(e){ if (!wrap.contains(e.target)) closePanel(); }

    trigger.addEventListener('click', function(e){
      e.stopPropagation();
      if (panel.classList.contains('iet-open')) {
        closePanel();
      } else {
        if (activePickerClose && activePickerClose !== closePanel) activePickerClose();
        openPanel();
      }
    });

    updateLabel();
    input._ietDpUpdate = updateLabel;
    return { updateLabel: updateLabel };
  }

  /* ============================================================
     Modal helpers — open/close by id, backdrop-click-to-close.
     Works for both the plain confirm modal (.iet-modal-bg /
     .iet-modal) and the result-popup variant — same open/close
     mechanics either way.
     ============================================================ */
  function ietOpenModal(bgId){
    var el = document.getElementById(bgId);
    if (el) el.classList.add('iet-open');
  }
  function ietCloseModal(bgId){
    var el = document.getElementById(bgId);
    if (el) el.classList.remove('iet-open');
  }
  // Wires a modal backdrop so clicking outside the modal card closes it.
  // Call once per modal after it's in the DOM.
  function ietWireModalBackdrop(bgId){
    var el = document.getElementById(bgId);
    if (!el || el.dataset.ietBackdropWired) return;
    el.dataset.ietBackdropWired = '1';
    el.addEventListener('click', function(e){ if (e.target === el) el.classList.remove('iet-open'); });
  }

  // Fills and opens the result-popup variant. iconEl/okBtnEl are the
  // .iet-result-icon / .iet-btn-result-ok elements inside that modal;
  // variant is 'success' | 'warn' | 'reject'.
  function ietShowResultModal(bgId, opts){
    opts = opts || {};
    var bg = document.getElementById(bgId);
    if (!bg) return;
    var iconEl = bg.querySelector('.iet-result-icon');
    var okBtn = bg.querySelector('.iet-btn-result-ok');
    var titleEl = bg.querySelector('.iet-result-modal h3');
    var textEl = bg.querySelector('.iet-result-modal p');
    var variant = opts.variant || 'success';
    var ICONS = {
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    if (iconEl) { iconEl.className = 'iet-result-icon iet-' + variant; iconEl.innerHTML = variant === 'warn' ? ICONS.alert : ICONS.check; }
    if (okBtn) okBtn.className = 'iet-btn-result-ok iet-' + variant;
    if (titleEl) titleEl.textContent = opts.title || (variant === 'warn' ? 'Action complete' : 'Success');
    if (textEl) textEl.textContent = opts.text || '';
    bg.classList.add('iet-open');
  }

  /* ============================================================
     Anti-blink reveal — same "hide until ready" technique used
     across the portal. Call once on page load; it strips Frappe's
     outer chrome (hiding stray siblings walking up from rootId)
     and reveals rootEl (adds .iet-ready) once both cleanup and the
     window load event have happened.

     opts.exemptPattern — a RegExp tested against a sibling's
       id+class; matching siblings are never hidden (defaults to
       /sidebar/i so the shared sidebar always survives).
     ============================================================ */
  function ietRevealOnReady(rootId, opts){
    opts = opts || {};
    var exemptPattern = opts.exemptPattern || /sidebar/i;

    function run(){
      var root = document.getElementById(rootId);
      if (!root) return;
      var el = root;
      while (el.parentElement) {
        var parent = el.parentElement;
        Array.prototype.forEach.call(parent.children, function(sib){
          if (sib === el) return;
          var tag = sib.tagName;
          var idClass = (sib.id || '') + ' ' + (sib.className || '');
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NAV' || tag === 'ASIDE' || tag === 'LINK') return;
          if (exemptPattern.test(idClass)) return;
          sib.style.setProperty('display', 'none', 'important');
        });
        ['padding-top','margin-top','padding-bottom','margin-bottom','padding-left','margin-left',
         'padding-right','margin-right'].forEach(function(prop){ parent.style.setProperty(prop, '0', 'important'); });
        parent.style.setProperty('width', 'auto', 'important');
        parent.style.setProperty('max-width', 'none', 'important');
        parent.style.setProperty('height', 'auto', 'important');
        parent.style.setProperty('max-height', 'none', 'important');
        parent.style.setProperty('overflow-y', 'visible', 'important');
        if (parent.tagName === 'BODY') break;
        el = parent;
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
    setTimeout(run, 500);
    setTimeout(run, 1500);

    function reveal(){
      run();
      var root = document.getElementById(rootId);
      if (root) root.classList.add('iet-ready');
    }
    if (document.readyState === 'complete') reveal(); else window.addEventListener('load', reveal);
    setTimeout(reveal, 2000); // safety net — never leave the page invisible
  }

  /* ============================================================
     Sidebar shell chrome — mobile open/close, scroll-hide the
     top-right avatar, persisted light/dark toggle. Nav items, HR
     gating, and the user/employee lookup are NOT handled here —
     each site's own sidebar script still supplies those and calls
     into this file only for the generic behaviors below.
     ============================================================ */
  function ietSetupSidebarMobileToggle(toggleId, overlayId){
    var toggle = document.getElementById(toggleId);
    var overlay = document.getElementById(overlayId);
    if (toggle) toggle.addEventListener('click', function(){ document.body.classList.toggle('iet-sb-open'); });
    if (overlay) overlay.addEventListener('click', function(){ document.body.classList.remove('iet-sb-open'); });
  }

  // Hides the top-right avatar/dropdown as soon as the page scrolls away
  // from the top, and only brings it back once scrolled back to the very
  // top — no debounce, matches the sidebar's documented behavior.
  function ietSetupSidebarScrollHide(topbarId, dropdownId){
    var topbar = document.getElementById(topbarId);
    var dropdown = document.getElementById(dropdownId);
    if (!topbar) return;
    function handleScroll(){
      var atTop = (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
      if (atTop) {
        topbar.classList.remove('iet-scroll-hidden');
      } else {
        topbar.classList.add('iet-scroll-hidden');
        if (dropdown) dropdown.classList.remove('iet-open');
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function ietSetupSidebarAvatarDropdown(btnId, dropdownId){
    var btn = document.getElementById(btnId);
    var dropdown = document.getElementById(dropdownId);
    if (!btn || !dropdown) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      dropdown.classList.toggle('iet-open');
    });
    document.addEventListener('click', function(e){
      if (!btn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('iet-open');
    });
  }

  // Persisted light/dark toggle for the sidebar shell's own chrome only
  // (see the html.iet-theme-dark rules in theme.css). Restores the saved
  // preference on load and returns a toggle function to wire to a button.
  function ietSetupSidebarThemeToggle(buttonId){
    if (localStorage.getItem('iet-theme') === 'dark') {
      document.documentElement.classList.add('iet-theme-dark');
    }
    var btn = document.getElementById(buttonId);
    if (btn) {
      btn.addEventListener('click', function(){
        var isDark = document.documentElement.classList.toggle('iet-theme-dark');
        localStorage.setItem('iet-theme', isDark ? 'dark' : 'light');
      });
    }
  }

  IET.initCustomSelect = ietInitCustomSelect;
  IET.initDatePicker = ietInitDatePicker;
  IET.openModal = ietOpenModal;
  IET.closeModal = ietCloseModal;
  IET.wireModalBackdrop = ietWireModalBackdrop;
  IET.showResultModal = ietShowResultModal;
  IET.revealOnReady = ietRevealOnReady;
  IET.setupSidebarMobileToggle = ietSetupSidebarMobileToggle;
  IET.setupSidebarScrollHide = ietSetupSidebarScrollHide;
  IET.setupSidebarAvatarDropdown = ietSetupSidebarAvatarDropdown;
  IET.setupSidebarThemeToggle = ietSetupSidebarThemeToggle;

  document.addEventListener('DOMContentLoaded', function () {
    if (!window.IET) return;

    document.querySelectorAll('select[data-iet-select]').forEach(function (el) {
      if (el.dataset.ietReady === '1') return;
      el.dataset.ietReady = '1';
      IET.initCustomSelect(el, {
        placeholder: el.dataset.placeholder || 'Select'
      });
    });

    document.querySelectorAll('input[data-iet-date]').forEach(function (el) {
      if (el.dataset.ietReady === '1') return;
      el.dataset.ietReady = '1';

      var opts = {
        placeholder: el.dataset.placeholder || 'Select date'
      };

      if (el.dataset.min) {
        opts.getMin = function () {
          var target = document.querySelector(el.dataset.min);
          return target ? target.value : '';
        };
      }

      if (el.dataset.max) {
        opts.getMax = function () {
          var target = document.querySelector(el.dataset.max);
          return target ? target.value : '';
        };
      }

      IET.initDatePicker(el, opts);
    });
  });

  window.IET = IET;
})();
