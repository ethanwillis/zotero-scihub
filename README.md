# Note/News:
Big recent update that fixes lots of small issues and the major compat ones for newer version of zotero.


# Zotero Scihub

This is an add-on for [Zotero](https://www.zotero.org/) 7 to 10 that enables automatic download of PDFs for items with a DOI.

# Quick Start Guide

#### Install

- Download the latest release (.xpi file) from the [Releases Page](https://github.com/ethanwillis/zotero-scihub/releases)
  _Note_ If you're using Firefox as your browser, right click the xpi and select "Save As.."
- In Zotero click "Tools" in the top menu bar and then click "Plugins"
- Click the gear icon in the top right and select "Install Plugin From File…"
- Browse to where you downloaded the .xpi file and select it. No restart is needed.

#### Usage

Once you have the plugin installed simply, right click any item in your collections.
There will now be a new context menu option titled "Update Scihub PDF." Once you
click this, a PDF of the file will be downloaded from Scihub and attached to your
item in Zotero.

For any new papers you add after this plugin is installed, the scihub pdf will be
automatically downloaded. Items which already have a PDF attachment are skipped.

Papers published after 2021 are mostly missing from Sci-Hub; when Sci-Hub does not
have a paper, the plugin looks for it on [Sci-Net](https://sci-net.xyz/), where newer
papers are uploaded by the community.

Sci-Hub may ask you to prove that you are not a robot. When that happens the plugin
opens the Sci-Hub page in a Zotero window: answer the question there ("No"/"Нет"),
close the window and run "Update Scihub PDF" again. Solving it in your regular
browser would not help, since Zotero does not see your browser's cookies.

#### Configuration

Plugin is configured through the dedicated "Zotero Scihub" pane in Zotero's settings:

- _Automatic PDF Download_: fetch the PDF of every item added to the library
- _Sci-Hub URL_: the mirror to use, `https://sci-hub.ru/` by default. If your network
  blocks it, try `https://sci-hub.box/` (redirects to a regional mirror) or enable
  DNS-over-HTTPS as described below
- _Sci-Net URL_: where to look for papers Sci-Hub does not have, `https://sci-net.xyz/` by default

#### DNS-over-HTTPS

Some networks (universities, some ISPs) block Sci-Hub domains in their DNS server, in
which case the plugin reports that it "cannot reach" the mirror. In case of malfunctioning or unsafe local DNS server, Zotero (as it's built on Firefox) might be configured with [Trusted Recursive Resolver](https://wiki.mozilla.org/Trusted_Recursive_Resolver) or DNS-over-HTTPS, where you could set your own DNS server just for Zotero without modifying network settings.

_Settings > Advanced > Config Editor_

1. set `network.trr.mode` to `2` or `3`, this enables DNS-over-HTTPS (2 enables it with fallback)
2. set `network.trr.uri` to `https://cloudflare-dns.com/dns-query`, this is the provider’s URL
3. set `network.trr.bootstrapAddress` to `1.1.1.1`, this is cloudflare’s normal DNS server (only) used to retrieve the IP of cloudfaire-dns.com
4. Restart zotero, wait for a DNS cache to clean up.

## Building

Use **Node.js 22.x** and its bundled npm, matching CI. `.tool-versions` pins
Node.js for asdf users. Run these commands from the repository root:

```sh
git clone --branch master git@github.com:ethanwillis/zotero-scihub.git
cd zotero-scihub
npm ci
npm test
npm run build
```

`npm ci` installs the exact dependencies in `package-lock.json`; use `npm install`
only when intentionally updating dependencies and commit the updated lockfile.
The build runs ESLint and TypeScript checking, bundles for Firefox 115+, and
replaces `build/` with:

- `build/zotero-scihub-<version>.xpi`: installable plugin (a ZIP archive).
- `build/addon/`: unpacked plugin.
- `build/update.json`: Zotero update metadata pointing to the versioned release.

Install the XPI through Zotero's Plugins menu as described above. This build is
for Zotero 7–10, not Zotero 6. Tests do not replace checking installation and
operation in Zotero.

The legacy test/development dependencies still produce deprecation warnings and
`npm audit` findings. They are not shipped in the XPI. Avoid `npm audit fix --force`
as a build repair: it can introduce incompatible major versions.

### Releasing

1. Ensure `package.json` and `package-lock.json` have the intended version
   (`npm version <version> --no-git-tag-version` when changing it), and update
   `CHANGELOG.md`.
2. Run `npm ci`, `npm test`, and `npm run build`; check the generated XPI in Zotero.
3. Commit and push the changes to `master`, then push a matching, unused tag:
   `git tag -a v<version> -m "Release <version>"` and
   `git push origin v<version>`.
4. Wait for the **Release** GitHub Actions workflow to succeed. It builds on
   Ubuntu with Node 22 and publishes the XPI and `update.json`, using the
   changelog as release notes. Ordinary branch and pull-request builds do not
   publish releases.
5. Check that both assets download from the release and that `update.json`
   points to its XPI. Keep both assets: the manifest uses the latest release's
   `update.json` for automatic updates.

Pushing via SSH requires a GitHub SSH key with repository write access. Publishing
is performed by the workflow's `GITHUB_TOKEN` (`contents: write`); a local GitHub
CLI login or API token is not required.

## Contributors
Thank you Samuel Coavoux for the recent updates! https://github.com/scoavoux

## [Contributing](./CONTRIBUTING.md)

## Disclaimer

Use this code at your own peril. No warranties are provided. Keep the laws of your locality in mind!
