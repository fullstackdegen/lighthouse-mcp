# Lighthouse Implementation Report

- Target: https://www.commalabs.co/tr
- Status: **complete**
- Generated: 2026-06-14T17:35:41.505Z
- Mode: fast (1 run(s) per profile)
- Lighthouse: 12.8.2
- User agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36

## Category Scores

| Category | Mobile median (range) | Desktop median (range) |
| --- | ---: | ---: |
| Performance | 93/100 (93-93/100) | 100/100 (100-100/100) |
| Accessibility | 96/100 (96-96/100) | 96/100 (96-96/100) |
| Best Practices | 96/100 (96-96/100) | 96/100 (96-96/100) |
| SEO | 92/100 (92-92/100) | 92/100 (92-92/100) |

## Key Metrics

| Metric | Mobile median (range) | Desktop median (range) |
| --- | ---: | ---: |
| First Contentful Paint | 966.33 ms (966.33-966.33 ms) | 305.56 ms (305.56-305.56 ms) |
| Speed Index | 2178.73 ms (2178.73-2178.73 ms) | 375.10 ms (375.10-375.10 ms) |
| Largest Contentful Paint | 3216.33 ms (3216.33-3216.33 ms) | 585.56 ms (585.56-585.56 ms) |
| Total Blocking Time | 15 ms (15-15 ms) | 0 ms (0-0 ms) |
| Cumulative Layout Shift | 0 (0-0) | 0 (0-0) |

## Prioritized Issues

### 1. Links do not have a discernible name

