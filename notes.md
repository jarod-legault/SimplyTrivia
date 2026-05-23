## Running

- If there are native changes
  - Run `npx expo prebuild --clean`
  - Run `yarn start`.
  - Run `yarn android` or `yarn ios` to create a new development build and install.
  - Run `npx expo run:android --device` if you want to build the dev build and install and run on a specific device.
- If not, just run `yarn start` if it is not running, press `i` or `a` in the terminal to start on emulator.

## Building/Publishing
- Credentials are stored on EAS servers.

### Android
- Run `yarn android:build:production` to build the .aab file.
- Run `eas submit` to submit the file to Google Play Console.
- Log in to Google Play Console and publish a new release, selecting the file that was submitted via EAS.

### iOS

- Run `yarn ios:build:production`.
- Run `eas submit` to submit the file to App Store Connect.
