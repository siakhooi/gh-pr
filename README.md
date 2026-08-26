# gh-pr

CLI for frequently used GitHub pull request workflows. Search open PRs, approve ones whose checks already passed, and squash-merge PRs you have approved.

The tool talks to the GitHub REST API through Octokit. Every command needs a `GITHUB_TOKEN` with access to search issues, read pull requests and checks, submit reviews, and merge.

## Installation

Install globally from npm:

```bash
npm install -g @siakhooi/gh-pr
```

Or run without installing:

```bash
npx @siakhooi/gh-pr --help
```

The package is also published on [GitHub Packages](https://github.com/siakhooi/gh-pr/pkgs/npm/gh-pr).

Set a GitHub personal access token before running any command:

```bash
export GITHUB_TOKEN=ghp_...
```

## Commands

`gh-pr` has three main commands. Shared filters (`--assigned-to-me`, `--authored-by-me`, `--authored-by-dependabot`, `--authored-by-renovate`, `-u`/`--user`, `-R`/`--repo`, `--label`, `-l`/`--limit`) narrow GitHub search results. Default `--limit` is 3.

### list

Search open pull requests and print them as JSON (title, URLs, repo, number, labels, `updated_at`). Extra filters: `--requested-my-review`, `--not-yet-reviewed`.

### autoreview

Find matching open PRs, skip ones you already reviewed on the current head commit or whose checks are missing or failing, then approve them. Use `-n`/`--dry-run` first. Caps: `--max-update` (default 2) and `--max-update-per-repo` (default 1).

### automerge

Find open PRs that are already approved, skip unless they are mergeable (`clean`), you approved the current commit, and all checks succeeded, then squash-merge. Same dry-run and max-update guards as `autoreview`.

## Usage

```bash
gh-pr --help
gh-pr list --help

# List open PRs assigned to you
gh-pr list --assigned-to-me

# Dependabot PRs that still need a review
gh-pr list --authored-by-dependabot --not-yet-reviewed -l 10

# Preview approvals, then approve PRs that requested your review
gh-pr autoreview --requested-my-review --dry-run
gh-pr autoreview --requested-my-review --max-update 2 --max-update-per-repo 1

# Merge approved Dependabot PRs in one repo
gh-pr automerge --authored-by-dependabot --dry-run
gh-pr automerge --authored-by-dependabot -R owner/repo
```

## Example

See <https://github.com/siakhooi/my-repo-management>

## Locations

### Source Code

- <https://github.com/siakhooi/gh-pr>

### Distributions

- <https://www.npmjs.com/package/@siakhooi/gh-pr>
- <https://github.com/siakhooi/gh-pr/pkgs/npm/gh-pr>

### Quality

- <https://sonarcloud.io/project/overview?id=siakhooi_gh-pr>
- <https://qlty.sh/gh/siakhooi/projects/gh-pr>

## Badges

![License](https://img.shields.io/github/license/siakhooi/gh-pr?logo=github)
[![Code Style](https://img.shields.io/badge/code%20style-google-blueviolet.svg)](https://github.com/google/gts)
![GitHub last commit](https://img.shields.io/github/last-commit/siakhooi/gh-pr?logo=github)
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/siakhooi/gh-pr?logo=github)
![GitHub issues](https://img.shields.io/github/issues/siakhooi/gh-pr?logo=github)
![GitHub closed issues](https://img.shields.io/github/issues-closed/siakhooi/gh-pr?logo=github)
![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/siakhooi/gh-pr?logo=github)
![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed-raw/siakhooi/gh-pr?logo=github)
![GitHub top language](https://img.shields.io/github/languages/top/siakhooi/gh-pr?logo=github)

![Release](https://img.shields.io/badge/Release-npm-purple)
![npm](https://img.shields.io/npm/v/@siakhooi/gh-pr?color=0e7fc0&label=NPM%20release&logo=npm)
![npm](https://img.shields.io/npm/dt/@siakhooi/gh-pr?logo=npm)
![npm type definitions](https://img.shields.io/npm/types/@siakhooi/gh-pr?logo=npm)

![Quality-Qlty](https://img.shields.io/badge/Quality-Qlty-purple)
[![Maintainability](https://qlty.sh/gh/siakhooi/projects/gh-pr/maintainability.svg)](https://qlty.sh/gh/siakhooi/projects/gh-pr)
[![Code Coverage](https://qlty.sh/gh/siakhooi/projects/gh-pr/coverage.svg)](https://qlty.sh/gh/siakhooi/projects/gh-pr)

![Quality-Sonar](https://img.shields.io/badge/Quality-SonarCloud-purple)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=bugs)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=siakhooi_gh-pr&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=siakhooi_gh-pr)

[![Wise](https://img.shields.io/badge/Funding-Wise-33cb56.svg?logo=wise)](https://wise.com/pay/me/siakn3)
![count](https://hit-tztugwlsja-uc.a.run.app/?outputtype=badge&counter=ghmd-gh-pr)
