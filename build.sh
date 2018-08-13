#!/bin/sh

version=0.0.1
rm builds/zotero-scihub-${version}.xpi
zip -r builds/zotero-scihub-${version}.xpi chrome/* chrome.manifest install.rdf
