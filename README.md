# iEmpPower Theme

Shared visual theme for the iEmpPower ESS portal — design tokens (the
"Efficient Modernist" system: teal `#008BB1`, Hanken Grotesk, 8/16/4px
radii), a small set of generic CSS components (buttons, cards, badges,
form controls, custom select, date picker, modal chrome), and the shared
sidebar shell's CSS + behavior JS.

This app ships **no doctypes, no server-side hooks, and no business
logic** — just two static files:

```
iempower_theme/
├── hooks.py                     app metadata only
├── public/
│   ├── css/theme.css            design tokens + component CSS
│   └── js/widgets.js            generic select/date-picker/modal/sidebar JS
```

It deliberately does **not** register `app_include_css` / `web_include_css`,
so it never forces itself onto Desk or every website page. Each portal page
opts in explicitly, the same way every page already includes the shared
sidebar script:

```html
<link rel="stylesheet" href="/assets/iempower_theme/css/theme.css">
<script src="/assets/iempower_theme/js/widgets.js"></script>
```

## What's in scope here — and what isn't

**In this app (visual/UX only, no field or permission logic):**
- Color tokens, typography, spacing/radius scale
- Buttons, cards, stat cards, badges/status chips, form control styling
- Custom select widget (wraps a native `<select>`)
- Custom date picker widget (wraps a native `<input type=date>`, with
  optional min/max linkage for From/To date pairs)
- Modal chrome — confirm dialogs and the outcome-colored result popup
- The "How to…" explainer modal shell
- The sidebar's CSS shell (layout, nav-item styling, avatar/dropdown,
  mobile toggle, scroll-hide behavior, light/dark toggle)

**Deliberately NOT in this app** — this stays in each page's own script,
exactly as it is today:
- Doctype/field names, API calls, `frappe.client.*` calls
- Advanced Filter field lists, operators, link-search
- Bulk-action eligibility rules, approval logic
- The sidebar's nav item list, HR allowlist check, and the
  Employee/User lookup that resolves the display name and avatar initial
- Frappe-chrome cleanup (`killStrayNavbar` and similar) — specific to how
  a given page is embedded, not a visual concern

## Install on Frappe Cloud

Same mechanism already used for `itchamps_timesheet`:

1. Push this repo to GitHub.
2. On Frappe Cloud, add the repository as a custom app to your bench
   group and deploy. A private bench is required.
3. On the site, install the app:
   ```
   bench --site <site> install-app iempower_theme
   ```

No `bench migrate` step is required — there's nothing to migrate.

## Using the widgets

```html
<link rel="stylesheet" href="/assets/iempower_theme/css/theme.css">
<script src="/assets/iempower_theme/js/widgets.js"></script>

<div class="iet-root iet-fade-in" id="my-page-root">
  <div class="iet-cs-wrap">
    <select id="status-filter">
      <option value="">Status: All</option>
      <option value="Draft">Draft</option>
    </select>
  </div>
  <input type="text" id="from-date" placeholder="From date">
</div>

<script>
  IET.initCustomSelect(document.getElementById('status-filter'), { placeholder: 'Status: All' });
  IET.initDatePicker(document.getElementById('from-date'), {
    placeholder: 'From date',
    getMax: function(){ return document.getElementById('to-date').value; }
  });
  IET.revealOnReady('my-page-root');
</script>
```

See `public/js/widgets.js` for the full list of exported `IET.*` functions
and their options.
