// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tauri::{Manager, WindowEvent};

use window_shadows::set_shadow;

use std::env;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use runas::Command as RunasCommand;
use std::process::Command;

use winapi::um::winuser::{
    keybd_event, KEYEVENTF_KEYUP, VK_MEDIA_NEXT_TRACK, VK_MEDIA_PLAY_PAUSE, VK_MEDIA_PREV_TRACK,
    VK_VOLUME_DOWN, VK_VOLUME_MUTE, VK_VOLUME_UP,
};

use sysinfo::{Disks, Networks, System, RefreshKind, CpuRefreshKind, Users};

use dirs::*;
use walkdir::WalkDir;

use chrono::Local;
use screenshot_desktop::Screenshot;

use wallpaper;

use serde::Serialize;
use serde_json::json;
use serde_json::Value;

use winreg::enums::*;
use winreg::RegKey;

#[derive(Serialize)]
struct SearchResult {
    path: String,
}



fn main() {
    // Create the system tray menu items
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new().add_item(quit);

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
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .setup(|app| {
            let main_window = app.get_window("main").unwrap();
            let main_window_clone = main_window.clone();

            set_shadow(&main_window, true).unwrap();

            // Listen for the close event on the main window
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent the window from closing and hide it instead
                    api.prevent_close();
                    main_window_clone
                        .hide()
                        .expect("failed to hide main window");
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
            change_wallpaper,
            shutdown_pc,
            restart_pc,
            lock_pc,
            sleep_pc,
            get_installed_apps,
            receive_applications_json
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



static mut RECEIVED_APPLICATIONS: Option<Vec<Value>> = None;

#[command]
async fn receive_applications_json(json: Vec<Value>) -> Result<(), String> {
    // Store the received JSON array in a static variable
    unsafe {
        RECEIVED_APPLICATIONS = Some(json);
    }
    Ok(())
}



#[tauri::command]
fn open_application(app_name: String) -> Result<Value, String> {
    // Get home directory using dirs crate
    let home_dir = dirs::home_dir()
        .ok_or_else(|| "Failed to get home directory".to_string())?;

    let json_path = home_dir
        .join("Documents")
        .join("Nova")
        .join("applications.json");

    // Read and parse the JSON file
    let json_content = fs::read_to_string(&json_path)
        .map_err(|e| format!("Failed to read applications.json: {}", e))?;

    let apps: Value = serde_json::from_str(&json_content)
        .map_err(|e| format!("Failed to parse applications.json: {}", e))?;

    // Check if the applications is an array
    let applications = apps.as_array()
        .ok_or_else(|| "Invalid applications.json format: expected an array".to_string())?;

    let search_term = app_name.to_lowercase();
    let mut matches = Vec::new();

    // Look for exact matching applications in the JSON file
    for app in applications {
        if let Some(name) = app["name"].as_str() {
            if name.to_lowercase() == search_term {
                if let Some(path) = app["path"].as_str() {
                    matches.push((name.to_string(), path.to_string()));
                }
            }
        }
    }

    // If no matches found, check the received applications
    if matches.is_empty() {
        unsafe {
            if let Some(received_apps) = &RECEIVED_APPLICATIONS {
                for app in received_apps {
                    if let Some(name) = app["name"].as_str() {
                        if name.to_lowercase() == search_term {
                            if let Some(path) = app["path"].as_str() {
                                matches.push((name.to_string(), path.to_string()));
                            }
                        }
                    }
                }
            }
        }
    }

    match matches.len() {
        0 => Ok(json!({
            "status": "error",
            "message": format!("No application found matching '{}'", app_name)
        })),
        1 => {
            // If only one match is found, launch it
            let (name, path) = &matches[0];

            // Launch the application based on path type
            let launch_result = if path.contains("://") {
                Command::new("cmd")
                    .args(&["/C", "start", path])
                    .spawn()
                    .map_err(|e| format!("Failed to open protocol: {}", e))
            } else {
                let application_path = Path::new(path);
                Command::new("cmd")
                    .args(&["/C", "start", "", application_path.to_str().unwrap()])
                    .spawn()
                    .map_err(|e| format!("Failed to open application: {}", e))
            };

            // Return appropriate response based on launch result
            match launch_result {
                Ok(_) => Ok(json!({
                    "status": "success",
                    "message": format!("Successfully launched '{}'", name),
                    "launched_app": name
                })),
                Err(e) => Ok(json!({
                    "status": "error",
                    "message": format!("Failed to launch '{}': {}", name, e)
                }))
            }
        },
        _ => {
            // If multiple matches are found, return an error
            Ok(json!({
                "status": "error",
                "message": format!("Multiple applications found matching '{}'", app_name)
            }))
        }
    }
}


use webbrowser;

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    if webbrowser::open(&url).is_ok() {
        Ok(())
    } else {
        Err("Failed to open URL".into())
    }
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
async fn turn_on_wifi() -> Result<(), String> {
    let status = RunasCommand::new("netsh")
        .args(&["interface", "set", "interface", "Wi-Fi", "enabled"])
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
async fn turn_off_wifi() -> Result<(), String> {
    let status = RunasCommand::new("netsh")
        .args(&["interface", "set", "interface", "Wi-Fi", "disabled"])
        .show(false)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to turn off WiFi".to_string())
    }
}



#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_memory = sys.total_memory();
    let used_memory = sys.used_memory();

    let long_os_version = System::long_os_version().unwrap_or("Unknown".to_string());
    let kernel_version = System::kernel_version().unwrap_or("Unknown".to_string());
    let os_version = System::os_version().unwrap_or("Unknown".to_string());
    let host_name = System::host_name().unwrap_or("Unknown".to_string());

    let mut s = System::new_with_specifics(
        RefreshKind::new().with_cpu(CpuRefreshKind::everything()),
    );
    let cpu_brand = s.cpus().first().map_or("Unknown".to_string(), |cpu| cpu.brand().to_string());
    let nb_cpus = sys.cpus().len();
    let cpu_arch = System::cpu_arch().unwrap_or("Unknown".to_string());

    // Wait a bit because CPU usage is based on diff.
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    // Refresh CPUs again to get actual value.
    s.refresh_cpu_usage();
    let cpu_usage = s.global_cpu_usage();

    let last_booted_time = System::boot_time();
    let system_uptime = System::uptime();

    let mut disks_info = Vec::new();
    let disks = Disks::new_with_refreshed_list();
    for disk in &disks {
        let disk_letter = disk.mount_point().to_str().unwrap_or("Unknown").to_string();
        let disk_name = disk.name().to_str().unwrap_or("Unknown").to_string();
        let file_system = disk.file_system().to_string_lossy().to_string();
        let used_storage = disk.available_space();
        let total_storage = disk.total_space();

        disks_info.push(json!({
            "disk_letter": disk_letter,
            "disk_name": if disk_name.is_empty() { "Unknown".to_string() } else { disk_name },
            "file_system": file_system,
            "used_storage": used_storage,
            "total_storage": total_storage
        }));
    }

    let mut networks_info = Vec::new();
    let networks = Networks::new_with_refreshed_list();
    for (interface_name, _data) in &networks {
        networks_info.push(json!({
            "interface_name": interface_name
        }));
    }

    Ok(json!({
        "total_memory": total_memory,
        "used_memory": used_memory,
        "long_os_version": long_os_version,
        "kernel_version": kernel_version,
        "os_version": os_version,
        "host_name": host_name,
        "cpu_brand": cpu_brand,
        "nb_cpus": nb_cpus,
        "cpu_arch": cpu_arch,
        "cpu_usage": cpu_usage,
        "last_booted_time": last_booted_time,
        "system_uptime": system_uptime,
        "disks": disks_info,
        "networks": networks_info
    }))
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
async fn search_file(search_terms: String) -> Result<Vec<SearchResult>, String> {
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
        "System Volume Information",
    ];

    for drive in drives {
        for entry in WalkDir::new(&drive)
            .follow_links(true)
            .into_iter()
            .filter_entry(|e| {
                // Skip system folders and hidden files
                if let Some(path) = e.path().to_str() {
                    !skip_folders.iter().any(|folder| path.contains(folder))
                        && !path.contains("AppData")
                        && !path.contains("$Recycle.Bin")
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

    Ok(results)
}

#[tauri::command]
fn open_folder(filePath: String) -> Result<(), String> {
    let path = Path::new(&filePath);

    let command = Command::new("explorer").arg("/select,").arg(&path).spawn();

    command.map_err(|e| format!("Failed to open folder: {}", e))?;
    Ok(())
}



#[tauri::command]
async fn set_light_mode() -> Result<(), String> {
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
        Err(e) => Err(format!("Failed to access registry: {}", e)),
    }
}

#[tauri::command]
async fn set_dark_mode() -> Result<(), String> {
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
        Err(e) => Err(format!("Failed to access registry: {}", e)),
    }
}



#[tauri::command]
fn take_screenshot() -> Result<(), String> {
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
        Ok(screenshot) => screenshot.save(&desktop_path).map_err(|e| e.to_string()),
        Err(_) => Err("Failed to capture screenshot".to_string()),
    }
}



#[tauri::command]
async fn change_wallpaper(image_path: String) -> Result<(), String> {
    // Use spawn_blocking to run the blocking operation in a separate thread
    tokio::task::spawn_blocking(move || {
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
            }
            Err(e) => Err(e.to_string()),
        }
    })
    .await
    .unwrap_or_else(|e| Err(format!("Failed to change wallpaper: {}", e)))
}



#[tauri::command]
fn shutdown_pc() -> Result<(), String> {
    let status = Command::new("cmd")
        .args(&["/C", "start", "", "shutdown", "/s", "/t", "10"])
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to shutdown PC".to_string())
    }
}

