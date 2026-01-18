$installDir = "C:\gnpm"
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/kostyamessanger/gnpm/main/gnpm.js" -OutFile "$installDir\gnpm.js"
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($path -notlike "*$installDir*") {
  $newPath = "$path;$installDir"
  [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
}
