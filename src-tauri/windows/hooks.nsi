!include "FileFunc.nsh"
!insertmacro GetParameters
!insertmacro GetOptions

!macro NSIS_HOOK_PREINSTALL
  StrCpy $R9 ""
  ${GetParameters} $R8
  ClearErrors
  ${GetOptions} $R8 "/language=" $R9
  IfErrors +2
  Goto +1

  nsExec::ExecToLog 'taskkill /F /IM "Take A Moment.exe" /T'
  Pop $0
  nsExec::ExecToLog 'taskkill /F /IM "take-a-moment.exe" /T'
  Pop $0
  Sleep 1000

  ; Clean up the Electron-era install and the first Tauri migration build so
  ; Windows does not show two Take A Moment apps after upgrading.
  SetOutPath "$TEMP"
  RMDir /r "$INSTDIR"
  RMDir /r "$PROGRAMFILES64\Take A Moment"
  RMDir /r "$PROGRAMFILES\Take A Moment"
  CreateDirectory "$INSTDIR"
  SetOutPath "$INSTDIR"
  Delete "$DESKTOP\Take A Moment.lnk"
  RMDir /r "$SMPROGRAMS\Take A Moment"

  ; The installer stub is 32-bit; the per-machine uninstall entries (incl.
  ; Electron-builder's GUID-named key) live in the 64-bit registry view, so
  ; switch views and remove every "Take A Moment" Uninstall key by DisplayName.
  ; This hook runs before our own 0.8.x entry is written, so only stale
  ; installs match.
  SetRegView 64
  StrCpy $0 0
  tam_uninst_loop:
    EnumRegKey $1 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall" $0
    StrCmp $1 "" tam_uninst_done
    ReadRegStr $2 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\$1" "DisplayName"
    StrCmp $2 "Take A Moment" 0 tam_uninst_next
      DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\$1"
      Goto tam_uninst_loop ; indices shift after delete; re-enumerate at $0
    tam_uninst_next:
    IntOp $0 $0 + 1
    Goto tam_uninst_loop
  tam_uninst_done:

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
  FileWrite $9 '  Remove-Item (Join-Path $$p.FullName "AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Take A Moment.lnk") -Force -EA 0$\n'
  FileWrite $9 '}$\n'
  FileClose $9
  ; Use the 64-bit PowerShell (Sysnative from this 32-bit stub) so per-user
  ; HKEY_USERS uninstall lookups hit the 64-bit registry view, not WOW6432Node.
  nsExec::ExecToLog '"$WINDIR\Sysnative\WindowsPowerShell\v1.0\powershell.exe" -NonInteractive -NoProfile -ExecutionPolicy Bypass -File "$TEMP\tam-migrate.ps1"'
  Pop $0
  IntCmp $0 0 +3
  nsExec::ExecToLog 'powershell -NonInteractive -NoProfile -ExecutionPolicy Bypass -File "$TEMP\tam-migrate.ps1"'
  Pop $0
  Sleep 2000
  Delete "$TEMP\tam-migrate.ps1"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  StrCmp $R9 "" +4
  FileOpen $0 "$INSTDIR\install-config.json" w
  FileWrite $0 '{"language":"$R9"}'
  FileClose $0
  Sleep 1500
  nsis_tauri_utils::RunAsUser "$INSTDIR\take-a-moment.exe" ""
!macroend
