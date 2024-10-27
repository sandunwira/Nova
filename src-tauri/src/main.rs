// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent};
use tauri::{Manager, WindowEvent};
use std::env;
use std::fs;
use std::process::Command;
use runas::Command as RunasCommand;
use std::path::Path;
use winapi::um::winuser::{keybd_event, VK_MEDIA_PLAY_PAUSE, VK_MEDIA_PREV_TRACK, VK_MEDIA_NEXT_TRACK, VK_VOLUME_UP, VK_VOLUME_DOWN, KEYEVENTF_KEYUP, VK_VOLUME_MUTE};
use tauri::command;
use walkdir::WalkDir;
use std::path::PathBuf;
use serde::Serialize;
use winreg::enums::*;
use winreg::RegKey;


#[derive(Serialize)]
struct SearchResult {
    path: String,
}


fn main() {
  // Create the system tray menu items
  let quit = CustomMenuItem::new("quit".to_string(), "Quit");
  let tray_menu = SystemTrayMenu::new()
    .add_item(quit);

  // Create the system tray
  let system_tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .system_tray(system_tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::LeftClick {
        position: _,
        size: _,
        ..
      } => {
        println!("system tray received a left click");
      }
      SystemTrayEvent::RightClick {
        position: _,
        size: _,
        ..
      } => {
        println!("system tray received a right click");
      }
      SystemTrayEvent::DoubleClick {
        position: _,
        size: _,
        ..
      } => {
        println!("system tray received a double click");
        let main_window = app.get_window("main").unwrap();
        main_window.show().expect("failed to show main window");
        println!("Main window is shown");
      }
      SystemTrayEvent::MenuItemClick { id, .. } => {
        match id.as_str() {
          "quit" => {
            std::process::exit(0);
          }
          _ => {}
        }
      }
      _ => {}
    })
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      let main_window_clone = main_window.clone();
      // Listen for the close event on the main window
      main_window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
          // Prevent the window from closing and hide it instead
          api.prevent_close();
          main_window_clone.hide().expect("failed to hide main window");
          println!("Main window is hidden");
        }
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      open_application,
      open_url,
      play_media,
      pause_media,
      previous_media,
      next_media,
      increase_volume,
      decrease_volume,
      toggle_mute,
      turn_on_wifi,
      turn_off_wifi,
      get_system_info,
      search_file,
      open_folder,
      set_light_mode,
      set_dark_mode,
      take_screenshot,
      random_wallpaper
    ])
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
  } else if destination.ends_with(".exe") {
    // Use the provided destination path directly
    let application_path = Path::new(&destination);

    // Use the `start` command to open the application in a new window
    Command::new("cmd")
      .args(&["/C", "start", "", application_path.to_str().unwrap()])
      .spawn()
      .map_err(|e| format!("Failed to open application: {}", e))?;
  }

  Ok(())
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
  // Use the `start` command to open the URL
  Command::new("cmd")
    .args(&["/C", "start", "", &url])
    .spawn()
    .map_err(|e| format!("Failed to open URL: {}", e))?;

  Ok(())
}


