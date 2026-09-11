#!/usr/bin/env bash
#
# expo-sqlite compiles SQLite from source, and its Gradle build downloads the
# amalgamation from sqlite.org while the build runs. On EAS that download
# started failing with:
#
#   Task :expo-sqlite:downloadSQLite FAILED
#   java.net.SocketException: Network is unreachable
#
# "Network is unreachable" is what a JVM reports when it resolves a host to an
# IPv6 address and the machine has no IPv6 route — the same project built fine
# days earlier, and nothing in it changed.
#
# So we fetch the archive here, with curl forced to IPv4, and leave it exactly
# where the Gradle task expects it. That task is declared with overwrite(false),
# so a file already sitting there turns it into a no-op.
#
# Two things this deliberately does NOT do, because both were tried and both
# broke the build afterwards:
#
#   * set _JAVA_OPTIONS=-Djava.net.preferIPv4Stack=true — it applies to every
#     JVM the build starts, each then prints "Picked up _JAVA_OPTIONS: ..." into
#     its output, and the Android Gradle plugin's prefab step fails on it:
#     [CXX1210] .../CMakeLists.txt release|arm64-v8a : No compatible library found
#   * set REACT_NATIVE_DOWNLOADS_DIR — expo-sqlite honours it, but it is a
#     React Native convention for third party native sources generally, so
#     redirecting it reaches much further than this one download.
#
# The build environment stays stock. The only thing that changes is that one
# file is already on disk.
#
# Runs as eas-build-post-install: node_modules must exist for the paths below.
# This never fails the build. If anything here does not work, Gradle simply
# attempts the download itself, exactly as before.

set -u

GRADLE_FILE="node_modules/expo-sqlite/android/build.gradle"

if [ ! -f "${GRADLE_FILE}" ]; then
  echo "[prefetch-sqlite] ${GRADLE_FILE} introuvable — on laisse Gradle faire"
  exit 0
fi

# Both the version and the URL are read from expo-sqlite's own build.gradle, so
# upgrading that package cannot leave this script fetching a stale archive.
#   def SQLITE_VERSION = '3450300'
SQLITE_VERSION="$(sed -n "s/^def SQLITE_VERSION *= *'\([0-9]*\)'.*/\1/p" "${GRADLE_FILE}" | head -1)"
#   src("https://www.sqlite.org/2024/sqlite-amalgamation-${SQLITE_VERSION}.zip")
URL_TEMPLATE="$(sed -n 's/.*src("\(https:[^"]*\)").*/\1/p' "${GRADLE_FILE}" | head -1)"

if [ -z "${SQLITE_VERSION}" ] || [ -z "${URL_TEMPLATE}" ]; then
  echo "[prefetch-sqlite] version ou URL illisible dans ${GRADLE_FILE} — on laisse Gradle faire"
  exit 0
fi

URL="${URL_TEMPLATE//\$\{SQLITE_VERSION\}/${SQLITE_VERSION}}"

# The same expression build.gradle uses for its destination.
DOWNLOADS_DIR="node_modules/expo-sqlite/android/build/downloads"
TARGET="${DOWNLOADS_DIR}/sqlite-amalgamation-${SQLITE_VERSION}.zip"

echo "[prefetch-sqlite] source : ${URL}"
echo "[prefetch-sqlite] cible  : ${TARGET}"

if [ -s "${TARGET}" ]; then
  echo "[prefetch-sqlite] déjà présent, rien à faire"
  exit 0
fi

mkdir -p "${DOWNLOADS_DIR}" || { echo "[prefetch-sqlite] dossier impossible, on laisse Gradle faire"; exit 0; }

# Downloaded beside the target, then moved: a partial file left at the target
# path would make Gradle skip the download and then fail to unzip it.
TMP="${TARGET}.part"
if curl -4 --fail --silent --show-error --location --retry 3 --retry-delay 2 -o "${TMP}" "${URL}"; then
  if command -v unzip >/dev/null 2>&1 && ! unzip -t "${TMP}" >/dev/null 2>&1; then
    echo "[prefetch-sqlite] archive illisible, abandon — Gradle réessaiera"
    rm -f "${TMP}"
    exit 0
  fi
  mv "${TMP}" "${TARGET}"
  echo "[prefetch-sqlite] récupéré : $(wc -c < "${TARGET}") octets"
else
  echo "[prefetch-sqlite] téléchargement impossible — Gradle réessaiera de son côté"
  rm -f "${TMP}"
fi

exit 0
