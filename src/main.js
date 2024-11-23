const { appWindow } = window.__TAURI__.window;

document.getElementById('titlebar-minimize').addEventListener('click', () => appWindow.minimize());
document.getElementById('titlebar-close').addEventListener('click', () => appWindow.hide());