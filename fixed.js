// Main JavaScript for Kot 24 AI Assistant
document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const chatArea = document.getElementById("chatArea");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const audioVisualizer = document.getElementById("audioVisualizer");

  // Speech Recognition Setup
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
  recognition.interimResults = false;

  // Speech Synthesis Setup
  const synth = window.speechSynthesis;

  // Voice Settings (Customizable)
  let voiceSettings = {
    rate: 1.0,
    pitch: 1.1,
    volume: 1.0,
    voiceIndex: 0,
  };

  // Google AI Studio API Configuration
  const API_KEY = "AIzaSyCQoLYRNKBTE_GmUhs34XwTV5MeGoydmoI";
  const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  // State variables
  let isListening = false;
  let isSpeaking = false;
  let messages = [];
  let availableVoices = [];

  // Initialize the assistant
  function initAssistant() {
    // Handle enter key press in input field
    userInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
      }
    });

    // Handle send button click
    sendBtn.addEventListener("click", handleUserInput);

    // Handle voice button click
    voiceBtn.addEventListener("click", toggleVoiceInput);

    // Setup speech recognition event handlers
    setupSpeechRecognition();

    // Create voice settings UI
    createVoiceSettingsUI();

    // Load available voices
    loadVoices();
  }

  // Load available speech synthesis voices
  function loadVoices() {
    // Get available voices
    availableVoices = synth.getVoices();

    // If voices aren't loaded yet, wait for the event
    if (availableVoices.length === 0) {
      synth.onvoiceschanged = function () {
        availableVoices = synth.getVoices();
        populateVoiceSelect();
      };
    } else {
      populateVoiceSelect();
    }
  }

  // Populate voice selection dropdown
  function populateVoiceSelect() {
    const voiceSelect = document.getElementById("voice-select");
    if (!voiceSelect) return;

    // Clear existing options
    voiceSelect.innerHTML = "";

    // Add voices to select dropdown
    availableVoices.forEach((voice, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
    });
  }

  // Create voice settings UI
  function createVoiceSettingsUI() {
    // Create settings panel
    const settingsPanel = document.createElement("div");
    settingsPanel.className = "voice-settings-panel";
    settingsPanel.innerHTML = `
            <div class="settings-header">
                
                <button class="toggle-settings" id="toggle-settings-btn">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
            <div class="settings-content" id="settings-content">
                <div class="setting-group">
                    <label for="voice-select">Voice:</label>
                    <select id="voice-select"></select>
                </div>
                <div class="setting-group">
                    <label for="rate-slider">Speed: <span id="rate-value">1.0</span></label>
                    <input type="range" id="rate-slider" min="0.5" max="2" value="1.0" step="0.1">
                </div>
                <div class="setting-group">
                    <label for="pitch-slider">Pitch: <span id="pitch-value">1.1</span></label>
                    <input type="range" id="pitch-slider" min="0.5" max="2" value="1.1" step="0.1">
                </div>
                <div class="setting-group">
                    <label for="volume-slider">Volume: <span id="volume-value">1.0</span></label>
                    <input type="range" id="volume-slider" min="0" max="1" value="1.0" step="0.1">
                </div>
                <button id="test-voice-btn" class="test-voice-btn">Test Voice</button>
            </div>
        `;

    // Add styles for voice settings
    document.head.insertAdjacentHTML(
      "beforeend",
      `
            <style>
                .voice-settings-panel {
                    position: absolute;
                    top: 130px;
                    right: 80px;
                    background: var(--card-bg);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    z-index: 100;
                    overflow: hidden;
                    transition: height 0.3s ease;
                }
                
                .settings-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 15px;
                    background: rgba(108, 92, 231, 0.2);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .settings-header h3 {
                    margin: 0;
                    font-size: 16px;
                    color: var(--text-color);
                }
                
                .toggle-settings {
                    background: transparent;
                    border: none;
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                .toggle-settings:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .settings-content {
                    padding: 15px;
                    display: none;
                }
                
                .settings-content.open {
                    display: block;
                }
                
                .setting-group {
                    margin-bottom: 15px;
                }
                
                .setting-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 14px;
                    color: var(--text-color);
                }
                
                .setting-group select,
                .setting-group input {
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: var(--text-color);
                }
                
                .setting-group input[type="range"] {
                    height: 6px;
                    -webkit-appearance: none;
                    background: rgba(255, 255, 255, 0.1);
                    outline: none;
                    padding: 0;
                    margin: 10px 0;
                }
                
                .setting-group input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--primary-color);
                    cursor: pointer;
                }
                
                .test-voice-btn {
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                    color: white;
                    border: none;
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 14px;
                    width: 100%;
                    transition: all 0.2s;
                }
                
                .test-voice-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(108, 92, 231, 0.3);
                }

                @media (max-width: 486px) {
                    .voice-settings-panel {
                    position: absolute;
                    top: 130px;
                    right: 30px;
                    }
                }
            </style>
        `
    );

    document.body.appendChild(settingsPanel);

    // Setup event listeners for voice settings
    setupVoiceSettingsEvents();
  }

  // Setup event listeners for voice settings
  function setupVoiceSettingsEvents() {
    // Toggle settings visibility
    const toggleBtn = document.getElementById("toggle-settings-btn");
    const settingsContent = document.getElementById("settings-content");

    toggleBtn.addEventListener("click", () => {
      settingsContent.classList.toggle("open");
    });

    // Rate slider
    const rateSlider = document.getElementById("rate-slider");
    const rateValue = document.getElementById("rate-value");

    rateSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      voiceSettings.rate = value;
      rateValue.textContent = value.toFixed(1);
    });

    // Pitch slider
    const pitchSlider = document.getElementById("pitch-slider");
    const pitchValue = document.getElementById("pitch-value");

    pitchSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      voiceSettings.pitch = value;
      pitchValue.textContent = value.toFixed(1);
    });

    // Volume slider
    const volumeSlider = document.getElementById("volume-slider");
    const volumeValue = document.getElementById("volume-value");

    volumeSlider.addEventListener("input", (e) => {
      const value = parseFloat(e.target.value);
      voiceSettings.volume = value;
      volumeValue.textContent = value.toFixed(1);
    });

    // Voice selection
    const voiceSelect = document.getElementById("voice-select");

    voiceSelect.addEventListener("change", (e) => {
      voiceSettings.voiceIndex = parseInt(e.target.value);
    });

    // Test voice button
    const testVoiceBtn = document.getElementById("test-voice-btn");

    testVoiceBtn.addEventListener("click", () => {
      speak(
        "Hello, this is a test of my voice settings. How do I sound?",
        true
      );
    });
  }

  // Handle user input (text)
  // Replace the handleUserInput function (around line 186)
  function handleUserInput() {
    const text = userInput.value.trim();
    if (text) {
      addMessage(text, "user");
      userInput.value = "";

      // Process the command
      takeCommand(text.toLowerCase());
    }
  }

  // Toggle voice input functionality
  function toggleVoiceInput() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // Start listening for voice input
  // Update the startListening and stopListening functions
  function startListening() {
    if (isListening) return; // Already listening
    
    try {
      isListening = true; // Set flag first
      recognition.start();
      voiceBtn.classList.add("listening");
      showToast("Listening...");
    } catch (error) {
      console.error("Speech recognition error:", error);
      isListening = false; // Reset flag on error
      voiceBtn.classList.remove("listening");
      showToast("Could not start voice recognition");
    }
  }

  function stopListening() {
    if (!isListening) return; // Not listening
    
    isListening = false; // Set this first to prevent restart in onend handler
    try {
      recognition.stop();
    } catch (e) {
      console.error("Error stopping recognition:", e);
    }
    voiceBtn.classList.remove("listening");
    showToast("Listening mode deactivated");
  }

  // Setup speech recognition event handlers
  function setupSpeechRecognition() {
    recognition.onstart = function () {
      console.log("Voice recognition started");
      showToast("Listening mode activated. Click again to stop.");
    };

  // Replace the recognition.onresult function (around line 227)
  recognition.onresult = function (event) {
    // Get the latest result
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript;
    console.log("Recognized speech:", transcript);

    // Add the transcript to the input field
    userInput.value = transcript.replace(/\*/g, "");

    // Use the same flow as text input - simulate clicking the send button
    // This ensures the exact same path is followed for both voice and text input
    setTimeout(() => {
      if (userInput.value.trim()) {
        sendBtn.click();
      }
    }, 300);
  };

    recognition.onerror = function (event) {
      console.error("Speech recognition error", event.error);
      if (event.error !== "no-speech") {
        // Don't stop on no-speech errors, only on other errors
        stopListening();
        showToast("Voice recognition error: " + event.error);
      }
    };

    // Modified to not automatically stop when speech ends
    recognition.onend = function () {
      // Only call stopListening if we're not supposed to be listening
      if (!isListening) {
        voiceBtn.classList.remove("listening");
      } else {
        // Restart if we're still supposed to be in listening mode
        // This handles cases where recognition stops unexpectedly
        try {
          recognition.start();
        } catch (error) {
          console.error("Failed to restart recognition:", error);
          isListening = false;
          voiceBtn.classList.remove("listening");
          showToast("Voice recognition stopped unexpectedly");
        }
      }
    };
  }

  function stripMarkdown(text) {
    // Remove markdown formatting characters for speaking
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Bold text
      .replace(/\*(.*?)\*/g, "$1")     // Italic text
      .replace(/`(.*?)`/g, "$1")       // Code
      .replace(/```([\s\S]*?)```/g, "$1"); // Code blocks
  }

  // Speak text using speech synthesis with customizable voice settings
  function speak(text, isTest = false) {
    if (synth.speaking) {
      synth.cancel();
    }

    if (text) {
      // Clean the text of markdown characters before speaking
      const cleanText = stripMarkdown(text);
      
      // Continue with the rest using cleanText
      let wasListening = isListening;
      if (isListening && !isTest) {
        recognition.stop();
      }

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply voice settings
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      // Apply selected voice if available
      if (
        availableVoices.length > 0 &&
        voiceSettings.voiceIndex < availableVoices.length
      ) {
        utterance.voice = availableVoices[voiceSettings.voiceIndex];
      }

      // Show audio visualizer while speaking (only for non-test speaking)
      if (!isTest) {
        audioVisualizer.classList.add("active");
        isSpeaking = true;
      }

      utterance.onend = function () {
        if (!isTest) {
          audioVisualizer.classList.remove("active");
          isSpeaking = false;
          
          // Resume listening if it was active before
          if (wasListening) {
            setTimeout(() => {
              try {
                recognition.start();
              } catch (e) {
                console.log("Could not restart recognition", e);
              }
            }, 100);
          }
        }
      };

      synth.speak(utterance);
    }
  }

  // Process AI response from the API
  async function aiResponse(prompt) {
    // Add user message to chat
    // addMessage(prompt, "user");

    showTypingIndicator();

    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      let aiResponseText = data.candidates[0].content.parts[0].text;

      // Process text replacements as in the JS file
      let newText = aiResponseText
        .replace(/gprompt/g, "Kot 24 AI")
        .replace(/google/gi, "Yasir Abbas and Saad Riaz")
        .replace(/large language model/g, "Kot 24");

      removeTypingIndicator();
      addMessage(newText, "assistant");
      speak(newText);
    } catch (error) {
      console.error("AI processing error:", error);
      removeTypingIndicator();

      // Use fallback response
      fallbackAIProcess(prompt);
    }
  }

  // Fallback AI processing when API is unavailable
  function fallbackAIProcess(text) {
    const responses = {
      hello: "Hello! How can I help you today?",
      "how are you": "I am fine, Thank you for asking. How can I assist you?",
      "what can you do":
        "I can answer questions, provide information, assist with tasks, and have conversations.",
      help: "I can answer questions, provide information on various topics, assist with calculations, or just chat. What would you like help with?",
      time: `The current time is ${new Date().toLocaleTimeString()}.`,
      date: `Today is ${new Date().toLocaleDateString()}.`,
      thanks: "You're welcome! Is there anything else I can help with?",
      bye: "Goodbye! Feel free to return if you need assistance later.",
    };

    // Default response if no match
    let response = "I'm here to help. What would you like to know?";

    // Check for matches in our simple response dictionary
    for (const [key, value] of Object.entries(responses)) {
      if (text.toLowerCase().includes(key)) {
        response = value;
        break;
      }
    }

    setTimeout(() => {
      removeTypingIndicator();
      addMessage(response, "assistant");
      speak(response);
    }, 1000);
  }

  // Command processing function
  function takeCommand(command) {
    // Voice settings command
    if (
      command.includes("customize voice") ||
      command.includes("voice") ||
      command.includes("settings") ||
      command.includes("change") ||
      command.includes("voice")
    ) {
      let message =
        "You can customize my voice using the voice settings panel. Click the gear icon in the top right corner to access voice settings.";
      speak(message);
      addMessage(message, "assistant");

      // Open settings panel
      document.getElementById("settings-content").classList.add("open");
      return;
    }

    // Who are you command
    if (
      command.includes("who are you") ||
      command.includes("what is your name") ||
      command.includes("what's your name") ||
      command.includes("tell me about yourself") ||
      command.includes("hu r u")
    ) {
      let message =
        "I am Kot 24 AI, Your Virtual Assistant. I am here to assist you with your questions and tasks.";
      speak(message);
      addMessage(message, "assistant");
    }
    // How are you command
    else if (
      command.includes("how are you") ||
      command.includes("how are you doing") ||
      command.includes("how are you feeling") ||
      command.includes("how are you doing today") ||
      command.includes("how are you feeling today") ||
      command.includes("how r u")
    ) {
      let message = "I am fine, Thank you for asking. How can I assist you?";
      speak(message);
      addMessage(message, "assistant");
    }
    // Open YouTube
    else if (command.includes("open") && command.includes("youtube")) {
      let message = "Sure, Opening Youtube";
      speak(message);
      addMessage(message, "assistant");
      window.open("https://www.youtube.com");
    } else if(command.includes("stop")) {
      let message = "Okay, I will stop Responding now.";
      speak(message);
      addMessage(message, "assistant");
    }
    // Search YouTube
    else if (command.includes("search") && command.includes("youtube")) {
      // Extract the search query
      let searchQuery = "";
      console.log(command);

      if (command.includes("for") || command.includes("in")) {
        searchQuery = command.split("for")[1]?.trim() || command.split("in")[1]?.trim();
      } else if (command.includes("search youtube")) {
        searchQuery = command.split("search youtube")[1]?.trim();
      } else {
        searchQuery = command.split("search")[1]?.trim();
      }

      // Remove any "on youtube" text from the end if present
      searchQuery = (searchQuery || "").replace("on youtube", "").trim();

      if (searchQuery) {
        let message = `Sure, searching YouTube for ${searchQuery}`;
        speak(message);
        addMessage(message, "assistant");

        // Encode the search query and open YouTube search
        const encodedQuery = encodeURIComponent(searchQuery);
        window.open(
          `https://www.youtube.com/results?search_query=${encodedQuery}`
        );
      } else {
        let message = "What would you like to search for on YouTube?";
        speak(message);
        addMessage(message, "assistant");
      }
    }
    // Open GitHub
    else if (
      command.includes("open") &&
      (command.includes("github") || command.includes("my github"))
    ) {
      let message = "Sure, Opening Github";
      speak(message);
      addMessage(message, "assistant");
      window.open("https://github.com");
    }
    // Open Facebook
    else if (command.includes("open") && command.includes("facebook")) {
      let message = "Sure, Opening Facebook";
      speak(message);
      addMessage(message, "assistant");
      window.open("https://www.facebook.com");
    }
    // Open Instagram
    else if (command.includes("open") && command.includes("instagram")) {
      let message = "Sure, Opening Instagram";
      speak(message);
      addMessage(message, "assistant");
      window.open("https://www.instagram.com");
    }
    // Open Google
    else if (command.includes("open") && command.includes("google")) {
      let message = "Sure, Opening Google";
      speak(message);
      addMessage(message, "assistant");
      window.open("https://www.google.com");
    }
    // Search Google
    else if (command.includes("search") && command.includes("google")) {
      // Extract the search query
      const searchTerms = command
        .replace("search", "")
        .replace("google", "")
        .trim();

      if (searchTerms) {
        let message = `Sure, searching Google for "${searchTerms}"`;
        speak(message);
        addMessage(message, "assistant");

        // Construct the Google search URL
        let keyword = encodeURIComponent(searchTerms);
        window.open(`https://www.google.com/search?q=${keyword}`);
      } else {
        let message = "What do you want me to search for on Google?";
        speak(message);
        addMessage(message, "assistant");
      }
    }
    // Open ChatGPT
    else if (
      command.includes("open") &&
      (command.includes("chat gpt") ||
        command.includes("chatgpt") ||
        command.includes("gpt"))
    ) {
      let message = "Sure, Opening Chat GPT";
      speak(message);
      addMessage(message, "assistant");
      window.open("https://chat.openai.com/");
    }
    // Time command
    else if (command.includes("time")) {
      let time = new Date().toLocaleString(undefined, {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      let message = `Now the time is ${time}`;
      speak(message);
      addMessage(message, "assistant");
    }
    // Date command
    else if (command.includes("date")) {
      let date = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      let message = `Today's date is ${date}`;
      speak(message);
      addMessage(message, "assistant");
    }
    // Default - use AI response
    else {
      aiResponse(command);
    }
  }

  // Add message to chat area
  function addMessage(text, sender) {
    // Add to messages array (for state tracking)
    messages.push({
      text: text,
      sender: sender === "user" ? "user" : "ai",
      timestamp: new Date(),
    });

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.classList.add(
      sender === "user" ? "user-message" : "assistant-message"
    );

    // Process text for links, code, etc.
    const processedText = processTextForDisplay(text);
    messageDiv.innerHTML = processedText.replace(/\*/g, "");

    chatArea.appendChild(messageDiv);
    scrollToBottom();
  }

  // Process text to handle markdown-like formatting
  function processTextForDisplay(text) {
    // Convert URLs to clickable links
    text = text.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Simple code block formatting
    text = text.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

    // Simple inline code formatting
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Convert line breaks to <br>
    text = text.replace(/\n/g, "<br>");

    // Remove Asterik
    text.replace(/\*/g, "");

    return text;
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "assistant-message", "typing-indicator");
    typingDiv.innerHTML =
      '<div class="typing-dots"><span></span><span></span><span></span></div>';
    typingDiv.id = "typingIndicator";
    chatArea.appendChild(typingDiv);
    scrollToBottom();
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // Scroll chat to bottom
  function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
    
  // Show toast notification
  function showToast(message) {
    // Check if there's already a toast
    let toast = document.querySelector(".toast");
    if (toast) {
      toast.remove();
    }

    toast = document.createElement("div");
    toast.className = "toast";
    toast.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 12px 24px;
            border-radius: 20px;
            z-index: 1000;
            font-size: 14px;
            animation: fadeInOut 3s forwards;
        `;

    document.head.insertAdjacentHTML(
      "beforeend",
      `
            <style>
                @keyframes fadeInOut {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
            </style>
        `
    );

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Add typing indicator style
  function addTypingStyles() {
    document.head.insertAdjacentHTML(
      "beforeend",
      `
            <style>
                .typing-indicator {
                    padding: 12px 15px;
                    display: flex;
                    align-items: center;
                }
                
                .typing-dots {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .typing-dots span {
                    width: 8px;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    animation: typingDot 1.4s infinite ease-in-out;
                }
                
                .typing-dots span:nth-child(1) {
                    animation-delay: 0s;
                }
                
                .typing-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .typing-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes typingDot {
                    0%, 100% {
                        transform: scale(0.6);
                        opacity: 0.6;
                    }
                    50% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                code {
                    background: rgba(0,0,0,0.2);
                    padding: 2px 5px;
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 0.9em;
                }
                
                pre code {
                    background: rgba(0,0,0,0.3);
                    display: block;
                    padding: 12px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 10px 0;
                    white-space: pre-wrap;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                
                .listening {
                    animation: pulse 1.5s infinite ease-in-out;
                    background: rgba(255, 99, 71, 0.7) !important;
                }
            </style>
        `
    );
  }

  // Initialize everything
  function initialize() {
    initAssistant();
    addTypingStyles();

    // Add welcome message after delay
    setTimeout(() => {
      addMessage(
        "Hello! I'm Kot 24 AI, your virtual assistant. How can I help you today?",
        "assistant"
      );
      speak(
        "Hello! I'm Kot 24 AI, your virtual assistant. How can I help you today?"
      );
    }, 1000);
  }

  // Start everything
  initialize();
});