#[tauri::command]
fn restart_pc() -> Result<(), String> {
    let status = Command::new("cmd")
        .args(&["/C", "start", "", "shutdown", "/r", "/t", "10"])
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to restart PC".to_string())
    }
}

#[tauri::command]
fn lock_pc() -> Result<(), String> {
    let status = Command::new("cmd")
        .args(&[
            "/C",
            "start",
            "",
            "rundll32.exe",
            "user32.dll,LockWorkStation",
        ])
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to log off PC".to_string())
    }
}

#[tauri::command]
fn sleep_pc() -> Result<(), String> {
    let status = Command::new("cmd")
        .args(&[
            "/C",
            "start",
            "",
            "rundll32.exe",
            "powrprof.dll,SetSuspendState",
            "0,1,0",
        ])
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        Ok(())
    } else {
        Err("Failed to put PC to sleep".to_string())
    }
}



#[tauri::command]
async fn get_installed_apps() -> Result<(), String> {
    let paths = vec![
        PathBuf::from("C:\\ProgramData\\Microsoft\\Windows\\Start Menu"),
        PathBuf::from(
            "C:\\Users\\Sandun\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs",
        ),
    ];

    let mut apps = Vec::new();

    for path in paths {
        for entry in WalkDir::new(&path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let extension = entry.path().extension().unwrap_or_default();
            if (path.starts_with("C:\\ProgramData") || path.starts_with("C:\\Users"))
                && extension == "lnk"
            {
                let app_name = entry
                    .path()
                    .file_stem()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                if !app_name.to_lowercase().contains("uninstall") {
                    let app_path = entry.path().display().to_string();
                    apps.push(json!({
                        "name": app_name,
                        "path": app_path
                    }));
                }
            }
        }
    }

    let json = serde_json::to_string(&apps).map_err(|e| e.to_string())?;

    // Get the user's home directory and construct the output path
    let home_dir = home_dir().ok_or("Could not get home directory")?;
    let output_dir = home_dir.join("Documents").join("Nova");

    // Ensure the directory exists
    if !output_dir.exists() {
        fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
    }

    fs::write(output_dir.join("applications.json"), json).map_err(|e| e.to_string())?;

    Ok(())
}