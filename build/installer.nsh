; Take A Moment — custom NSIS installer script
; Silent install with optional language flag:
;   "Take A Moment Setup 0.7.x.exe" /S /language=en
; Without /language=, the app shows its own language picker on first run.

!include "FileFunc.nsh"
!insertmacro GetParameters
!insertmacro GetOptions

!macro customInit
  ; $R9 holds the install language if explicitly passed via /language=<code>.
  ; If not passed, $R9 stays empty and the in-app picker handles it.
  StrCpy $R9 ""
  ${GetParameters} $R8
  ClearErrors
  ${GetOptions} $R8 "/language=" $R9
  IfErrors +2
  Goto +1

  ; Kill any running instance before files are touched.
  nsExec::ExecToLog 'taskkill /F /IM "Take A Moment.exe" /T'
  Pop $0
  Sleep 1000

  ; Migrate: remove existing per-user installs before installing system-wide.
  ; Writes a temp PowerShell script that:
  ;   1. Removes the HKCU uninstall registry entry for all currently loaded user hives
  ;   2. Deletes the per-user install directory and shortcuts for every profile
  FileOpen $9 "$TEMP\tam-migrate.ps1" w
  FileWrite $9 '$$n="Take A Moment"; $$u="Software\Microsoft\Windows\CurrentVersion\Uninstall"$\n'
  FileWrite $9 'foreach($$s in (Get-ChildItem "Registry::HKEY_USERS" -EA 0|?{$$_.PSChildName -match "^S-1-5-21"})){$\n'
  FileWrite $9 '  $$k=Get-ChildItem "Registry::HKEY_USERS\$$($$s.PSChildName)\$$u" -EA 0|Get-ItemProperty -EA 0|?{$$_.DisplayName -eq $$n}|Select -First 1$\n'
  FileWrite $9 '  if($$k){Remove-Item "Registry::HKEY_USERS\$$($$s.PSChildName)\$$u\$$($$k.PSChildName)" -Recurse -Force -EA 0}$\n'
  FileWrite $9 '}$\n'
  FileWrite $9 'foreach($$p in (Get-ChildItem "C:\Users" -Directory -EA 0|?{$$_.Name -notin "Public","Default","Default User"})){$\n'
  FileWrite $9 '  Remove-Item (Join-Path $$p.FullName "AppData\Local\Programs\Take A Moment") -Recurse -Force -EA 0$\n'
  FileWrite $9 '  Remove-Item (Join-Path $$p.FullName "Desktop\Take A Moment.lnk") -Force -EA 0$\n'
  FileWrite $9 '  Remove-Item (Join-Path $$p.FullName "AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Take A Moment") -Recurse -Force -EA 0$\n'
  FileWrite $9 '}$\n'
  FileClose $9
  nsExec::ExecToLog 'powershell -NonInteractive -NoProfile -ExecutionPolicy Bypass -File "$TEMP\tam-migrate.ps1"'
  Pop $0
  Sleep 2000
  Delete "$TEMP\tam-migrate.ps1"
!macroend

!macro customInstall
  ; Only write install-config.json when /language= was explicitly provided.
  ; Without it the app shows its own language picker on first run.
  StrCmp $R9 "" +4
  FileOpen $0 "$INSTDIR\resources\install-config.json" w
  FileWrite $0 '{"language":"$R9"}'
  FileClose $0
  ; Auto-launch after silent install (company portal / Intune).
  ; Non-silent installs are handled by runAfterFinish in electron-builder config.
  IfSilent +1 +2
  ExecShell "open" "$INSTDIR\Take A Moment.exe"
!macroend
