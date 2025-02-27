const { appWindow } = window.__TAURI__.window;

// TITLEBAR EVENTS START ===================================================== //
document.getElementById('titlebar-minimize').addEventListener('click', () => appWindow.minimize());
document.getElementById('titlebar-close').addEventListener('click', () => appWindow.hide());
// ======================================================= TITLEBAR EVENTS END //


document.addEventListener('DOMContentLoaded', function () {
	// USER REGISTRATION START =============================================== //
	// Update the registration check
	if (window.localStorage.getItem('userData')) {
		let userData = JSON.parse(window.localStorage.getItem('userData'));
		// Update User Data
		window.localStorage.setItem('userData', JSON.stringify(userData));
		console.log('User Data Renewed');
	} else if (!window.localStorage.getItem('onboarding')) {
		window.location.href = 'welcome.html';
	}
	// ================================================= USER REGISTRATION END //
});