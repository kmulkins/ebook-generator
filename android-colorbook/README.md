# Color Book Generator Android Test App

Native Android launcher wrapping the existing website https://colorbookgenerator.cloud.run/ using Chrome Trusted Web Activity.

This branch is dedicated only to a temporary Android APK build. The main branch and the eBook Generator are unchanged.

Build via the GitHub Actions workflow 'Build Color Book Generator Android APK' on branch 'colorbook-android-build-2026'. Artifact: ColorBookGenerator-Android-debug. Unzip it to get app-debug.apk and install on Android 7+.

IMPORTANT: This DEBUG APK is not a signed production release. Without https://colorbookgenerator.cloud.run/.well-known/assetlinks.json linked to the actual signing fingerprint, the website is displayed in a browser Custom Tab with toolbar, not a fully verified fullscreen Trusted Web Activity.

Web login, book generation and downloads should be tested on a physical Android phone. Google Play publishing requires separate signing, compliance with billing policies, verification of asset links, and testing. No API keys or signing credentials are included.
