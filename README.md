# Zotero Scihub
This is an add-on for [Zotero](https://www.zotero.org/) that enables automatic download of PDFs for items with a DOI.

# Quick Start Guide

#### Install
- Download the latest release (.xpi file) from the [Releases Page](https://github.com/sneakers-the-rat/zotero-scihub/releases)
*Note* If you're using Firefox as your browser, right click the xpi and select "Save As.."
- In Zotero click "Tools" in the top menu bar and then click "Addons"
- Go to the Extensions page and then click the gear icon in the top right.
- Select Install Add-on from file.
- Browse to where you downloaded the .xpi file and select it.
- Restart Zotero, by clicking "restart now" in the extensions list where the
scihub plugin is now listed.

#### Usage
Once you have the plugin installed simply, right click any item in your collections.
There will now be a new context menu option titled "Update Scihub PDF." Once you
click this, a PDF of the file will be downloaded from Scihub and attached to your
item in Zotero.

For any new papers you add after this plugin is installed, the scihub pdf will be
automatically downloaded.

#### Configuration

There are two parameters that can be edited, to do so go to the configuration editor 

*Preferences > Advanced > General > Config Editor (button near the bottom of the window)*

- `extensions.zotero.zoteroscihub.automatic_pdf_download` (default `true`)  - automatically download pdfs from scihub when entries are added to zotero
- `extensions.zotero.zoteroscihub.scihub_url` (default `https://sci-hub.do`) - url to try to get pdfs from!

## Building

Invoke make with the VERSION variable set in the environment. For example:

````
VERSION=0.0.2 make
````

Alternatively, version numbers can be passed to make directly:

````
make VERSION=0.0.2
````

## Disclaimer
Use this code at your own peril. No warranties are provided. Keep the laws of your
locality in mind!
