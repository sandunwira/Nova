// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::env;
use std::fs;
use std::process::Command;
use std::path::Path;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
        Ok(())
      })
    .invoke_handler(tauri::generate_handler![open_application])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn open_application(destination: String) -> Result<(), String> {
  // Check if the destination is a protocol
  if destination.contains("://") {
    // Use the `start` command to open the protocol
    Command::new("cmd")
      .args(&["/C", "start", &destination])
      .spawn()
      .map_err(|e| format!("Failed to open application: {}", e))?;
  } else {
    // Use the provided destination path directly
    let application_path = Path::new(&destination);

    // Check if the application path exists
    if !application_path.exists() {
        return Err(format!("The specified path does not exist: {:?}", application_path));
    }

    // Attempt to launch the application
    Command::new(application_path)
        .spawn()
        .map_err(|e| format!("Failed to open application: {}", e))?;
  }

  Ok(())
}