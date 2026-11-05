param([int]$Port = 3106)
$root = Split-Path $PSScriptRoot -Parent
$config = Join-Path $root '.env.gemini-qa.local'
$logDir = Join-Path $root 'work\local-qa-diagnostics'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Get-Content $config | ForEach-Object { if ($_ -match '^([A-Z][A-Z0-9_]*)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }
$env:MAMA_AI_DYNAMODB_LOCAL='true'; $env:MAMA_AI_LOCAL_QA='true'; $env:VERCEL=''; $env:VERCEL_ENV=''
if ($env:MAMA_AI_DYNAMODB_LOCAL_ENDPOINT -ne 'http://127.0.0.1:8010' -or $env:MAMA_AI_DYNAMODB_TABLE_NAME -notmatch '^mamaai-local-qa-') { throw 'Unsafe local QA configuration.' }
$out=Join-Path $logDir 'server.out.log'; $err=Join-Path $logDir 'server.err.log'
$next = Join-Path $root 'node_modules\next\dist\bin\next'
$process = Start-Process -FilePath 'node.exe' -ArgumentList $next,'dev','--port',$Port -WorkingDirectory $root -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  if ($process.HasExited) { throw "Local QA Next.js process exited with code $($process.ExitCode)." }
  try { Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -TimeoutSec 2 -ErrorAction Stop | Out-Null; break } catch { Start-Sleep -Milliseconds 500 }
  if ($attempt -eq 29) { Stop-Process -Id $process.Id -Force; throw 'Local QA server did not become ready.' }
}
$process
