#!/usr/bin/env bash
#
# Description: Create a new release on GitHub using the GitHub CLI.
# Usage: ./create-release.sh [options]
#

set -euo pipefail

if ! command -v gh &>/dev/null; then
	echo "Error: GitHub CLI (gh) is not installed. Please install it to run this script."
	exit 1
fi

# shellcheck disable=SC1091
. ./release.env

if [[ -z "${RELEASE_VERSION:-}" || -z "${RELEASE_TITLE:-}" || -z "${RELEASE_NOTE:-}" ]]; then
	echo "Error: RELEASE_VERSION, RELEASE_TITLE, and RELEASE_NOTE must be set in release.env."
	exit 1
fi

set -x
gh release create "$RELEASE_VERSION" --title "$RELEASE_TITLE" --notes "${RELEASE_NOTE}" --latest