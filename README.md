# Note/News:
I've been away from any open source work for a while. I also have had issues with my Github account for a while. However!, I know a lot of people like this plugin and have posted a lot of ideas/errors in the issues. 

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

0. Pre-requisite is to have [node.js](nodejs.org) installed
1. Install dependencies `npm install`
2. Build `npm run build`, the plugin is written to `build/zotero-scihub-<version>.xpi`
3. To release, push a `v<version>` tag: CI attaches the `.xpi` and `update.json` (used by Zotero for automatic updates) to the GitHub release

## Contributors
Thank you Samuel Coavoux for the recent updates! https://github.com/scoavoux

## [Contributing](./CONTRIBUTING.md)

## Disclaimer

Use this code at your own peril. No warranties are provided. Keep the laws of your locality in mind!
