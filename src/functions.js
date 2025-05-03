const { appWindow, WebviewWindow } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.tauri;


let bugcodesData = [];
let crisisHotlinesData = [];
let dictionaryData = [];

// // Fetch the JSON files
fetch('data/bugcodes.json')
	.then(response => response.json())
	.then(data => {
		bugcodesData = data;
	});

fetch('data/crisis_hotlines.json')
	.then(response => response.json())
	.then(data => {
		crisisHotlinesData = data;
	});

fetch('data/dictionary.min.json')
	.then(response => response.json())
	.then(data => {
		dictionaryData = data;
	});


const chatForm = document.getElementById('chatForm');
const chatMessage = document.getElementById('chatMessage');
const botResponse = document.getElementById('botResponse');
const chatFormSubmitBtn = document.getElementById('chatFormSubmitBtn');
const chatResponses = document.getElementById('chatResponses');


// GET USER DATA START ======================================================== //
let userData = null;
try {
	const storedData = window.localStorage.getItem('userData');

	if (storedData) {
		userData = JSON.parse(storedData);
		if (!userData || !userData.avatar) {
			window.location.href = 'welcome.html';
		}
		console.log('User Data:', userData);
	} else {
		window.location.href = 'welcome.html';
	}
} catch (error) {
	console.error('Error loading user data:', error);
	window.location.href = 'welcome.html';
}
// ========================================================== GET USER DATA END //


let userChatAvatarHTML = userData ? `
	<div style="height: calc(100% - 30px); padding-top: 30px; width: 45px; display: flex; align-items: start; justify-content: center; user-select: none;">
		<img src="${userData.avatar}" alt="User Avatar" style="height: 20px; width: 20px; object-fit: cover; border-radius: 50px;">
	</div>
` : `
	<div style="height: calc(100% - 30px); padding-top: 30px; width: 45px; display: flex; align-items: start; justify-content: center; user-select: none;">
		<img src="assets/images/useravatars/thumbs-default.svg" alt="User Avatar" style="height: 20px; width: 20px; object-fit: contain;">
	</div>
`;

let botChatAvatarHTML = `
	<div style="height: calc(100% - 30px); padding-top: 30px; width: 45px; display: flex; align-items: start; justify-content: center; user-select: none;">
		<img src="assets/images/logo.svg" alt="Nova Avatar" style="height: 20px; width: 20px; object-fit: contain;">
	</div>
`;


// Add the showWelcomeMessage function
function showWelcomeMessage() {
	if (chatResponses.children.length === 0) {
		const welcomeDiv = document.createElement('div');
		welcomeDiv.id = 'welcome-message';
		welcomeDiv.style = 'height: 100%; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; user-select: none;';

		// Fetch task items from JSON file
		fetch('data/tasks.json')
			.then(response => response.json())
			.then(allTaskItems => {
				// Function to get 4 unique random task items
				const getRandomTaskItems = (items, count) => {
					const shuffled = [...items].sort(() => 0.5 - Math.random());
					return shuffled.slice(0, count);
				};

				// Get 4 random task items
				const randomTaskItems = getRandomTaskItems(allTaskItems, 4);

				welcomeDiv.innerHTML = `
					<span style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
						<p>This is</p>
						<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
							<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 38px; object-fit: contain; margin-top: 4px;">
							<h1 style="font-size: 55px;">NOVA</h1>
						</span>
					</span>

					<span style="width: 60%; display: flex; flex-direction: column; align-items: center; gap: 35px;">
						<p>I can help you with tasks such as:</p>

						<div style="width: 100%; display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
							${randomTaskItems.map(item => `
								<div onclick='chatMessage.value = "${item.examples[Math.floor(Math.random() * item.examples.length)]}"; chatMessage.focus();' style="background: var(--blackGray); border: 0.5px solid var(--darkGray); padding: 12px; display: flex; flex-direction: row; align-items: center; justify-content: start; gap: 15px; cursor: pointer;">
									${item.icon}
									<p style="font-size: 12px; font-weight: 300;">${item.text}</p>
								</div>
							`).join('')}
						</div>

						<p style="font-size: 12px;">and many more</p>
					</span>
				`;

				chatResponses.appendChild(welcomeDiv);
			}).catch(error => {
				console.error('Error fetching task items:', error);
			});
	}
}

