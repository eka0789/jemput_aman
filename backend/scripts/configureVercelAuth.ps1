param(
  [string]$Scope = 'eka0789s-projects'
)

$ErrorActionPreference = 'Stop'

function ConvertFrom-SecureValue {
  param([Security.SecureString]$Value)
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Read-ConfirmedSecret {
  param(
    [string]$Label,
    [int]$MinimumLength,
    [switch]$Numeric
  )
  while ($true) {
    $first = Read-Host $Label -AsSecureString
    $second = Read-Host 'Ulangi untuk konfirmasi' -AsSecureString
    $plainFirst = ConvertFrom-SecureValue $first
    $plainSecond = ConvertFrom-SecureValue $second
    try {
      if ($plainFirst -ne $plainSecond) {
        Write-Warning 'Nilai konfirmasi tidak sama. Silakan ulangi.'
        continue
      }
      if ($plainFirst.Length -lt $MinimumLength) {
        Write-Warning "Minimal $MinimumLength karakter."
        continue
      }
      if ($Numeric -and $plainFirst -notmatch '^\d{4,12}$') {
        Write-Warning 'PIN harus terdiri dari 4 sampai 12 angka.'
        continue
      }
      return $first
    } finally {
      $plainFirst = $null
      $plainSecond = $null
    }
  }
}

function New-CredentialHash {
  param([Security.SecureString]$Secret)
  $plain = ConvertFrom-SecureValue $Secret
  $salt = New-Object byte[] 16
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($salt)
    $derive = [Security.Cryptography.Rfc2898DeriveBytes]::new(
      $plain,
      $salt,
      210000,
      [Security.Cryptography.HashAlgorithmName]::SHA256
    )
    try {
      $digest = $derive.GetBytes(32)
      return 'pbkdf2_sha256$210000${0}${1}' -f (
        ([BitConverter]::ToString($salt) -replace '-', '').ToLowerInvariant()
      ), (
        ([BitConverter]::ToString($digest) -replace '-', '').ToLowerInvariant()
      )
    } finally {
      $derive.Dispose()
    }
  } finally {
    $plain = $null
    $rng.Dispose()
  }
}

function Set-ProductionEnvironment {
  param(
    [string]$Name,
    [string]$Value
  )
  $Value | npx.cmd vercel@56.5.0 env add $Name production --force --scope $Scope
  if ($LASTEXITCODE -ne 0) {
    throw "Gagal memasang $Name ke Vercel."
  }
}

Write-Host 'Konfigurasi login JemputAman Production' -ForegroundColor Cyan
Write-Host 'Password dan PIN tidak akan ditampilkan atau disimpan sebagai teks biasa.'

$adminPassword = Read-ConfirmedSecret 'Password Admin (minimal 10 karakter)' 10
$foundationPassword = Read-ConfirmedSecret 'Password Yayasan (minimal 10 karakter)' 10
$kioskPin = Read-ConfirmedSecret 'PIN Kiosk (4-12 angka)' 4 -Numeric

Set-ProductionEnvironment 'ADMIN_PASSWORD_HASH' (New-CredentialHash $adminPassword)
Set-ProductionEnvironment 'FOUNDATION_PASSWORD_HASH' (New-CredentialHash $foundationPassword)
Set-ProductionEnvironment 'KIOSK_PIN_HASH' (New-CredentialHash $kioskPin)
Set-ProductionEnvironment 'JWT_EXPIRES_IN' '8h'

Write-Host 'Kredensial production berhasil dikonfigurasi.' -ForegroundColor Green
Write-Host 'Email Admin: admin@tkceria-salatiga.sch.id'
Write-Host 'Email Yayasan: bambang@yayasan.org'
