#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {validateConfig, inventory} = require('./index.cjs');
try {
  const [command, configFile = 'release.config.json', directory = 'dist-desktop'] = process.argv.slice(2);
  const config = validateConfig(JSON.parse(fs.readFileSync(configFile, 'utf8')));
  if (command === 'prepare') console.log(JSON.stringify({productId:config.productId, publish:config.publish}, null, 2));
  else if (command === 'verify') {
    const product = JSON.parse(fs.readFileSync(path.resolve(path.dirname(configFile), 'package.json'), 'utf8'));
    if (product.productVersion && product.productVersion !== product.version) throw new Error('Product and package versions differ');
    const result = inventory(directory, config.productId, product.version);
    const target = path.join(directory, 'release-artifacts.json');
    fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
    console.log(target);
  } else throw new Error('Usage: olchi-release prepare|verify [release.config.json] [artifact-directory]');
} catch (error) { console.error(error.message); process.exitCode = 1; }
