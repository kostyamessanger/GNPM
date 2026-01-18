#!/usr/bin/env node


const fs = require('fs');
const path = require('path');
const https = require('https');

// URL вашего репозитория на GitHub (замените "ваш-ник")
const REPO_URL = 'https://raw.githubusercontent.com/ваш-ник/gnpm/main';

// Разбор аргументов
const args = process.argv.slice(2);
if (args[0] !== 'install' || !args[1]) {
  console.log('Usage: gnpm install <package-name>');
  process.exit(1);
}

const packageName = args[1];
const cwd = process.cwd();

// Пути
const nodeModulesDir = path.join(cwd, 'node_modules');
const targetDir = path.join(nodeModulesDir, packageName);
const packagesDir = path.join(cwd, 'packages');
const zipPath = path.join(packagesDir, `${packageName}.zip`);

console.log('\n🔍 GNPM Installer');
console.log('───────────────────────────────────────────────');

// 1. Проверка: установлен ли пакет
if (fs.existsSync(targetDir)) {
  console.log(`❌ ${packageName} уже установлен в node_modules/`);
  process.exit(0);
}

console.log(`✅ Пакет ${packageName} не найден. Начинаем установку...`);


// 2. Создание папок
if (!fs.existsSync(nodeModulesDir)) {
  console.log('⏳ Создаю папку node_modules/');
  fs.mkdirSync(nodeModulesDir);
}
if (!fs.existsSync(packagesDir)) {
  console.log('⏳ Создаю папку packages/');
  fs.mkdirSync(packagesDir);
}

// 3. Проверка наличия package.json в репозитории
console.log(`\n1/4 🔎 Проверяю наличие package.json для ${packageName}...`);
https.get(`${REPO_URL}/packages/${packageName}/package.json`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`❌ Не удалось найти package.json для ${packageName}`);
      console.error(`   Проверьте: ${REPO_URL}/packages/${packageName}/package.json`);
      process.exit(1);
    }

    const pkg = JSON.parse(data);
    console.log(`✅ Найдено: ${packageName}@${pkg.version}`);


    // 4. Проверка доступности ZIP-архива
    console.log(`\n2/4 🔎 Проверяю доступность архива ${packageName}.zip...`);
    https.get(`${REPO_URL}/packages/${packageName}.zip`, { timeout: 5000 }, (checkRes) => {
      if (checkRes.statusCode === 200) {
        console.log('   → Архив доступен. Начинаю загрузку...');


        // 5. Скачивание ZIP
        console.log(`\n3/4 ⏬ Скачиваю архив ${packageName}.zip...`);
        const file = fs.createWriteStream(zipPath);
        let totalSize = 0;
        let downloaded = 0;

        checkRes.on('data', (chunk) => {
          downloaded += chunk.length;
          totalSize = checkRes.headers['content-length'];
          const progress = ((downloaded / totalSize) * 100).toFixed(1);
          process.stdout.write(`   → ${progress}% (${(downloaded / 1024).toFixed(0)} КБ из ${(totalSize / 1024).toFixed(0)} КБ)\r`);
        });

        file.on('finish', () => {
          console.log(`\n✅ Архив сохранён: ./packages/${packageName}.zip`);


          // 6. Распаковка
          console.log(`\n4/4 📦 Распаковываю в node_modules/${packageName}...`);
          require('unzip-core').Extract({ path: targetDir })
            .on('close', () => {
              console.log('✅ Распаковка завершена');


              // 7. Обновление package.json
              console.log(`\n📝 Обновляю package.json...`);
              const projectPkgPath = path.join(cwd, 'package.json');
              if (fs.existsSync(projectPkgPath)) {
                const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf8'));
                projectPkg.dependencies = projectPkg.dependencies || {};
                projectPkg.dependencies[packageName] = `^${pkg.version}`;
                fs.writeFileSync(projectPkgPath, JSON.stringify(projectPkg, null, 2));
                console.log('✅ package.json обновлён');
              } else {
                console.log('ℹ package.json не найден — зависимость не добавлена');
              }

              console.log('\n🎉 Установка завершена!');
              console.log('───────────────────────────────────────────────');
            });
        });
      } else {
        console.error(`❌ Архив недоступен. Код: ${checkRes.statusCode}`);
        process.exit(1);
      }
    }).on('error', (checkErr) => {
      console.error('❌ Не удалось проверить архив:', checkErr.message);
      process.exit(1);
    });
  });
}).on('error', (err) => {
  console.error('❌ Ошибка проверки package.json:', err.message);
  console.error(`   URL: ${REPO_URL}/packages/${packageName}/package.json`);
  process.exit(1);
});
  
v2.0
