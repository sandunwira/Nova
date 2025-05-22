let currentUserData = JSON.parse(window.localStorage.getItem('userData'));

class Assistant {
	constructor() {
		this.requestsData = [];
		this.responsesData = [];
		this.conversationHistory = [];
		this.lastMatchedIntent = null;
		this.lastMatchedResponse = null;

		// Dynamic Variables
		this.customData = {
			name: currentUserData.name,
			feedback_url: "https://forms.gle/77MP5rjGaXWLjhmcA",
		};
	}

	// Static utility methods
	static Utility = {
		async fetchData(url) {
			const response = await fetch(url);
			return response.json();
		},

		cleanQuery(input) {
			const emojiRegex = /[\p{Emoji}]/gu;
			// Check if query has both text and emojis
			const hasEmojis = emojiRegex.test(input);
			const hasText = input.replace(emojiRegex, '').trim().length > 0;

			// If only emojis, return as is
			if (hasEmojis && !hasText) {
				return input;
			}
			// If both text and emojis, remove emojis
			if (hasEmojis && hasText) {
				return input.replace(emojiRegex, '').trim();
			}
			// If only text, return as is
			return input;
		},

		// New method to extract keywords from a query
		extractKeywords(query) {
			// Clean the query first
			const cleanedQuery = this.cleanQuery(query);

			// Process cleaned query
			const cleanQuery = cleanedQuery.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();

			// Split into words and remove common stop words
			const stopWords = new Set([
				'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
				'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
				'to', 'was', 'were', 'will', 'with'
			]);

			return cleanQuery.split(/\s+/).filter(word => word.length > 1 && !stopWords.has(word));
		},

		// Add method to detect knowledge-seeking questions
		isKnowledgeQuestion(query) {
			const knowledgePatterns = [
				/^what is/i,
				/^who is/i,
				/^where is/i,
				/^when was/i,
				/^how does/i,
				/^why does/i,
				/^explain/i,
				/^tell me about/i,
				/^define/i,
				/^meaning of/i
			];

			return knowledgePatterns.some(pattern => pattern.test(query.trim()));
		},

		// Enhanced keyword matching with more sophisticated scoring
		calculateIntentScore(query, requestExamples) {
			// Remove punctuation and extra whitespace
			const cleanQuery = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

			// Knowledge question check - if it's a knowledge question, reduce matching likelihood
			if (this.isKnowledgeQuestion(cleanQuery)) {
				console.log("Knowledge question detected");
			}

			// Exact match check
			const exactMatches = requestExamples.filter(example =>
				example.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim() === cleanQuery
			);
			if (exactMatches.length > 0) return 1.0;

			// Partial match and word-based scoring
			const queryWords = cleanQuery.split(/\s+/);
			const scores = requestExamples.map(example => {
				const cleanExample = example.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
				const exampleWords = cleanExample.split(/\s+/);

				// Calculate exact word matches (stricter matching)
				const exactWordMatches = queryWords.filter(qw => exampleWords.includes(qw));
				const exactWordScore = exactWordMatches.length / Math.max(queryWords.length, exampleWords.length);

				// Calculate partial word matches
				const partialWordMatches = queryWords.filter(qw =>
					exampleWords.some(ew => ew.includes(qw) || qw.includes(ew))
				) - exactWordMatches.length; // Don't double count
				const partialWordScore = partialWordMatches / Math.max(queryWords.length, exampleWords.length) * 0.5; // Half weight for partial matches

				// Calculate word overlap score (combining exact and partial with appropriate weights)
				const wordOverlapScore = exactWordScore + partialWordScore;

				// Levenshtein distance as a fallback
				const distanceScore = 1 - (this.levenshtein(cleanQuery, cleanExample) / Math.max(cleanQuery.length, cleanExample.length));

				// Combine scores with more weight to exact word matches
				const combinedScore = (wordOverlapScore * 0.8) + (distanceScore * 0.2);

				// Apply penalties for knowledge questions matching with non-knowledge intents
				if (this.isKnowledgeQuestion(cleanQuery) && !this.isKnowledgeQuestion(cleanExample)) {
					return combinedScore * 0.6; // 40% penalty
				}

				return combinedScore;
			});

			// Return the highest score
			return Math.max(...scores);
		},

		levenshtein(a, b) {
			// Initialize matrix
			const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

			// Fill the first row of the matrix
			for (let j = 0; j <= a.length; j++) {
				matrix[0][j] = j;
			}

			// Populate the rest of the matrix
			for (let i = 1; i <= b.length; i++) {
				for (let j = 1; j <= a.length; j++) {
					if (b[i - 1] === a[j - 1]) {
						matrix[i][j] = matrix[i - 1][j - 1];
					} else {
						matrix[i][j] = Math.min(
							matrix[i - 1][j] + 1, // Deletion
							matrix[i][j - 1] + 1, // Insertion
							matrix[i - 1][j - 1] + 1 // Substitution
						);
					}
				}
			}

			// Return the Levenshtein distance
			return matrix[b.length][a.length];
		},

		getTimestamp() {
			return new Date().toISOString();
		},

		// Check if query is a repeat request
		isRepeatRequest(query) {
			const repeatKeywords = ['repeat', 'again', 'another', 'once more', 'one more', 'more'];
			const cleanQuery = query.toLowerCase().trim();
			return repeatKeywords.some(keyword => cleanQuery.includes(keyword));
		}
	};

