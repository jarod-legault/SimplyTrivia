## Building/Publishing
- Credentials are stored on EAS servers.

### Android
- Run `yarn android:build:production` to build the .aab file.
- Run `eas submit` to submit the file to Google Play Console.
- Log in to Google Play Console and publish a new release, selecting the file that was submitted via EAS.

### iOS

- Run `yarn ios:build:production`.
- Run `eas submit` to submit the file to App Store Connect.
