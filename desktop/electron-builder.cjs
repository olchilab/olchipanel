'use strict';
const {validateConfig} = require('../packages/olchi-release-kit');
const config = validateConfig(require('../release.config.json'));
module.exports = {
  appId: 'com.olchilab.olchipanel',
  productName: 'OlchiPanel',
  directories: {output:'dist-desktop'},
  extraMetadata: {main:'desktop/main.cjs'},
  files: ['desktop/**', 'src/**', 'public/**', '!public/e2/**', 'bin/**', 'skills/**', 'packages/olchi-release-kit/**', 'package.json', 'release.config.json', 'LICENSE'],
  win: {icon:'public/icons/olchi-512.png', target:[{target:'nsis', arch:['x64']}], artifactName:'OlchiPanel-${version}-${arch}-Setup.${ext}'},
  nsis: {oneClick:false, perMachine:false, allowToChangeInstallationDirectory:true, deleteAppDataOnUninstall:false},
  publish: config.publish
};
