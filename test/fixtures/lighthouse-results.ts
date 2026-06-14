export interface FixtureOptions {
  performance?: number | null;
  accessibility?: number | null;
  bestPractices?: number | null;
  seo?: number | null;
  fcpMs?: number;
  speedIndexMs?: number;
  lcpMs?: number;
  tbtMs?: number;
  cls?: number;
  finalUrl?: string;
  formFactor?: "mobile" | "desktop";
  audits?: Record<string, unknown>;
}

export function makeLighthouseResult(options: FixtureOptions = {}) {
  const formFactor = options.formFactor ?? "mobile";
  return {
    requestedUrl: "https://example.com",
    finalUrl: options.finalUrl ?? "https://example.com/",
    finalDisplayedUrl: options.finalUrl ?? "https://example.com/",
    lighthouseVersion: "12.8.2",
    userAgent: "Fixture Chrome",
    configSettings: {
      formFactor,
      throttlingMethod: "simulate",
      screenEmulation:
        formFactor === "mobile"
          ? {
              mobile: true,
              width: 412,
              height: 823,
              deviceScaleFactor: 1.75,
              disabled: false,
            }
          : {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
    },
    categories: {
      performance: category(
        "performance",
        options.performance === undefined ? 0.8 : options.performance,
        [
          "first-contentful-paint",
          "speed-index",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "unused-javascript",
        ],
      ),
      accessibility: category(
        "accessibility",
        options.accessibility === undefined ? 0.9 : options.accessibility,
        ["image-alt"],
      ),
      "best-practices": category(
        "best-practices",
        options.bestPractices === undefined ? 0.9 : options.bestPractices,
        ["errors-in-console"],
      ),
      seo: category(
        "seo",
        options.seo === undefined ? 0.9 : options.seo,
        ["document-title"],
      ),
    },
    audits: {
      "first-contentful-paint": metric(
        "First Contentful Paint",
        options.fcpMs ?? 1000,
        "ms",
      ),
      "speed-index": metric(
        "Speed Index",
        options.speedIndexMs ?? 1500,
        "ms",
      ),
      "largest-contentful-paint": metric(
        "Largest Contentful Paint",
        options.lcpMs ?? 2500,
        "ms",
      ),
      "total-blocking-time": metric(
        "Total Blocking Time",
        options.tbtMs ?? 200,
        "ms",
      ),
      "cumulative-layout-shift": metric(
        "Cumulative Layout Shift",
        options.cls ?? 0.05,
        "unitless",
      ),
      "unused-javascript": {
        id: "unused-javascript",
        title: "Reduce unused JavaScript",
        description:
          "Remove unused JavaScript and defer loading scripts until required.",
        score: 0.5,
        scoreDisplayMode: "metricSavings",
        displayValue: "Potential savings of 61 KiB",
        details: {
          type: "opportunity",
          overallSavingsMs: 380,
          overallSavingsBytes: 62464,
          items: [
            {
              url: "https://example.com/app.js",
              totalBytes: 140000,
              wastedBytes: 62464,
              wastedMs: 380,
            },
          ],
        },
      },
      "image-alt": {
        id: "image-alt",
        title: "Image elements do not have alt attributes",
        description:
          "Informative elements should have short, descriptive alternate text.",
        score: 0,
        scoreDisplayMode: "binary",
        details: {
          type: "table",
          items: [
            {
              node: {
                selector: "main img.hero",
                snippet: '<img class="hero">',
              },
            },
          ],
        },
      },
      "errors-in-console": {
        id: "errors-in-console",
        title: "Browser errors were logged to the console",
        description: "Errors logged to the console indicate unresolved problems.",
        score: 0,
        scoreDisplayMode: "binary",
        details: {
          type: "table",
          items: [{ source: "network", description: "404" }],
        },
      },
      "document-title": {
        id: "document-title",
        title: "Document does not have a title element",
        description: "The title gives users an overview of the page.",
        score: 0,
        scoreDisplayMode: "binary",
        details: { type: "table", items: [] },
      },
      ...options.audits,
    },
  };
}

function category(id: string, score: number | null, auditIds: string[]) {
  return {
    id,
    title: id,
    score,
    auditRefs: auditIds.map((auditId) => ({
      id: auditId,
      weight: 1,
      group: id,
    })),
  };
}

function metric(title: string, numericValue: number, numericUnit: string) {
  return {
    id: title.toLowerCase().replaceAll(" ", "-"),
    title,
    score: 0.9,
    scoreDisplayMode: "numeric",
    numericValue,
    numericUnit,
    displayValue:
      numericUnit === "ms" ? `${numericValue} ms` : String(numericValue),
  };
}
