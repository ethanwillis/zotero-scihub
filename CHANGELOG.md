# Changelog

## 2.0.0 — Zotero 7 to 10

Port of the plugin to the bootstrap plugin architecture (Zotero 7+), checked on
Zotero 10.0.3 (Firefox ESR 140) with sci-hub.ru in September 2026.

### Zotero 10 compatibility

- `bootstrap.js` no longer calls `registerChrome()`: on Firefox ESR 140 the
  call only accepts `content`, `locale` and `override` entries, and the `skin`
  entry threw `NS_ERROR_ILLEGAL_VALUE`, aborting the plugin startup. Every
  resource is addressed through `rootURI` instead.
- `Zotero.Item.isCollection()` does not exist anymore; `isRegularItem()` is enough.
- `Zotero.alert()` is called directly: there is no `alert()` in the plugin
  bootstrap sandbox.

### Sci-Hub site changes

- PDF url read from `citation_pdf_url` / `<object>` / the download link (no more
  `#pdf` element), resolved against the final URL after mirror redirects.
- HTTP cache bypassed: Sci-Hub serves its pages, captcha included, with a 10-year
  `max-age`.
- 404 and any 200 page without a PDF mean "not available"; only the "are you a
  robot?" page is treated as a captcha.
- The captcha page opens in Zotero's own viewer, which shares Zotero's cookie jar,
  so solving it there unblocks the next request (an external browser never could).
- A host that cannot be reached (DNS block, TLS failure) is reported as such
  instead of as a captcha.
