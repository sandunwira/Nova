const { appWindow, WebviewWindow } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.tauri;


let bugcodesData = [];
let crisisHotlinesData = [];

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


const chatForm = document.getElementById('chatForm');
const chatMessage = document.getElementById('chatMessage');
const botResponse = document.getElementById('botResponse');
const chatFormSubmitBtn = document.getElementById('chatFormSubmitBtn');
const chatResponses = document.getElementById('chatResponses');


document.addEventListener('DOMContentLoaded', async function () {
	chatMessage.focus();

	// Time-based greetings
	const date = new Date();
	const hours = date.getHours();
	let greeting = "Hello";
	if (hours >= 0 && hours < 12) {
		greeting = "Good Morning! 🌤️";
	} else if (hours >= 12 && hours < 18) {
		greeting = "Good Afternoon! 🌞";
	} else {
		greeting = "Good Evening! 🌙";
	}

	new Notification(`${greeting}`, {
		body: 'Ask me anything and I will try my best to help you out ;)',
		sound: 'Default'
	});

	// weather notification
	setTimeout(() => {
		getWeather().then(({ location, weatherComment, temperature }) => {
			new Notification(`${temperature} in ${location}`, {
				body: weatherComment,
				sound: 'Default'
			});
		}).catch(error => {
			console.error('Error in getting weather:', error);
		});
	}, 60000);


	try {
		const assistant = new Assistant();
		await assistant.initialize();

		chatForm.addEventListener('submit', async function (event) {
			event.preventDefault();

			const userResponse = document.createElement('div');
			userResponse.className = 'user-response';
			userResponse.innerHTML = 'User: ' + chatMessage.value.trim();
			chatResponses.appendChild(userResponse);

			const userMessage = chatMessage.value.trim();

			try {
				if (userMessage.toLowerCase().startsWith("set a timer for")) {
					const time = userMessage.replace("set a timer for", "").trim();
					setTimer(time);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("visit") || userMessage.toLowerCase().includes("go to")) {
					const url = userMessage.replace("visit", "").replace("go to", "").trim();
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = "Nova: Opening " + url + "...";
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					openURL(url).then(() => {
						botResponseDiv.innerHTML = `Nova: Opened <a href="https://${url}" target="_blank">https://${url}</a> successfully. Enjoy!`;

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Nova: Sorry, I couldn't open the URL.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.startsWith("open") || userMessage.startsWith("launch") || userMessage.startsWith("run") || userMessage.startsWith("start") || userMessage.startsWith("execute")) {
					const appName = userMessage.replace('open', '').trim().replace('launch', '').trim().replace('run', '').trim().replace('start', '').trim().replace('execute', '').trim();
					openApplication(appName);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("search")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Searching the web... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					searchWeb(userMessage).then(({snippetText, search_status}) => {
						if (search_status === 'success') {
							botResponseDiv.innerHTML = `
								Nova: Here's what i've found in web:<br><br>
								${snippetText}<br><br>
								<p style="font-size: 10px;">Powered by <a href="https://duckduckgo.com" target="_blank">DuckDuckGo</a></p>
							`;
						} else if (search_status === 'no_results' || search_status === 'no_snippet') {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.textContent = "Sorry, I couldn't find any relevant information. Please try again in a bit or try a different search query.";
							chatResponses.appendChild(errorResponseDiv);
						}

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'error-response';
						botResponseDiv.innerHTML = "Nova: Sorry, I couldn't find any relevant information. Please try again in a bit or try a different search query.";
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("random movie") || userMessage.toLowerCase().includes("movie recommendation") || userMessage.toLowerCase().includes("suggest me a movie") || userMessage.toLowerCase().includes("suggest a movie")) {
					getRandomMovie();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("ip address")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching your IP Address... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getIPAddress().then(({ ipaddress }) => {
						botResponseDiv.innerHTML = `
							<p style="margin-bottom: 5px;">Nova: Your IP Address is:</p>
							<h1>${ipaddress}</h1>
						`;

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Nova: Sorry, I couldn't fetch your IP Address.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("weather")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching the weather... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getWeather().then(({ location, weatherComment, temperature, humidity, windSpeed }) => {
						const response = `
							<p style="margin-bottom: 5px;">Nova: Here are the weather information for ${location}:</p><br>
							<h1>${temperature} in ${location}</h1><br>
							<h3>Humidity:</h3><p>${humidity}</p><br>
							<h3>Wind Speed:</h3><p>${windSpeed}</p><br>
							<p style="color: var(--lightGray); font-weight: 300; font-style: oblique;">${weatherComment}</p>
							<br><p style="font-size: 10px;">Powered by <a href="https://openweathermap.org" target="_blank">OpenWeatherMap</a></p>
						`;
						botResponseDiv.innerHTML = response;

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Nova: Sorry, I couldn't fetch the weather.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("time") || userMessage.toLowerCase().includes("clock") || userMessage.toLowerCase().includes("current time") || userMessage.toLowerCase().includes("what's the time") || userMessage.toLowerCase().includes("what time is it") || userMessage.toLowerCase().includes("tell me the time")) {
					const timeResponse = document.createElement('div');
					timeResponse.className = 'bot-response';
					timeResponse.innerHTML = `
						<p style="margin-bottom: 5px;">Nova: Current time is:</p>
						<h1>${getTime()}</h1>
					`;
					chatResponses.appendChild(timeResponse);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("date") || userMessage.toLowerCase().includes("today's date") || userMessage.toLowerCase().includes("what's the date") || userMessage.toLowerCase().includes("tell me the date") || userMessage.toLowerCase().includes("what date is it") || userMessage.toLowerCase().includes("what's today's date")) {
					const { day, month, year } = getDate();
					const response = `
						<p style="margin-bottom: 5px;">Nova: Today's date is:</p>
						<h1>${month} ${day}, ${year}</h1>
					`;
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = response;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("calc") || userMessage.toLowerCase().includes("calculate") || userMessage.toLowerCase().includes("calculator") || userMessage.toLowerCase().includes("math")) {
					const expression = userMessage.replace("calc", "").replace("calculate", "").replace("calculator", "").replace("math", "").trim();
					const result = calculateNumbers(expression);
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<p style="margin-bottom: 5px;">Nova: The answer of ${expression} is:</p>
						<h1>${result}</h1>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("news") || userMessage.toLowerCase().includes("headlines") || userMessage.toLowerCase().includes("latest news") || userMessage.toLowerCase().includes("news headlines")) {
					const newsResponseDiv = document.createElement('div');
					newsResponseDiv.className = 'bot-response';
					newsResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching the latest news... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(newsResponseDiv);

					scrolltoBottom();

					fetchNews().then(newsItems => {
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
						newsResponseDiv.innerHTML = 'Nova: ' + newsText;
					}).catch(() => {
						newsResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't fetch the latest news.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("iotd") || userMessage.toLowerCase().includes("image of the day") || userMessage.toLowerCase().includes("bing image") || userMessage.toLowerCase().includes("bing wallpaper")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching the image of the day... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getImageOfTheDay().then(({ imageTitle, imageUrl, imageCredits }) => {
						botResponseDiv.innerHTML = `
							Nova: Here's the image of the day:<br><br>
							<h1>${imageTitle}</h1>
							<img src="${imageUrl}" alt="${imageTitle}" style="margin: 10px 0px 5px 0px;">
							<br><p style="font-size: 10px;">Powered by <a href="https://www.bing.com" target="_blank">Bing</a> | Image Credits: ${imageCredits}</p>
						`;

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Nova: Sorry, I couldn't fetch the image of the day.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("qotd") || userMessage.toLowerCase().includes("quote of the day") || userMessage.toLowerCase().includes("inspirational quote") || userMessage.toLowerCase().includes("motivational quote")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching the quote of the day... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getQuoteOfTheDay().then(({ quote, author }) => {
						botResponseDiv.innerHTML = `
							Nova: Quote of the day is:<br><br>
							<h1>${quote}</h1>
							<p style="margin-top: 5px;">- ${author}</p>
						`;

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Nova: Sorry, I couldn't fetch the quote of the day.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("random quote") || userMessage.toLowerCase().includes("quote")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching a random quote... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getRandomQuote().then(({ quote, author }) => {
						botResponseDiv.innerHTML = `
							Nova: Here's a quote I found for you:<br><br>
							<h1>${quote}</h1>
							<p style="margin-top: 5px;">- ${author}</p>
						`;

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Nova: Sorry, I couldn't fetch a random quote.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("on this day") || userMessage.toLowerCase().includes("on this day events") || userMessage.toLowerCase().includes("on this day in history") || userMessage.toLowerCase().includes("on this day facts")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching on this day events... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getOnThisDayEvents().then(events => {
						const { day, month } = getDate();

						let eventsText = `Here are some interesting events that happened on ${month} ${day} in history:<br>`;
						events.forEach((event) => {
							eventsText += `<p style="margin-top: 20px;">${event}</p>`;
						});

						botResponseDiv.innerHTML = `Nova: ${eventsText}`;
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't fetch on this day events.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("meal") || userMessage.toLowerCase().includes("recipe") || userMessage.toLowerCase().includes("food") || userMessage.toLowerCase().includes("random meal") || userMessage.toLowerCase().includes("meal recipe") || userMessage.toLowerCase().includes("meal suggestion") || userMessage.toLowerCase().includes("meal recommendation")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching a random meal recipe... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getRandomMeal().then(mealDetails => {
						botResponseDiv.innerHTML = `Nova:<br><br> ${mealDetails}`;

						scrolltoBottom();
					}).catch(error => {
						console.error('Error fetching random meal recipe:', error);

						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Nova: Sorry, I couldn't fetch a random meal recipe.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("books about")) {
					const query = userMessage.replace("books about", "").trim();

					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Searching for books about ${query}... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					searchBooks(query).then(bookDetails => {
						botResponseDiv.innerHTML = `
							Nova: Here are books that I found for "${query}":<br><br>
							${bookDetails}
						`;
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't find any books about " + query + ".";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().startsWith("translate") && userMessage.toLowerCase().includes(" to ")) {
					const textToTranslate = userMessage.match(/translate (.+) to (.+)/i);
					if (textToTranslate && textToTranslate.length === 3) {
						const text = textToTranslate[1].trim();
						const targetLanguage = textToTranslate[2].trim();

						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = `
							<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
								Nova: Translating the text... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
							</span>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();

						translateText(text, targetLanguage).then(translatedText => {
							botResponseDiv.innerHTML = `
								<p style="margin-bottom: 5px;">Nova: Here's the translated text for "${text}":</p>
								<h1>${translatedText}</h1>
							`;

							scrolltoBottom();
						}).catch(error => {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.innerHTML = "Sorry, I couldn't translate the text.";
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						});
					} else {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.textContent = "Sorry, I couldn't understand the translation request. Please use the format: translate [text] to [target_language].";
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().includes("disaster") || userMessage.toLowerCase().includes("natural disaster") || userMessage.toLowerCase().includes("disaster alert") || userMessage.toLowerCase().includes("disaster warning")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching disaster alerts... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getDisasterAlerts().then(alerts => {
						botResponseDiv.innerHTML = `Nova: ${alerts}`;

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't fetch disaster alerts.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().startsWith("play")) {
					const query = userMessage.replace("play", "").trim();
					if (query === "") {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = `
							<p style="margin-bottom: 5px;">
								Nova: Please provide a song name or artist to play.<br>
								Hint: play Believer by Imagine Dragons
							</p><br>
							<p style="font-size: 10px;">Powered by <a href="https://music.youtube.com" target="_blank">YouTube Music</a></p><br>
							<p style="color: var(--lightGray); font-weight: 300; font-style: oblique;">If you want to resume playing currently paused media, say "resume".</p>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
						return;
					} else {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = `
							<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
								Nova: Opening YouTube Music... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
							</span>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();

						openYTMusic(query).then(() => {
							botResponseDiv.innerHTML = `
								<p style="margin-bottom: 5px;">Nova: Opened YouTube Music</p>
							`;

							scrolltoBottom();
						}).catch(() => {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.innerHTML = "Sorry, I couldn't open YouTube Music.";
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						});
					}
				} else if (userMessage.toLowerCase().includes("resume")) {
					playMedia();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("pause")) {
					pauseMedia();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("previous")) {
					previousMedia();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("skip") || userMessage.toLowerCase().includes("next")) {
					nextMedia();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("increase volume") || userMessage.toLowerCase().includes("volume up")) {
					increaseVolume();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("decrease volume") || userMessage.toLowerCase().includes("volume down")) {
					decreaseVolume();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("mute")) {
					muteVolume();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("unmute")) {
					unmuteVolume();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("on wifi") || userMessage.toLowerCase().includes("wifi on")) {
					turnOnWiFi();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("off wifi") || userMessage.toLowerCase().includes("wifi off")) {
					turnOffWiFi();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("create qr for")) {
					const text = userMessage.replace("create qr for", "").trim();
					const qrCodeElement = createQRCode(text);

					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `Nova: Here's the QR Code for "${text}":<br><br>`;
					botResponseDiv.appendChild(qrCodeElement);
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("convert")) {
					const match = userMessage.match(/convert (\d+)([a-zA-Z]+) to ([a-zA-Z]+)/);
					if (match) {
						const amount = parseFloat(match[1]);
						const fromCurrency = match[2].toUpperCase();
						const toCurrency = match[3].toUpperCase();
						let formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = `
							<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
								Nova: Converting ${formattedAmount} ${fromCurrency} to ${toCurrency}... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
							</span>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();

						convertCurrency(amount, fromCurrency, toCurrency).then(convertedAmount => {
							botResponseDiv.innerHTML = `
								<p>Nova: Here's the currency conversion:</p><br>
								<h1>${convertedAmount}</h1>
								<p>(as of ${getDate().month} ${getDate().day}, ${getDate().year} at ${getTime()})</p>
							`;

							scrolltoBottom();
						}).catch(error => {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.textContent = "Sorry, I couldn't convert the currency.";
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						});
					} else {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't understand the conversion request. Please use the format: convert [amount][base_currency] to [target_currency].";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().includes("pc info")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching system information... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getSystemInfo().then(({ deviceName, longOSName, lastBootedTime, uptime, cpuBrand, cpuArch, cpuCores, cpuUsage, usedMemory, totalMemory, disksInfoTable, networksInfo }) => {
						const response = `
							<p style="margin-bottom: 5px;">Nova: Here's your system information at a glance:</p><br>
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
						botResponseDiv.innerHTML = response;

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't fetch system information.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("bug code") || userMessage.toLowerCase().includes("error")) {
					const bugCode = userMessage.match(/bug code 0x([0-9a-fA-F]+)/) || userMessage.match(/0x([0-9a-fA-F]+) error/);
					if (bugCode) {
						const bugCodeDetails = findBugCodeDetails(bugCode[1].toUpperCase());
						if (bugCodeDetails) {
							const botResponseDiv = document.createElement('div');
							botResponseDiv.className = 'bot-response';
							botResponseDiv.innerHTML = `
								<p style="margin-bottom: 5px;">Nova: Here are the details for the bug code:</p><br>

								<h3>Bug Code:</h3>
								<p>${bugCodeDetails.code}</p><br>

								<h3>Code Name:</h3>
								<p>${bugCodeDetails.code_name}</p><br>

								<h3>Description:</h3>
								<p>${bugCodeDetails.description}</p><br>

								<h3>Solutions:</h3>
								<p>${bugCodeDetails.solutions.map(solution => `- ${solution}`).join('<br>')}</p>
							`;
							chatResponses.appendChild(botResponseDiv);

							scrolltoBottom();
						} else {
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.textContent = "Sorry, I couldn't find any details for the bug code.";
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						}
					} else {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't find any bug code in the request.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().includes("send email")) {
					sendEmail();

					scrolltoBottom();
				} else if (userMessage.toLowerCase().startsWith("find")) {
					const searchTerms = userMessage.replace("find ", "");
					searchFile(searchTerms);

					scrolltoBottom();
				} else if (userMessage.toLowerCase().includes("switch to light mode")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Switching to Light Mode... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					switchToLight().then(() => {
						botResponseDiv.innerHTML = "Nova: Switched to Light Mode successfully!";

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'bot-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't switch to Light Mode.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("switch to dark mode")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Switching to Dark Mode... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					switchToDark().then(() => {
						botResponseDiv.innerHTML = "Nova: Switched to Dark Mode successfully!";

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't switch to Dark Mode.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("screenshot") || userMessage.toLowerCase().includes("take a screenshot")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Taking a screenshot... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					takeScreenshot().then(() => {
						botResponseDiv.innerHTML = "Nova: Screenshot successfully saved to Desktop!";

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't take a screenshot.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("wallpaper")) {
					const query = userMessage.match(/(?:set a |)([a-zA-Z]+) wallpaper/);

					if (query && query[1]) {
						const category = query[1];

						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = `
							<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
								Nova: Changing the wallpaper... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
							</span>
						`;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();

						changeWallpaper(category).then(() => {
							botResponseDiv.innerHTML = `Nova: ${category.charAt(0).toUpperCase() + category.slice(1)} wallpaper changed successfully!`;

							scrolltoBottom();
						}).catch(error => {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.innerHTML = "Sorry, I couldn't change the wallpaper.";
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						});
					} else {
						const response = "Nova: Sorry, I couldn't find any wallpaper to change.";
						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = response;
						chatResponses.appendChild(botResponseDiv);

						scrolltoBottom();
					}
				} else if (userMessage.toLowerCase().includes("shutdown pc") || userMessage.toLowerCase().includes("turn off pc")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: PC is shutting down... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					shutdown_pc().then(() => {
						botResponseDiv.innerHTML = "Nova: PC is turned off...";

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't shut down the PC.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("restart pc") || userMessage.toLowerCase().includes("reboot pc")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Restarting the PC... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					restart_pc().then(() => {
						botResponseDiv.innerHTML = "Nova: PC is restarting...";

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't restart the PC.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("lock pc") || userMessage.toLowerCase().includes("lock computer")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Locking the PC... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					lock_pc().then(() => {
						botResponseDiv.innerHTML = "Nova: PC is locked...";

						scrolltoBottom();
					}).catch(() => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't lock the PC.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().includes("sleep pc") || userMessage.toLowerCase().includes("sleep computer")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.textContent = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Putting the PC to sleep... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					sleep_pc().then(() => {
						botResponseDiv.innerHTML = "Nova: PC is slept...";

						scrolltoBottom();
					}).catch(error => {
						botResponseDiv.remove();
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Sorry, I couldn't put the PC to sleep.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().startsWith("emergency") || userMessage.toLowerCase().startsWith("police") || userMessage.toLowerCase().startsWith("danger") || userMessage.toLowerCase().startsWith("fire") || userMessage.toLowerCase().startsWith("ambulance") || userMessage.toLowerCase().startsWith("medical") || userMessage.toLowerCase().startsWith("doctor") || userMessage.toLowerCase().startsWith("hospital") || userMessage.toLowerCase().startsWith("119") || userMessage.toLowerCase().startsWith("911") || userMessage.toLowerCase().startsWith("999") || userMessage.toLowerCase().startsWith("112") || userMessage.toLowerCase().startsWith("crisis")) {
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = `
						<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
							Nova: Fetching crisis hotlines... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
						</span>
					`;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();

					getCrisisHotlines().then(hotlineData => {
						if (hotlineData) {
							let hotlinesText = `Here are some hotlines to seek help if you're in a crisis in, ${hotlineData["country"]}:<br>`;
							hotlineData["hotlines"].forEach(hotline => {
								const numbers = hotline.numbers.join(', ');
								hotlinesText += `
									<br><h3>${hotline.name}</h3>
									<p style="font-weight: 300;">${numbers}</p>
								`;
							});
							const response = hotlinesText;

							console.log(hotlinesText);

							botResponseDiv.innerHTML = 'Nova: '+ response;

							scrolltoBottom();
						} else {
							botResponseDiv.remove();
							const errorResponseDiv = document.createElement('div');
							errorResponseDiv.className = 'error-response';
							errorResponseDiv.innerHTML = "Please call 911 or your local emergency number for immediate help.";
							chatResponses.appendChild(errorResponseDiv);

							scrolltoBottom();
						}
					}).catch(() => {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.textContent = "Sorry, I couldn't find any hotlines for immediate help. Please call 911 or your local emergency number for immediate help.";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					});
				} else if (userMessage.toLowerCase().startsWith("summarize:")) {
					const inputText = userMessage.replace("summarize:", "").trim();
					if (inputText === "") {
						const errorResponseDiv = document.createElement('div');
						errorResponseDiv.className = 'error-response';
						errorResponseDiv.innerHTML = "Please provide a text to summarize.<br>Hint: summarize: [text]";
						chatResponses.appendChild(errorResponseDiv);

						scrolltoBottom();
					} else {
						const botResponseDiv = document.createElement('div');
						botResponseDiv.className = 'bot-response';
						botResponseDiv.innerHTML = `
							<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
								Nova: Summarizing the text... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
							</span>
						`;
						chatResponses.appendChild(botResponseDiv);

						const response = await textSummarizer(inputText).then(summary => summary).catch(error => "Sorry, I couldn't summarize the text.");
						botResponseDiv.innerHTML = 'Nova: This is the summarized text:<br><br>' + response;

						scrolltoBottom();
					}
				} else {
					const response = await assistant.processQuery(userMessage);
					const botResponseDiv = document.createElement('div');
					botResponseDiv.className = 'bot-response';
					botResponseDiv.innerHTML = 'Nova: ' + response;
					chatResponses.appendChild(botResponseDiv);

					scrolltoBottom();
				}
			} catch (error) {
				console.error('Error processing query:', error);

				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.className = 'error-response';
				errorResponseDiv.innerHTML = 'Sorry, an error occurred while processing your request.';
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();
			}
		});
	} catch (error) {
		console.error('Failed to initialize assistant:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = 'Sorry, the assistant failed to initialize properly.';
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
	try {
		await window.__TAURI__.invoke('open_url', {
			url: url
		});
	} catch (error) {
		console.error('Failed to open URL:', error);
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
				botResponseDiv.className = 'bot-response';
				botResponseDiv.innerHTML = `Nova: ${response.launched_app} launched successfully. Enjoy!`;
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
				errorResponseDiv.className = 'error-response';
				errorResponseDiv.innerHTML = response.message;
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
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = 'Sorry, I encountered a system error. Please try again later.';
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		new Notification('System Error', {
			body: 'Failed to process the request. Please try again later.',
			sound: 'Default'
		});
	}
}



// function to get a random movie
function getRandomMovie() {
	let movieDetails = null;
	let randomMovieID = Math.floor(Math.random() * 10000000);

	const botResponseDiv = document.createElement('div');
	botResponseDiv.className = 'bot-response';
	botResponseDiv.innerHTML = `
		<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
			Nova: Searching for a movie... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
		</span>
	`;
	chatResponses.appendChild(botResponseDiv);

	scrolltoBottom();

	fetch(`https://www.omdbapi.com/?i=tt${randomMovieID}&apikey=1e86c5d2`)
		.then(response => response.json())
		.then(data => {
			const movieTitle = data.Title;
			const movieYear = data.Year;
			const movieGenre = data.Genre;
			const moviePlot = data.Plot;
			const movieRating = data.imdbRating;
			const movieActors = data.Actors;
			const movieDirector = data.Director;
			const moviePoster = data.Poster;
			let moviePosterContainer;
			const type = data.Type;

			console.log(randomMovieID);

			if (movieTitle === undefined || type === "episode") {
				botResponseDiv.remove();
				getRandomMovie();
				return;
			}

			movieDetails = `${movieTitle} (${movieYear})\nGenre: ${movieGenre}\nRating: ${movieRating}\nDirector: ${movieDirector}\nActors: ${movieActors}\nPlot: ${moviePlot}\nPoster: ${moviePoster}\nImdb: https://www.imdb.com/title/${data.imdbID}`;
			console.log(movieDetails);

			if (moviePoster === "N/A") {
				moviePosterContainer = `
					<span style="height: 300px; aspect-ratio: 3 / 4; border-radius: 2px; background: #808080; display: flex; justify-content: center; align-items: center;">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="75px"  height="75px"  viewBox="0 0 24 24"  fill="none"  stroke="#A9A9A9"  stroke-width="1"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-movie"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M8 4l0 16" /><path d="M16 4l0 16" /><path d="M4 8l4 0" /><path d="M4 16l4 0" /><path d="M4 12l16 0" /><path d="M16 8l4 0" /><path d="M16 16l4 0" /></svg>
					</span>
				`;
			} else {
				moviePosterContainer = `<img src="${moviePoster}" alt="${movieTitle}" style="width: auto; height: auto; object-fit: contain; object-position: center;">`;
			}

			botResponseDiv.innerHTML = `
				Nova: Here's a movie I found for you:<br><br>
				<span style="display: flex; flex-direction: row; justify-content: center; gap: 15px;">
					<span style="width: 50%;">
						<h1>${movieTitle} (${movieYear})</h1><br>
						<h3>Genre:</h3><p>${movieGenre}</p><br>
						<h3>Rating:</h3><p>${movieRating}</p><br>
						<h3>Director:</h3><p>${movieDirector}</p><br>
						<h3>Actors:</h3><p>${movieActors}</p><br>
						<h3>Plot:</h3><p>${moviePlot}</p><br>
						<p>Visit <a href="https://www.imdb.com/title/${data.imdbID}" target="_blank">IMDb Page</a></p>
					</span>
					<span style="width: 50%;">
						${moviePosterContainer}
					</span>
				</span>
			`;

			scrolltoBottom();
		});

	return movieDetails;
}



// function to get the ip address
async function getIPAddress() {
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
	try {
		const { ipaddress } = await getIPAddress();
		const location = await fetch(`https://ipinfo.io/${ipaddress}/city?token=a6384bf1fee5c5`)
			.then(response => response.text());
		console.log(`Location: ${location}`);
		const weatherData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=2e65cf86daa6dc72fef7c3f47c32788e`)
			.then(response => response.json());
		console.log(weatherData);
		const description = weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1);
		const temperature = `${Math.round(weatherData.main.temp - 273.15)}°C`;
		const humidity = `${weatherData.main.humidity}%`;
		const windSpeed = `${weatherData.wind.speed} m/s`;
		const weatherDetails = `Weather in ${location} - ${description} • Temperature: ${temperature} • Humidity: ${humidity} • Wind Speed: ${windSpeed}`;

		let weatherComment = "";

		switch (description) {
			case "Thunderstorm with light rain": weatherComment = "Just a sprinkle with a bit of rumble. Bring a hoodie—should be fun! ☔️⚡️"; break;
			case "Thunderstorm with rain": weatherComment = "Raindrops and rumbles coming your way. Better grab your rain boots! 🌧️⚡️"; break;
			case "Thunderstorm with heavy rain": weatherComment = "Full-on symphony outside—thunder, and a downpour! Better stay dry. ⛈️⚡️"; break;
			case "Light thunderstorm": weatherComment = "Just a gentle boom or two. Enjoy the show! 🌩️😊"; break;
			case "Thunderstorm": weatherComment = "It's a classic thunderstorm out there. Cue the dramatic skies! 🌩️🌧️"; break;
			case "Heavy thunderstorm": weatherComment = "Big booms and serious rain—nature's got a show planned! ⛈️💥"; break;
			case "Ragged thunderstorm": weatherComment = "A wild one's rolling in, a bit all over the place. Keep cozy inside if you can. 🌩️💨"; break;
			case "Thunderstorm with light drizzle": weatherComment = "A little drizzle with some rumbles. Just enough to keep things interesting! 🌦️⚡️"; break;
			case "Thunderstorm with drizzle": weatherComment = "A stormy drizzle is here—grab that raincoat for extra protection! ☔️⚡️"; break;
			case "Thunderstorm with heavy drizzle": weatherComment = "Thundery skies and a heavy mist. It's one of those classic stormy days! 🌧️⚡️"; break;
			case "Light intensity drizzle": weatherComment = "A soft drizzle—just enough to make things shimmer. No umbrella needed! 🌦️😊"; break;
			case "Drizzle": weatherComment = "A gentle mist is in the air. Just enough to feel refreshing. 🌫️☁️"; break;
			case "Heavy intensity drizzle": weatherComment = "Heavy on the drizzle but light on the storm. It's a wet one out there! ☔️🌧️"; break;
			case "Light intensity drizzle rain": weatherComment = "A mix of rain and mist. Gentle enough for a quick walk. 🌦️🚶‍♂️"; break;
			case "Drizzle rain": weatherComment = "A steady drizzle is here. Just a perfect cozy-weather vibe! ☕🌧️"; break;
			case "Heavy intensity drizzle rain": weatherComment = "Drizzly and damp. A day for tea and a warm blanket! 🍵☔️"; break;
			case "Shower rain and drizzle": weatherComment = "Raindrops with a bit of mist. Embrace the moodiness! 🌧️💧"; break;
			case "Heavy shower rain and drizzle": weatherComment = "It's like the sky's watering the earth today. Keep your umbrella handy! ☔️💦"; break;
			case "Shower drizzle": weatherComment = "A quick sprinkle of drizzly rain—nothing an umbrella can't handle. ☔️🌫️"; break;
			case "Light rain": weatherComment = "A soft sprinkle outside. You might just skip the umbrella for this one. 🌦️😊"; break;
			case "Moderate rain": weatherComment = "A steady fall—great for those rain lovers out there. 🌧️💧"; break;
			case "Heavy intensity rain": weatherComment = "It's a pour out there! Don't forget your waterproof boots! 🥾🌧️"; break;
			case "Very heavy rain": weatherComment = "Full downpour mode! The plants are happy, and you'll need serious rain gear. 🌧️🌊"; break;
			case "Extreme rain": weatherComment = "The sky's pouring everything it has! Maybe stay indoors for this one. 🏠💦"; break;
			case "Freezing rain": weatherComment = "Rain with a frosty touch. Bundle up and take it slow on the roads! 🧣❄️"; break;
			case "Light intensity shower rain": weatherComment = "A brief, soft shower. Just enough to keep things cool. 🌦️😄"; break;
			case "Shower rain": weatherComment = "A passing shower—could clear up soon, but maybe grab a hat! 🧢🌦️"; break;
			case "Heavy intensity shower rain": weatherComment = "A solid rain shower is here. It's getting serious out there! 🌧️💧"; break;
			case "Ragged shower rain": weatherComment = "Rain on and off, like nature can't quite decide. Keep that umbrella close! ☂️🌦️"; break;
			case "Light snow": weatherComment = "Just a dusting. A little winter magic in the air! ❄️😊"; break;
			case "Snow": weatherComment = "Snowfall! Perfect day for hot cocoa and cozy sweaters. ☕️❄️"; break;
			case "Heavy snow": weatherComment = "It's a winter wonderland outside! The world's getting a thick white blanket. 🌨️⛄️"; break;
			case "Sleet": weatherComment = "Cold and wet—sleet's here! Bundle up and watch your step. 🧥❄️"; break;
			case "Light shower sleet": weatherComment = "A hint of sleet—just a sprinkle to keep things frosty. ❄️🌧️"; break;
			case "Shower sleet": weatherComment = "On-and-off sleet showers. It's a chilly dance of rain and snow! 🌧️❄️"; break;
			case "Light rain and snow": weatherComment = "Rain meets snow—double the fun, double the layers. 🌨️🌧️"; break;
			case "Rain and snow": weatherComment = "It's a mix outside! Stay cozy and enjoy the unique weather show. ☔️❄️"; break;
			case "Light shower snow": weatherComment = "Gentle snow showers—just enough to catch a few flakes. 🌨️✨"; break;
			case "Shower snow": weatherComment = "On-and-off snow showers. Perfect for a bit of winter magic. 🌨️💫"; break;
			case "Heavy shower snow": weatherComment = "Serious snow showers are here—time to make some snow angels! ☃️❄️"; break;
			case "Mist": weatherComment = "A bit of mist is hanging around. The world feels like a fairytale! 🌫️🧚"; break;
			case "Smoke": weatherComment = "A hazy day out there. Take it easy and breathe safe. 💨😷"; break;
			case "Haze": weatherComment = "A gentle haze, making everything feel a bit mysterious. 🌫️🕵️"; break;
			case "Sand/dust whirls": weatherComment = "A dusty swirl's in the air—watch out for a bit of grit! 🌪️👀"; break;
			case "Fog": weatherComment = "It's a thick fog! Feels like walking through a cloud. 🌫️☁️"; break;
			case "Sand": weatherComment = "A sandy breeze blowing through—might feel a bit gritty out there! 🏜️💨"; break;
			case "Dust": weatherComment = "Dust in the air, keep an eye out if you're sensitive. 🌬️😶"; break;
			case "Volcanic ash": weatherComment = "Volcanic ash is in the air. Best to stay indoors! 🌋😯"; break;
			case "Squalls": weatherComment = "Quick gusts and winds—it's a bit of a wild one out there! 💨🌪️"; break;
			case "Tornado": weatherComment = "Tornado watch! Stay alert, stay safe, and find shelter if needed. 🌪️⚠️"; break;
			case "Clear sky": weatherComment = "It's as clear as it gets—sunshine and endless blue skies! ☀️😎"; break;
			case "Few clouds": weatherComment = "Just a few fluffy clouds—enough for some shade but lots of sun. 🌤️😌"; break;
			case "Scattered clouds": weatherComment = "Clouds scattered around—just enough for a little variety. 🌥️😌"; break;
			case "Broken clouds": weatherComment = "Clouds breaking up the blue sky. Nature's design looks great today. 🌤️🌥️"; break;
			case "Overcast clouds": weatherComment = "A fully cloudy day. Perfect for cozying up indoors. ☁️📚"; break;
			default: weatherComment = "Time to enjoy the day!"; break;
		}

		return { weatherDetails, location, description, weatherComment, temperature, humidity, windSpeed };
	} catch (error) {
		console.error('Error in getWeather:', error);
		throw error;
	}
}



// function to search the web
async function searchWeb(query) {
	query = query.replace('search ', '').trim();
	const proxyUrl = 'https://api.allorigins.win/get?url=';
	const targetUrl = encodeURIComponent(`https://html.duckduckgo.com/html/?q=${query}`);
	const url = proxyUrl + targetUrl;

	try {
		let search_status;

		const response = await fetch(url);
		let data = await response.json();
		console.log('Fetched data:', data);

		let htmlString = data.contents.replace(/\s+/g, ' ').trim();
		console.log('HTML string:', htmlString);

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		console.log('Parsed document:', doc);

		// Priority 1: Find the element with the ID 'zero_click_abstract'
		let snippetElement = doc.getElementById('zero_click_abstract');
		let snippetText = 'Sorry, I couldn\'t find any relevant information. Please try again in a bit or try a different search query.';

		if (snippetElement) {
			snippetText = snippetElement.innerText;
			console.log('Snippet text: ' + snippetText);
			snippetText = snippetText.replace('More at Wikipedia', '');
		} else {
			// Priority 2: Find the first element with the class 'result__snippet'
			const snippetElements = doc.querySelectorAll('.result__snippet');
			if (snippetElements.length > 0) {
				// Check if the first element's text starts with "Learn about"
				if (snippetElements[0].innerText.startsWith('Learn about')) {
					// If so, use the second element's text if it exists
					if (snippetElements.length > 1) {
						snippetText = snippetElements[1].innerText;
					}
				} else {
					// Otherwise, use the first element's text
					snippetText = snippetElements[0].innerText;
				}
			}
		}

		// Remove the last sentence that contains "More at..."
		snippetText = snippetText.replace(/\.?\s*More at.*$/, '');

		// Split the text into sentences
		let sentences = snippetText.split('. ');

		// Remove the last sentence that ends with "..."
		for (let i = sentences.length - 1; i >= 0; i--) {
			if (sentences[i].endsWith('...')) {
				sentences.splice(i, 1);
				break;
			}
		}

		// Remove citation elements such as "[1]" or "[a]", "[ 1 ]" or "[ a ]" from the sentences
		sentences = sentences.map(sentence => sentence.replace(/\[[a-zA-Z0-9]+\]/g, '').replace(/\[[ a-zA-Z0-9 ]+\]/g, ''));

		// Join the sentences back together
		snippetText = sentences.join('. ');

		search_status = 'success';

		if (snippetText.length === 0) {
			search_status = 'no_results';
			snippetText = 'Sorry, I couldn\'t find any relevant information. Please try again in a bit or try a different search query.';
		} else if (snippetText.length < 110) {
			search_status = 'no_snippet';
			snippetText = 'Sorry, I couldn\'t find a detailed snippet. Please click the link below to read more.';
		}

		console.log('Sanitized snippet text: ' + snippetText);

		return { snippetText, search_status };
	}
	catch (error) {
		console.error('Error fetching or parsing HTML:', error);
		throw error;
	}
}



// function to get the time
function getTime() {
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
}



// function to get the date
function getDate() {
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
}



// function to calculate numbers
function calculateNumbers(expression) {
	try {
		const result = new Function('return ' + expression)();
		return result;
	}
	catch (error) {
		console.error('Error in calculateNumbers:', error);
		throw error;
	}
}



// function to fetch news from rss feed
async function fetchNews() {
	try {
		const response = await fetch(`https://api.allorigins.win/get?url=https://abcnews.go.com/abcnews/internationalheadlines?${Date.now()}`);
		const data = await response.json();
		const xmlString = data.contents;
		const parser = new DOMParser();
		const xml = parser.parseFromString(xmlString, 'text/xml');
		const items = xml.querySelectorAll('item');
		const newsItems = [];

		items.forEach(item => {
			const title = item.querySelector('title').textContent;
			const description = item.querySelector('description').textContent;
			const link = item.querySelector('link').textContent;
			newsItems.push({ title, description, link });
		});

		return newsItems;
	} catch (error) {
		console.error('Error in fetchNews:', error);
		throw error;
	}
}



// function to get image of the day
async function getImageOfTheDay() {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US';
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
		const imageTitle = jsonData.images[0].title;
		const imageUrl = "https://www.bing.com" + jsonData.images[0].urlbase + "_1920x1080.jpg";
		const imageCredits = jsonData.images[0].copyright;
		return { imageTitle, imageUrl, imageCredits };
	} catch (error) {
		console.error('Error in getImageOfTheDay:', error);
		throw error;
	}
}



// function to get quote of the day
async function getQuoteOfTheDay() {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = 'https://zenquotes.io/api/today';
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
		const quote = jsonData[0].q;
		const author = jsonData[0].a;
		const fullQuote = quote + ' - ' + author;
		return { fullQuote, quote, author };
	}
	catch (error) {
		console.error('Error in getQuoteOfTheDay:', error);
		throw error;
	}
}



// function to get random quote
async function getRandomQuote() {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = 'https://zenquotes.io/api/random';
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}?${Date.now()}`, {
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
		const quote = jsonData[0].q;
		const author = jsonData[0].a;
		const fullQuote = quote + ' - ' + author;
		return { fullQuote, quote, author };
	}
	catch (error) {
		console.error('Error in getRandomQuote:', error);
		throw error;
	}
}



// function to get on this day events
async function getOnThisDayEvents() {
	let month = new Date().getMonth() + 1;
	let day = new Date().getDate();
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = `https://today.zenquotes.io/api/${month}/${day}`;
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
		const events = jsonData.data.Events.map(event => event.text);
		return events;
	}
	catch (error) {
		console.error('Error in getOnThisDayEvents:', error);
		throw error;
	}
}



// function to get random meal recipes
async function getRandomMeal() {
	try {
		const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
		const data = await response.json();
		const meal = data.meals[0];
		const mealName = meal.strMeal;
		const mealCategory = meal.strCategory;
		const mealArea = meal.strArea;
		const mealInstructions = meal.strInstructions;
		const mealIngredients = [];
		for (let i = 1; i <= 20; i++) {
			const ingredient = meal['strIngredient' + i];
			const measure = meal['strMeasure' + i];
			if (ingredient) {
				mealIngredients.push(`- ${ingredient}: ${measure}`);
			}
		}
		const mealImage = meal.strMealThumb;
		const mealYoutube = meal.strYoutube;
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
			<p style="font-size: 10px; margin-top: 5px;"><a href="${mealYoutube}" target="_blank">YouTube</a></p>
		`;
		return mealDetails;
	} catch (error) {
		console.error('Error in getRandomMeal:', error);
		throw error;
	}
}



// function to search books
async function searchBooks(query) {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
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
		const books = jsonData.items;

		if (books && books.length > 0) {
			const bookDetails = books.map(book => {
				const volumeInfo = book.volumeInfo;
				const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author';
				return `
					<span style="display: flex; flex-direction: row; gap: 10px; width: 100%; margin-top: 15px;">
						<span style="width: 50%;">
							<h1><a href="${volumeInfo.infoLink}" target="_blank">${volumeInfo.title}</a></h1><br>
							<h3>Authors:</h3><p>${authors}</p><br>
							<h3>Publisher:</h3><p>${volumeInfo.publisher}</p><br>
							<h3>Published Date:</h3><p>${volumeInfo.publishedDate}</p><br>
						</span>
						<span style="width: 50%; height: 200px;">
							<img src="${volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : ''}" style="height: 100%; width: 100%; object-fit: contain;" alt="${volumeInfo.title}">
						</span>
					</span>
					<h3>Description:</h3><p>${volumeInfo.description}</p>
				`;
			}).join('<br>');
			return bookDetails;
		} else {
			console.log('No books found');
			return [];
		}
	} catch (error) {
		console.error('Error fetching or parsing books:', error);
		throw error;
	}
}



// function to translate text
async function translateText(text, targetLanguage) {
	try {
		const proxyUrl = `https://auroraproxyserver.onrender.com/`;
		const targetUrl = 'https://api-free.deepl.com/v2/translate';
		targetLanguage = targetLanguage.toLowerCase();
		switch (targetLanguage) {
			case 'arabic': targetLanguage = 'AR'; break;
			case 'bulgarian': targetLanguage = 'BG'; break;
			case 'czech': targetLanguage = 'CS'; break;
			case 'danish': targetLanguage = 'DA'; break;
			case 'german': targetLanguage = 'DE'; break;
			case 'greek': targetLanguage = 'EL'; break;
			case 'english': targetLanguage = 'EN-US'; break;
			case 'spanish': targetLanguage = 'ES'; break;
			case 'estonian': targetLanguage = 'ET'; break;
			case 'finnish': targetLanguage = 'FI'; break;
			case 'french': targetLanguage = 'FR'; break;
			case 'hungarian': targetLanguage = 'HU'; break;
			case 'indonesian': targetLanguage = 'ID'; break;
			case 'italian': targetLanguage = 'IT'; break;
			case 'japanese': targetLanguage = 'JA'; break;
			case 'korean': targetLanguage = 'KO'; break;
			case 'lithuanian': targetLanguage = 'LT'; break;
			case 'latvian': targetLanguage = 'LV'; break;
			case 'norwegian': targetLanguage = 'NB'; break;
			case 'dutch': targetLanguage = 'NL'; break;
			case 'polish': targetLanguage = 'PL'; break;
			case 'portuguese br': targetLanguage = 'PT-BR'; break;
			case 'portuguese pt': targetLanguage = 'PT-PT'; break;
			case 'romanian': targetLanguage = 'RO'; break;
			case 'russian': targetLanguage = 'RU'; break;
			case 'slovak': targetLanguage = 'SK'; break;
			case 'slovenian': targetLanguage = 'SL'; break;
			case 'swedish': targetLanguage = 'SV'; break;
			case 'turkish': targetLanguage = 'TR'; break;
			case 'ukrainian': targetLanguage = 'UK'; break;
			case 'chinese': targetLanguage = 'ZH'; break;
			case 'chinese simplified': targetLanguage = 'ZH-HANS'; break;
			case 'chinese traditional': targetLanguage = 'ZH-HANT'; break;
		}
		const response = await fetch(`${proxyUrl}${targetUrl}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'DeepL-Auth-Key 93c60809-8f46-4788-b25f-9c73a7122ae8:fx'
			},
			body: JSON.stringify({
				text: [text],
				target_lang: targetLanguage
			})
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const translatedText = data.translations[0].text;
		return translatedText;
	} catch (error) {
		console.error('Error in translateText:', error);
		throw error;
	}
}



// function to create qr codes
function createQRCode(text) {
	const qrcode = new QRCode(document.createElement('div'), {
		text: text,
		width: 128,
		height: 128
	});

	const qrCodeImage = qrcode._el.firstChild.toDataURL('image/png');
	const qrCodeElement = document.createElement('img');
	qrCodeElement.src = qrCodeImage;
	qrCodeElement.alt = `QR Code for ${text}`;
	qrCodeElement.style.width = '128px';
	qrCodeElement.style.height = '128px';

	return qrCodeElement;
}



// function to open_ytmusic
async function openYTMusic(query) {
	try {
		console.log("Opening YouTube Music...");

		const ytmusic_window = new WebviewWindow('ytmusic_window', {
			url: 'https://music.youtube.com/search?q=' + query,
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
		});
	} catch (error) {
		ytmusic_window.once('tauri://error', (error) => {
			console.error("Failed to open YouTube Music:", error);
		});

		throw error;
	}
}



// function to play media
async function playMedia() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Resuming playback... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('play_media');

		botResponseDiv.innerHTML = "Nova: Resumed playback...";
	} catch (error) {
		console.error('Failed to play media:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to play media. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to pause media
async function pauseMedia() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Pausing playback... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('pause_media');

		botResponseDiv.innerHTML = "Nova: Paused playback...";
	} catch (error) {
		console.error('Failed to pause media:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to pause media. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to play previous media
async function previousMedia() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Playing previous track... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('previous_media');

		botResponseDiv.innerHTML = "Nova: Played previous track...";
	} catch (error) {
		console.error('Failed to play previous media:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to play previous track. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to play next media
async function nextMedia() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Playing next track... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('next_media');

		botResponseDiv.innerHTML = "Nova: Played next track...";
	} catch (error) {
		console.error('Failed to play next media:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to play next track. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to increase volume
async function increaseVolume() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Increasing volume... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('increase_volume');

		botResponseDiv.innerHTML = "Nova: Volume increased...";
	} catch (error) {
		console.error('Failed to increase volume:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to increase volume. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to decrease volume
async function decreaseVolume() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Decreasing volume... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('decrease_volume');

		botResponseDiv.innerHTML = "Nova: Volume decreased...";
	} catch (error) {
		console.error('Failed to decrease volume:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to decrease volume. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to toggle mute
async function muteVolume() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Toggling mute... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('toggle_mute');

		botResponseDiv.innerHTML = "Nova: Volume muted...";
	} catch (error) {
		console.error('Failed to mute volume:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to mute volume. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to toggle unmute
async function unmuteVolume() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Toggling unmute... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('toggle_mute');

		botResponseDiv.innerHTML = "Nova: Volume unmuted...";
	} catch (error) {
		console.error('Failed to unmute volume:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to unmute volume. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}



// function to turn on wifi
async function turnOnWiFi() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Turning on WiFi... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('turn_on_wifi');

		botResponseDiv.innerHTML = "Nova: WiFi turned on...";
	} catch (error) {
		console.error('Failed to turn on WiFi:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to turn on WiFi. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}

// function to turn off wifi
async function turnOffWiFi() {
	try {
		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Nova: Turning off WiFi... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span>
		`;
		chatResponses.appendChild(botResponseDiv);

		scrolltoBottom();

		await window.__TAURI__.invoke('turn_off_wifi');

		botResponseDiv.innerHTML = "Nova: WiFi turned off...";
	} catch (error) {
		console.error('Failed to turn off WiFi:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to turn off WiFi. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();
	}
}



// function to get natural disaster alerts
async function getDisasterAlerts() {
	try {
		const { country } = await getIPAddress();
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

		return { deviceName, longOSName, lastBootedTime, uptime, cpuBrand, cpuArch, cpuCores, cpuUsage, usedMemory, totalMemory, disksInfoTable, networksInfo };
	} catch (error) {
		console.error('Error getting system information:', error);

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
		chatFormSubmitBtn.disabled = true;

		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = "Nova: Enter the email details here:<br><br>";

		const emailForm = document.createElement('form');
		emailForm.id = 'emailForm';
		emailForm.innerHTML = `
			<label style="display: block; margin-bottom: 5px;" for="emailTo">To:</label>
			<input type="email" id="emailTo" name="emailTo" required><br><br>

			<label style="display: block; margin-bottom: 5px;" for="emailSubject">Subject:</label>
			<input type="text" id="emailSubject" name="emailSubject" required><br><br>

			<label style="display: block; margin-bottom: 5px;" for="emailBody">Body:</label>
			<input type="text" id="emailBody" name="emailBody" required><br><br>

			<button type="submit">Send Email</button>
			<button type="button" id="emailCloseBtn">Close Form</button><br><br>
		`;

		botResponseDiv.appendChild(emailForm);
		chatResponses.appendChild(botResponseDiv);

		document.getElementById('emailCloseBtn').addEventListener('click', () => {
			document.getElementById('emailForm').remove();
			botResponseDiv.textContent = 'Email Form Closed';
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

				botResponseDiv.innerHTML = "Nova: Opened email client. Please click send to send the email.";

				scrolltoBottom();

				alert('Opened email client. Please click send to send the email.');
				chatFormSubmitBtn.disabled = false;
				chatMessage.disabled = false;
			} catch (error) {
				console.error('Failed to send email:', error);

				botResponseDiv.remove();
				const errorResponseDiv = document.createElement('div');
				errorResponseDiv.className = 'bot-response';
				errorResponseDiv.innerHTML = "Failed to send email. Please try again later.";
				chatResponses.appendChild(errorResponseDiv);

				scrolltoBottom();

				alert('Failed to send email. Please try again later.');
				chatFormSubmitBtn.disabled = false;
				chatMessage.disabled = false;
			}
		});
	} catch (error) {
		console.error('Error in sendEmail:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Failed to send email. Please try again later.";
		chatResponses.appendChild(errorResponseDiv);

		scrolltoBottom();

		alert('Failed to send email. Please try again later.');
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
		chatFormSubmitBtn.disabled = true;
		const searchDisplay = `"${searchTerms}"`;

		const botResponseDiv = document.createElement('div');
		botResponseDiv.className = 'bot-response';
		botResponseDiv.innerHTML = `
			<span style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
				Searching for files matching ${searchDisplay} across all drives... <svg  xmlns="http://www.w3.org/2000/svg"  width="15"  height="15"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2 spinner"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
			</span><br>
			This may take a while. Feel free to do something else in the meantime. I'll notify you when the search is complete.
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
				Found ${results.length} file(s) matching ${searchDisplay}:<br><br>
				<span style="display: grid; grid-template-columns: 95% auto; row-gap: 5px;">
					${formattedResults}
				</span><br>
				<p style="font-size: 10px;">Search took ${searchTime}</p>
			`;

			scrolltoBottom();

			new Notification('File Search Finished', {
				body: `Found ${results.length} file(s) matching ${searchDisplay}. Search took ${searchTime}.`,
				icon: 'assets/images/icon.png'
			});
		} else {
			botResponseDiv.innerHTML = `
				No matching files found for ${searchDisplay}<br><br>
				<p style="font-size: 10px;">Search took ${searchTime}</p>
			`;

			scrolltoBottom();

			new Notification('File Search Finished', {
				body: `No matching files found for ${searchDisplay}. Search took ${searchTime}.`,
				icon: 'assets/images/icon.png'
			});
		}
	} catch (error) {
		chatFormSubmitBtn.disabled = false;
		chatMessage.disabled = false;
		console.error('Error searching for files:', error);

		if (botResponseDiv) {
			botResponseDiv.remove();
		}

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = `An error occurred while searching: ${error}`;
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
	try {
		await invoke('set_light_mode');
		console.log('Switched to light mode');
	} catch (error) {
		console.error('Failed to switch to light mode:', error);
	}
}

// function to switch to dark mode
async function switchToDark() {
	try {
		await invoke('set_dark_mode');
		console.log('Switched to dark mode');
	} catch (error) {
		console.error('Failed to switch to dark mode:', error);
	}
}



// function to take a screenshot
async function takeScreenshot() {
	try {
		const screenshot = await invoke('take_screenshot');
		console.log('Screenshot taken:', screenshot);
		return screenshot;
	} catch (error) {
		console.error('Failed to take screenshot:', error);
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
	try {
		await invoke('shutdown_pc');

		new Notification('System Shutdown Initiated', {
			body: 'Your system will be shutting down in 10 seconds...',
			icon: 'assets/images/icon.png'
		});

		console.log('System shutdown initiated');
	} catch (error) {
		console.error('Failed to shutdown system:', error);

		new Notification('Failed to Shutdown System', {
			body: 'Failed to shutdown system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to restart the system
async function restart_pc() {
	try {
		await invoke('restart_pc');

		new Notification('System Restart Initiated', {
			body: 'Your system will be restarting in 10 seconds...',
			icon: 'assets/images/icon.png'
		});

		console.log('System restart initiated');
	} catch (error) {
		console.error('Failed to restart system:', error);

		new Notification('Failed to Restart System', {
			body: 'Failed to restart system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to log off the system
async function lock_pc() {
	try {
		await invoke('lock_pc');

		new Notification('System Lock Initiated', {
			body: 'Your system is locked!',
			icon: 'assets/images/icon.png'
		});

		console.log('System lock initiated');
	}
	catch (error) {
		console.error('Failed to lock system:', error);

		new Notification('Failed to Lock System', {
			body: 'Failed to lock system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to sleep the system
async function sleep_pc() {
	try {
		await invoke('sleep_pc');

		new Notification('System Sleep Initiated', {
			body: 'Your system will be going to sleep in moments...',
			icon: 'assets/images/icon.png'
		});

		console.log('System sleep initiated');
	} catch (error) {
		console.error('Failed to sleep system:', error);

		new Notification('Failed to Sleep System', {
			body: 'Failed to sleep system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}



// Function to get crisis hotlines
async function getCrisisHotlines() {
	try {
		const { country } = await getIPAddress();
		const hotlineData = crisisHotlinesData.find(hotline => hotline["alpha-2"] === country);
		if (hotlineData) {
			console.log(`Hotlines for ${hotlineData["country"]}:`);
			for (const hotline of hotlineData["hotlines"]) {
				const numbers = hotline.numbers.join(', ');
				console.log(`${hotline.name}:\n${numbers}`);
			}
			return hotlineData;
		} else {
			console.log(`No hotlines found for ${country}`);
			return null;
		}
	} catch (error) {
		console.error('Error in getCrisisHotlines:', error);
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
			errorResponseDiv.className = 'error-response';
			errorResponseDiv.innerHTML = "Sorry, I couldn't set the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes";
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		} else if (duration <= 0) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.className = 'error-response';
			errorResponseDiv.innerHTML = "Please enter a valid duration for the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes";
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		}

		const unit = timer[1].toLowerCase();
		const timeInMs = convertToMilliseconds(duration, unit);

		if (timeInMs === 0) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.className = 'error-response';
			errorResponseDiv.innerHTML = "Please enter a valid unit for the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes";
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		} else if (timeInMs > 86400000) {
			const errorResponseDiv = document.createElement('div');
			errorResponseDiv.className = 'error-response';
			errorResponseDiv.innerHTML = "Please enter a duration less than or equal to 24 hours.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes";
			chatResponses.appendChild(errorResponseDiv);

			scrolltoBottom();
			return;
		}

		console.log(`Timer: ${duration} ${unit} timer has started!`);

		const timerResponseDiv = document.createElement('div');
		timerResponseDiv.className = 'bot-response';
		timerResponseDiv.textContent = `Nova: ${duration} ${unit} timer has started!`;
		chatResponses.appendChild(timerResponseDiv);

		scrolltoBottom();

		let remainingTime = timeInMs;

		const interval = setInterval(() => {
			remainingTime -= 1000;
			timerResponseDiv.innerHTML = `Nova: ${Math.floor(remainingTime / 1000)} seconds remaining...`;
			console.log(`Timer: ${Math.floor(remainingTime / 1000)} seconds remaining...`);
			if (remainingTime <= 0) {
				clearInterval(interval);
			}
		}, 1000);

		await new Promise(resolve => setTimeout(resolve, timeInMs));

		console.log(`Nova: ${duration} ${unit} timer has completed!`);
		timerResponseDiv.innerHTML = `Nova: ${duration} ${unit} timer has completed!`;

		scrolltoBottom();

		new Notification('Timer Completed!', {
			body: `${duration} ${unit} timer has completed!`,
			sound: 'Default'
		});
	} catch (error) {
		console.error('Failed to set timer:', error);

		const errorResponseDiv = document.createElement('div');
		errorResponseDiv.className = 'error-response';
		errorResponseDiv.innerHTML = "Sorry, I couldn't set the timer.<br><br>Please make sure you have this format: set a timer for [duration] [unit].<br>For example, set a timer for 5 minutes";
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



// function to scroll to bottom of chat
function scrolltoBottom() {
	const chatResponsesContainer = document.getElementById('chatResponsesContainer');
	chatResponsesContainer.scrollTo({
		top: chatResponsesContainer.scrollHeight,
		behavior: 'smooth'
	});

	console.log('Scrolled to bottom of chat');
}