# Kiddom Webflow Scripts

This repository contains the custom JavaScript modules used on the Kiddom Webflow site. 
Because Webflow does not natively support hosting complex, multi-file JavaScript projects or ES modules, we develop the code here and serve it to Webflow using a CDN.

## Local Development

We use Gulp and Webpack to bundle the scripts and inject them into a local proxy of the staging site.

### 1. Installation
Make sure you have Node.js installed, then install the dependencies:
```bash
npm install
```

### 2. Run the Dev Server
```bash
gulp watch
```
This will start a local proxy (using BrowserSync) of `https://kiddom-staging.webflow.io/`. Any changes you make to the local JavaScript files (`kiddom-scripts.js` or files in `/modules/`) will automatically be bundled by Webpack into `dist/js/kiddom-scripts-bundled.js` and injected into the proxied page on-the-fly.

---

## Deployment & Cache Purging

When you are ready to deploy your changes, simply commit and push your code to the `main` branch on GitHub.

The scripts are served to Webflow via CDNs, which aggressively cache files to improve performance. This means you might not see your changes immediately on the live site.

### jsDelivr Cache Purge Links
Clicking this link will manually purge the jsDelivr cache and force it to fetch the latest version from GitHub. It will return a JSON response indicating whether the purge was successful (`"purged": true`).

* **<a href="https://purge.jsdelivr.net/gh/Sulzer-Inc/kd-2026-scripts@main/dist/js/kiddom-scripts-bundled.js" target="_blank">Purge Bundled Script</a>**

> [!NOTE]
> **Rate Limiting / Throttling:** When a file path on `@main` is purged multiple times in a short window, jsDelivr rate-limits / throttles purge requests to protect its edge servers. If the JSON response shows `"throttled": true`, the API will ignore new purge attempts until the cooldown timer (`throttlingReset` ~8 minutes) expires.

### Githack
* **`raw.githack.com` (Development):** The cache automatically expires every **1 minute**. You do not need to manually purge it; just wait 60 seconds after your push.
* **`rawcdn.githack.com` (Production):** The cache is set to expire after **1 year**. It cannot be easily purged. If you are using this in production, you should use jsDelivr instead, or you will need to append a query parameter or change the filename in Webflow to bust the cache.

---

## Webflow Script Injection Snippet

If you need to re-add or reference the script injection code used in Webflow, here it is. **This should be pasted into the "Before `</body>` tag" section in Webflow's Custom Code settings.** This automatically serves the jsDelivr version on production (`kiddom.co`) and the Githack version on staging or the Webflow designer.

```html
<!-- Consolidated Kiddom Scripts -->
<script>
(function() {
  var script = document.createElement('script');
  if (window.location.hostname.indexOf('kiddom.co') !== -1) {
    // Production
    script.src = 'https://cdn.jsdelivr.net/gh/Sulzer-Inc/kd-2026-scripts@main/dist/js/kiddom-scripts-bundled.js';
  } else {
    // Staging, Localhost, Designer Preview, etc.
    script.src = 'https://raw.githack.com/Sulzer-Inc/kd-2026-scripts/main/dist/js/kiddom-scripts-bundled.js';
  }
  document.body.appendChild(script);
})();
</script>
```
