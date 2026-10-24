#!/usr/bin/env bash
set -euo pipefail

# sessionStart hook: activate Node from .nvmrc before agent sessions.
cat >/dev/null

project_dir="${CURSOR_PROJECT_DIR:-$(pwd)}"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

load_nvm() {
  if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    source "${NVM_DIR}/nvm.sh"
    return 0
  fi

  for nvm_sh in /opt/homebrew/opt/nvm/nvm.sh /usr/local/opt/nvm/nvm.sh; do
    if [[ -s "${nvm_sh}" ]]; then
      # shellcheck disable=SC1090
      source "${nvm_sh}"
      return 0
    fi
  done

  return 1
}

if ! load_nvm || [[ ! -f "${project_dir}/.nvmrc" ]]; then
  echo '{}'
  exit 0
fi

(
  cd "${project_dir}"
  nvm use >/dev/null
)

node -e 'process.stdout.write(JSON.stringify({ env: { PATH: process.env.PATH, NODE_BIN: process.execPath } }))'
