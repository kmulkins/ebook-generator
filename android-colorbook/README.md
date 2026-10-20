# Color Book Generator Android Test 2

This is a simplified **Android browser launcher** for the existing https://colorbookgenerator.cloud.run/ website. It opens a native start screen followed by a browser Custom Tab when the user taps "Open Book Generator". If Custom Tabs are unavailable, it attempts a regular browser intent. It is intentionally not a verified/fullscreen Trusted Web Activity because the website is not yet linked with a release app signing certificate.

The Android package id is `com.kevinmulkins.colorbookgenerator.test2` so it can coexist with the original debug app, which may be installed with a different debug signing key.

GitHub Actions builds a debug APK for testing. Install it on Android 7 or newer. This is not yet a Play Store release.
