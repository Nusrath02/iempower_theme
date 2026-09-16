app_name = "iempower_theme"
app_title = "iEmpPower Theme"
app_publisher = "ITChamps Software Private Limited"
app_description = "Shared visual theme (design tokens, CSS, and generic UI widgets) for the iEmpPower ESS portal."
app_email = "support@itchamps.com"
app_license = "MIT"

# Intentionally empty.
#
# This app ships no doctypes, no server-side hooks, and no business logic —
# just static assets under public/css and public/js. Nothing here registers
# with app_include_css / app_include_js / web_include_css / web_include_js,
# on purpose: those hooks would force the theme onto every Desk page (or
# every website page) site-wide, which is not what was asked for. Instead,
# each portal Web Page opts in explicitly, exactly the way every page
# already includes the shared sidebar script:
#
#   <link rel="stylesheet" href="/assets/iempower_theme/css/theme.css">
#   <script src="/assets/iempower_theme/js/widgets.js"></script>
#
# If site-wide inclusion is ever wanted instead, the standard hooks are:
#   web_include_css = ["/assets/iempower_theme/css/theme.css"]
#   web_include_js  = ["/assets/iempower_theme/js/widgets.js"]
