const { withGradleProperties } = require('expo/config-plugins');
const { updateAndroidBuildProperty } = require('@expo/config-plugins/build/android/BuildProperties');

/** Raise Gradle heap/metaspace for release lint (e.g. react-native-screens). */
function withAndroidGradleMemory(config) {
  return withGradleProperties(config, (modConfig) => {
    modConfig.modResults = updateAndroidBuildProperty(
      modConfig.modResults,
      'org.gradle.jvmargs',
      '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
    );
    return modConfig;
  });
}

module.exports = withAndroidGradleMemory;
