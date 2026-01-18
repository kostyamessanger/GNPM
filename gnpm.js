#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// URL вашего репозитория на GitHub (замените "ваш-ник" на реальное имя)
const REPO_URL = 'https://raw.githubusercontent.com/ваш-ник/gnpm/main';

// Разбор аргументов командной строки
const args = process.argv.slice(2);
if (args[0] !== 'install' || !args[1]) {
  console.log('Usage: gnpm install <package-name>');
  process.exit(1);
}

const packageName = args[1];
const cwd = process.cwd(); // Текущая рабочая директория


// Пути к нужным папкам и файлам
const nodeModulesDir = path.join(cwd, 'node_modules');
const targetDir = path.join(nodeModulesDir, packageName); // Куда распаковывать
const packagesDir = path.join(cwd, 'packages');       // Локальная папка для ZIP
const zipPath = path.join(packagesDir, `${packageName}.zip`); // Путь к загруженному ZIP


// Проверка: установлен ли пакет уже?
if (fs.existsSync(targetDir)) {
  console.log(`${packageName} уже установлен.`);
  process.exit(0);
}

// Создаём необходимые папки, если их нет
if (!fs.existsSync(nodeModulesDir)) fs.mkdirSync(nodeModulesDir);
if (!fs.existsSync(packagesDir)) fs.mkdirSync(packagesDir);


console.log(`Начинаем установку ${packageName}...`);


// Шаг 1: получаем package.json пакета из репозитория
https.get(`${REPO_URL}/packages/${packageName}/package.json`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const pkg = JSON.parse(data);
    console.log(`Найдена версия: ${packageName}@${pkg.version}`);


    // Шаг 2: скачиваем ZIP-архив в ./packages/<packageName>.zip
    https.get(`${REPO_URL}/packages/${packageName}.zip`, (response) => {
      const file = fs.createWriteStream(zipPath);
      response.pipe(file);

      file.on('finish', () => {
        console.log('Архив загружен в ./packages/');

        // Шаг 3: распаковываем ZIP в node_modules/<packageName>
        require('unzip-core').Extract({ path: targetDir })
          .on('close', () => {
            console.log(`${packageName} успешно установлен!`);


            // Шаг 4: обновляем package.json проекта (если он есть)
            const projectPkgPath = path.join(cwd, 'package.json');
            if (fs.existsSync(projectPkgPath)) {
              const projectPkg = JSON.parse(fs.readFileSync(projectPkgPath, 'utf8'));
              projectPkg.dependencies = projectPkg.dependencies || {};
              projectPkg.dependencies[packageName] = `^${pkg.version}`;
              fs.writeFileSync(projectPkgPath, JSON.stringify(projectPkg, null, 2));
              console.log('package.json обновлён.');
            }
          });
      });
    }).on('error', (err) => {
      console.error('Ошибка загрузки ZIP:', err.message);
      // Удаляем неполный архив
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      process.exit(1);
    });
  });
}).on('error', (err) => {
  console.error('Ошибка получения package.json:', err.message);
  process.exit(1);
});
v1.0
