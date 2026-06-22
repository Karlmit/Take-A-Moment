; Take A Moment — custom NSIS installer script
; Silent install with language flag:
;   "Take A Moment Setup 0.5.x.exe" /S /language=en

!include "FileFunc.nsh"
!insertmacro GetParameters
!insertmacro GetOptions

!macro customInit
  ; $R9 holds the install language throughout the installer session
  StrCpy $R9 "sv"
  ${GetParameters} $R8
  ClearErrors
  ${GetOptions} $R8 "/language=" $R9
  ; Kill any running instance before files are touched.
  ; nsExec runs silently (no console window), unlike ExecWait.
  nsExec::ExecToLog 'taskkill /F /IM "Take A Moment.exe" /T'
  Pop $0
  Sleep 1000
!macroend

!macro customInstall
  ; Write language preference so the app applies it on first run
  FileOpen $0 "$INSTDIR\resources\install-config.json" w
  FileWrite $0 '{"language":"$R9"}'
  FileClose $0
  ; Auto-launch after silent install (company portal / Intune)
  ; Non-silent installs are handled by runAfterFinish in electron-builder config
  IfSilent +1 +2
  ExecShell "open" "$INSTDIR\Take A Moment.exe"
!macroend
