document.addEventListener('DOMContentLoaded', (event) => {
    const messageArea = document.getElementById('message-area');
    const sendButton = document.getElementById('send');
    const fileInput = document.querySelector("#file-input");
    const fileInputBtn = document.querySelector("#file-input-btn");
    const chatBody = document.querySelector(".chat-body");
    const attachmentAlert = document.querySelector(".attachment-confirmed");
    const userData = {
        message: null,
        file: {
            data: null,
            mimi_type: null
        }
    }
    
    //API setup
    const API_KEY = 'AIzaSyC5o5WDtts25fEGQdJzUSmQEnMghGNmpdQ';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    //used focus and blur to only show send button when the user clicks on the message area.
    messageArea.addEventListener('focus', () => {
        sendButton.style.display = 'block';
    });
    messageArea.addEventListener('blur', () => {
        if (messageArea.value.trim() === '') {
            sendButton.style.display = 'none';
        }
    });
    
    //generate bot response 
    const generateBotResponse = async (incomingMessageDiv) =>{
        const messageElement = incomingMessageDiv.querySelector(".message-text");

        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{
                    parts: [{text: userData.message}, ...(userData.file.data ? [{inline_data: userData.file}] : [])]
                }]
            })
        }

        try{
            const response = await fetch(API_URL, requestOptions);
            const data = await response.json();
            if(!response.ok) throw new Error(data.error.message);
            
            const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
            messageElement.innerText = apiResponseText;
            userData.file.data = null;
        }catch(error){
            console.log(error);
            messageElement.innerText = error.message;
            messageElement.style.color = "#ff0000";
        }finally{
            incomingMessageDiv.classList.remove("thinking");
            chatBody.scrollTo({top: chatBody.scrollHeight, behavior:"smooth"});
        }
    }

    // Create div function
    const createMessageElement = (content, classes) => {
        const div = document.createElement("div");
        div.classList.add("message", classes);
        div.innerHTML = content;
        return div;
    }

    //function to handle outgoing user messages
    const handleOutgoingMessage = () => {
        const messageContent = `
                                ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" />` : ""}
                                <div class="message-text"></div>`;

        const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
        outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
        chatBody.appendChild(outgoingMessageDiv);
        chatBody.scrollTo({top:chatBody.scrollHeight, behavior: "smooth"});

        //function to show the thinking indicator dots
        setTimeout(() => {
            const messageContent = 
            ` <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                        <path
                            d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z">
                        </path>
                    </svg>
                    <div class="message-text bot">
                       <div class="thinking-indicator">
                        <div class="dot"></div>
                       <div class="dot"></div>
                       <div class="dot"></div>
                       </div>
                    </div>`;
            const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
            chatBody.appendChild(incomingMessageDiv);
            generateBotResponse(incomingMessageDiv);
        },1000);
    }

    // event listeners for sending messages when either a user clicks on the send button or presses enter button
    sendButton.addEventListener('click', () =>{
        const userMessge = messageArea.value.trim();
        if(userMessge){
            userData.message = userMessge;
            handleOutgoingMessage();
            messageArea.value = '';
        }
    })
    messageArea.addEventListener("keydown", (e) => {
        const userMessge = e.target.value.trim();
        if(e.key === 'Enter' && userMessge){
            userData.message = userMessge;
            handleOutgoingMessage();
            e.target.value = '';
        }
    });

    // handle file input change
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if(!file) return;
        attachmentAlert.style.display = "block";
        setTimeout(() => {
            attachmentAlert.style.display = "none";
        }, 2000);
        const reader = new FileReader();
        reader.onload = (e) =>{
            const base64String = e.target.result.split(",")[1];

            userData.file = {
                data: base64String,
                mime_type: file.type
            }

            fileInput.value = "";
        }

        reader.readAsDataURL(file);
    })
    fileInputBtn.addEventListener("click", () => fileInput.click());
});