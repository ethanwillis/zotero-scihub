# Zotero Scihub
This is an add-on for [Zotero](https://www.zotero.org/) that enables automatic download of PDFs for items with a DOI.

# Quick Start Guide

#### Install
- Download the latest release (.xpi file) from the [Releases Page](https://github.com/ethanwillis/zotero-scihub/releases)
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



## Building

Invoke make with the VERSION variable set in the environment. For example:

````
VERSION=0.0.2 make
````

Alternatively, version numbers can be passed to make directly:

````
make VERSION=0.0.2
````