document.addEventListener('DOMContentLoaded', async function () {
	showWelcomeMessage();

	chatMessage.focus();

	const assistant = new Assistant();
	await assistant.initialize();

	// Time-based greetings
	// const date = new Date();
	// const hours = date.getHours();
	// let greeting = "Hello";
	// if (hours >= 0 && hours < 12) {
	// 	greeting = "Good Morning! 🌤️";
	// } else if (hours >= 12 && hours < 18) {
	// 	greeting = "Good Afternoon! 🌞";
	// } else {
	// 	greeting = "Good Evening! 🌙";
	// }

	// new Notification(`${greeting}`, {
	// 	body: 'Ask me anything and I will try my best to help you out ;)',
	// 	sound: 'Default'
	// });

	// weather notification
	// setTimeout(() => {
	// 	getWeather().then(({ location, weatherComment, temperature }) => {
	// 		new Notification(`${temperature} in ${location}`, {
	// 			body: weatherComment,
	// 			sound: 'Default'
	// 		});
	// 	}).catch(error => {
	// 		console.error('Error in getting weather:', error);
	// 	});
	// }, 60000);


	try {
		chatForm.addEventListener('submit', async function (event) {
			const welcomeMessage = document.getElementById('welcome-message');
			if (welcomeMessage) {
				welcomeMessage.remove();
			}

			event.preventDefault();

			const userResponse = document.createElement('div');
			userResponse.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			userResponse.innerHTML = `
				${userChatAvatarHTML}
				<div class="user-response">
					${chatMessage.value.trim()}
				</div>
			`;
			chatResponses.appendChild(userResponse);

			const userMessage = chatMessage.value.trim();

			chatMessage.value = '';

			try {
				if (userMessage.toLowerCase().startsWith("set a timer for")) {
					const time = userMessage.replace("set a timer for", "").trim();
					setTimer(time);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("visit") || userMessage.toLowerCase().startsWith("go to")) {
					const url = userMessage.replace("visit", "").replace("go to", "").trim();
					openURL(url);

					scrolltoBottom();
				} else if (userMessage.startsWith("open") || userMessage.startsWith("launch") || userMessage.startsWith("run") || userMessage.startsWith("start") || userMessage.startsWith("execute")) {
					const appName = userMessage.replace('open', '').trim().replace('launch', '').trim().replace('run', '').trim().replace('start', '').trim().replace('execute', '').trim();
					openApplication(appName);

					scrolltoBottom();
				} else if (userMessage.startsWith("close")) {
					const appName = userMessage.replace('close', '').trim();
					closeApplication(appName);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("search")) {
					searchWeb(userMessage);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("calc")) {
					const expression = userMessage.replace("calc", "").trim();
					calculateNumbers(expression);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("books about")) {
					const query = userMessage.replace("books about", "").trim();
					searchBooks(query);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("translate") && userMessage.toLowerCase().includes(" to ")) {
					const textToTranslate = userMessage.match(/translate (.+) to (.+)/i);
					if (textToTranslate && textToTranslate.length === 3) {
						const text = textToTranslate[1].trim();
						const targetLanguage = textToTranslate[2].trim();
						translateText(text, targetLanguage);

						scrolltoBottom();
					} else {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								Sorry, I couldn't understand the translation request. Please use the format: translate [text] to [target_language].
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().startsWith("disaster") || userMessage.toLowerCase().startsWith("natural disaster") || userMessage.toLowerCase().startsWith("disaster alert") || userMessage.toLowerCase().startsWith("disaster warning")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
					botResponseDiv.innerHTML = `
						${botChatAvatarHTML}
						<div class="bot-response">
							<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
								Fetching disaster alerts... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
							</span>
						</div>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getDisasterAlerts().then(alerts => {
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								${alerts}
							</div>
						`;

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						errorResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="error-response">
								Sorry, I couldn't fetch disaster alerts.
							</div>
						`;
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().startsWith("play")) {
					const queryforytmusic = userMessage.replace("play", "").trim();
					if (queryforytmusic === "") {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								<p style="margin-bottom: 5px;">
									Please provide a song name or artist to play.<br>
									Hint: play Believer by Imagine Dragons
								</p><br>
								<p style="font-size: 10px;">Powered by <a href="https://music.youtube.com" target="_blank">YouTube Music</a></p><br>
								<p style="color: var(--lightGray); font-weight: 300; font-style: oblique;">If you want to resume playing currently paused media, say "resume".</p>
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
						return;
					} else {
						openYTMusic(queryforytmusic);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().startsWith("create qr for")) {
					const textforqr = userMessage.replace("create qr for", "").trim();
					createQRCode(textforqr);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("convert")) {
					const match = userMessage.match(/convert (\d+)([a-zA-Z]+) to ([a-zA-Z]+)/);
					if (match) {
						const amount = parseFloat(match[1]);
						const fromCurrency = match[2].toUpperCase();
						const toCurrency = match[3].toUpperCase();
						let formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
									Converting ${formattedAmount} ${fromCurrency} to ${toCurrency}... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
								</span>
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();

						convertCurrency(amount, fromCurrency, toCurrency).then(convertedAmount => {
							botResponseDiv.innerHTML = `
								${botChatAvatarHTML}
								<div class="bot-response">
									<p>Here's the currency conversion:</p><br>
									<h1>${convertedAmount}</h1>
									<p>(as of ${getDateForFunctions().month} ${getDateForFunctions().day}, ${getDateForFunctions().year} at ${getTimeForFunctions()})</p>
								</div>
							`;

							scrolltoBottom();
						}).catch(error => {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
							errorResponseDiv.innerHTML = `
								${botChatAvatarHTML}
								<div class="error-response">
									Sorry, I couldn't convert the currency.
								</div>
							`;
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						});
					} else {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						errorResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="error-response">
								Sorry, I couldn't understand the conversion request. Please use the format: convert [amount][base_currency] to [target_currency].
							</div>
						`;
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().includes("bug code") || userMessage.toLowerCase().includes("error")) {
					const bugCode = userMessage.match(/bug code 0x([0-9a-fA-F]+)/) || userMessage.match(/0x([0-9a-fA-F]+) error/);
					if (bugCode) {
						const bugCodeDetails = findBugCodeDetails(bugCode[1].toUpperCase());
						if (bugCodeDetails) {
							const botResponseDiv = document.createElement('div');
							botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
							botResponseDiv.innerHTML = `
								${botChatAvatarHTML}
								<div class="bot-response">
									<p style="margin-bottom: 5px;">Here are the details for the bug code:</p><br>

									<h3>Bug Code:</h3>
									<p>${bugCodeDetails.code}</p><br>

									<h3>Code Name:</h3>
									<p>${bugCodeDetails.code_name}</p><br>

									<h3>Description:</h3>
									<p>${bugCodeDetails.description}</p><br>

									<h3>Solutions:</h3>
									<p>${bugCodeDetails.solutions.map(solution => `- ${solution}`).join('<br>')}</p>
								</div>
							`;
							chatResponses.appendChild(botResponseDiv);

							scrolltoBottom();
						} else {
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
							errorResponseDiv.innerHTML = `
								${botChatAvatarHTML}
								<div class="error-response">
									Sorry, I couldn't find any details for the bug code.
								</div>
							`;
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						}
					} else {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						errorResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="error-response">
								Sorry, I couldn't find any bug code in the request.
							</div>
						`;
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().startsWith("find")) {
					const searchTerms = userMessage.replace("find ", "");
					searchFile(searchTerms);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("wallpaper")) {
					const query = userMessage.match(/(?:set a |)([a-zA-Z]+) wallpaper/);

					if (query && query[1]) {
						const category = query[1];

						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
									Changing the wallpaper... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
								</span>
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();

						changeWallpaper(category).then(() => {
							botResponseDiv.innerHTML = `
								${botChatAvatarHTML}
								<div class="bot-response">
									${category.charAt(0).toUpperCase() + category.slice(1)} wallpaper changed successfully!
								</div>
							`;

							scrolltoBottom();
						}).catch(error => {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
							errorResponseDiv.innerHTML = `
								${botChatAvatarHTML}
								<div class="error-response">
									Sorry, I couldn't change the wallpaper.
								</div>
							`;
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						});
					} else {
						const response = "Sorry, I couldn't find any wallpaper to change.";
						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								${response}
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().startsWith("wake me up at")) {
					let wakeUpTime = userMessage.replace("wake me up at", "").trim();
					wakeUpAlarm(wakeUpTime);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("define")) {
					const word = userMessage.replace("define", "").trim();
					defineWord(word);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("extract text from")) {
					const imageData = userMessage.replace("extract text from", "").trim();
					extractTextFromImage(imageData);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("summarize:") || userMessage.toLowerCase().startsWith("summarise:")) {
					const inputText = userMessage.replace("summarize:", "").trim().replace("summarise:", "").trim();
					if (inputText === "") {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						errorResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="error-response">
								Please provide a text to summarize.<br>Hint: summarize: [text]
							</div>
						`;
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					} else {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
									Summarizing the text... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
								</span>
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);

						const response = await textSummarizer(inputText).then(summary => summary).catch(error => "Sorry, I couldn't summarize the text.");
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								Here is the summarized text:<br><br>${response}
							</div>
						`;

						scrolltoBottom();
					}
				} else {
					// Get intent from assistant
					const intentResult = await assistant.getIntent(userMessage);

					if (intentResult.intent) {
						// Handle different intents based on their type
						switch (intentResult.intent) {
							case 'random_movie':
								await getRandomMovie();
								break;

							case 'get_ip':
								await getIPAddress();
								break;

							case 'get_weather':
								await getWeather();
								break;

							case 'get_time':
								await getTime();
								break;

							case 'get_date':
								await getDate();
								break;

							case 'get_news':
								await fetchNews();
								break;

							case 'get_iotd':
								await getImageOfTheDay();
								break;

							case 'get_qotd':
								await getQuoteOfTheDay();
								break;

							case 'get_quote':
								await getRandomQuote();
								break;

							case 'get_otd':
								await getOnThisDayEvents();
								break;

							case 'get_meal':
								await getRandomMeal();
								break;

							case 'resume_playback':
								await playMedia();
								break;

							case 'pause_playback':
								await pauseMedia();
								break;

							case 'next_track':
								await nextMedia();
								break;

							case 'previous_track':
								await previousMedia();
								break;

							case 'volume_up':
								await increaseVolume();
								break;

							case 'volume_down':
								await decreaseVolume();
								break;

							case 'mute_volume':
								await muteVolume();
								break;

							case 'unmute_volume':
								await unmuteVolume();
								break;

							case 'turn_on_wifi':
								await turnOnWiFi();
								break;

							case 'turn_off_wifi':
								await turnOffWiFi();
								break;

							case 'shutdown_pc':
								await shutdown_pc();
								break;

							case 'restart_pc':
								await restart_pc();
								break;

							case 'lock_pc':
								await lock_pc();
								break;

							case 'sleep_pc':
								await sleep_pc();
								break;

							case 'emergency_hotlines':
								await getCrisisHotlines();
								break;

							case 'get_system_info':
								await getSystemInfo();
								break;

							case 'set_light_mode':
								await switchToLight();
								break;

							case 'set_dark_mode':
								await switchToDark();
								break;

							case 'take_screenshot':
								await takeScreenshot();
								break;

							case 'send_email':
								await sendEmail();
								break;

							case 'rps':
								await playRockPaperScissors(userMessage);
								break;

							default:
								// For intents that only need responses (like greetings)
								const response = await assistant.processQuery(userMessage);
								const botResponseDiv = document.createElement('div');
								botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
								botResponseDiv.innerHTML = `
									${botChatAvatarHTML}
									<div class="bot-response">
										${response}
									</div>
								`;
								chatResponses.appendChild(botResponseDiv);
						}
					} else {
						// No intent matched, use default response
						const response = await assistant.processQuery(userMessage);
						const botResponseDiv = document.createElement('div');
						botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
						botResponseDiv.innerHTML = `
							${botChatAvatarHTML}
							<div class="bot-response">
								${response}
							</div>
						`;
						chatResponses.appendChild(botResponseDiv);
					}
				}

				scrolltoBottom();
			} catch (error) {
				console.error('Error processing query:', error);

				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				errorResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="error-response">
						Sorry, an error occurred while processing your request.
					</div>
				`;
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();
			}
		});

		chatMessage.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				chatForm.dispatchEvent(new Event('submit'));
			}
		});
	} catch (error) {
		console.error('Failed to initialize assistant:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, the assistant failed to initialize properly.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
});



// function to get installed apps
async function get_installed_apps() {
	try {
		const installedApps = await invoke('get_installed_apps');
		return installedApps;
	} catch (error) {
		console.error('Failed to get installed apps:', error);
	}
}
get_installed_apps();

// function to send default applications to rust
async function sendApplicationsJsonToRust() {
	try {
		applicationsData = await fetch('data/default_applications.json').then(response => response.json());
		console.log(applicationsData);
		await invoke('receive_applications_json', { json: applicationsData });
		console.log('Default Applications JSON sent to Rust successfully.');
	} catch (error) {
		console.error('Failed to read or send applications.json:', error);
	}
}
sendApplicationsJsonToRust();



// Function to open a URL
async function openURL(url) {
	url = `https://${url}`;

	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			Opening ${url}...
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('open_url', {
			url: url
		});

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Opened <a href="${url}" target="_blank">${url}</a> successfully. Enjoy!
			</div>
		`;

		scrolltoBottom();
	} catch (error) {
		console.error('Failed to open URL:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't open the URL.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
		throw error;
	}
}



// Function to open applications
async function openApplication(appName) {
	try {
		const response = await window.__TAURI__.invoke('open_application', {
			appName: appName
		});

		switch (response.status) {
			case 'success':
				console.log(`${response.launched_app} launched successfully. Enjoy!`);

				const botResponseDiv = document.createElement('div');
				botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				botResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="bot-response">
						${response.launched_app} launched successfully. Enjoy!
					</div>
				`;
				chatResponses.appendChild(botResponseDiv);

				scrolltoBottom();

				new Notification('Application Launched', {
					body: `${response.launched_app} launched successfully. Enjoy!`,
					sound: 'Default'
				});

				break;

			case 'error':
				console.error('Application error:', response.message);

				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				errorResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="error-response">
						${response.message}
					</div>
				`;
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();

				new Notification('Application Error', {
					body: response.message,
					sound: 'Default'
				});

				break;
		}
	} catch (error) {
		console.error('Failed to execute command:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I encountered a system error. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		new Notification('System Error', {
			body: 'Failed to process the request. Please try again later.',
			sound: 'Default'
		});
	}
}

// Function to close applications
async function closeApplication(appName) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Attempting to close ${appName} and its processes... <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	try {
		const response = await window.__TAURI__.invoke('close_application', { appName });
		chatResponses.removeChild(botResponseDiv);

		const responseDiv = document.createElement('div');

		switch (response.status) {
			case 'success':
				responseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				responseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="bot-response">
						${response.message}
					</div>
				`;
				new Notification('Application Closed', {
					body: response.message,
					silent: true
				});
				break;

			case 'error':
				responseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				if (response.protected) {
					// Handle protected process error
					responseDiv.innerHTML = `
						${botChatAvatarHTML}
						<div class="error-response">
							${response.message}<br>
							<span style="color: var(--lightGray); font-size: 12px;">
								This is a system process that cannot be terminated for security reasons.
							</span>
						</div>
					`;
				} else if (response.not_found) {
					// Handle process not found error
					responseDiv.innerHTML = `
						${botChatAvatarHTML}
						<div class="error-response">
							${response.message}<br>
							<span style="color: var(--lightGray); font-size: 12px;">
								The application might not be running or might have a different process name.
							</span>
						</div>
					`;
				} else {
					// Handle other errors
					responseDiv.innerHTML = `
						${botChatAvatarHTML}
						<div class="error-response">
							${response.message}
						</div>
					`;
				}
				new Notification('Error', {
					body: response.message,
					sound: 'Default'
				});
				break;

			default:
				responseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				responseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="error-response">
						An unexpected error occurred.
					</div>
				`;
				new Notification('Error', {
					body: 'An unexpected error occurred.',
					sound: 'Default'
				});
		}

		chatResponses.appendChild(responseDiv);
		scrolltoBottom();

	} catch (error) {
		console.error('Failed to close application:', error);
		chatResponses.removeChild(botResponseDiv);

		const errorDiv = document.createElement('div');
		errorDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to close application.<br>
				<span style="color: var(--lightGray); font-size: 12px;">
					Error: ${error.message}
				</span>
			</div>
		`;
		chatResponses.appendChild(errorDiv);

		new Notification('Error', {
			body: 'Failed to close application: ' + error.message,
			sound: 'Default'
		});

		scrolltoBottom();
	}
}



