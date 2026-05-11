#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
rg -n 'throw new (ApiException|SecurityException)\([^\n]*"|ResponseEntity\.ok\("|ResponseEntity\.status\([^\)]*\)\.body\("' src/main/java || true
