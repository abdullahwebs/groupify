
if (localStorage.getItem('group_id') && localStorage.getItem('username')) {
    if (!sessionStorage.getItem('startTime')) {
        sessionStorage.setItem('startTime', Date.now());
    }

    window.onbeforeunload = function () {
        let endTime = Date.now();
        let startTime = parseInt(sessionStorage.getItem('startTime'));
        let timeSpent = (endTime - startTime) / 1000;
        console.log(`User spent ${timeSpent} seconds in the group`);

        // Send time to the backend (replace with your API endpoint)
        axios.post('http://localhost:8000/time_user_spent/', {
            "username": localStorage.getItem('username'),
            "group_id": localStorage.getItem('group_id'),
            "time_spent": timeSpent
        })

        sessionStorage.removeItem('startTime');
    };

}

// Function to handle message editing
document.getElementById('chat-container').addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit_message');

    if (editButton) {
        // Check if another message is being edited
        const existingEdit = document.querySelector('.edit-input');
        if (existingEdit) return; // Prevent multiple edits at the same time

        let messageDiv = editButton.closest('.message');
        let textMessage = messageDiv.querySelector('.textMessage');
        let username = messageDiv.querySelector('.inmessageUsername')?.innerText || '';
        let oldMessage = textMessage.innerText.replace(username, '').trim();

        // Create an input field pre-filled with the message
        let inputField = document.createElement('input');
        inputField.type = 'text';
        inputField.className = 'edit-input';
        inputField.value = oldMessage;

        // Create an update button
        let updateButton = document.createElement('button');
        updateButton.innerText = 'Update';
        updateButton.className = 'update_message';

        // Replace message text with input field and button
        textMessage.innerHTML = '';
        textMessage.appendChild(inputField);
        textMessage.appendChild(updateButton);

        // Add event listener to update button
        updateButton.addEventListener('click', () => {
            let newMessage = inputField.value.trim();
            if (newMessage) {
                console.log('Updated message:', newMessage);
                textMessage.innerHTML = `<span class="text">${newMessage}</span>`;
                axios.post('http://localhost:8000/update_message/', {
                    "id": messageDiv.querySelector('.messageId').value,
                    "message": newMessage
                })
                    .then(response => {
                        console.log(response.data)
                    })

            } else {
                alert("Message cannot be empty!");
            }
        });
    }
});

// Ensure the user is logged in. Redirect to the registration page if not.
if (!localStorage.getItem('username')) {
    window.location.replace('http://localhost:8000/register/');
}


if (!localStorage.getItem('group')) {

    document.getElementById('mainChat').innerHTML = `
    <div class="welcome-message">
 <h1 class="welcome-heading">WELCOME</h1>
 <p class="welcome-subtext">Start your journey by joining or creating a group.</p>
 </div>
    `
}

function checkJoined() {
    return axios.post('http://localhost:8000/checkJoined/', {
        'username': localStorage.getItem('username'),
        'group_id': localStorage.getItem('group_id')
    })
        .then(response => {
            if (response.data.result == true) {
                return true
            }
            else {
                return false
            }
        })
        .catch(error => {
            console.error("Error:", error);
            return null;
        });
}


// UI manipulation handler
async function joinHandler() {
    let controlAccess = document.getElementById('controlAccess');
    let chatInputLock = document.getElementById('message_form')

    try {
        let isJoined = await checkJoined();
        if (isJoined) {
            controlAccess.innerHTML = 'Leave Group';
            chatInputLock.innerHTML = `
        
<div class="input-container">


    <!-- Message Input -->
    <input type="text" placeholder="Type a message" name="message" id="messageInput" class="form-control">
    
        <!-- File Attachment Icon -->
    <label for="attached_file" class="attachfile">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="24" height="24">
            <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 38.6C310.1 219.5 256 287.4 256 368c0 59.1 29.1 111.3 73.7 143.3c-3.2 .5-6.4 .7-9.7 .7L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zm48 96a144 144 0 1 1 0 288 144 144 0 1 1 0-288zm16 80c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 48-48 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l48 0 0 48c0 8.8 7.2 16 16 16s16-7.2 16-16l0-48 48 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-48 0 0-48z"/>
        </svg>
    </label>
    <input type="file" id="attached_file" name="file">

    <!-- Send Button -->
    <button type="submit" id="sendMessageBtn">
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>
    </button>
</div>

<!-- Hidden Inputs for Metadata -->
<input type="hidden" id="sender" name="sender">
<input type="hidden" id="group" name="group">

<!-- Additional Send Button (Hidden) -->
<button class="message_send">Send</button>



          `
            controlAccess.addEventListener('click', () => {
                axios.post('http://localhost:8000/leaveGroup/', {
                    "username": localStorage.getItem('username'),
                    "group_id": localStorage.getItem('group_id')
                })
                    .then(response => {
                        console.log(response.data);
                    });
                window.location.reload()
            });
        } else {
            controlAccess.innerHTML = 'Join Group';
            chatInputLock.innerHTML = `
       <p style="margin:auto;color:#bebebe;">Join This Group To Chat With Other Members.</p>
       `
            controlAccess.addEventListener('click', () => {
                axios.post('http://localhost:8000/groupJoined/', {
                    "username": localStorage.getItem('username'),
                    "group_id": localStorage.getItem('group_id')
                })
                    .then(response => {
                        console.log(response.data);
                    });
                window.location.reload()
            });
        }
    } catch (error) {
        console.error("Error checking joined status:", error);
    }
}

