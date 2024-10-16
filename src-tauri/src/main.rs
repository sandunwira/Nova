// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::env;
use std::fs;
use std::process::Command;
use std::path::Path;
use winapi::um::winuser::{keybd_event, VK_MEDIA_PLAY_PAUSE, VK_MEDIA_PREV_TRACK, VK_MEDIA_NEXT_TRACK, VK_VOLUME_UP, VK_VOLUME_DOWN, KEYEVENTF_KEYUP};

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
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
      decrease_volume
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