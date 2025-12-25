param(
  [string]$ReleaseDir = "release",
  [string]$KeyPath = "app-signing.key",
  [string]$CertPath = "app-signing.crt"
)

if (-not (Test-Path -Path $KeyPath)) {
  Write-Error "Missing private key: $KeyPath"
  exit 1
}

if (-not (Test-Path -Path $CertPath)) {
  Write-Error "Missing public cert: $CertPath"
  exit 1
}

if (-not (Test-Path -Path $ReleaseDir)) {
  Write-Error "Missing release directory: $ReleaseDir"
  exit 1
}

$executables = Get-ChildItem -Path $ReleaseDir -Filter *.exe -File
if ($executables.Count -eq 0) {
  Write-Error "No .exe files found in $ReleaseDir"
  exit 1
}

foreach ($exe in $executables) {
  $sigPath = "$($exe.FullName).sig"
  & openssl dgst -sha256 -sign $KeyPath -out $sigPath $exe.FullName
  if ($LASTEXITCODE -ne 0) {
    Write-Error "OpenSSL signing failed for $($exe.Name)"
    exit 1
  }
  Write-Host "Signed: $($exe.Name) -> $([System.IO.Path]::GetFileName($sigPath))"
}