// Call the function
joinHandler();


document.addEventListener('DOMContentLoaded', () => {

    // Fetch and display joined groups
    function getJoinedGroups() {
        axios.post('http://localhost:8000/renderJoined/', {
            'username': localStorage.getItem('username'),
        })
            .then(response => {
                console.log("Fetched joined groups:", response.data);
                renderJoinedGroups(response.data);
            })
            .catch(error => console.error('Error fetching joined groups:', error));
    }

    // Function to render chat groups inside #joinedlist
    const renderJoinedGroups = (groups) => {
        const chatList = document.getElementById('joinedlist');
        if (!chatList) {
            console.error("Element with ID 'joinedlist' not found.");
            return;
        }
        if (!groups || groups.length === 0) {
            chatList.innerHTML = "<p>No joined groups yet.</p>";
            return;
        }

        // Clear previous list
        chatList.innerHTML = '';

        groups.forEach(group => {
            // Create chat item
            const chatItem = document.createElement('div');
            chatItem.classList.add('chat-item');
            chatItem.setAttribute('data-group-id', group.id); // Store ID in dataset

            // Avatar image
            const avatar = document.createElement('img');
            avatar.src = `/static/group_dp/${group.image}`;
            avatar.classList.add('avatar');
            avatar.alt = 'Group';

            // Group name and description
            const textContainer = document.createElement('div');
            textContainer.classList.add('chat-info');

            const groupName = document.createElement('h3');
            groupName.classList.add('group_name');
            groupName.textContent = group.name;

            const groupDesc = document.createElement('p');
            groupDesc.classList.add('group_desc');
            groupDesc.textContent = group.desc;

            textContainer.appendChild(groupName);
            textContainer.appendChild(groupDesc);
            chatItem.appendChild(avatar);
            chatItem.appendChild(textContainer);



            // Make chat-item clickable to open chat
            chatItem.addEventListener('click', () => {
                localStorage.setItem('group_id', group.id);
                document.getElementById('group_name_header').textContent = group.name;
                document.getElementById('header_avatar').src = `/static/group_dp/${group.image}`;
                localStorage.setItem('group', group.name)
                localStorage.setItem('group_id', group.id)
                localStorage.setItem('group_image', group.image)
                localStorage.setItem('server_group', group.name.replace(/\s+/g, ''))
                window.location.reload()
            });


            chatList.appendChild(chatItem);
        });
    }       // Load groups when page loads
    getJoinedGroups();
});



// Goups Search Handler

const inputElement = document.getElementById('groupSeachInput');

// Add an event listener for the 'input' event
inputElement.addEventListener('input', function (event) {
    // Log the current value of the input to the console
    console.log('Input value:', event.target.value);

});

// Dynamic group fetch + Add to DOM
var groupsParent = document.querySelector('#chatlist')
function addGroups() {

}



// Declare WebSocket globally so it can be accessed by other functions.
let websocket;

// Fetch previous chat messages for the current group.
const fetchChats = () => {
    const fetchChatUrl = 'http://localhost:8000/get_chats/';
    const fetchChatData = { "group": localStorage.getItem('group') };

    axios.post(fetchChatUrl, fetchChatData)
        .then(response => renderArchivedChats(response.data))
        .catch(error => console.error('Error fetching chats:', error));
};

// Checking File type coming from backend
function getFileType(fileName) {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    const videoExtensions = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"];
    const audioExtensions = ["mp3", "wav", "ogg", "aac", "flac", "m4a"];

    const fileExtension = fileName.split('.').pop().toLowerCase();

    if (imageExtensions.includes(fileExtension)) {
        return "image";
    } else if (videoExtensions.includes(fileExtension)) {
        return "video";
    } else if (audioExtensions.includes(fileExtension)) {
        return "audio";
    } else {
        return "unknown"; // Not an image, video, or audio
    }
}


