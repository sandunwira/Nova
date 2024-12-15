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

	// TOOLTIP START ========================================================= //
	const tooltips = document.querySelectorAll('.tooltip');

	tooltips.forEach(function (tooltip) {
		const text = tooltip.getAttribute('data-tooltip');
		const tooltipText = document.createElement('span');
		tooltipText.className = 'tooltiptext';
		tooltipText.innerText = text;
		tooltip.appendChild(tooltipText);

		tooltip.addEventListener('mouseenter', function () {
			const rect = tooltipText.getBoundingClientRect();
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;

			// Adjust horizontal position if cropped
			if (rect.left < 0) {
				tooltipText.style.left = '0';
				tooltipText.style.marginLeft = '0';
			} else if (rect.right > windowWidth) {
				tooltipText.style.left = 'auto';
				tooltipText.style.right = '5px';
				tooltipText.style.marginLeft = '0';
			}

			// Adjust vertical position if cropped
			if (rect.top < 0) {
				tooltipText.style.bottom = 'auto';
				tooltipText.style.top = '125%';
			} else if (rect.bottom > windowHeight) {
				tooltipText.style.top = 'auto';
				tooltipText.style.bottom = '125%';
			}
		});
	});
	// =========================================================== TOOLTIP END //
});