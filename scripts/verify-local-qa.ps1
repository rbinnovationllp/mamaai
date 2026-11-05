param([int]$Port = 3106, [switch]$RealProvider)
$root = Split-Path $PSScriptRoot -Parent
$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($existing) { throw "Local QA port $Port is already occupied; refusing to use an unowned server." }
$config = Join-Path $root '.env.gemini-qa.local'
$logDir = Join-Path $root 'work\local-qa-diagnostics'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Get-Content $config | ForEach-Object { if ($_ -match '^([A-Z][A-Z0-9_]*)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }
$env:MAMA_AI_DYNAMODB_LOCAL='true'; $env:MAMA_AI_LOCAL_QA='true'; $env:MAMA_AI_LOCAL_QA_GEMINI_MOCK_FAILURE=if($RealProvider){'false'}else{'true'}; $env:VERCEL=''; $env:VERCEL_ENV=''
if ($env:MAMA_AI_DYNAMODB_LOCAL_ENDPOINT -ne 'http://127.0.0.1:8010' -or $env:MAMA_AI_DYNAMODB_TABLE_NAME -notmatch '^mamaai-local-qa-' -or -not (Test-NetConnection 127.0.0.1 -Port 8010 -InformationLevel Quiet)) { throw 'Local QA DynamoDB is not safely available.' }
$out=Join-Path $logDir 'scenario.out.log'; $err=Join-Path $logDir 'scenario.err.log'; $next=Join-Path $root 'node_modules\next\dist\bin\next'
$server=Start-Process node.exe -ArgumentList $next,'dev','--port',$Port -WorkingDirectory $root -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
try {
  for($i=0;$i -lt 40;$i++){ if($server.HasExited){throw "Next exited $($server.ExitCode)"}; try { Invoke-WebRequest "http://127.0.0.1:$Port/" -TimeoutSec 2 -ErrorAction Stop|Out-Null;break }catch{Start-Sleep -Milliseconds 500};if($i -eq 39){throw 'Next readiness timeout'} }
  $session=New-Object Microsoft.PowerShell.Commands.WebRequestSession; $email='scenario-'+[guid]::NewGuid().ToString('N').Substring(0,10)+'@example.test'; $password='ScenarioQA!2026'
  function Call([string]$path,[object]$body){$r=Invoke-WebRequest "http://127.0.0.1:$Port$path" -Method Post -ContentType application/json -Body ($body|ConvertTo-Json -Depth 10 -Compress) -WebSession $session -SkipHttpErrorCheck;@{status=[int]$r.StatusCode;body=($r.Content|ConvertFrom-Json)}}
  $register=Call '/api/customer/auth/register' @{fullName='Fictional Scenario QA';email=$email;password=$password;confirmPassword=$password;staySignedIn=$true}
  $members=@(1..5|ForEach-Object{@{id="member$_";name="Fictional Member $_";relation=if($_ -eq 5){'child'}else{'adult'};age=if($_ -le 2){70}elseif($_ -eq 5){4}else{40};foodPreference='vegetarian';allergies=@('peanut');doctorAdvisedRestrictions=@();dislikes=@()}})
  $profile=Call '/api/customer/family-profile' @{customer=@{name='Fictional Scenario QA';preferredLanguage='en';householdFoodPreference='vegetarian';cookingHabit='fresh_home_cooked';budgetPreference='moderate';weeklyFoodRoutineStatus='skip';weeklyFoodRoutine=@();mealTypePreferences=@{breakfast=@();lunch=@();snacks=@();dinner=@()};mealTimings=@{};favoriteFoodTags=@();recentMealHistory=@();nonVegPreferredFoods=@()};members=$members}
  $askQuestion=if($RealProvider){'Suggest one balanced vegetarian dinner for this family, considering the two seniors and young child. One member has a peanut allergy. Avoid peanuts and peanut oil. List the ingredients and explain why the meal is suitable.'}else{'Suggest a vegetarian dinner without peanuts or peanut oil.'}
  $ask=Call '/api/ask-mama' @{question=$askQuestion;responseLanguage='en'}
  Start-Sleep -Milliseconds 500; $event=(Get-Content $out|Select-String 'LOCAL_QA_ASK_MAMA_DIAGNOSTIC'|Select-Object -Last 1).Line
  [pscustomobject]@{serverAlive=(-not $server.HasExited);registration=$register.status;profile=$profile.status;profileHasPeanut=($profile.body.familyProfile.members|ForEach-Object{$_.allergies}|Where-Object{$_ -eq 'peanut'}).Count -gt 0;ask=$ask.status;askCode=$ask.body.error.code;answer=$ask.body.response;unresolved=$ask.body.unresolved;fallback=$ask.body.fallbackSource;diagnosticCaptured=[bool]$event;realGeminiCalled=[bool]$RealProvider}|ConvertTo-Json -Compress
} finally { if(-not $server.HasExited){Stop-Process -Id $server.Id -Force} }
