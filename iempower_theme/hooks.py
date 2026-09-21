app_name = "iempower_theme"
app_title = "iEmpPower Theme"
app_publisher = "ITChamps Software Private Limited"
app_description = "Shared visual theme (design tokens, CSS, and generic UI widgets) for the iEmpower ESS portal."
app_email = "support@itchamps.com"
app_license = "MIT"

web_include_css = [
    "/assets/iempower_theme/css/theme.css",
    "/assets/iempower_theme/css/compatibility.css",
]

web_include_js = [
    "/assets/iempower_theme/js/widgets.js",
]

# This app ships no doctypes, no server-side hooks, and no business logic.
# It provides the shared visual layer site-wide so pages can use the theme
# contract automatically, while the compatibility stylesheet keeps older
# page layouts readable and consistent.