// function to get a random movie
function getRandomMovie() {
	let movieDetails = null;

	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Searching for a movie... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	fetch(`https://novaserver.onrender.com/api/functions/random-movie`)
		.then(response => response.json())
		.then(data => {
			const movieID = data.id;
			const movieTitle = data.title;
			const movieYear = data.year;
			const movieGenre = data.genre;
			const moviePlot = data.plot;
			const movieRating = data.rating;
			const movieActors = data.actors;
			const movieDirector = data.director;
			const moviePoster = data.poster;
			let moviePosterContainer;

			movieDetails = `
				${movieTitle} (${movieYear})\n
				Genre: ${movieGenre}\n
				Rating: ${movieRating}\n
				Director: ${movieDirector}\n
				Actors: ${movieActors}\n
				Plot: ${moviePlot}\n
				Poster: ${moviePoster}\n
				Imdb: https://www.imdb.com/title/${movieID}
			`;
			console.log(movieDetails);

			if (moviePoster === "N/A") {
				moviePosterContainer = `
					<span style="height: 300px; aspect-ratio: 3 / 4; border-radius: 2px; background: #808080; display: flex; justify-content: center; align-items: center;">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="75px"  height="75px"  viewBox="0 0 24 24"  fill="none"  stroke="#A9A9A9"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-movie"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M8 4l0 16" /><path d="M16 4l0 16" /><path d="M4 8l4 0" /><path d="M4 16l4 0" /><path d="M4 12l16 0" /><path d="M16 8l4 0" /><path d="M16 16l4 0" /></svg>
					</span>
				`;
			} else {
				moviePosterContainer = `
					<img src="${moviePoster}" alt="${movieTitle}" style="width: auto; height: auto; object-fit: contain; object-position: center;">
				`;
			}

			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Here's a movie I found for you:<br><br>
					<span style="display: flex; flex-direction: row; justify-content: center; gap: 15px;">
						<span style="width: 50%;">
							<h1>${movieTitle} (${movieYear})</h1><br>
							<h3>Genre:</h3><p>${movieGenre}</p><br>
							<h3>Rating:</h3><p>${movieRating}</p><br>
							<h3>Director:</h3><p>${movieDirector}</p><br>
							<h3>Actors:</h3><p>${movieActors}</p><br>
							<h3>Plot:</h3><p>${moviePlot}</p><br>
							<p>Visit <a href="https://www.imdb.com/title/${movieID}" target="_blank">IMDb Page</a></p>
						</span>
						<span style="width: 50%;">
							${moviePosterContainer}
						</span>
					</span>
				</div>
			`;

			scrolltoBottom();
		});

	return movieDetails;
}



// function to get the ip address
async function getIPAddress() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching your IP Address... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch('https://ipinfo.io/?token=a6384bf1fee5c5');
		const data = await response.json();
		const ipaddress = data.ip;
		const country = data.country;

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<p style="margin-bottom: 5px;">Your IP Address is:</p>
				<h1>${ipaddress}</h1>
			</div>
		`;

		scrolltoBottom();

		return { ipaddress, country };
	} catch (error) {
		console.error('Error in getIPAddress:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch your IP Address.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}

// function to get ip address for functions
async function getIPAddressForFunctions() {
	return fetch('https://ipinfo.io/?token=a6384bf1fee5c5')
		.then(response => response.json())
		.then(data => {
			const ipaddress = data.ip;
			const country = data.country;
			return { ipaddress, country };
		})
		.catch(error => {
			console.error('Error in getIPAddress:', error);
			throw error;
		});
}



// function to get the weather
async function getWeather() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching the weather... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const { ipaddress } = await getIPAddressForFunctions();
		const location = await fetch(`https://ipinfo.io/${ipaddress}/city?token=a6384bf1fee5c5`)
			.then(response => response.text());
		console.log(`Location: ${location}`);
		const weatherData = await fetch(`https://novaserver.onrender.com/api/functions/weather?location=${location}`)
			.then(response => response.json());
		console.log(weatherData);

		const description = weatherData.description;
		const temperature = weatherData.temperature;
		const humidity = weatherData.humidity;
		const windSpeed = weatherData.windSpeed;
		const weatherDetails = weatherData.weatherDetails;
		const weatherComment = weatherData.weatherComment;

		const response = `
			<p style="margin-bottom: 5px;">Here are the weather information for ${location}:</p><br>
			<h1>${temperature} in ${location}</h1><br>
			<h3>Humidity:</h3><p>${humidity}</p><br>
			<h3>Wind Speed:</h3><p>${windSpeed}</p><br>
			<p style="color: var(--lightGray); font-weight: 300; font-style: oblique;">${weatherComment}</p>
			<br><p style="font-size: 10px;">Powered by <a href="https://openweathermap.org" target="_blank">OpenWeatherMap</a></p>
		`;
		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${response}
			</div>
		`;

		scrolltoBottom();

		return { weatherDetails, location, description, weatherComment, temperature, humidity, windSpeed };
	} catch (error) {
		console.error('Error in getWeather:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch the weather.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to search the web
async function searchWeb(query) {
	query = query.replace('search ', '').trim();

	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Searching the web... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		let search_status;

		const response = await fetch(`https://novaserver.onrender.com/api/functions/web-search?query=${query}`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching web search results:', error);
				throw error;
			});

		console.log('Web search response:', response);
		const snippetText = response.snippet;

		search_status = 'success';

		if (snippetText.length === 0) {
			search_status = 'no_results';
			snippetText = 'Sorry, I couldn\'t find any relevant information. Please try again in a bit or try a different search query.';
		} else if (snippetText.length < 110) {
			search_status = 'no_snippet';
			snippetText = 'Sorry, I couldn\'t find a detailed response. Please try again in a bit or try a different search query.';
		}

		console.log('Snippet text: ' + snippetText);

		if (search_status === 'success') {
			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Here's what i've found in web:<br><br>
					${snippetText}<br><br>
					<p style="font-size: 10px;">Powered by <a href="https://duckduckgo.com" target="_blank">DuckDuckGo</a></p>
				</div>
			`;
		} else if (search_status === 'no_results' || search_status === 'no_snippet') {
			botResponseDiv.remove();
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Sorry, I couldn't find any relevant information. Please try again in a bit or try a different search query.
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);
		}

		scrolltoBottom();

		return { snippetText, search_status };
	} catch (error) {
		console.error('Error fetching or parsing HTML:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't find any relevant information. Please try again in a bit or try a different search query.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
		throw error;
	}
}



// function to get the time
function getTime() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching the time... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		let date = new Date();

		let hours = date.getHours();
		switch (hours) {
			case 0: hours = 12; break;
			case 13: hours = 1; break;
			case 14: hours = 2; break;
			case 15: hours = 3; break;
			case 16: hours = 4; break;
			case 17: hours = 5; break;
			case 18: hours = 6; break;
			case 19: hours = 7; break;
			case 20: hours = 8; break;
			case 21: hours = 9; break;
			case 22: hours = 10; break;
			case 23: hours = 11; break;
		}
		if (hours < 10) {
			hours = '0' + hours;
		}

		let minutes = date.getMinutes();
		if (minutes < 10) {
			minutes = '0' + minutes;
		}

		let ampm = date.getHours() >= 12 ? 'pm' : 'am';

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<p style="margin-bottom: 5px;">Current time is:</p>
				<h1>${hours}:${minutes}${ampm}</h1>
			</div>
		`;

		scrolltoBottom();

		return `${hours}:${minutes}${ampm}`;
	} catch (error) {
		console.error('Error in getTime:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch the time.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}

// function to get the time for functions
function getTimeForFunctions() {
	try {
		let date = new Date();

		let hours = date.getHours();
		switch (hours) {
			case 0: hours = 12; break;
			case 13: hours = 1; break;
			case 14: hours = 2; break;
			case 15: hours = 3; break;
			case 16: hours = 4; break;
			case 17: hours = 5; break;
			case 18: hours = 6; break;
			case 19: hours = 7; break;
			case 20: hours = 8; break;
			case 21: hours = 9; break;
			case 22: hours = 10; break;
			case 23: hours = 11; break;
		}
		if (hours < 10) {
			hours = '0' + hours;
		}

		let minutes = date.getMinutes();
		if (minutes < 10) {
			minutes = '0' + minutes;
		}

		let ampm = date.getHours() >= 12 ? 'pm' : 'am';

		return `${hours}:${minutes}${ampm}`;
	} catch (error) {
		console.error('Error in getTime:', error);
		throw error;
	}
}


// function to get the date
function getDate() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching the date... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		let date = new Date();

		let day = date.getDate();
		if (day < 10) {
			day = '0' + day;
		}

		let month = date.getMonth();
		switch (month) {
			case 0: month = "January"; break;
			case 1: month = "February"; break;
			case 2: month = "March"; break;
			case 3: month = "April"; break;
			case 4: month = "May"; break;
			case 5: month = "June"; break;
			case 6: month = "July"; break;
			case 7: month = "August"; break;
			case 8: month = "September"; break;
			case 9: month = "October"; break;
			case 10: month = "November"; break;
			case 11: month = "December"; break;
		}

		let year = date.getFullYear();

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<p style="margin-bottom: 5px;">Today's date is:</p>
				<h1>${day} ${month}, ${year}</h1>
			</div>
		`;

		scrolltoBottom();

		return { day, month, year };
	} catch (error) {
		console.error('Error in getDate:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch the date.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}

// function to get the date for functions
function getDateForFunctions() {
	try {
		let date = new Date();

		let day = date.getDate();
		if (day < 10) {
			day = '0' + day;
		}

		let month = date.getMonth();
		switch (month) {
			case 0: month = "January"; break;
			case 1: month = "February"; break;
			case 2: month = "March"; break;
			case 3: month = "April"; break;
			case 4: month = "May"; break;
			case 5: month = "June"; break;
			case 6: month = "July"; break;
			case 7: month = "August"; break;
			case 8: month = "September"; break;
			case 9: month = "October"; break;
			case 10: month = "November"; break;
			case 11: month = "December"; break;
		}

		let year = date.getFullYear();

		return { day, month, year };
	} catch (error) {
		console.error('Error in getDate:', error);
		throw error;
	}
}



// function to calculate numbers
function calculateNumbers(expression) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Calculating... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const result = new Function('return ' + expression)();

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<p style="margin-bottom: 5px;">The answer of ${expression} is:</p>
				<h1>${result}</h1>
			</div>
		`;

		scrolltoBottom();

		return result;
	} catch (error) {
		console.error('Error in calculateNumbers:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't calculate the numbers.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to fetch news from rss feed
async function fetchNews() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching the latest news... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch(`https://novaserver.onrender.com/api/functions/news`);
		const data = await response.json();

		if (!data || !data.items || !Array.isArray(data.items)) {
			throw new Error('Invalid news data format');
		}

		const newsItems = data.items;

		let newsText = "Here are some of the latest global news:<br>";
		newsItems.forEach((item) => {
			newsText += `
				<div style="display: flex; flex-direction: column; gap: 5px; margin-top: 20px;">
					<h1>${item.title}</h1>
					<p>${item.description}... <a href="${item.link}" target="_blank">read more</a></p>
				</div>
			`;
		});

		newsText += '<br><p style="font-size: 10px;">Powered by <a href="https://abcnews.go.com" target="_blank">ABC News</a></p>';
		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${newsText}
			</div>
		`;

		scrolltoBottom();
		return newsItems;
	} catch (error) {
		console.error('Error in fetchNews:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch the latest news.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to get image of the day
async function getImageOfTheDay() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching the image of the day... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch(`https://novaserver.onrender.com/api/functions/iotd`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching image of the day:', error);
				throw error;
			});
		console.log('Image of the day response:', response);

		const imageTitle = response.title;
		const imageUrl = response.imageUrl;
		const imageCredits = response.credits;

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Here's the image of the day:<br><br>
				<h1>${imageTitle}</h1>
				<img src="${imageUrl}" alt="${imageTitle}" style="margin: 10px 0px 5px 0px;">
				<br><p style="font-size: 10px;">Powered by <a href="https://www.bing.com" target="_blank">Bing</a> | Image Credits: ${imageCredits}</p>
			</div>
		`;

		scrolltoBottom();

		return { imageTitle, imageUrl, imageCredits };
	} catch (error) {
		console.error('Error in getImageOfTheDay:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch the image of the day.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to get quote of the day
async function getQuoteOfTheDay() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching the quote of the day... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch(`https://novaserver.onrender.com/api/functions/qotd`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching quote of the day:', error);
				throw error;
			});

		console.log('Quote of the day response:', response);

		const quote = response.quote;
		const author = response.author;
		const fullQuote = quote + ' - ' + author;

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Quote of the day is:<br><br>
				<h1>${quote}</h1>
				<p style="margin-top: 5px;">- ${author}</p>
			</div>
		`;

		scrolltoBottom();

		return { fullQuote, quote, author };
	} catch (error) {
		console.error('Error in getQuoteOfTheDay:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch the quote of the day.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to get random quote
async function getRandomQuote() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching a random quote... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch(`https://novaserver.onrender.com/api/functions/random-quote`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching random quote:', error);
				throw error;
			});

		console.log('Random quote response:', response);

		const quote = response.quote;
		const author = response.author;
		const fullQuote = quote + ' - ' + author;

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Here's a quote I found for you:<br><br>
				<h1>${quote}</h1>
				<p style="margin-top: 5px;">- ${author}</p>
			</div>
		`;

		scrolltoBottom();

		return { fullQuote, quote, author };
	} catch (error) {
		console.error('Error in getRandomQuote:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch a random quote.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to get on this day events
async function getOnThisDayEvents() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching on this day events... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	let monthNum = new Date().getMonth() + 1;
	let dayNum = new Date().getDate();

	try {
		const { day, month } = getDateForFunctions();
		const response = await fetch(`https://novaserver.onrender.com/api/functions/otd?m=${monthNum}&d=${dayNum}`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching on this day events:', error);
				throw error;
			});

		console.log('On this day events response:', response);

		const events = response.events.map(event => `${event.year}: ${event.event}`);

		let eventsText = `Here are some interesting events that happened on ${month} ${day} in history:<br>`;
		events.forEach((event) => {
			eventsText += `<p style="margin-top: 20px;">${event}</p>`;
		});

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${eventsText}
			</div>
		`;

		scrolltoBottom();
		return events;
	} catch (error) {
		console.error('Error in getOnThisDayEvents:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch on this day events.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to get random meal recipes
async function getRandomMeal() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching a random meal recipe... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch('https://novaserver.onrender.com/api/functions/random-meal')
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching random meal:', error);
				throw error;
			});

		console.log('Random meal response:', response);

		const mealName = response.name;
		const mealCategory = response.category;
		const mealArea = response.area;
		const mealInstructions = response.instructions;
		const mealIngredients = [];
		response.ingredients.forEach(ingredient => {
			if (ingredient) {
				mealIngredients.push(`- ${ingredient}`);
			}
		});
		const mealImage = response.thumbnail;
		const mealYoutube = response.youtube;
		let youtubeLink = "";
		if (mealYoutube) {
			youtubeLink = `<p style="font-size: 10px; margin-top: 5px;"><a href="${mealYoutube}" target="_blank">YouTube</a></p>`;
		} else {
			youtubeLink = "";
		}

		const mealDetails = `
			<h1>${mealName} (${mealCategory}, ${mealArea})</h1><br>
			<span style="display: flex; flex-direction: row; gap: 10px; width: 100%;">
				<span style="width: 50%;">
					<h2>Ingredients:</h2>
					${mealIngredients.join('<br>')}<br><br>
				</span>
				<span style="width: 50%;">
					<img src="${mealImage}" style="max-height: 150px; width: 100%; object-fit: cover;" alt="${mealName}"><br>
				</span>
			</span>
			<h2>Instructions:</h2>
			<p>${mealInstructions}</p><br>
			${youtubeLink}
		`;

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${mealDetails}
			</div>
		`;

		scrolltoBottom();

		return mealDetails;
	} catch (error) {
		console.error('Error in getRandomMeal:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch a random meal recipe.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		throw error;
	}
}