- Audit: `link-name`
- Category: accessibility
- Severity: **critical**
- Affected profiles: mobile, desktop
- Description: Link text (and alternate text for images, when used as links) that is discernible, unique, and focusable improves the navigation experience for screen reader users. [Learn how to make links accessible](https://dequeuniversity.com/rules/axe/4.10/link-name).
- Mobile result: score 0; no display value
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/commalabs">
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/commalabs.co">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#consultation">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#team">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#contact">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="https://wa.me/905372519038">
- Desktop result: score 0; no display value
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/company/commalabs">
  - Evidence: selector div.border-t-2 > div.flex > div.flex > a.text-gray-600; snippet <a class="text-gray-600 hover:text-black transition-colors" target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/commalabs.co">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#consultation">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#team">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="#contact">
  - Evidence: selector nav.fixed > div.mx-auto > div.flex > a.whitespace-nowrap; snippet <a target="_blank" rel="noopener noreferrer" class="whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-vis…" data-state="closed" href="https://wa.me/905372519038">
- Suggested actions:
  - Give every link a discernible accessible name.
- Acceptance criteria:
  - All link elements pass the Lighthouse link-name audit.
  - Raise the median accessibility score to at least 90/100.
- Documentation: https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html

### 2. Largest Contentful Paint element

- Audit: `largest-contentful-paint-element`
- Category: performance
- Severity: **high**
- Affected profiles: mobile
- Description: This is the largest contentful element painted within the viewport. [Learn more about the Largest Contentful Paint element](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/)
- Mobile result: score 0; 3,220 ms
- Suggested actions:
  - Prioritize the LCP resource and reduce work required to render its element.
- Acceptance criteria:
  - Keep median Largest Contentful Paint at or below 2,500 ms.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/

### 3. Reduce unused JavaScript

- Audit: `unused-javascript`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity. [Learn how to reduce unused JavaScript](https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/).
- Mobile result: score 0; Est savings of 61 KiB
- Mobile impact: 300 ms, 62761 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/f7f8b7557f00a7b3.js; 38931 wasted bytes
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 23830 wasted bytes
- Desktop result: score 0; Est savings of 61 KiB
- Desktop impact: 40 ms, 62865 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/f7f8b7557f00a7b3.js; 38931 wasted bytes
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 23934 wasted bytes
- Suggested actions:
  - Remove unused modules and split non-critical JavaScript into on-demand chunks.
- Acceptance criteria:
  - Reduce the reported wasted JavaScript bytes.
  - Keep median mobile Total Blocking Time at or below 200 ms.
  - Raise the median performance score to at least 90/100.
  - Keep median desktop Total Blocking Time at or below 150 ms.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/unused-javascript/

### 4. Avoid serving legacy JavaScript to modern browsers

- Audit: `legacy-javascript`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Polyfills and transforms enable legacy browsers to use new JavaScript features. However, many aren't necessary for modern browsers. Consider modifying your JavaScript build process to not transpile [Baseline](https://web.dev/baseline) features, unless you know you must support legacy browsers. [Learn why most sites can deploy ES6+ code without transpiling](https://philipwalton.com/articles/the-state-of-es5-on-the-web/)
- Mobile result: score 0; Est savings of 14 KiB
- Mobile impact: 150 ms, 13950 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 13988 wasted bytes
- Desktop result: score 0.5; Est savings of 14 KiB
- Desktop impact: 0 ms, 13951 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/db74325abc5b5b35.js; 13997 wasted bytes
- Suggested actions:
  - Adjust the JavaScript build target to avoid unnecessary legacy transforms and polyfills for supported browsers.
- Acceptance criteria:
  - Reduce the legacy JavaScript bytes reported by Lighthouse.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/legacy-javascript/

### 5. Reduce unused CSS

- Audit: `unused-css-rules`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to decrease bytes consumed by network activity. [Learn how to reduce unused CSS](https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/).
- Mobile result: score 0; Est savings of 11 KiB
- Mobile impact: 150 ms, 11222 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; 11222 wasted bytes
- Desktop result: score 0.5; Est savings of 10 KiB
- Desktop impact: 0 ms, 10702 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; 10702 wasted bytes
- Suggested actions:
  - Remove unused selectors and load non-critical styles only where required.
- Acceptance criteria:
  - Reduce the reported wasted CSS bytes.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules/

### 6. Network dependency tree

- Audit: `network-dependency-tree-insight`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: [Avoid chaining critical requests](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains) by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load.
- Mobile result: score 0; no display value
  - Evidence: snippet [preconnect](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/) hints help the browser establish a connection earlier in the page load, saving time when the first request for that origin is made. The following are the origins that the page preconnected to.
  - Evidence: snippet Add [preconnect](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/) hints to your most important origins, but try to use no more than 4.
- Desktop result: score 0; no display value
  - Evidence: snippet [preconnect](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/) hints help the browser establish a connection earlier in the page load, saving time when the first request for that origin is made. The following are the origins that the page preconnected to.
  - Evidence: snippet Add [preconnect](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect/) hints to your most important origins, but try to use no more than 4.
- Suggested actions:
  - Shorten critical request chains, defer non-critical dependencies, and keep preconnect hints limited to required origins.
- Acceptance criteria:
  - Reduce the longest critical dependency chain and remove unnecessary preconnect hints reported by Lighthouse.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains/

### 7. Eliminate render-blocking resources

- Audit: `render-blocking-resources`
- Category: performance
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles. [Learn how to eliminate render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/).
- Mobile result: score 0; Est savings of 90 ms
- Mobile impact: 0 ms, 0 bytes estimated savings
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css; 150 wasted ms
- Desktop result: score 0.5; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/chunks/eb91abd9baf32259.css
- Suggested actions:
  - Inline critical styles and defer non-critical stylesheets and scripts.
- Acceptance criteria:
  - Eliminate render-blocking resources from the critical rendering path.
  - Raise the median performance score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources/

### 8. Browser errors were logged to the console

- Audit: `errors-in-console`
- Category: best-practices
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: Errors logged to the console indicate unresolved problems. They can come from network request failures and other browser concerns. [Learn more about this errors in console diagnostic audit](https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/)
- Mobile result: score 0; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/media/fonts.woff2; snippet Failed to load resource: the server responded with a status of 404 ()
- Desktop result: score 0; no display value
  - Evidence: URL https://www.commalabs.co/_next/static/media/fonts.woff2; snippet Failed to load resource: the server responded with a status of 404 ()
- Suggested actions:
  - Resolve application, resource-loading, and browser console errors.
- Acceptance criteria:
  - The audited page produces no Lighthouse-reported browser errors.
  - Raise the median best-practices score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console/

### 9. robots.txt is not valid

- Audit: `robots-txt`
- Category: seo
- Severity: **high**
- Affected profiles: mobile, desktop
- Description: If your robots.txt file is malformed, crawlers may not be able to understand how you want your website to be crawled or indexed. [Learn more about robots.txt](https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/).
- Mobile result: score 0; 6 errors found
- Desktop result: score 0; 6 errors found
- Suggested actions:
  - Fix robots.txt syntax errors, remove unsupported directives, and serve the file as plain text with an HTTP 200 response.
- Acceptance criteria:
  - Serve a valid robots.txt file that passes the Lighthouse robots-txt audit.
  - Raise the median seo score to at least 90/100.
- Documentation: https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/

## Coding-Agent Instructions

1. Treat `structuredContent` as the source of truth.
2. Inspect the repository before proposing file-level changes.
3. Address issues in prioritizedIssues order.
4. Prefer one source change that resolves the same audit on both profiles.
5. Preserve user-visible behavior and accessibility.
6. Run the repository's tests after each logical fix.
7. Rerun this Lighthouse tool in reliable mode.
8. Compare medians and variability against the report's acceptance criteria.
9. Do not claim completion when the new report is incomplete or materially more variable than the baseline.
