default:
    @just --list
clean:
    rm -rf dist
install:
    npm install
build:
    npm run build
run:
    node dist/cli.js
all:
    just clean
    just set-version
    npm run format
    npm run lint
    npm run test:coverage
    npm run build

install-local:
    npm install -g .
uninstall-local:
    npm uninstall -g @siakhooi/gh-pr

release:
    ./scripts/create-release.sh
set-version:
    ./scripts/set-version.sh
