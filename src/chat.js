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


// USER PROFILE START ======================================================== //
window.addEventListener('DOMContentLoaded', () => {
	const titlebarProfile = document.getElementById('titlebar-profile');
	titlebarProfile.style = 'display: flex; flex-direction: row; align-items: center; gap: 8px; z-index: 10; width: auto; cursor: default; animation: fadeIn 1s;';
	titlebarProfile.title = `Logged in as ${userData.name}`;
	titlebarProfile.innerHTML = `
		<img
			src="${userData.avatar}"
			alt="Avatar for ${userData.name}"
			style="width: 12px; height: 12px;"
		/>
		<span style="font-size: 10px; color: var(--white); font-weight: 300;" id="greetingText">
			Hey, ${userData.name}
		</span>
	`;

	const greetingText = document.getElementById('greetingText');
	setTimeout(() => {
		greetingText.textContent = userData.name;
	}, 8000);
});
// ========================================================== USER PROFILE END //