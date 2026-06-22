; Custom NSIS script for Take A Moment installer
; Supports: /language=<code> flag for silent installs
; Example: "Take A Moment Setup 0.4.0.exe" /S /language=en

!include "LogicLib.nsh"

!macro customHeader
  Var INSTALL_LANG
!macroend

!macro customInit
  StrCpy $INSTALL_LANG "sv"
  ClearErrors
  ${GetOptions} $CMDLINE "/language=" $INSTALL_LANG
!macroend

!macro customInstall
  ; Write language config so the app can apply it on first run
  FileOpen $0 "$INSTDIR\resources\install-config.json" w
  FileWrite $0 '{"language":"$INSTALL_LANG"}'
  FileClose $0
!macroend
