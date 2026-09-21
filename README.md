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

## How to use this theme after installation

Once the app is installed on a site, the shared assets are loaded through the app hooks, so developers do not need to add the stylesheet or script tag manually on every page.

### Global hook setup

```python
web_include_css = [
    "/assets/iempower_theme/css/theme.css",
    "/assets/iempower_theme/css/compatibility.css",
]

web_include_js = [
    "/assets/iempower_theme/js/widgets.js",
]
```

This means the theme CSS and shared widgets are available across the site automatically.

### Use the theme contract on new pages

The page should follow the shared theme structure. Use classes like:

- `.iet-root`
- `.iet-page`
- `.iet-card`
- `.iet-btn`
- `.iet-btn-outline`
- `.iet-filters`
- `.iet-filter-field`
- `data-iet-select`
- `data-iet-date`

Example:

```html
<div class="iet-root" id="dashboard-root">
  <div class="iet-page">
    <h1>Overview</h1>

    <div class="iet-filters">
      <div class="iet-filter-field">
        <select data-iet-select data-placeholder="Status: All">
          <option value="">All</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
        </select>
      </div>

      <div class="iet-filter-field">
        <input type="date" id="from-date" data-iet-date data-placeholder="From date" data-max="#to-date">
      </div>

      <div class="iet-filter-field">
        <input type="date" id="to-date" data-iet-date data-placeholder="To date" data-min="#from-date">
      </div>
    </div>

    <div class="iet-cards-row">
      <div class="iet-card">
        <div class="iet-stat-label">Total</div>
        <div class="iet-stat-value">128</div>
      </div>
    </div>

    <div class="iet-actions">
      <button class="iet-btn">Add New</button>
      <button class="iet-btn-outline">Export</button>
    </div>
  </div>
</div>
```

### Why this works

The shared JS automatically initializes any element using `data-iet-select` or `data-iet-date`, so developers do not need to write the widget setup script for each page.

### Legacy / older pages

Older pages that still use legacy classes like `.btn`, `.card`, `.sidebar`, etc. can keep working because the app also includes a compatibility stylesheet:

```python
web_include_css = [
    "/assets/iempower_theme/css/theme.css",
    "/assets/iempower_theme/css/compatibility.css",
]
```

This helps maintain visual consistency until older pages are gradually migrated to the `.iet-*` pattern.

### Important note

This theme is designed to style the content area and shared widgets. It does not replace the entire host shell of a Frappe dashboard. The page should still follow the theme contract for best results, while older pages can rely on compatibility support.

See `public/js/widgets.js` for the full list of exported `IET.*` functions and their options.
