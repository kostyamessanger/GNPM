#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_URL = 'https://raw.githubusercontent.com/ваш-ник/gnpm/main';

const args = process.argv.slice(2);
if (args[0] !== 'install' || !args[1]) {
  console.log('Usage: gnpm install <package-name>');
  process.exit(1);
}

const name = args[1];
const targetDir = path.join(process.cwd(), 'node_modules', name);

if (fs.existsSync(targetDir)) {
  console.log(`${name} already installed.`);
  process.exit(0);
}

if (!fs.existsSync('node_modules')) fs.mkdirSync('node_modules');

https.get(`${REPO_URL}/packages/${name}/package.json`, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const pkg = JSON.parse(data);
    console.log(`Found ${name}@${pkg.version}`);

    https.get(`${REPO_URL}/packages/${name}.zip`, response => {
      const file = fs.createWriteStream(`${targetDir}.zip`);
      response.pipe(file);
      file.on('finish', () => {
        require('unzip-core').Extract({ path: targetDir })
          .on('close', () => {
            fs.unlinkSync(`${targetDir}.zip`);
            console.log(`${name} installed!`);

            const pkgPath = path.join(process.cwd(), 'package.json');
            if (fs.existsSync(pkgPath)) {
              const p = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
              p.dependencies = p.dependencies || {};
              p.dependencies[name] = `^${pkg.version}`;
              fs.writeFileSync(pkgPath, JSON.stringify(p, null, 2));
            }
          });
      });
    });
  });
}).on('error', err => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
              
