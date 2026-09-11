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
# Fetching the archive here, with curl forced to IPv4, into the directory
# expo-sqlite reads (REACT_NATIVE_DOWNLOADS_DIR) makes the Gradle task find the
# file already in place and skip the download: its Download task is declared
# with overwrite(false).
#
# Note: do NOT try to solve this by setting _JAVA_OPTIONS=-Djava.net.preferIPv4Stack=true
# in eas.json. That variable applies to every JVM the build starts, and each one
# then prints "Picked up _JAVA_OPTIONS: ..." into its output. The prefab step of
# the Android Gradle plugin reads the output of a JVM it launches while
# configuring CMake, and that extra line makes it fail:
#
#   Execution failed for task ':expo-modules-core:configureCMakeRelWithDebInfo[arm64-v8a]'
#   [CXX1210] .../expo-modules-core/android/CMakeLists.txt release|arm64-v8a : No compatible library found
#
# curl -4 below solves the download without touching any other process.

# This never fails the build. If anything here does not work, Gradle simply
# attempts the download itself, exactly as before.

set -u

# Tied to expo-sqlite 14.0.6 (node_modules/expo-sqlite/android/build.gradle).
# If that package is upgraded and the version moves, this prefetch quietly
# stops matching and Gradle goes back to downloading — no breakage, just no help.
SQLITE_VERSION="3450300"
DOWNLOADS_DIR="${REACT_NATIVE_DOWNLOADS_DIR:-/tmp/rn-downloads}"
TARGET="${DOWNLOADS_DIR}/sqlite-amalgamation-${SQLITE_VERSION}.zip"
URL="https://www.sqlite.org/2024/sqlite-amalgamation-${SQLITE_VERSION}.zip"

echo "[prefetch-sqlite] cible : ${TARGET}"

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
