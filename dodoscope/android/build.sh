#!/usr/bin/env bash
# Construit DodoScope.apk sans Android Studio ni Gradle.
# Outils nécessaires (Ubuntu/Debian) : sudo apt install aapt dalvik-exchange zipalign apksigner openjdk-17-jdk
set -euo pipefail
cd "$(dirname "$0")"
B=build
API_JAR=${ANDROID_JAR:-$B/android-33.jar}
mkdir -p $B

# 1. android.jar (bibliothèque de référence pour compiler ; n'est pas incluse dans l'APK)
if [ ! -f "$API_JAR" ]; then
  echo "• Téléchargement de android.jar (API 33 : le format de la 34+ est illisible par aapt v1)"
  curl -fsSL -o "$API_JAR" https://raw.githubusercontent.com/Sable/android-platforms/master/android-33/android.jar
fi

# 2. copie de l'appli web dans les assets
rm -rf $B/assets $B/gen $B/obj && mkdir -p $B/assets/www $B/gen $B/obj
cp ../index.html ../styles.css ../app.js ../icon.svg ../manifest.webmanifest $B/assets/www/

# 3. ressources -> R.java
aapt package -f -m -J $B/gen -M AndroidManifest.xml -S res -I "$API_JAR"

# 4. compilation Java -> .class -> classes.dex
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 -bootclasspath "$API_JAR" -d $B/obj \
  $(find src $B/gen -name '*.java')
DX=$(command -v dalvik-exchange || command -v dx)
$DX --dex --min-sdk-version=24 --output=$B/classes.dex $B/obj

# 5. assemblage de l'APK
aapt package -f -M AndroidManifest.xml -S res -A $B/assets -I "$API_JAR" -F $B/unsigned.apk
(cd $B && aapt add -f unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 $B/unsigned.apk $B/aligned.apk

# 6. signature
# La clé et son mot de passe sont créés au premier build et restent hors du dépôt (.gitignore).
# Garde-les : une mise à jour signée avec une autre clé oblige à désinstaller l'appli.
KS=${KEYSTORE:-dodoscope.keystore}
PASS_FILE=${KEYSTORE_PASS_FILE:-dodoscope.keystore.pass}
if [ ! -f "$KS" ]; then
  echo "• Création de la clé de signature $KS"
  head -c 24 /dev/urandom | base64 | tr -d '/+=' > "$PASS_FILE"
  chmod 600 "$PASS_FILE"
  keytool -genkeypair -keystore "$KS" -storepass:file "$PASS_FILE" -keypass:file "$PASS_FILE" -alias dodoscope \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=DodoScope, O=ngalaha, C=FR" >/dev/null 2>&1
fi
apksigner sign --ks "$KS" --ks-pass file:"$PASS_FILE" --ks-key-alias dodoscope \
  --v4-signing-enabled false --out ../DodoScope.apk $B/aligned.apk
apksigner verify ../DodoScope.apk
echo "✓ APK prêt : $(cd .. && pwd)/DodoScope.apk ($(du -h ../DodoScope.apk | cut -f1))"