#[tauri::command]
fn play_media() -> Result<(), String> {
    unsafe {
        keybd_event(VK_MEDIA_PLAY_PAUSE as u8, 0, 0, 0);
        keybd_event(VK_MEDIA_PLAY_PAUSE as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    Ok(())
}


#[tauri::command]
fn pause_media() -> Result<(), String> {
    unsafe {
        keybd_event(VK_MEDIA_PLAY_PAUSE as u8, 0, 0, 0);
        keybd_event(VK_MEDIA_PLAY_PAUSE as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    Ok(())
}


#[tauri::command]
fn previous_media() -> Result<(), String> {
    unsafe {
        keybd_event(VK_MEDIA_PREV_TRACK as u8, 0, 0, 0);
        keybd_event(VK_MEDIA_PREV_TRACK as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    Ok(())
}


#[tauri::command]
fn next_media() -> Result<(), String> {
    unsafe {
        keybd_event(VK_MEDIA_NEXT_TRACK as u8, 0, 0, 0);
        keybd_event(VK_MEDIA_NEXT_TRACK as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    Ok(())
}


#[tauri::command]
fn increase_volume() -> Result<(), String> {
    unsafe {
        keybd_event(VK_VOLUME_UP as u8, 0, 0, 0);
        keybd_event(VK_VOLUME_UP as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    Ok(())
}

#[tauri::command]
fn decrease_volume() -> Result<(), String> {
    unsafe {
        keybd_event(VK_VOLUME_DOWN as u8, 0, 0, 0);
        keybd_event(VK_VOLUME_DOWN as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    Ok(())
}

#[tauri::command]
fn toggle_mute() -> Result<(), String> {
  unsafe {
    keybd_event(VK_VOLUME_MUTE as u8, 0, 0, 0);
    keybd_event(VK_VOLUME_MUTE as u8, 0, KEYEVENTF_KEYUP, 0);
  }
  Ok(())
}


#[tauri::command]
fn turn_on_wifi() -> Result<(), String> {
    let status = RunasCommand::new("cmd")
        .args(&["netsh", "interface", "set", "interface", "Wi-Fi", "enabled"])
        .show(false)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to turn on WiFi".to_string())
    }
}

#[tauri::command]
fn turn_off_wifi() -> Result<(), String> {
    let status = RunasCommand::new("cmd")
        .args(&["netsh", "interface", "set", "interface", "Wi-Fi", "disabled"])
        .show(false)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to turn off WiFi".to_string())
    }
}


use sysinfo::{Components, Disks, Networks, System};

#[tauri::command]
fn get_system_info() -> Result<String, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let mut info = String::new();

    info.push_str("System:\n");
    info.push_str(&format!("Total Memory: {} bytes\n", sys.total_memory()));
    info.push_str(&format!("Used Memory: {} bytes\n", sys.used_memory()));
    info.push_str(&format!("Total Swap: {} bytes\n", sys.total_swap()));
    info.push_str(&format!("Used Swap: {} bytes\n", sys.used_swap()));

    info.push_str(&format!("System Name: {:?}\n", System::name()));
    info.push_str(&format!("System OS Build Version: {:?}\n", System::kernel_version()));
    info.push_str(&format!("System OS Version: {:?}\n", System::os_version()));
    info.push_str(&format!("System Host Name: {:?}\n", System::host_name()));

    info.push_str(&format!("NB CPUs: {}\n", sys.cpus().len()));

    info.push_str("Disks:\n");
    let disks = Disks::new_with_refreshed_list();
    for disk in &disks {
        info.push_str(&format!("{:?}\n", disk));
    }

    info.push_str("Components:\n");
    let components = Components::new_with_refreshed_list();
    for component in &components {
        info.push_str(&format!("{:?}\n", component));
    }

    Ok(info)
}


fn get_windows_drives() -> Vec<String> {
  let mut drives = Vec::new();

  // Get all available drives using wmic
  if let Ok(output) = Command::new("wmic")
      .args(["logicaldisk", "get", "name"])
      .output() 
  {
      if let Ok(output_str) = String::from_utf8(output.stdout) {
          for line in output_str.lines() {
              let drive = line.trim();
              if drive.len() == 2 && drive.ends_with(':') {
                  drives.push(format!("{}\\", drive));
              }
          }
      }
  }

  // If wmic command fails, fallback to C: drive
  if drives.is_empty() {
      drives.push("C:\\".to_string());
  }

  drives
}

#[tauri::command]
fn search_file(search_terms: String) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    let drives = get_windows_drives();

    // Convert search terms to lowercase for case-insensitive comparison
    let keywords: Vec<String> = search_terms
        .to_lowercase()
        .split_whitespace()
        .map(String::from)
        .collect();

    // Common Windows folders to skip for better performance
    let skip_folders = [
        "Windows",
        "$Recycle.Bin",
        "Program Files",
        "Program Files (x86)",
        "ProgramData",
        "System Volume Information"
    ];

    for drive in drives {
        for entry in WalkDir::new(&drive)
            .follow_links(true)
            .into_iter()
            .filter_entry(|e| {
                // Skip system folders and hidden files
                if let Some(path) = e.path().to_str() {
                    !skip_folders.iter().any(|folder| path.contains(folder)) &&
                    !path.contains("AppData") &&
                    !path.contains("$Recycle.Bin")
                } else {
                    true
                }
            })
            .filter_map(|e| e.ok())
        {
          if entry.file_type().is_file() {
            let filename = entry.file_name().to_string_lossy().to_lowercase();

            // Check if all keywords are present in the filename
            if keywords.iter().all(|keyword| filename.contains(keyword)) {
                results.push(SearchResult {
                    path: entry.path().display().to_string(),
                });
            }
        }
        }
    }

    if results.is_empty() {
      Err(format!("No files found matching: {}", search_terms))
  } else {
      Ok(results)
  }
}


#[tauri::command]
fn open_folder(filePath: String) -> Result<(), String> {
    let path = Path::new(&filePath);

    let command = Command::new("explorer").arg(&path).spawn();

    command.map_err(|e| format!("Failed to open folder: {}", e))?;
    Ok(())
}


#[tauri::command]
fn set_light_mode() -> Result<(), String> {
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let path = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

  match hkcu.open_subkey_with_flags(path, KEY_READ | KEY_WRITE) {
      Ok(key) => {
          // Set both app and system theme to light (1)
          key.set_value("AppsUseLightTheme", &1u32)
              .map_err(|e| format!("Failed to set app theme: {}", e))?;
          key.set_value("SystemUsesLightTheme", &1u32)
              .map_err(|e| format!("Failed to set system theme: {}", e))?;

          Ok(())
      }
      Err(e) => Err(format!("Failed to access registry: {}", e))
  }
}


#[tauri::command]
fn set_dark_mode() -> Result<(), String> {
  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let path = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

  match hkcu.open_subkey_with_flags(path, KEY_READ | KEY_WRITE) {
      Ok(key) => {
          // Set both app and system theme to dark (0)
          key.set_value("AppsUseLightTheme", &0u32)
              .map_err(|e| format!("Failed to set app theme: {}", e))?;
          key.set_value("SystemUsesLightTheme", &0u32)
              .map_err(|e| format!("Failed to set system theme: {}", e))?;

          Ok(())
      }
      Err(e) => Err(format!("Failed to access registry: {}", e))
  }
}



#[tauri::command]
fn take_screenshot() -> Result<(), String> {
  use chrono::Local;
  use dirs;
  use screenshot_desktop::Screenshot;

  // Get the path to the desktop directory
  let mut desktop_path = match dirs::home_dir() {
    Some(path) => path,
    None => return Err("Failed to get home directory".to_string()),
  };
  desktop_path.push("Desktop");

  // Generate the filename with the current date and time
  let timestamp = Local::now().format("%Y-%m-%d %H%M%S").to_string();
  let file_name = format!("Screenshot {}.png", timestamp);
  desktop_path.push(file_name);

  match Screenshot::new() {
      Ok(screenshot) => {
          screenshot.save(&desktop_path).map_err(|e| e.to_string())
      },
      Err(_) => {
          Err("Failed to capture screenshot".to_string())
      },
  }
}

use wallpaper;

#[tauri::command]
fn random_wallpaper(image_path: String) -> Result<(), String> {
  // Returns the wallpaper of the current desktop.
  println!("{:?}", wallpaper::get());

  // Sets the wallpaper for the current desktop from a URL.
  match wallpaper::set_from_url(&image_path) {
      Ok(_) => {
          // Set the wallpaper mode to Crop
          wallpaper::set_mode(wallpaper::Mode::Crop).unwrap();

          // Returns the wallpaper of the current desktop.
          println!("{:?}", wallpaper::get());
          Ok(())
      },
      Err(e) => Err(e.to_string()),
  }
}