; Take A Moment — custom NSIS installer script
; Silent install with language flag:
;   "Take A Moment Setup 0.4.0.exe" /S /language=en

!include "FileFunc.nsh"
!insertmacro GetParameters
!insertmacro GetOptions

!macro customInit
  ; $R9 holds the install language throughout the installer session
  StrCpy $R9 "sv"
  ${GetParameters} $R8
  ClearErrors
  ${GetOptions} $R8 "/language=" $R9
!macroend

!macro customInstall
  ; Write language preference so the app applies it on first run
  FileOpen $0 "$INSTDIR\resources\install-config.json" w
  FileWrite $0 '{"language":"$R9"}'
  FileClose $0
!macroend
