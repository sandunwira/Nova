const { appWindow } = window.__TAURI__.window;

// TITLEBAR EVENTS START ===================================================== //
document.getElementById('titlebar-minimize').addEventListener('click', () => appWindow.minimize());
document.getElementById('titlebar-close').addEventListener('click', () => appWindow.hide());
// ======================================================= TITLEBAR EVENTS END //


// VOICE RECOGNITION START =================================================== //
const chatFormVoiceBtn = document.getElementById('chatFormVoiceBtn');

let recognition = null;
let isListening = false;
let silenceTimer = null;
let lastResultTimestamp = null;

function resetSilenceTimer() {
	if (silenceTimer) {
		clearTimeout(silenceTimer);
	}
	lastResultTimestamp = Date.now();
	silenceTimer = setTimeout(() => {
		if (isListening && Date.now() - lastResultTimestamp >= 5000) {
			console.log('Silence detected, stopping recording');
			recognition.stop();
			isListening = false;
			chatFormVoiceBtn.style.color = 'var(--white)';
		}
	}, 5000);
}

chatFormVoiceBtn.addEventListener('click', () => {
	chatMessage.focus();
	if ('webkitSpeechRecognition' in window) {
		if (!recognition) {
			recognition = new webkitSpeechRecognition();
			recognition.lang = 'en-US';
			recognition.continuous = true;
			recognition.interimResults = true;

			recognition.audioStart = () => {
				console.log('Audio capturing started');
				resetSilenceTimer();
			};

			recognition.onresult = (event) => {
				const transcript = Array.from(event.results)
					.map(result => result[0].transcript)
					.join('');
				chatMessage.value = transcript;
				chatMessage.dispatchEvent(new Event('input'));
				resetSilenceTimer();
			};

			recognition.onerror = (event) => {
				console.error('Speech recognition error:', event.error);
				isListening = false;
				chatFormVoiceBtn.style.color = '#333333';
				if (silenceTimer) {
					clearTimeout(silenceTimer);
				}
			};

			recognition.onend = () => {
				console.log('Speech recognition ended');
				if (isListening) {
					recognition.start();
					resetSilenceTimer();
				} else {
					chatFormVoiceBtn.style.color = 'var(--white)';
					if (silenceTimer) {
						clearTimeout(silenceTimer);
					}
				}
			};
		}

		if (!isListening) {
			recognition.start();
			isListening = true;
			chatFormVoiceBtn.style.color = 'var(--accent)';
			resetSilenceTimer();
		} else {
			recognition.stop();
			isListening = false;
			chatFormVoiceBtn.style.color = 'var(--white)';
			if (silenceTimer) {
				clearTimeout(silenceTimer);
			}
		}
	} else {
		console.error('Speech recognition is not supported in this browser.');
	}
});
// ===================================================== VOICE RECOGNITION END //


// TOOLTIP START ============================================================= //
document.addEventListener('DOMContentLoaded', function () {
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
});
// =============================================================== TOOLTIP END //