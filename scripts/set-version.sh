#!/usr/bin/env bash
#
# Description: Set the version for the Debian and RPM packages.
# Usage: ./set-version.sh [options]
#

set -euo pipefail

# shellcheck disable=SC1091
. ./release.env

if [[ -z "${RELEASE_VERSION:-}" ]]; then
	echo "Error: RELEASE_VERSION must be set in release.env."
	exit 1
fi

export RELEASE_VERSION
yq -i '.version = env(RELEASE_VERSION)' package.json
yq -i '.version = env(RELEASE_VERSION)' package-lock.json