	async initialize() {
		try {
			this.requestsData = await Assistant.Utility.fetchData('data/requests.json');
			this.responsesData = await Assistant.Utility.fetchData('data/responses.json');

			if (typeof localStorage !== 'undefined') {
				const savedHistory = localStorage.getItem('conversationHistory');
				if (savedHistory) {
					this.conversationHistory = JSON.parse(savedHistory);
				}
			}
		} catch (error) {
			console.error('Error initializing Assistant:', error);
			throw error;
		}
	}

	// Add the replaceDynamicVariables method
	replaceDynamicVariables(response) {
		return response.replace(/\[([^\]]+)\]/g, (match, variable) => {
			return this.customData[variable] || match;
		});
	}

	findResponse(requestKeyword) {
		// Check for repeat request first
		if (Assistant.Utility.isRepeatRequest(requestKeyword) && this.lastMatchedIntent) {
			console.log(`Repeating last matched intent: ${this.lastMatchedIntent}`);
			return this.getResponseForIntent(this.lastMatchedIntent);
		}

		let bestMatch = null;
		let highestScore = 0;

		// Iterate through all requests to find the best intent match
		for (const request of this.requestsData) {
			// Calculate intent score for this request
			const intentScore = Assistant.Utility.calculateIntentScore(
				requestKeyword,
				request.requests
			);

			// Update best match if this intent has a higher score
			if (intentScore > highestScore) {
				highestScore = intentScore;
				bestMatch = request;
			}
		}

		// Store the highest score for use in processQuery
		this.lastIntentScore = highestScore;

		// Log matching details
		console.log(`Matched Intent: ${bestMatch?.intent || 'None'}, Score: ${highestScore}`);

		// Set last matched intent and response
		this.lastMatchedIntent = bestMatch?.intent;

		// Return response or default message
		if (bestMatch && highestScore > 0.5) {
			const response = this.getResponseForIntent(bestMatch.intent);
			this.lastMatchedResponse = response;
			return response;
		}

		return "Sorry, I couldn't understand the request.";
	}

	getResponseForIntent(intent) {
		// Find and return a random response for the matched intent
		const matchedResponses = this.responsesData.find(response => response.intent === intent);

		if (matchedResponses && matchedResponses.responses && matchedResponses.responses.length > 0) {
			return matchedResponses.responses[Math.floor(Math.random() * matchedResponses.responses.length)];
		}

		return "Sorry, I couldn't find a response for this intent.";
	}

	// Add methods for conversation history management
	saveConversation(query, response) {
		const conversation = {
			timestamp: Assistant.Utility.getTimestamp(),
			query,
			response,
			intent: this.lastMatchedIntent || 'unknown'
		};

		this.conversationHistory.push(conversation);

		// Save to localStorage if available
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
		}
	}

	getConversationHistory() {
		return this.conversationHistory;
	}

	clearConversationHistory() {
		this.conversationHistory = [];
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('conversationHistory');
		}
	}

	async getIntent(query) {
		if (!query || typeof query !== 'string') {
			return {
				intent: null,
				confidence: 0,
				error: 'Invalid query'
			};
		}

		try {
			// Check for repeat request first
			if (Assistant.Utility.isRepeatRequest(query) && this.lastMatchedIntent) {
				return {
					intent: this.lastMatchedIntent,
					confidence: 1.0,
					isRepeat: true
				};
			}

			let bestMatch = null;
			let highestScore = 0;

			// Iterate through all requests to find the best intent match
			for (const request of this.requestsData) {
				const intentScore = Assistant.Utility.calculateIntentScore(
					query,
					request.requests
				);

				// Update best match if this intent has a higher score
				if (intentScore > highestScore) {
					highestScore = intentScore;
					bestMatch = request;
				}
			}

			// Only return intent if confidence is high enough
			if (bestMatch && highestScore > 0.5) {
				this.lastMatchedIntent = bestMatch.intent;
				return {
					intent: bestMatch.intent,
					confidence: highestScore
				};
			}

			return {
				intent: null,
				confidence: highestScore
			};
		} catch (error) {
			console.error('Error getting intent:', error);
			return {
				intent: null,
				confidence: 0,
				error: error.message
			};
		}
	}

	// New method to fetch response from external API
	async fetchExternalResponse(query) {
		try {
			const encodedPrompt = encodeURIComponent(query);
			const response = await fetch(`http://localhost:5000/api/chat?prompt=${encodedPrompt}`);

			if (!response.ok) {
				throw new Error(`API responded with status: ${response.status}`);
			}

			const data = await response.json();
			
			// Extract response from the correct path in the JSON structure
			if (data.candidates && 
				data.candidates[0] && 
				data.candidates[0].content && 
				data.candidates[0].content.parts && 
				data.candidates[0].content.parts[0] && 
				data.candidates[0].content.parts[0].text) {
				return data.candidates[0].content.parts[0].text;
			}
			
			// Fallback if structure doesn't match
			return data.response || "Sorry, I couldn't understand the response from the server.";
		} catch (error) {
			console.error('Error fetching from external API:', error);
			return "Sorry, I couldn't connect to the external service.";
		}
	}

	async processQuery(query) {
		try {
			console.log("Original Query:", query);
			// Clean the query first
			const cleanedQuery = Assistant.Utility.cleanQuery(query);
			console.log("Cleaned Query:", cleanedQuery);

			// Check if this looks like a knowledge question
			const isKnowledgeQuestion = Assistant.Utility.isKnowledgeQuestion(cleanedQuery);

			let response;
			let highestScore = 0;

			// If it's a knowledge-seeking question, prefer using external API
			if (isKnowledgeQuestion) {
				console.log("Knowledge question detected, preferring external API");
				response = await this.fetchExternalResponse(cleanedQuery);
				// Apply dynamic variable replacement to external API response
				response = this.replaceDynamicVariables(response);

				// Save the fact that we used external API
				this.lastMatchedIntent = "external_knowledge";
			} else {
				// For other queries, try to find a local response
				response = this.findResponse(cleanedQuery);

				// If we get the score, store it (modifying findResponse to return score)
				if (this.lastIntentScore) {
					highestScore = this.lastIntentScore;
				}

				// If no good intent match was found or score is below enhanced threshold for general questions
				if (response === "Sorry, I couldn't understand the request." ||
					(response.includes("I'm here to assist") && highestScore < 0.7)) {
					console.log("No strong intent match found, querying external API...");
					response = await this.fetchExternalResponse(cleanedQuery);
					// Apply dynamic variable replacement to external API response
					response = this.replaceDynamicVariables(response);
				} else {
					response = this.replaceDynamicVariables(response);
				}
			}

			console.log("Response:", response);
			return response;
		} catch (error) {
			console.error('Error processing query:', error);
			return "Sorry, an error occurred while processing your request.";
		}
	}
}