// function to search books
async function searchBooks(query) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Searching for books about ${query}... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch(`http://localhost:5000/api/functions/book-search?query=${query}`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching book search:', error);
				throw error;
			});

		console.log('Book search response:', response);

		const books = response.results;

		if (books && books.length > 0) {
			const bookDetails = books.map(book => {
				return `
					<span style="display: flex; flex-direction: row; gap: 10px; width: 100%; margin-top: 15px;">
						<span style="width: 50%;">
							<h1><a href="${book.infoLink}" target="_blank">${book.title}</a></h1><br>
							<h3>Authors:</h3><p>${book.authors}</p><br>
							<h3>Publisher:</h3><p>${book.publisher}</p><br>
							<h3>Published Date:</h3><p>${book.publishedDate}</p><br>
						</span>
						<span style="width: 50%; height: 200px;">
							<img src="${book.thumbnail}" style="height: 100%; width: 100%; object-fit: contain;" alt="${book.title}">
						</span>
					</span>
					<h3>Description:</h3><p>${book.description}</p>
				`;
			}).join('<br>');

			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Here are books that I found for "${query}":<br><br>
					${bookDetails}
				</div>
			`;

			return bookDetails;
		} else {
			console.log('No books found');

			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Sorry, I couldn't find any books about "${query}"
				</div>
			`;

			scrolltoBottom();

			return [];
		}
	} catch (error) {
		console.error('Error fetching or parsing books:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, an error occurred while fetching books.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to translate text
async function translateText(text, targetLanguage) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Translating the text... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const response = await fetch(`http://localhost:5000/api/functions/translate?text=${text}&target=${targetLanguage}`)
			.then(response => response.json())
			.catch(error => {
				console.error('Error fetching translation:', error);
				throw error;
			});

		console.log('Translation response:', response);

		const translatedText = response.translation;

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<p style="margin-bottom: 5px;">Here's the translated text for "${text}":</p>
				<h1>${translatedText}</h1>
			</div>
		`;

		scrolltoBottom();

		return translatedText;
	} catch (error) {
		console.error('Error in translateText:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, an error occurred while translating the text.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}

// function to create qr codes
function createQRCode(textforqr) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Creating QR Code for ${textforqr}... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const qrcode = new QRCode(document.createElement('div'), {
			text: textforqr,
			width: 128,
			height: 128
		});

		const qrCodeImage = qrcode._el.firstChild.toDataURL('image/png');
		const qrCodeElement = document.createElement('img');
		qrCodeElement.src = qrCodeImage;
		qrCodeElement.alt = `QR Code for ${textforqr}`;
		qrCodeElement.style.width = '128px';
		qrCodeElement.style.height = '128px';

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Here's the QR Code for "${textforqr}":<br><br>
				${qrCodeElement.outerHTML}
			</div>
		`;

		scrolltoBottom();

		return qrCodeElement;
	} catch (error) {
		console.error('Error in createQRCode:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, an error occurred while creating the QR Code.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to open_ytmusic
async function openYTMusic(queryforytmusic) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Opening YouTube Music... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		console.log("Opening YouTube Music...");

		const ytmusic_window = new WebviewWindow('ytmusic_window', {
			url: 'https://music.youtube.com/search?q=' + queryforytmusic,
			title: 'YouTube Music',
			decorations: true,
			height: 400,
			width: 400,
			resizable: false,
			maximizable: false,
			x: 10,
			y: 10,
			fileDropEnabled: false,
			alwaysOnTop: false,
		});

		ytmusic_window.once('tauri://created', () => {
			console.log("Opened YouTube Music");

			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					<p style="margin-bottom: 5px;">Opened YouTube Music</p>
				</div>
			`;

			scrolltoBottom();
		});
	} catch (error) {
		ytmusic_window.once('tauri://error', (error) => {
			console.error("Failed to open YouTube Music:", error);
		});

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't open YouTube Music.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to play media
async function playMedia() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Resuming playback... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('play_media');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Resumed playback...
			</div>
		`;
	} catch (error) {
		console.error('Failed to play media:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to play media. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to pause media
async function pauseMedia() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Pausing playback... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('pause_media');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Paused playback...
			</div>
		`;
	} catch (error) {
		console.error('Failed to pause media:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to pause media. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to play previous media
async function previousMedia() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Playing previous track... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('previous_media');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Played previous track...
			</div>
		`;
	} catch (error) {
		console.error('Failed to play previous media:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to play previous track. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to play next media
async function nextMedia() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Playing next track... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('next_media');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Played next track...
			</div>
		`;
	} catch (error) {
		console.error('Failed to play next media:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to play next track. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to increase volume
async function increaseVolume() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Increasing volume... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('increase_volume');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Volume increased...
			</div>
		`;
	} catch (error) {
		console.error('Failed to increase volume:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to increase volume. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to decrease volume
async function decreaseVolume() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Decreasing volume... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('decrease_volume');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Volume decreased...
			</div>
		`;
	} catch (error) {
		console.error('Failed to decrease volume:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to decrease volume. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to toggle mute
async function muteVolume() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Toggling mute... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('toggle_mute');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Volume muted...
			</div>
		`;
	} catch (error) {
		console.error('Failed to mute volume:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to mute volume. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to toggle unmute
async function unmuteVolume() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Toggling unmute... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('toggle_mute');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Volume unmuted...
			</div>
		`;
	} catch (error) {
		console.error('Failed to unmute volume:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to unmute volume. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}



// function to turn on wifi
async function turnOnWiFi() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Turning on WiFi... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('turn_on_wifi');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				WiFi turned on...
			</div>
		`;
	} catch (error) {
		console.error('Failed to turn on WiFi:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to turn on WiFi. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to turn off wifi
async function turnOffWiFi() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Turning off WiFi... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await window.__TAURI__.invoke('turn_off_wifi');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				WiFi turned off...
			</div>
		`;
	} catch (error) {
		console.error('Failed to turn off WiFi:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to turn off WiFi. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}



// function to get natural disaster alerts
async function getDisasterAlerts() {
	try {
		const { country } = await getIPAddressForFunctions();
		let countryCode = country;
		switch (country) {
			case 'AF': countryCode = 'AFG'; break; case 'AX': countryCode = 'ALA'; break; case 'AL': countryCode = 'ALB'; break;
			case 'DZ': countryCode = 'DZA'; break; case 'AS': countryCode = 'ASM'; break; case 'AD': countryCode = 'AND'; break;
			case 'AO': countryCode = 'AGO'; break; case 'AI': countryCode = 'AIA'; break; case 'AQ': countryCode = 'ATA'; break;
			case 'AG': countryCode = 'ATG'; break; case 'AR': countryCode = 'ARG'; break; case 'AM': countryCode = 'ARM'; break;
			case 'AW': countryCode = 'ABW'; break; case 'AU': countryCode = 'AUS'; break; case 'AT': countryCode = 'AUT'; break;
			case 'AZ': countryCode = 'AZE'; break; case 'BS': countryCode = 'BHS'; break; case 'BH': countryCode = 'BHR'; break;
			case 'BD': countryCode = 'BGD'; break; case 'BB': countryCode = 'BRB'; break; case 'BY': countryCode = 'BLR'; break;
			case 'BE': countryCode = 'BEL'; break; case 'BZ': countryCode = 'BLZ'; break; case 'BJ': countryCode = 'BEN'; break;
			case 'BM': countryCode = 'BMU'; break; case 'BT': countryCode = 'BTN'; break; case 'BO': countryCode = 'BOL'; break;
			case 'BA': countryCode = 'BIH'; break; case 'BW': countryCode = 'BWA'; break; case 'BV': countryCode = 'BVT'; break;
			case 'BR': countryCode = 'BRA'; break; case 'VG': countryCode = 'VGB'; break; case 'IO': countryCode = 'IOT'; break;
			case 'BN': countryCode = 'BRN'; break; case 'BG': countryCode = 'BGR'; break; case 'BF': countryCode = 'BFA'; break;
			case 'BI': countryCode = 'BDI'; break; case 'KH': countryCode = 'KHM'; break; case 'CM': countryCode = 'CMR'; break;
			case 'CA': countryCode = 'CAN'; break; case 'CV': countryCode = 'CPV'; break; case 'KY': countryCode = 'CYM'; break;
			case 'CF': countryCode = 'CAF'; break; case 'TD': countryCode = 'TCD'; break; case 'CL': countryCode = 'CHL'; break;
			case 'CN': countryCode = 'CHN'; break; case 'HK': countryCode = 'HKG'; break; case 'MO': countryCode = 'MAC'; break;
			case 'CX': countryCode = 'CXR'; break; case 'CC': countryCode = 'CCK'; break; case 'CO': countryCode = 'COL'; break;
			case 'KM': countryCode = 'COM'; break; case 'CG': countryCode = 'COG'; break; case 'CD': countryCode = 'COD'; break;
			case 'CK': countryCode = 'COK'; break; case 'CR': countryCode = 'CRI'; break; case 'CI': countryCode = 'CIV'; break;
			case 'HR': countryCode = 'HRV'; break; case 'CU': countryCode = 'CUB'; break; case 'CY': countryCode = 'CYP'; break;
			case 'CZ': countryCode = 'CZE'; break; case 'DK': countryCode = 'DNK'; break; case 'DJ': countryCode = 'DJI'; break;
			case 'DM': countryCode = 'DMA'; break; case 'DO': countryCode = 'DOM'; break; case 'EC': countryCode = 'ECU'; break;
			case 'EG': countryCode = 'EGY'; break; case 'SV': countryCode = 'SLV'; break; case 'GQ': countryCode = 'GNQ'; break;
			case 'ER': countryCode = 'ERI'; break; case 'EE': countryCode = 'EST'; break; case 'ET': countryCode = 'ETH'; break;
			case 'FK': countryCode = 'FLK'; break; case 'FO': countryCode = 'FRO'; break; case 'FJ': countryCode = 'FJI'; break;
			case 'FI': countryCode = 'FIN'; break; case 'FR': countryCode = 'FRA'; break; case 'GF': countryCode = 'GUF'; break;
			case 'PF': countryCode = 'PYF'; break; case 'TF': countryCode = 'ATF'; break; case 'GA': countryCode = 'GAB'; break;
			case 'GM': countryCode = 'GMB'; break; case 'GE': countryCode = 'GEO'; break; case 'DE': countryCode = 'DEU'; break;
			case 'GH': countryCode = 'GHA'; break; case 'GI': countryCode = 'GIB'; break; case 'GR': countryCode = 'GRC'; break;
			case 'GL': countryCode = 'GRL'; break; case 'GD': countryCode = 'GRD'; break; case 'GP': countryCode = 'GLP'; break;
			case 'GU': countryCode = 'GUM'; break; case 'GT': countryCode = 'GTM'; break; case 'GG': countryCode = 'GGY'; break;
			case 'GN': countryCode = 'GIN'; break; case 'GW': countryCode = 'GNB'; break; case 'GY': countryCode = 'GUY'; break;
			case 'HT': countryCode = 'HTI'; break; case 'HM': countryCode = 'HMD'; break; case 'VA': countryCode = 'VAT'; break;
			case 'HN': countryCode = 'HND'; break; case 'HU': countryCode = 'HUN'; break; case 'IS': countryCode = 'ISL'; break;
			case 'IN': countryCode = 'IND'; break; case 'ID': countryCode = 'IDN'; break; case 'IR': countryCode = 'IRN'; break;
			case 'IQ': countryCode = 'IRQ'; break; case 'IE': countryCode = 'IRL'; break; case 'IM': countryCode = 'IMN'; break;
			case 'IL': countryCode = 'ISR'; break; case 'IT': countryCode = 'ITA'; break; case 'JM': countryCode = 'JAM'; break;
			case 'JP': countryCode = 'JPN'; break; case 'JE': countryCode = 'JEY'; break; case 'JO': countryCode = 'JOR'; break;
			case 'KZ': countryCode = 'KAZ'; break; case 'KE': countryCode = 'KEN'; break; case 'KI': countryCode = 'KIR'; break;
			case 'KP': countryCode = 'PRK'; break; case 'KR': countryCode = 'KOR'; break; case 'KW': countryCode = 'KWT'; break;
			case 'KG': countryCode = 'KGZ'; break; case 'LA': countryCode = 'LAO'; break; case 'LV': countryCode = 'LVA'; break;
			case 'LB': countryCode = 'LBN'; break; case 'LS': countryCode = 'LSO'; break; case 'LR': countryCode = 'LBR'; break;
			case 'LY': countryCode = 'LBY'; break; case 'LI': countryCode = 'LIE'; break; case 'LT': countryCode = 'LTU'; break;
			case 'LU': countryCode = 'LUX'; break; case 'MK': countryCode = 'MKD'; break; case 'MG': countryCode = 'MDG'; break;
			case 'MW': countryCode = 'MWI'; break; case 'MY': countryCode = 'MYS'; break; case 'MV': countryCode = 'MDV'; break;
			case 'ML': countryCode = 'MLI'; break; case 'MT': countryCode = 'MLT'; break; case 'MH': countryCode = 'MHL'; break;
			case 'MQ': countryCode = 'MTQ'; break; case 'MR': countryCode = 'MRT'; break; case 'MU': countryCode = 'MUS'; break;
			case 'YT': countryCode = 'MYT'; break; case 'MX': countryCode = 'MEX'; break; case 'FM': countryCode = 'FSM'; break;
			case 'MD': countryCode = 'MDA'; break; case 'MC': countryCode = 'MCO'; break; case 'MN': countryCode = 'MNG'; break;
			case 'ME': countryCode = 'MNE'; break; case 'MS': countryCode = 'MSR'; break; case 'MA': countryCode = 'MAR'; break;
			case 'MZ': countryCode = 'MOZ'; break; case 'MM': countryCode = 'MMR'; break; case 'NA': countryCode = 'NAM'; break;
			case 'NR': countryCode = 'NRU'; break; case 'NP': countryCode = 'NPL'; break; case 'NL': countryCode = 'NLD'; break;
			case 'AN': countryCode = 'ANT'; break; case 'NC': countryCode = 'NCL'; break; case 'NZ': countryCode = 'NZL'; break;
			case 'NI': countryCode = 'NIC'; break; case 'NE': countryCode = 'NER'; break; case 'NG': countryCode = 'NGA'; break;
			case 'NU': countryCode = 'NIU'; break; case 'NF': countryCode = 'NFK'; break; case 'MP': countryCode = 'MNP'; break;
			case 'NO': countryCode = 'NOR'; break; case 'OM': countryCode = 'OMN'; break; case 'PK': countryCode = 'PAK'; break;
			case 'PW': countryCode = 'PLW'; break; case 'PS': countryCode = 'PSE'; break; case 'PA': countryCode = 'PAN'; break;
			case 'PG': countryCode = 'PNG'; break; case 'PY': countryCode = 'PRY'; break; case 'PE': countryCode = 'PER'; break;
			case 'PH': countryCode = 'PHL'; break; case 'PN': countryCode = 'PCN'; break; case 'PL': countryCode = 'POL'; break;
			case 'PT': countryCode = 'PRT'; break; case 'PR': countryCode = 'PRI'; break; case 'QA': countryCode = 'QAT'; break;
			case 'RE': countryCode = 'REU'; break; case 'RO': countryCode = 'ROU'; break; case 'RU': countryCode = 'RUS'; break;
			case 'RW': countryCode = 'RWA'; break; case 'BL': countryCode = 'BLM'; break; case 'SH': countryCode = 'SHN'; break;
			case 'KN': countryCode = 'KNA'; break; case 'LC': countryCode = 'LCA'; break; case 'MF': countryCode = 'MAF'; break;
			case 'PM': countryCode = 'SPM'; break; case 'VC': countryCode = 'VCT'; break; case 'WS': countryCode = 'WSM'; break;
			case 'SM': countryCode = 'SMR'; break; case 'ST': countryCode = 'STP'; break; case 'SA': countryCode = 'SAU'; break;
			case 'SN': countryCode = 'SEN'; break; case 'RS': countryCode = 'SRB'; break; case 'SC': countryCode = 'SYC'; break;
			case 'SL': countryCode = 'SLE'; break; case 'SG': countryCode = 'SGP'; break; case 'SK': countryCode = 'SVK'; break;
			case 'SI': countryCode = 'SVN'; break; case 'SB': countryCode = 'SLB'; break; case 'SO': countryCode = 'SOM'; break;
			case 'ZA': countryCode = 'ZAF'; break; case 'GS': countryCode = 'SGS'; break; case 'SS': countryCode = 'SSD'; break;
			case 'ES': countryCode = 'ESP'; break; case 'LK': countryCode = 'LKA'; break; case 'SD': countryCode = 'SDN'; break;
			case 'SR': countryCode = 'SUR'; break; case 'SJ': countryCode = 'SJM'; break; case 'SZ': countryCode = 'SWZ'; break;
			case 'SE': countryCode = 'SWE'; break; case 'CH': countryCode = 'CHE'; break; case 'SY': countryCode = 'SYR'; break;
			case 'TW': countryCode = 'TWN'; break; case 'TJ': countryCode = 'TJK'; break; case 'TZ': countryCode = 'TZA'; break;
			case 'TH': countryCode = 'THA'; break; case 'TL': countryCode = 'TLS'; break; case 'TG': countryCode = 'TGO'; break;
			case 'TK': countryCode = 'TKL'; break; case 'TO': countryCode = 'TON'; break; case 'TT': countryCode = 'TTO'; break;
			case 'TN': countryCode = 'TUN'; break; case 'TR': countryCode = 'TUR'; break; case 'TM': countryCode = 'TKM'; break;
			case 'TC': countryCode = 'TCA'; break; case 'TV': countryCode = 'TUV'; break; case 'UG': countryCode = 'UGA'; break;
			case 'UA': countryCode = 'UKR'; break; case 'AE': countryCode = 'ARE'; break; case 'GB': countryCode = 'GBR'; break;
			case 'US': countryCode = 'USA'; break; case 'UM': countryCode = 'UMI'; break; case 'UY': countryCode = 'URY'; break;
			case 'UZ': countryCode = 'UZB'; break; case 'VU': countryCode = 'VUT'; break; case 'VE': countryCode = 'VEN'; break;
			case 'VN': countryCode = 'VNM'; break; case 'VI': countryCode = 'VIR'; break; case 'WF': countryCode = 'WLF'; break;
			case 'EH': countryCode = 'ESH'; break; case 'YE': countryCode = 'YEM'; break; case 'ZM': countryCode = 'ZMB'; break;
			case 'ZW': countryCode = 'ZWE'; break; case 'XK': countryCode = 'XKX'; break;
		}
		const proxyUrl = 'https://proxy.cors.sh/';
		const targetUrl = `https://api.ambeedata.com/disasters/latest/by-country-code?countryCode=${countryCode}&limit=10&page=1`;
		const response = await fetch(`${proxyUrl}${targetUrl}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-cors-api-key': 'temp_926ec718593f306b641bb1f09a4a203b',
				'x-api-key': '44a116d525bd4f6d1e8fb69870e74616e3006cb3e9cabfbf12b78e5c29db1a49'
			},
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();

		if (data.message === 'Data not available!' || !data.result || data.result.length === 0) {
			return `There are no currently reported alerts for your location (${countryCode})`;
		}

		const alerts = data.result;
		const alertDetails = alerts.map(alert => {
			let alertType = alert.event_type;
			switch (alertType) {
				case 'EQ': alertType = 'Earthquake'; break;
				case 'TC': alertType = 'Tropical Cyclone'; break;
				case 'WF': alertType = 'Wildfire'; break;
				case 'FL': alertType = 'Flood'; break;
				case 'ET': alertType = 'Extreme Temperature'; break;
				case 'DR': alertType = 'Drought'; break;
				case 'SW': alertType = 'Severe Weather'; break;
				case 'SI': alertType = 'Sea ice'; break;
				case 'VO': alertType = 'Volcano'; break;
				case 'LS': alertType = 'Landslide'; break;
				case 'TN': alertType = 'Tsunami'; break;
				case 'Misc': alertType = 'Miscellaneous'; break;
			}

			let alertLocation = alert.event_name;
			alertLocation = alertLocation.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

			let alertDate = alert.date;
			let alertLatitude = alert.lat;
			let alertLongitude = alert.lng;

			return `
				Location: ${alertLocation}<br>
				Alert Type: ${alertType}<br>
				Date: ${alertDate}<br>
				Latitude: ${alertLatitude}<br>
				Longitude: ${alertLongitude}<br>
				Map:<br>
				<iframe src="https://maps.google.com/maps?q=${alertLatitude},${alertLongitude}&hl=en;z=5&amp;output=embed" width="300" height="200" frameborder="0" style="border:0;" allowfullscreen="" loading="lazy" aria-hidden="false" tabindex="0"></iframe><br>
			`;
		}).join('<br>');

		return `Here are the currently reported alerts for your location (Showing only up to 10 results in your location - ${countryCode}):<br><br>${alertDetails}`;
	} catch (error) {
		console.error('Error in getDisasterAlerts:', error);
		throw error;
	}
}



// function to convert currencies
async function convertCurrency(amount, fromCurrency, toCurrency) {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency.toLowerCase()}.json`;
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const exchangeRate = jsonData[fromCurrency.toLowerCase()][toCurrency.toLowerCase()];
		if (!exchangeRate) {
			throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
		}
		let convertedAmount = (amount * exchangeRate).toFixed(2);
		// format the amount to have commas
		amount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		convertedAmount = convertedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
	} catch (error) {
		console.error('Error in convertCurrency:', error);
		throw error;
	}
}



// Function to get and display system information
async function getSystemInfo() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching system information... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const systemInfo = await invoke('get_system_info');
		console.log('System info received:', systemInfo);

		const { total_memory, used_memory, long_os_version, host_name, cpu_brand, nb_cpus, cpu_arch, cpu_usage, last_booted_time, system_uptime, disks, networks } = systemInfo;

		const totalMemory = (total_memory / 1024 / 1024 / 1024).toFixed(1); // in GB
		const usedMemory = (used_memory / 1024 / 1024 / 1024).toFixed(1); // in GB
		const longOSName = long_os_version;
		const deviceName = host_name;
		const cpuBrand = cpu_brand;
		const cpuCores = nb_cpus;
		const cpuArch = cpu_arch;
		const cpuUsage = (cpu_usage).toFixed(1);
		const lastBootedTime = (new Date(last_booted_time * 1000)).toLocaleString();
		const uptime = `${String(Math.floor(system_uptime / 86400)).padStart(2, '0')}:${String(Math.floor((system_uptime % 86400) / 3600)).padStart(2, '0')}:${String(Math.floor((system_uptime % 3600) / 60)).padStart(2, '0')}:${String(system_uptime % 60).padStart(2, '0')}`;
		const disksInfo = disks.map(disk =>
			`- Mount Point: ${disk.disk_letter} | Name: ${disk.disk_name} | File System: ${disk.file_system} | Storage: Used ${(disk.used_storage / 1024 / 1024 / 1024).toFixed(1)} GB out of ${(disk.total_storage / 1024 / 1024 / 1024).toFixed(1)} GB`
		).join('<br>');
		const disksInfoTable = disks.map(disk =>
			`<tr>
				<td>${disk.disk_letter}</td>
				<td>${disk.disk_name}</td>
				<td>${disk.file_system}</td>
				<td>Used ${(disk.used_storage / 1024 / 1024 / 1024).toFixed(1)} (${(disk.used_storage / disk.total_storage * 100).toFixed(1)}%) GB out of ${(disk.total_storage / 1024 / 1024 / 1024).toFixed(1)} GB</td>
			</tr>`
		).join('');

		const networksInfo = networks.map(network =>
			`- ${network.interface_name}`
		).join('<br>');

		console.log('Device Name: ' + deviceName + '\nOperating System: ' + longOSName + '\nBooted Time: ' + lastBootedTime + '\nUptime: ' + uptime);
		console.log('Processor: ' + cpuBrand + '\nCPU Architecture: ' + cpuArch + '\nCPU Cores: ' + cpuCores + '\nCPU Usage: ' + cpuUsage + '%');
		console.log('Memory:\n- Used ' + usedMemory + ' GB (' + ((usedMemory / totalMemory) * 100).toFixed(0) + '%) out of ' + totalMemory + ' GB');
		console.log('Disks:\n' + (disksInfo.replace(/<br>/g, '\n\n')).replace(/[|]/g, '\n-'));
		console.log('Networks:\n' + networksInfo.replace(/<br>/g, '\n'));

		const response = `
			<p style="margin-bottom: 5px;">Here's your system information at a glance:</p><br>
			<h1>${deviceName}</h1><br>

			<h3>Operating System:</h3>
			<p>- ${longOSName}</p>

			<h3>Last Booted Time:</h3>
			<p>- ${lastBootedTime}</p>

			<h3>Uptime:</h3>
			<p>- ${uptime}</p><br>

			<h3>Processor:</h3>
			<p>- ${cpuBrand}</p>

			<h3>CPU Architecture:</h3>
			<p>- ${cpuArch}</p>

			<h3>CPU Cores:</h3>
			<p>- ${cpuCores}</p>

			<h3>CPU Usage:</h3>
			<p>- ${cpuUsage}%</p><br>

			<h3>Memory:</h3>
			<p>- ${usedMemory} GB (${((usedMemory / totalMemory) * 100).toFixed(0)}%) used out of ${totalMemory} GB</p><br>

			<h3>Disks:</h3>
			<table>
				<thead>
					<tr>
						<th>Mount Point</th>
						<th>Name</th>
						<th>File System</th>
						<th>Storage</th>
					</tr>
				</thead>
				<tbody>
					${disksInfoTable}
				</tbody>
			</table><br>

			<h3>Networks:</h3>
			<p>${networksInfo}</p>
		`;
		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${response}
			</div>
		`;

		scrolltoBottom();

		return { deviceName, longOSName, lastBootedTime, uptime, cpuBrand, cpuArch, cpuCores, cpuUsage, usedMemory, totalMemory, disksInfoTable, networksInfo };
	} catch (error) {
		console.error('Error getting system information:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't fetch system information.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to find the bug code details
function findBugCodeDetails(bugCode) {
	bugCode = bugCode.toUpperCase();
	bugCode = "0x" + bugCode;
	const bugCodeDetails = bugcodesData.find(bugcode => bugcode.code === bugCode);
	if (bugCodeDetails) {
		console.log('Bug Code Details:\n\n' + 'Code: ' + bugCodeDetails.code + '\n\n' + 'Code Name: ' + bugCodeDetails.code_name + '\n\n' + 'Description: ' + bugCodeDetails.description + '\n\n' + 'Solutions: \n' + bugCodeDetails.solutions.map(solution => `- ${solution}`).join('\n'));
		return bugCodeDetails;
	} else {
		console.log('Bug Code not found:', bugCode);
		return null;
	}
}



// function to send email
async function sendEmail() {
	try {
		chatMessage.setAttribute('disabled', true);
		chatFormVoiceBtn.disabled = true;
		chatFormSubmitBtn.disabled = true;

		const botResponseDiv = document.createElement('div');
		botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Enter the email details here:<br><br>
				<form id="emailForm">
					<label style="display: block; margin-bottom: 5px;" for="emailTo">To:</label>
					<input type="email" id="emailTo" name="emailTo" required><br><br>

					<label style="display: block; margin-bottom: 5px;" for="emailSubject">Subject:</label>
					<input type="text" id="emailSubject" name="emailSubject" required><br><br>

					<label style="display: block; margin-bottom: 5px;" for="emailBody">Body:</label>
					<input type="text" id="emailBody" name="emailBody" required><br><br>

					<button type="submit">Send Email</button>
					<button type="button" id="emailCloseBtn">Close Form</button><br><br>
				</form>
			</div>
		`;
		chatResponses.appendChild(botResponseDiv);

		document.getElementById('emailCloseBtn').addEventListener('click', () => {
			document.getElementById('emailForm').remove();
			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Email Form Closed
				</div>
			`;
			chatFormVoiceBtn.disabled = false;
			chatFormSubmitBtn.disabled = false;
			chatMessage.removeAttribute('disabled', false);
			chatMessage.focus();
		});

		scrolltoBottom();

		document.getElementById('emailTo').focus();

		emailForm.addEventListener('submit', async (event) => {
			event.preventDefault();

			const emailTo = emailForm.emailTo.value;
			const emailSubject = emailForm.emailSubject.value;
			const emailBody = emailForm.emailBody.value;

			const mailtolink = `mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}`;

			try {
				await window.__TAURI__.invoke('open_url', { url: mailtolink });

				botResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="bot-response">
						Opened email client. Please click send to send the email.
					</div>
				`;

				scrolltoBottom();

				alert('Opened email client. Please click send to send the email.');
				chatFormVoiceBtn.disabled = false;
				chatFormSubmitBtn.disabled = false;
				chatMessage.disabled = false;
			} catch (error) {
				console.error('Failed to send email:', error);

				botResponseDiv.remove();
				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				errorResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="error-response">
						Failed to send email. Please try again later.
					</div>
				`;
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();

				alert('Failed to send email. Please try again later.');
				chatFormVoiceBtn.disabled = false;
				chatFormSubmitBtn.disabled = false;
				chatMessage.disabled = false;
			}
		});
	} catch (error) {
		console.error('Error in sendEmail:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to send email. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		alert('Failed to send email. Please try again later.');
		chatFormVoiceBtn.disabled = false;
		chatFormSubmitBtn.disabled = false;
		userMessage.disabled = false;

		throw error;
	}
}



// function to search files
async function searchFile(searchTerms) {
	let botResponseDiv;

	try {
		chatMessage.setAttribute('disabled', true);
		chatFormVoiceBtn.disabled = true;
		chatFormSubmitBtn.disabled = true;
		const searchDisplay = `"${searchTerms}"`;

		const botResponseDiv = document.createElement('div');
		botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
					Searching for files matching ${searchDisplay} across all drives... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
				</span><br>
				This may take a while. Feel free to do something else in the meantime. I'll notify you when the search is complete.
			</div>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		let startTime = new Date().getTime();

		new Notification('File Search in Progress', {
			body: `Searching for files matching ${searchDisplay} across all drives... This may take a while. Do not close the app.`,
			icon: 'assets/images/icon.png'
		});

		const results = await window.__TAURI__.invoke('search_file', {
			searchTerms: searchTerms
		});

		let endTime = new Date().getTime();
		let searchTime = (endTime - startTime) / 1000;
		searchTime = searchTime.toFixed(0);

		if (searchTime > 60) {
			let minutes = Math.floor(searchTime / 60);
			let seconds = searchTime % 60;
			searchTime = `${minutes} minutes and ${seconds} seconds`;
		} else {
			searchTime = `${searchTime} seconds`;
		}

		chatFormVoiceBtn.disabled = false;
		chatFormSubmitBtn.disabled = false;
		chatMessage.disabled = false;

		if (results && results.length > 0) {
			console.log('File(s) found:', results);

			const formattedResults = results.map(result => {
				const filePath = result.path.replace(/\\/g, '\\\\');
				return `
					<p style="font-weight: 300; background: #333333; display: flex; align-items: center; padding: 10px; border-right: 1px solid var(--darkGray);">
						${result.path}
					</p>
					<button style="display: flex; align-items: center; justify-content: center;" onclick="window.__TAURI__.invoke('open_folder', { filePath: '${filePath}' })" title="Open Folder">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="14"  height="14"  viewBox="0 0 24 24"  fill="#A9A9A9"  class="icon icon-tabler icons-tabler-filled icon-tabler-folder"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" /></svg>
					</button>
				`;
			}).join('');

			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Found ${results.length} file(s) matching ${searchDisplay}:<br><br>
					<span style="display: grid; grid-template-columns: 95% auto; row-gap: 5px;">
						${formattedResults}
					</span><br>
					<p style="font-size: 10px;">Search took ${searchTime}</p>
				</div>
			`;

			scrolltoBottom();

			new Notification('File Search Finished', {
				body: `Found ${results.length} file(s) matching ${searchDisplay}. Search took ${searchTime}.`,
				icon: 'assets/images/icon.png'
			});
		} else {
			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					No matching files found for ${searchDisplay}<br><br>
					<p style="font-size: 10px;">Search took ${searchTime}</p>
				</div>
			`;

			scrolltoBottom();

			new Notification('File Search Finished', {
				body: `No matching files found for ${searchDisplay}. Search took ${searchTime}.`,
				icon: 'assets/images/icon.png'
			});
		}
	} catch (error) {
		chatFormVoiceBtn.disabled = false;
		chatFormSubmitBtn.disabled = false;
		chatMessage.disabled = false;
		console.error('Error searching for files:', error);

		if (botResponseDiv) {
			botResponseDiv.remove();
		}

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				An error occurred while searching: ${error}
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		new Notification('File Search Error', {
			body: `An error occurred while searching for files.`,
			icon: 'assets/images/icon.png'
		});
	}
}



// function to switch to light mode
async function switchToLight() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Switching to Light Mode... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await invoke('set_light_mode');
		console.log('Switched to light mode');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Switched to Light Mode successfully!
			</div>
		`;

		scrolltoBottom();
	} catch (error) {
		console.error('Failed to switch to light mode:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to switch to light mode. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to switch to dark mode
async function switchToDark() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Switching to Dark Mode... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await invoke('set_dark_mode');
		console.log('Switched to dark mode');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Switched to Dark Mode successfully!
			</div>
		`;

		scrolltoBottom();
	} catch (error) {
		console.error('Failed to switch to dark mode:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Failed to switch to dark mode. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}



// function to take a screenshot
async function takeScreenshot() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Taking a screenshot... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const screenshot = await invoke('take_screenshot');
		console.log('Screenshot taken:', screenshot);

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Screenshot successfully saved to Desktop!
			</div>
		`;

		scrolltoBottom();

		return screenshot;
	} catch (error) {
		console.error('Failed to take screenshot:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't take a screenshot. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}



// function to change wallpaper
async function changeWallpaper(category) {
	try {
		const response = await fetch(`https://api.unsplash.com/photos/random?query=${category}&count=1&orientation=landscape&client_id=aXEHFMJhuEQoof-Sm66CGSaq41BYMrH_LwBTL1XRiwY`);
		const data = await response.json();
		const wallpaper = data[0].urls.raw + '&dpr=2';
		const imagePath = wallpaper;

		new Notification('Downloading Wallpaper', {
			body: 'Please wait while the wallpaper is downloaded and set as your desktop background...',
			icon: 'assets/images/icon.png'
		});

		await invoke('change_wallpaper', { imagePath: imagePath });
		console.log('Wallpaper changed', wallpaper);

		new Notification('Wallpaper Changed', {
			body: 'Wallpaper changed successfully. Enjoy your new wallpaper ;)',
			icon: 'assets/images/icon.png'
		});
	} catch (error) {
		console.error('Failed to change wallpaper:', error);

		new Notification('Failed to Change Wallpaper', {
			body: 'Failed to change wallpaper. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}



// function to shutdown the system
async function shutdown_pc() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				PC is shutting down... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await invoke('shutdown_pc');
		console.log('System shutdown initiated');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				PC is turned off...
			</div>
		`;

		new Notification('System Shutdown Initiated', {
			body: 'Your system will be shutting down in 10 seconds...',
			icon: 'assets/images/icon.png'
		});
	} catch (error) {
		console.error('Failed to shutdown system:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't shutdown the system. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		new Notification('Failed to Shutdown System', {
			body: 'Failed to shutdown system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to restart the system
async function restart_pc() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				PC is restarting... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await invoke('restart_pc');
		console.log('System restart initiated');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				PC is restarting...
			</div>
		`;

		new Notification('System Restart Initiated', {
			body: 'Your system will be restarting in 10 seconds...',
			icon: 'assets/images/icon.png'
		});
	} catch (error) {
		console.error('Failed to restart system:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't restart the system. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		new Notification('Failed to Restart System', {
			body: 'Failed to restart system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to log off the system
async function lock_pc() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Locking the PC... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await invoke('lock_pc');
		console.log('System lock initiated');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				PC is locked...
			</div>
		`;

		new Notification('System Lock Initiated', {
			body: 'Your system is locked!',
			icon: 'assets/images/icon.png'
		});
	} catch (error) {
		console.error('Failed to lock system:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't lock the system. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		new Notification('Failed to Lock System', {
			body: 'Failed to lock system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to sleep the system
async function sleep_pc() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Putting the PC to sleep... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		await invoke('sleep_pc');
		console.log('System sleep initiated');

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				PC is slept...
			</div>
		`;

		new Notification('System Sleep Initiated', {
			body: 'Your system will be going to sleep in moments...',
			icon: 'assets/images/icon.png'
		});
	} catch (error) {
		console.error('Failed to sleep system:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't sleep the system. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		new Notification('Failed to Sleep System', {
			body: 'Failed to sleep system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}



// Function to get crisis hotlines
async function getCrisisHotlines() {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';

	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Fetching crisis hotlines... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		const { country } = await getIPAddressForFunctions();
		const hotlineData = crisisHotlinesData.find(hotline => hotline["alpha-2"] === country);

		if (hotlineData) {
			let hotlinesText = `Here are some hotlines in ${hotlineData["country"]}, to seek help in a crisis:<br>`;
			hotlineData["hotlines"].forEach(hotline => {
				const numbers = hotline.numbers.join(', ');
				hotlinesText += `
					<br><h3>${hotline.name}</h3>
					<p style="font-weight: 300;">${numbers}</p>
				`;
			});

			const response = hotlinesText;

			console.log(hotlinesText);

			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					${response}
				</div>
			`;

			scrolltoBottom();

			return hotlineData;
		} else {
			console.log(`No hotlines found for ${country}`);

			botResponseDiv.remove();
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Please call 911 or your local emergency number for immediate help.
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();

			return null;
		}
	} catch (error) {
		console.error('Error in getCrisisHotlines:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't find any hotlines for immediate help. Please call 911 or your local emergency number for immediate help.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to set a timer
async function setTimer(time) {
	try {
		const timer = time.split(' ');
		const duration = parseInt(timer[0]);

		if (isNaN(duration)) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Sorry, I couldn't set the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		} else if (duration <= 0) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Please enter a valid duration for the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		}

		const unit = timer[1].toLowerCase();
		const timeInMs = convertToMilliseconds(duration, unit);

		if (timeInMs === 0) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Please enter a valid unit for the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		} else if (timeInMs > 86400000) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Please enter a duration less than or equal to 24 hours.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		}

		console.log(`Timer: ${duration} ${unit} timer has started!`);

		const timerResponseDiv = document.createElement('div');
		timerResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		timerResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${duration} ${unit} timer has started!
			</div>
		`;
		chatResponses.appendChild(timerResponseDiv);

		scrolltoBottom();

		let remainingTime = timeInMs;

		const interval = setInterval(() => {
			remainingTime -= 1000;
			timerResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					${Math.floor(remainingTime / 1000)} seconds remaining...
				</div>
			`;
			console.log(`Timer: ${Math.floor(remainingTime / 1000)} seconds remaining...`);
			if (remainingTime <= 0) {
				clearInterval(interval);
			}
		}, 1000);

		await new Promise(resolve => setTimeout(resolve, timeInMs));

		console.log(`${duration} ${unit} timer has completed!`);
		timerResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				${duration} ${unit} timer has completed!
			</div>
		`;

		scrolltoBottom();

		new Notification('Timer Completed!', {
			body: `${duration} ${unit} timer has completed!`,
			sound: 'Default'
		});
	} catch (error) {
		console.error('Failed to set timer:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't set the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

function convertToMilliseconds(duration, unit) {
	let timeInMs = 0;
	switch (unit) {
		case 'second': timeInMs = duration * 1000; break;
		case 'seconds': timeInMs = duration * 1000; break;
		case 'minute': timeInMs = duration * 60000; break;
		case 'minutes': timeInMs = duration * 60000; break;
		case 'hour': timeInMs = duration * 3600000; break;
		case 'hours': timeInMs = duration * 3600000; break;
		case 'day': timeInMs = duration * 86400000; break;
		case 'days': timeInMs = duration * 86400000; break;
		default: timeInMs = 0;
	}
	return timeInMs;
}



// function to summarize text
async function textSummarizer(inputText) {
	try {
		const summary = Summarizer.summarize(inputText);
		return summary;
	} catch (error) {
		console.error('Failed to summarize text:', error);
		throw error;
	}
}



// function to play rock paper scissors
async function playRockPaperScissors(userMessage) {
	let resultComment = '';
	choices = ['Rock', 'Paper', 'Scissors'];

	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			Let's play rock, paper, scissors!
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		let player_choice = userMessage.toLowerCase().trim();

		if (player_choice.includes('rock')) {
			player_choice = 'Rock';
		} else if (player_choice.includes('paper')) {
			player_choice = 'Paper';
		} else if (player_choice.includes('scissors')) {
			player_choice = 'Scissors';
		} else {
			player_choice = choices[Math.floor(Math.random() * choices.length)];
		}

		let computer_choice = choices[Math.floor(Math.random() * choices.length)];

		let result = '';
		if (player_choice === computer_choice) {
			result = 'it\'s a tie';
			resultComment = `We both chose ${player_choice}`;
		} else if (player_choice === 'Rock' && computer_choice === 'Paper') {
			result = 'you lose';
			resultComment = `Paper covers Rock`;
		} else if (player_choice === 'Rock' && computer_choice === 'Scissors') {
			result = 'you win';
			resultComment = `Rock crushes Scissors`;
		} else if (player_choice === 'Paper' && computer_choice === 'Rock') {
			result = 'you win';
			resultComment = `Paper covers Rock`;
		} else if (player_choice === 'Paper' && computer_choice === 'Scissors') {
			result = 'you lose';
			resultComment = `Scissors cut Paper`;
		} else if (player_choice === 'Scissors' && computer_choice === 'Rock') {
			result = 'you lose';
			resultComment = `Rock crushes Scissors`;
		} else if (player_choice === 'Scissors' && computer_choice === 'Paper') {
			result = 'you win';
			resultComment = `Scissors cut Paper`;
		}

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				I chose ${computer_choice}!<br><br>${resultComment}, so <span style="font-weight: bold;">${result}</span>!
			</div>
		`;

		scrolltoBottom();
	} catch (error) {
		console.error('Failed to play rock paper scissors:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't play rock paper scissors. Please try again.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



async function wakeUpAlarm(wakeUpTime) {
	if (wakeUpTime === "") {
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Please provide a time to wake up.<br>Hint: wake me up at 9:00 AM
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);
		return;
	}

	// Check if time includes AM/PM
	const isAM = wakeUpTime.toLowerCase().includes('am');
	const isPM = wakeUpTime.toLowerCase().includes('pm');

	// Remove AM/PM and trim
	wakeUpTime = wakeUpTime.replace(/(am|pm)/i, '').trim();
	const wakeUpTimeArray = wakeUpTime.split(':');

	if (wakeUpTimeArray.length !== 2) {
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Please provide time in HH:MM format.<br>Hint: wake me up at 9:00 AM
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);
		return;
	}

	let wakeUpHour = parseInt(wakeUpTimeArray[0]);
	let wakeUpMinute = parseInt(wakeUpTimeArray[1]);

	// Convert 12-hour format to 24-hour format
	if (isPM && wakeUpHour < 12) wakeUpHour += 12;
	if (isAM && wakeUpHour === 12) wakeUpHour = 0;

	// Validate hours and minutes
	if (wakeUpHour < 0 || wakeUpHour > 23 || wakeUpMinute < 0 || wakeUpMinute > 59 || isNaN(wakeUpHour) || isNaN(wakeUpMinute)) {
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Please provide a valid time to wake up.<br>Hint: wake me up at 9:00 AM
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);
		return; // Exit function if invalid time
	}

	try {
		const now = new Date();
		const alarmTime = new Date();

		alarmTime.setHours(wakeUpHour);
		alarmTime.setMinutes(wakeUpMinute);
		alarmTime.setSeconds(0);

		// If alarm time has already passed today, set it for tomorrow
		if (alarmTime < now) {
			alarmTime.setDate(alarmTime.getDate() + 1);
		}

		// Format display time
		const displayHour = wakeUpHour % 12 || 12;
		const ampm = wakeUpHour >= 12 ? 'PM' : 'AM';
		const displayTime = `${displayHour}:${wakeUpMinute.toString().padStart(2, '0')} ${ampm}`;

		const botResponseDiv = document.createElement('div');
		botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				Wake up alarm successfully set! I'll wake you up at <span style="font-weight: bold;">${displayTime}</span>!
			</div>
		`;
		chatResponses.appendChild(botResponseDiv);

		new Notification('Wake Up Alarm Set!', {
			body: `Wake up alarm successfully set at ${displayTime}!`,
			silent: 'Default',
		});

		const timeUntilAlarm = alarmTime - now;

		setTimeout(() => {
			// Create and play alarm sound
			const audio = new Audio('assets/sounds/alarms/alarm6.mp3');
			audio.loop = true;
			audio.play();

			// Create notification
			new Notification('Wake Up!', {
				body: `Time to wake up! It's ${displayTime} now!`,
				silent: true,
			});

			// Create stop alarm indicator
			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					Time to wake up! It's <span style="font-weight: bold;">${displayTime}</span> now!<br><br>
					<button id="stopAlarm">Stop Alarm</button>
				</div>
			`;

			scrolltoBottom();

			// Add click event to stop button
			document.getElementById('stopAlarm').addEventListener('click', () => {
				audio.pause();
				audio.currentTime = 0;
				botResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="bot-response">
						Wake up alarm stopped!
					</div>
				`;
			});

			// Auto stop after 1 minute if not stopped manually
			setTimeout(() => {
				if (document.getElementById('stopAlarm')) {
					audio.pause();
					audio.currentTime = 0;
					botResponseDiv.innerHTML = `
						${botChatAvatarHTML}
						<div class="bot-response">
							Wake up alarm stopped!
						</div>
					`;
				}
			}, 60000);
		}, timeUntilAlarm);

		scrolltoBottom();
	} catch (error) {
		console.error('Failed to set wake up alarm:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't set the wake up alarm. Please try again.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		throw error;
	}
}



// function to define a word
async function defineWord(word) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Finding definitions for "${word}"... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		// Find the letter group containing the word
		const letterGroup = dictionaryData.find(group =>
			group.letter.toLowerCase() === word[0].toLowerCase()
		);

		if (!letterGroup) {
			console.warn(`No letter group found for the word ${word}`);

			botResponseDiv.remove();
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Sorry, the word <span style="font-weight: bold;">"${word}"</span> is not a valid word. Please enter a word that starts with A - Z
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return null;
		}

		// Find the word in the letter group
		const wordData = letterGroup.words.find(w =>
			w.word.toLowerCase() === word.toLowerCase()
		);

		if (wordData) {
			if (!wordData.definitions || wordData.definitions.length === 0 || wordData.definitions.includes(null)) {
				console.warn(`No definitions found for the word ${word}`);

				botResponseDiv.remove();
				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				errorResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="error-response">
						Sorry, I couldn't find any definitions for the word <span style="font-weight: bold;">"${wordData.word}"</span>
					</div>
				`;
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();
				return null;
			}

			let definitions = '';
			wordData.definitions.forEach((definition) => {
				if (definition) {
					definitions += `<p>- ${definition}</p>`;
				}
			});

			// If no valid definitions were found after filtering
			if (!definitions) {
				console.warn(`No definitions found for the word ${word}`);

				botResponseDiv.remove();
				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
				errorResponseDiv.innerHTML = `
					${botChatAvatarHTML}
					<div class="error-response">
						Sorry, I couldn't find any definitions for the word <span style="font-weight: bold;">"${word}"</span>
					</div>
				`;
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();
				return null;
			}

			botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			botResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="bot-response">
					<h2>Definitions found for the word "${wordData.word}":</h2><br>
					<div style="display: flex; flex-direction: column; gap: 5px;">
						${definitions}
					</div>
				</div>
			`;

			scrolltoBottom();
			return wordData;
		} else {
			console.warn(`${word} is not included in the dictionary`);

			botResponseDiv.remove();
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
			errorResponseDiv.innerHTML = `
				${botChatAvatarHTML}
				<div class="error-response">
					Sorry, the word <span style="font-weight: bold;">"${word}"</span> is not included in my dictionary. Please try another word
				</div>
			`;
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return null;
		}
	} catch (error) {
		console.error('Error in defineWord:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't find any definitions for the word <span style="font-weight: bold;">"${word}"</span>
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
		throw error;
	}
}



// function for ocr text extraction
async function extractTextFromImage(imageData) {
	const botResponseDiv = document.createElement('div');
	botResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
	botResponseDiv.innerHTML = `
		${botChatAvatarHTML}
		<div class="bot-response">
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Extracting text from image... <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		</div>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	try {
		// Create worker and load language data
		const worker = await Tesseract.createWorker();
		await worker.loadLanguage('eng');
		await worker.initialize('eng');

		// Recognize text from image
		imageData = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageData)}`;
		const { data: { text } } = await worker.recognize(imageData);

		// Terminate worker after recognition
		await worker.terminate();

		console.log('Extracted text from image:', text);

		botResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="bot-response">
				<h2>Extracted text from the image:</h2><br>
				<p>${text}</p>
			</div>
		`;

		scrolltoBottom();
		return text;

	} catch (error) {
		console.error('Failed to extract text from image:', error);

		botResponseDiv.remove();
		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.style = 'width: 100%; display: flex; flex-direction: row; justify-content: space-between;';
		errorResponseDiv.innerHTML = `
			${botChatAvatarHTML}
			<div class="error-response">
				Sorry, I couldn't extract text from the image. Please try again later.
			</div>
		`;
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
		throw error;
	}
}




// function to scroll to bottom of chat
function scrolltoBottom() {
	const chatResponsesContainer = document.getElementById('chatResponsesContainer');
	chatResponsesContainer.scrollTo({
		top: chatResponsesContainer.scrollHeight,
		behavior: 'smooth'
	});

	console.log('Scrolled to bottom of chat');
}