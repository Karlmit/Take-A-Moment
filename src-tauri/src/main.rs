#![cfg_attr(all(windows, not(debug_assertions)), windows_subsystem = "windows")]

fn main() {
  // When deployed via Intune the installer runs as SYSTEM, and the post-install
  // ExecShell can inherit that context. WebView2 then tries to write its data
  // directory to the SYSTEM account profile and shows an unwritable-path error.
  // Exit silently instead of attempting to start a GUI as SYSTEM.
  #[cfg(windows)]
  if std::env::var("USERNAME")
    .map(|u| u.eq_ignore_ascii_case("SYSTEM"))
    .unwrap_or(false)
  {
    return;
  }
  take_a_moment_lib::run()
}