// Render archived chat messages into the chat container.
const renderArchivedChats = (chats) => {
    const messageBox = document.getElementById('chat-container');
    messageBox.innerHTML = ''; // Clear previous messages.

    chats.forEach(chat => {
        const isOutgoing = chat.sender === localStorage.getItem('username');

        const div = document.createElement('div');
        div.className = isOutgoing ? 'message outgoing' : 'message incoming';
        if (chat.unsent === true) {
            div.innerHTML = `<p class="textMessage"><em>Unsent message</em></p>`
        }
        else {
            const span = document.createElement('span');
            const p = document.createElement('p');
            const input = document.createElement('p');

            span.textContent = chat.sender
            p.innerHTML = chat.message
            input.value = chat.id

            span.setAttribute('class', 'inmessageUsername')
            p.setAttribute('class', 'textMessage')
            input.setAttribute('class', 'messageId')
            input.setAttribute('type', 'hidden')

            div.appendChild(span)
            div.appendChild(p)
            div.appendChild(input)


        }

        // Add message actions only for outgoing messages
        if (isOutgoing) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = `
                <button class="action-btn delete_message">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                    </svg>
                </button> 
                <button class="action-btn edit_message">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"/>
                    </svg>
                </button> 
            `;
            div.appendChild(actionsDiv);
        }

        // Handle attached files (if any)
        if (chat.file !== 'null') {
            if (chat.unsent !== true) {



                let mediaElement;
                const fileType = getFileType(chat.file);

                if (fileType === 'video') {
                    mediaElement = document.createElement('video');
                    mediaElement.setAttribute('controls', true);
                    mediaElement.src = `../static/uploads/${chat.file}`;
                }
                else if (fileType === 'image') {
                    mediaElement = document.createElement('img');
                    mediaElement.src = `../static/uploads/${chat.file}`;
                }
                else if (fileType === 'audio') {
                    mediaElement = document.createElement('div');
                    mediaElement.innerHTML = `
                    <audio controls>
                        <source src="../static/uploads/${chat.file}" type="audio/mpeg">
                        <source src="../static/uploads/${chat.file}" type="audio/ogg">
                        Your browser does not support the audio tag.
                    </audio>
                `;
                }

                if (mediaElement) {
                    mediaElement.className = 'attached_file';
                    div.appendChild(mediaElement);
                }
            }
        }
        messageBox.appendChild(div);
    });
};



// Unsend Message Handler using Event Delegation
document.getElementById('chat-container').addEventListener('click', (event) => {
    const deleteButton = event.target.closest('.delete_message');
    if (deleteButton) {
        let messageDiv = deleteButton.closest('.message');
        let messageId = messageDiv.querySelector('.messageId').value;

        console.log(messageId);

        // Confirm before unsending
        if (confirm("Are you sure you want to unsend this message?")) {
            unsendMessage(messageId, messageDiv);
        }
    }
});

// Function to handle message deletion
const unsendMessage = (messageId, messageElement) => {
    axios.post(`http://localhost:8000/unsend_message/`, { 'id': messageId })
        .then(response => {
            if (response.data.unsent === true) {
                messageElement.innerHTML = `<p class="textMessage"><em>Unsent message</em></p>`;
            } else {
                alert("Failed to unsend message.");
            }
        })
        .catch(error => console.error("Error deleting message:", error));
};





// Handle message actions (Edit, Delete, Unsend)
const handleMessageActions = (event) => {
    const actionBtn = event.target.closest('.action-btn');
    if (!actionBtn) return;

    const messageContainer = event.target.closest('.message');
    const messageId = messageContainer.querySelector('.messageId').value;

    if (actionBtn.textContent === '✎') {
        // Edit message logic
        console.log('Edit message:', messageId);
    } else if (actionBtn.textContent === '🗑️') {
        // Delete message logic
        console.log('Delete message:', messageId);
    } else if (actionBtn.textContent === '↩️') {
        // Unsend message logic
        console.log('Unsend message:', messageId);
    }
};

// Initialize WebSocket for real-time messaging.
const initializeWebSocket = () => {
    const url = `ws://${window.location.host}/ws/websocket-server/${localStorage.getItem('group_id')}/`;
    websocket = new WebSocket(url); // Assign to the global variable.

    websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'serverchat') {
            const messageBox = document.getElementById('chat-container');

            const div = document.createElement('div');
            div.className = message.username === localStorage.getItem('username') ? 'message outgoing' : 'message incoming';

            div.innerHTML = `
                <p class="textMessage">
                    <span class="inmessageUsername">${message.username}: </span>
                    ${message.message}
                </p>
                <input type="hidden" value="${message.id}" class="messageId">
                <div class="message-actions">
                    <button class="action-btn">✎</button> <!-- Edit -->
                    <button class="action-btn">🗑️</button> <!-- Delete -->
                    <button class="action-btn">↩️</button> <!-- Unsend -->
                </div>
            `;

            if (message.file !== 'null') {
                const img = document.createElement('img');
                img.src = `../static/uploads/${message.file}`;
                img.className = 'attached_file';
                div.appendChild(img);
            }

            messageBox.appendChild(div);
        }
    };
};

