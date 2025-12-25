param(
  [string]$ReleaseDir = "release",
  [string]$CertPath = "app-signing.crt"
)

if (-not (Test-Path -Path $CertPath)) {
  Write-Error "Missing public cert: $CertPath"
  exit 1
}

if (-not (Test-Path -Path $ReleaseDir)) {
  Write-Error "Missing release directory: $ReleaseDir"
  exit 1
}

$pubkeyPath = Join-Path $ReleaseDir "app-signing.pubkey.pem"
& openssl x509 -in $CertPath -pubkey -noout -out $pubkeyPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "OpenSSL failed to extract public key from $CertPath"
  exit 1
}

$executables = Get-ChildItem -Path $ReleaseDir -Filter *.exe -File
if ($executables.Count -eq 0) {
  Write-Error "No .exe files found in $ReleaseDir"
  exit 1
}

foreach ($exe in $executables) {
  $sigPath = "$($exe.FullName).sig"
  if (-not (Test-Path -Path $sigPath)) {
    Write-Error "Missing signature for $($exe.Name): $([System.IO.Path]::GetFileName($sigPath))"
    exit 1
  }
  & openssl dgst -sha256 -verify $pubkeyPath -signature $sigPath $exe.FullName
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Verification failed for $($exe.Name)"
    exit 1
  }
  Write-Host "Verified: $($exe.Name)"
}

Remove-Item -Path $pubkeyPath -Force
