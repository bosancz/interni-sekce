#!/usr/bin/env bash
set -euo pipefail

NODE_MAJOR="${NODE_MAJOR:-24}"
PREFIX="/opt/node${NODE_MAJOR}"
DIST="${NODE_DIST_URL:-https://nodejs.org/dist}"

log() { echo -e "\033[1;33m[node${NODE_MAJOR}]\033[0m $*"; }
die() { echo "[node${NODE_MAJOR}] $*" >&2; exit 1; }

case "$(uname -m)" in
  x86_64) arch=x64 ;;
  aarch64 | arm64) arch=arm64 ;;
  *) die "unsupported architecture: $(uname -m)" ;;
esac

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl -fsSL -o "$tmp/index.json" "$DIST/index.json"
version="$(grep -o "\"version\":\"v${NODE_MAJOR}\.[0-9][0-9.]*\"" "$tmp/index.json" | head -n1 | cut -d'"' -f4)"
[ -n "$version" ] || die "could not resolve the latest v${NODE_MAJOR}.x release from $DIST/index.json"

if [ -x "$PREFIX/bin/node" ] && [ "$("$PREFIX/bin/node" -v)" = "$version" ]; then
  log "$version is already installed in $PREFIX"
else
  log "installing $version ($arch) into $PREFIX"

  tarball="node-${version}-linux-${arch}.tar.xz"
  curl -fsSL -o "$tmp/$tarball" "$DIST/$version/$tarball"
  curl -fsSL -o "$tmp/SHASUMS256.txt" "$DIST/$version/SHASUMS256.txt"
  (cd "$tmp" && grep " $tarball\$" SHASUMS256.txt | sha256sum -c -) \
    || die "checksum verification failed for $tarball"

  rm -rf "$PREFIX"
  mkdir -p "$PREFIX"
  tar -xJf "$tmp/$tarball" -C "$PREFIX" --strip-components=1
fi

log "putting $PREFIX/bin first on PATH for login shells"
echo "export PATH=$PREFIX/bin:\$PATH" > /etc/profile.d/nodejs.sh
chmod 644 /etc/profile.d/nodejs.sh

link_into() {
  local dir="$1" bin
  for bin in node npm npx corepack; do
    [ -e "$PREFIX/bin/$bin" ] && ln -sfn "$PREFIX/bin/$bin" "$dir/$bin"
  done
  log "  linked $dir -> $PREFIX/bin"
}

link_into /usr/local/bin
IFS=':' read -ra path_dirs <<< "$PATH"
for dir in "${path_dirs[@]}"; do
  case "$dir" in "" | "$PREFIX/bin" | /usr/local/bin) continue ;; esac
  [ -e "$dir/node" ] || continue
  link_into "$dir"
done

export PATH="$PREFIX/bin:$PATH"
hash -r 2>/dev/null || true

[ "$(node -v)" = "$version" ] || die "expected $version on PATH, got $(node -v)"
log "node $(node -v), npm $(npm -v)"
