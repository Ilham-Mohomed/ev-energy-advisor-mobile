# EV Energy Advisor Mobile

Expo / React Native Android prototype with customer and utility-officer views, six illustrative V2G/V2H pathways, editable assumptions, BEP comparisons and a preliminary ranking.

## Important
This is a prototype, not a validated implementation of the user's research workbook. The formulas and scenario cost multipliers in `App.js` are illustrative placeholders. Replace them with the approved workbook equations and assumptions before using the app for research conclusions or customer decisions. No login, cloud database, customer record storage, or utility backend is connected.

## Build a directly installable Android APK
This project is configured for an EAS internal preview APK (`eas.json`).

The Expo project ID must be linked in `app.json` under `expo.extra.eas.projectId`. Obtain the ID from the Expo project details page and insert it there. Then run an EAS build from an authenticated environment:

```bash
npm install
npm install --global eas-cli
eas login
eas build --platform android --profile preview
```

The EAS build service produces an APK download link when the cloud build completes.


## Optional browser-only build using GitHub Actions
A workflow is included at `.github/workflows/android-apk.yml`. After uploading the project files to the connected GitHub repository:
1. Set `expo.extra.eas.projectId` in `app.json` to the ID shown in the Expo project's Details page.
2. Create an Expo access token at https://expo.dev/accounts/ilhammohomeds-team/settings/access-tokens (or open Account Settings → Access Tokens).
3. In GitHub repository Settings → Secrets and variables → Actions, create a repository secret named `EXPO_TOKEN` and paste the token value.
4. Open the GitHub repository's Actions tab and run **Build Android APK** using **Run workflow**, or push a commit to `main`.
5. When EAS completes, open the build link in the Expo dashboard and download the APK to your Android phone.

This avoids installing Node.js, VS Code, or Expo Go on your computer. GitHub Actions and EAS still perform the build in the cloud.
