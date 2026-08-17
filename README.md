# Kiddom Webflow Scripts & Styles

This repository contains the custom JavaScript modules and SCSS styles used on the Kiddom Webflow site. 
Because Webflow does not natively support hosting complex, multi-file JavaScript/SCSS projects, we develop the code here and serve it to Webflow using a CDN.

## Local Development

We use Gulp, Dart Sass, PostCSS, and Webpack to compile styles and bundle scripts, injecting them into a local proxy of the staging site.

### 1. Installation
Make sure you have Node.js installed, then install the dependencies:
```bash
npm install
```

### 2. Run the Dev Server
```bash
gulp watch
```
This will start a local proxy (using BrowserSync) of `https://kiddom-staging.webflow.io/`:
* **JavaScript**: Changes to `src/js/` (entry `src/js/kiddom-scripts.js` and `src/js/modules/`) are bundled into `dist/js/kiddom-scripts-bundled.js` and hot-reloaded.
* **SCSS/CSS**: Changes to `src/sass/` (entry `src/sass/kiddom-styles.scss` and partials) are compiled into `dist/css/kiddom-styles.min.css` and live-streamed without full page reloads.

---

## Deployment & Cache Purging

When you are ready to deploy your changes, simply commit and push your code to the `main` branch on GitHub.

The assets are served to Webflow via CDNs, which aggressively cache files to improve performance. This means you might not see your changes immediately on the live site.

### jsDelivr Cache Purge Links
Clicking these links will manually purge the jsDelivr cache and force it to fetch the latest version from GitHub. It will return a JSON response indicating whether the purge was successful (`"purged": true`).

* **<a href="https://purge.jsdelivr.net/gh/Sulzer-Inc/kd-2026-scripts@main/dist/js/kiddom-scripts-bundled.js" target="_blank">Purge Bundled JavaScript</a>**
* **<a href="https://purge.jsdelivr.net/gh/Sulzer-Inc/kd-2026-scripts@main/dist/css/kiddom-styles.min.css" target="_blank">Purge Compiled CSS</a>**

> [!NOTE]
> **Rate Limiting / Throttling:** When a file path on `@main` is purged multiple times in a short window, jsDelivr rate-limits / throttles purge requests to protect its edge servers. If the JSON response shows `"throttled": true`, the API will ignore new purge attempts until the cooldown timer (`throttlingReset` ~8 minutes) expires.

### GitHub Pages (Staging)
* **`sulzer-inc.github.io` (Staging):** We use GitHub Pages to serve files for staging because it updates instantly when code is pushed to `main` and has no aggressive caching or rate-limiting.

---

## Webflow Code Snippets

We use a small script to automatically load the fast GitHub Pages links on staging (`webflow.io`) and the cached jsDelivr links on production (`kiddom.co`).

### 1. Styles (`<head>` Code)
Paste this into the **"Inside `<head>` tag"** section in Webflow's Custom Code settings:

```html
<!-- Consolidated Kiddom Styles -->
<script>
(function() {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  if (window.location.hostname.indexOf('webflow.io') !== -1) {
    // Staging, Localhost, Designer Preview, etc. (GitHub Pages)
    link.href = 'https://sulzer-inc.github.io/kd-2026-scripts/dist/css/kiddom-styles.min.css';
  } else {
    // Production (jsDelivr CDN)
    link.href = 'https://cdn.jsdelivr.net/gh/Sulzer-Inc/kd-2026-scripts@main/dist/css/kiddom-styles.min.css';
  }
  document.head.appendChild(link);
})();
</script>
```

### 2. Scripts (Before `</body>` Code)
Paste this into the **"Before `</body>` tag"** section in Webflow's Custom Code settings:

```html
<!-- Consolidated Kiddom Scripts -->
<script>
(function() {
  var script = document.createElement('script');
  script.defer = true;
  if (window.location.hostname.indexOf('webflow.io') !== -1) {
    // Staging, Localhost, Designer Preview, etc. (GitHub Pages)
    script.src = 'https://sulzer-inc.github.io/kd-2026-scripts/dist/js/kiddom-scripts-bundled.js';
  } else {
    // Production (jsDelivr CDN)
    script.src = 'https://cdn.jsdelivr.net/gh/Sulzer-Inc/kd-2026-scripts@main/dist/js/kiddom-scripts-bundled.js';
  }
  document.body.appendChild(script);
})();
</script>
```