// Handle message form submission.
const handleMessageSubmit = (event) => {
    event.preventDefault();
    const sender = document.getElementById('sender').value = localStorage.getItem('username')
    const group = document.getElementById('group').value = localStorage.getItem('group')
    const messageInput = event.target.messageInput.value || 'null';
    const fileInput = document.getElementById('attached_file');
    const file = fileInput.files[0];
    const fileName = file ? file.name : 'null';
    const formData = new FormData(event.target);

    fetch('http://localhost:8000/save_chats/', {
        method: 'POST',
        body: formData,
    })
        .then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error saving message:', error));

    // Send the message via WebSocket.
    websocket.send(
        JSON.stringify({
            message: messageInput,
            username: localStorage.getItem('username'),
            file: fileName,
        })
    );

    event.target.messageInput.value = ''; // Clear the input field.
};

// Initialize the chat application.
const initializeChatApp = () => {
    // Set group name and avatar in the header.
    document.getElementById('group_name_header').textContent = localStorage.getItem('group');
    document.getElementById('header_avatar').src = `../static/group_dp/${localStorage.getItem('group_image')}`;

    // Attach event listeners.
    document.querySelectorAll('.chat-item').forEach(item => item.addEventListener('click', handleChatItemClick));
    document.addEventListener('click', handleMessageActions);
    document.getElementById('message_form').addEventListener('submit', handleMessageSubmit);

    // Fetch and render archived chats.
    fetchChats();

    // Initialize WebSocket for real-time messaging.
    initializeWebSocket();
};

// Run the initialization function when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', initializeChatApp);



const handleChatItemClick = (event) => {
    const chatItem = event.currentTarget;
    const imageSrc = chatItem.querySelector('.avatar').getAttribute('src');
    const imageName = imageSrc.split('/').pop();
    const groupName = chatItem.querySelector('.group_name').textContent;
    const group_id = chatItem.querySelector('.group_id').value

    localStorage.setItem('group_id', group_id)
    localStorage.setItem('group', groupName);
    localStorage.setItem('group_image', imageName);
    localStorage.setItem('server_group', groupName.replace(/\s+/g, ''))
    window.location.reload();
};

// Searching and adding groups + rendering intrests groups 

// Function to add event listeners to chat items
const addChatItemEventListeners = () => {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(chatItem => {
        chatItem.addEventListener('click', handleChatItemClick);
    });
};

// Function to render chat groups
const renderChatGroups = (groups) => {
    const chatList = document.getElementById('chatlist');
    if (!groups || groups.length === 0) return;

    // Remove existing chat items and append only new ones
    chatList.innerHTML = '';
    groups.forEach(group => {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');

        const avatar = document.createElement('img');
        avatar.src = `/static/group_dp/${group.image}`;
        avatar.classList.add('avatar');
        avatar.alt = 'Group';

        const textContainer = document.createElement('div');
        const groupName = document.createElement('h3');
        groupName.classList.add('group_name');
        groupName.textContent = group.name;

        const groupDesc = document.createElement('p');
        groupDesc.classList.add('group_desc');
        groupDesc.textContent = group.desc;

        const groupId = document.createElement('input')
        groupId.setAttribute('type', 'hidden')
        groupId.value = group.id
        groupId.setAttribute('class', 'group_id')

        textContainer.appendChild(groupName);
        textContainer.appendChild(groupDesc);
        chatItem.appendChild(avatar);
        chatItem.appendChild(textContainer);
        chatItem.appendChild(groupId);


        chatList.appendChild(chatItem);
    });


    addChatItemEventListeners();
};


// Fetch groups from the server
const fetchAllGroups = () => {
    axios.post('http://localhost:8000/renderIntrest/', { username: localStorage.getItem('username') })
        .then(response => {
            if (response.data && response.data.data) {
                console.log(response.data.data)
                renderChatGroups(response.data.data);
            } else {
                throw new Error('Invalid response from server');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('chatlist').innerHTML = '<p class="error-message">Failed to load groups. Please try again later.</p>';
        });
};

fetchAllGroups();

// Group search functionality
const groupSearchInput = document.getElementById('groupSeachInput');
groupSearchInput.addEventListener('input', function (event) {
    const userInput = event.target.value.trim();
    if (userInput === '') {
        fetchAllGroups();
        return;
    }
    axios.post('http://localhost:8000/groupSearch/', { name: userInput })
        .then(response => {
            if (response.data && response.data.data.length > 0) {
                renderChatGroups(response.data.data);
            }
        })
        .catch(error => console.error('Search Error:', error));
});



