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
      get_system_info
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
    let status = RunasCommand::new("powershell")
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
    let status = RunasCommand::new("powershell")
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