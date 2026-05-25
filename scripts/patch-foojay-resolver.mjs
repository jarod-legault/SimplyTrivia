/**
 * Patches @react-native/gradle-plugin to use foojay-resolver-convention 1.0.0.
 *
 * Why: Expo SDK 56 / React Native 0.85 ship with Gradle 9.x. Gradle 9 removed
 * JvmVendorSpec.IBM_SEMERU, but RN's gradle-plugin still pins foojay 0.5.0,
 * which references that constant. Android builds then fail during settings
 * evaluation with a NoSuchFieldError / IBM_SEMERU error.
 *
 * This script bumps the plugin to 1.0.0, which drops the IBM_SEMERU reference
 * (see foojay 1.0.0 release notes on the Gradle Plugin Portal).
 *
 * Sources:
 * - https://github.com/gradle/foojay-toolchains/issues/151
 * - https://github.com/facebook/react-native/issues/55781
 * - https://github.com/facebook/react-native/pull/56210
 * - https://plugins.gradle.org/plugin/org.gradle.toolchains.foojay-resolver-convention
 *
 * Remove when: react-native includes foojay-resolver-convention >= 1.0.0 in
 * packages/gradle-plugin/settings.gradle.kts (check after upgrading react-native).
 * Then delete this file, remove the "postinstall" script from package.json, and
 * run yarn install to confirm ./android builds without the patch.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const settingsPath = join(
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts',
);

const from = 'foojay-resolver-convention").version("0.5.0")';
const to = 'foojay-resolver-convention").version("1.0.0")';

let content = readFileSync(settingsPath, 'utf8');
if (!content.includes(from)) {
  if (content.includes(to)) {
    process.exit(0);
  }
  console.warn('patch-foojay-resolver: expected pattern not found, skipping');
  process.exit(0);
}

writeFileSync(settingsPath, content.replace(from, to));
