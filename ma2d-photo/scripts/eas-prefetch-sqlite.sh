#!/usr/bin/env bash
#
# expo-sqlite compiles SQLite from source, and its Gradle build downloads the
# amalgamation from sqlite.org while the build runs. On EAS that download fails:
#
#   Task :expo-sqlite:downloadSQLite FAILED
#   java.net.SocketException: Network is unreachable
#
# "Network is unreachable" is what a JVM reports when it resolves a host to an
# IPv6 address and the machine has no IPv6 route — the same project built fine
# days earlier, and nothing in it changed.
#
# So we fetch the archive here, with curl forced to IPv4, and leave a copy in
# every directory expo-sqlite might read. Its Download task is declared with
# overwrite(false), so a file already sitting there turns it into a no-op.
#
# Run twice, from two EAS hooks, because each one can do something the other
# cannot:
#   eas-build-pre-install   runs before node_modules exists, so it can only use
#                           REACT_NATIVE_DOWNLOADS_DIR and the constants below.
#   eas-build-post-install  can read expo-sqlite's own build.gradle and reach
#                           its default build/downloads directory.
# The second run finds the first run's file and only copies it where it is
# missing.
#
# Do NOT set _JAVA_OPTIONS=-Djava.net.preferIPv4Stack=true to fix the download
# instead. It applies to every JVM the build starts, each then prints
# "Picked up _JAVA_OPTIONS: ..." into its output, and the Android Gradle
# plugin's prefab step fails on it:
#   [CXX1210] .../CMakeLists.txt release|arm64-v8a : No compatible library found
#
# This never fails the build. If anything here does not work, Gradle simply
# attempts the download itself, exactly as before.

set -u

# Used only before node_modules exists. Tied to expo-sqlite 14.0.6; after the
# install hook the real values are read from the package itself.
SQLITE_VERSION="3450300"
URL_TEMPLATE='https://www.sqlite.org/2024/sqlite-amalgamation-${SQLITE_VERSION}.zip'

GRADLE_FILE="node_modules/expo-sqlite/android/build.gradle"

if [ -f "${GRADLE_FILE}" ]; then
  #   def SQLITE_VERSION = '3450300'
  FOUND_VERSION="$(sed -n "s/^def SQLITE_VERSION *= *'\([0-9]*\)'.*/\1/p" "${GRADLE_FILE}" | head -1)"
  #   src("https://www.sqlite.org/2024/sqlite-amalgamation-${SQLITE_VERSION}.zip")
  FOUND_URL="$(sed -n 's/.*src("\(https:[^"]*\)").*/\1/p' "${GRADLE_FILE}" | head -1)"
  if [ -n "${FOUND_VERSION}" ] && [ -n "${FOUND_URL}" ]; then
    SQLITE_VERSION="${FOUND_VERSION}"
    URL_TEMPLATE="${FOUND_URL}"
    echo "[prefetch-sqlite] version et URL lues dans ${GRADLE_FILE}"
  else
    echo "[prefetch-sqlite] ${GRADLE_FILE} illisible, on garde les constantes du script"
  fi
else
  echo "[prefetch-sqlite] pas encore de node_modules, on utilise les constantes du script"
fi

URL="${URL_TEMPLATE//\$\{SQLITE_VERSION\}/${SQLITE_VERSION}}"
ARCHIVE="sqlite-amalgamation-${SQLITE_VERSION}.zip"

# Every directory the Gradle task may use: the one named by the environment
# variable when it is set, and the module's own default otherwise.
TARGET_DIRS=""
if [ -n "${REACT_NATIVE_DOWNLOADS_DIR:-}" ]; then
  TARGET_DIRS="${REACT_NATIVE_DOWNLOADS_DIR}"
fi
if [ -f "${GRADLE_FILE}" ]; then
  TARGET_DIRS="${TARGET_DIRS} node_modules/expo-sqlite/android/build/downloads"
fi

if [ -z "${TARGET_DIRS// /}" ]; then
  echo "[prefetch-sqlite] aucune destination connue à ce stade, rien à faire"
  exit 0
fi

# An existing copy, from the earlier hook or from a previous run, is reused
# rather than downloaded again.
SOURCE=""
DOWNLOADED_TO_TMP="no"
for dir in ${TARGET_DIRS}; do
  if [ -s "${dir}/${ARCHIVE}" ]; then
    SOURCE="${dir}/${ARCHIVE}"
    echo "[prefetch-sqlite] copie déjà disponible : ${SOURCE}"
    break
  fi
done

if [ -z "${SOURCE}" ]; then
  echo "[prefetch-sqlite] téléchargement de ${URL}"
  TMP="$(mktemp -t sqlite-amalgamation.XXXXXX)" || { echo "[prefetch-sqlite] mktemp impossible — Gradle réessaiera"; exit 0; }
  if curl -4 --fail --silent --show-error --location --retry 3 --retry-delay 2 -o "${TMP}" "${URL}"; then
    if command -v unzip >/dev/null 2>&1 && ! unzip -t "${TMP}" >/dev/null 2>&1; then
      echo "[prefetch-sqlite] archive illisible, abandon — Gradle réessaiera"
      rm -f "${TMP}"
      exit 0
    fi
    SOURCE="${TMP}"
    DOWNLOADED_TO_TMP="yes"
    echo "[prefetch-sqlite] récupéré : $(wc -c < "${SOURCE}") octets"
  else
    echo "[prefetch-sqlite] téléchargement impossible — Gradle réessaiera de son côté"
    rm -f "${TMP}"
    exit 0
  fi
fi

for dir in ${TARGET_DIRS}; do
  if [ -s "${dir}/${ARCHIVE}" ]; then
    echo "[prefetch-sqlite] OK ${dir}/${ARCHIVE} (déjà en place)"
    continue
  fi
  if ! mkdir -p "${dir}"; then
    echo "[prefetch-sqlite] ÉCHEC ${dir} (création impossible)"
    continue
  fi
  # Copied next to the target, then moved: a partial file left at the target
  # path would make Gradle skip the download and then fail to unzip it.
  if cp "${SOURCE}" "${dir}/${ARCHIVE}.part" && chmod 644 "${dir}/${ARCHIVE}.part" && mv "${dir}/${ARCHIVE}.part" "${dir}/${ARCHIVE}"; then
    echo "[prefetch-sqlite] OK ${dir}/${ARCHIVE} (déposé)"
  else
    echo "[prefetch-sqlite] ÉCHEC ${dir}/${ARCHIVE} (copie impossible)"
    rm -f "${dir}/${ARCHIVE}.part"
  fi
done

# Only the temporary file this run created is removed. Matching on /tmp/ would
# delete the copy an earlier hook left in REACT_NATIVE_DOWNLOADS_DIR, which on
# EAS is itself under /tmp.
if [ "${DOWNLOADED_TO_TMP}" = "yes" ]; then
  rm -f "${SOURCE}"
fi

exit 0
