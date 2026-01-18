<#
.SYNOPSIS
  Установщик GNPM для Windows
.DESCRIPTION
  Скачивает gnpm.js и добавляет в PATH пользователя.
#>

# Целевая папка для GNPM (можно изменить)
$installDir = "C:\gnpm"

# URL вашего репозитория (замените "ваш-ник")
$scriptUrl = "https://raw.githubusercontent.com/ваш-ник/gnpm/main/gnpm.js"
$scriptPath = "$installDir\gnpm.js"

Write-Host "🚀 Начинаем установку GNPM..." -ForegroundColor Cyan

# 1. Создаём папку установки
try {
  if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Write-Host "✓ Создана папка: $installDir"
  } else {
    Write-Host "ℹ Папка уже существует: $installDir"
  }
} catch {
  Write-Host "❌ Ошибка создания папки: $_" -ForegroundColor Red
  exit 1
}

# 2. Скачиваем gnpm.js
Write-Host "⏳ Скачиваем gnpm.js из $scriptUrl..."
try {
  $webClient = New-Object System.Net.WebClient
  $webClient.DownloadFile($scriptUrl, $scriptPath)
  
  if (Test-Path $scriptPath) {
    Write-Host "✓ gnpm.js успешно загружен"
  } else {
    Write-Host "❌ Файл не найден после загрузки" -ForegroundColor Red
    exit 1
  }
} catch {
  Write-Host "❌ Ошибка загрузки: $_" -ForegroundColor Red
  # Дополнительно выводим код ошибки
  Write-Host "Код ошибки: $($_.Exception.StatusCode)" -ForegroundColor DarkGray
  Write-Host "Сообщение: $($_.Exception.Message)" -ForegroundColor DarkGray
  exit 1
}

# 3. Проверяем, что файл не пустой
if ((Get-Item $scriptPath).Length -eq 0) {
  Write-Host "❌ Скачанный файл пуст. Проверьте URL." -ForegroundColor Red
  exit 1
}

# 4. Добавляем в PATH пользователя (без перезаписи всего PATH)
Write-Host "⏳ Обновляем PATH пользователя..."
try {
  $currentPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
  
  # Проверяем, есть ли наш путь уже в PATH
  if ($currentPath -like "*$installDir*") {
    Write-Host "ℹ Путь уже в PATH" -ForegroundColor Yellow
  } else {
    $newPath = "$currentPath;$installDir"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✓ PATH обновлен. Теперь можно использовать 'gnpm' в терминале."
  }
} catch {
  Write-Host "❌ Ошибка обновления PATH: $_" -ForegroundColor Red
  exit 1
}

# 5. Финальная инструкция
Write-Host ""
Write-Host "✅ GNPM установлен!" -ForegroundColor Green
Write-Host "1. Перезапустите терминал (cmd/PowerShell)." -ForegroundColor Yellow
Write-Host "2. Проверьте: gnpm --help" -ForegroundColor Yellow
Write-Host "3. Для удаления: удалите папку $installDir и уберите путь из PATH." -ForegroundColor Yellow


exit 0

v1.0
