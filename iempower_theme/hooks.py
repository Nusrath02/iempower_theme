app_name = "iempower_theme"
app_title = "iEmpPower Theme"
app_publisher = "ITChamps Software Private Limited"
app_description = "Shared visual theme (design tokens, CSS, and generic UI widgets) for the iEmpower ESS portal."
app_email = "support@itchamps.com"
app_license = "MIT"

web_include_css = ["/assets/iempower_theme/css/theme.css"]
web_include_js = ["/assets/iempower_theme/js/widgets.js"]

# This app ships no doctypes, no server-side hooks, and no business logic —
# just static assets under public/css and public/js. These web include hooks
# intentionally load the shared theme site-wide so every web page gets the
# design tokens and widget behavior without having to add the asset tags one
# by one on each page.
