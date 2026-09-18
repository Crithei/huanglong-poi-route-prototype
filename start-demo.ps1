$port = 4173
while (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
  $port += 1
}

$address = "http://127.0.0.1:$port"
Start-Process -FilePath "node.exe" -ArgumentList @("server.js", "$port") -WorkingDirectory $PSScriptRoot -WindowStyle Hidden

$ready = $false
foreach ($attempt in 1..20) {
  try {
    Invoke-WebRequest -UseBasicParsing -Uri $address -TimeoutSec 1 | Out-Null
    $ready = $true
    break
  } catch {
    Start-Sleep -Milliseconds 150
  }
}

if (-not $ready) {
  throw "The Huanglong prototype server did not start at $address."
}

Start-Process -FilePath $address
