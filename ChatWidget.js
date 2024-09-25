// ChatWidget.js
class ChatWidget {
    constructor(clientId, tokenServerUrl, preferredLanguage) {
        this.clientId = clientId;
        this.tokenServerUrl = tokenServerUrl;
        this.preferredLanguage = preferredLanguage;
        this.session = null;
        this.modal = null;
        this.isInitialized = false;
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'chatModal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <div id="chatContainerDivID" class="chat-container">
                    <div id="message-container"></div>
                    <div class="input-container">
                        <textarea id="messageInput" placeholder="Type your message..."></textarea>
                        <button id="sendButton" onClick="sendMessage()">Send</button>
                    </div>
                    <div class="button-container">
                        <button id="talkButton">Talk</button>
                        <button id="muteButton">Mute</button>
                        <button id="speakerButton">Speaker</button>
                        <select id="languageDropdown"></select>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
        this.setupStyles();
        this.setupCloseButton();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #chatModal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0, 0, 0, 0.5);
            }
            .modal-content {
                background-color: white;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                width: 80%;
                max-width: 600px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .close-button {
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }
            .chat-container {
                display: flex;
                flex-direction: column;
                height: 400px;
                overflow: hidden;
            }
            .message-container {
                flex-grow: 1;
                overflow-y: auto;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            .input-container {
                display: flex;
                flex-direction: column;
                margin-top: 10px;
            }
            textarea {
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 5px;
                resize: none;
                overflow: hidden;
            }
            button {
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 10px;
                cursor: pointer;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    }

    setupCloseButton() {
        const closeButton = this.modal.querySelector('.close-button');
        closeButton.onclick = () => this.closeModal();
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        };
    }

    openModal() {
        if (!this.modal) {
            this.createModal();
        }
        this.modal.style.display = 'block';
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    async initialize() {
        if (this.isInitialized) return;

        const HexaEight = (await import('./hexaeightsession.mjs')).default;
        const { HexaEightChat } = await import('./hexaeightAIchat.mjs');

        this.session = new HexaEight();
        await this.session.init(this.clientId, this.tokenServerUrl, "hexaeight-user-container");
        const initialized = await this.session.ready();
        console.log("Session is initialized: " + initialized);

        // Ensure the modal is created before calling populateLanguageDropdown
        this.createModal();

        // Initialize HexaEightChat
        HexaEightChat.init({
            chatContainerId: "chatContainerDivID",
            session: this.session,
            messageCallback: this.handleMessage.bind(this),
        });

        const languageDropdown = document.getElementById("languageDropdown");
        HexaEightChat.populateLanguageDropdown(
            languageDropdown,
            "talkButton",
            "speakerButton",
            "muteButton"
        );
        HexaEightChat.setPreferredLanguage(this.preferredLanguage, languageDropdown);

        this.isInitialized = true;
    }

    handleMessage(request, message) {
        // Handle incoming messages
        this.session.DecipherMessage(request).then(req => {
            if (JSON.parse(req).BODY === "RENDER") {
                const codeToExecute = JSON.parse(this.session.DecipherMessage(message)).BODY;
                const asyncFunction = new Function(`(async () => { ${codeToExecute} })();`);
                asyncFunction();
            }
            console.log("Received new message:", message);
            console.log("Received new request:", request);
        }).catch(error => {
            console.error("Error handling message:", error);
        });
    }

    async sendMessage(messageText) {
        if (messageText !== "") {
            await this.session.EngageAI(messageText);
        }
    }
}

// Expose ChatWidget globally
window.ChatWidget = ChatWidget;
