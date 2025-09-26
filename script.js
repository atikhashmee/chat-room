 let LOCAL_USER_ID = null 
        let SIMULATED_USERS = []; 

        
        // DOM Element References
        const messagesEl = document.getElementById('messages');
        const inputForm = document.getElementById('input-form');
        const messageInput = document.getElementById('message-input');
        const userInfoEl = document.getElementById('user-info');
        const loadingOverlay = document.getElementById('loading-overlay');
        const userListEl = document.getElementById('user-list');
        
        // Call feature elements
        const audioCallBtn = document.getElementById('audio-call-btn');
        const videoCallBtn = document.getElementById('video-call-btn');
        const messageBox = document.getElementById('custom-message-box');
        const messageBoxText = document.getElementById('message-box-text');
        const userIdentifyName = document.getElementById('userIdentitiname');
        const activeUserHeader = document.getElementById('active-chat-user');

        let connectedSession = null;
        let activeContact = null;
        let connectedUsername = ""

        /**
         * Custom handler to display a temporary message instead of using alert().
         * @param {string} type The type of action requested (Audio/Video).
         */
        const handleCallAction = (type) => {
            messageBoxText.innerHTML = `<strong>${type} Call:</strong> This simulates a WebRTC connection attempt. In a real APIRTC app, this would initiate a peer-to-peer call.`;
            messageBox.style.display = 'block';
            
            // Auto-hide the message after 5 seconds
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        };

        /**
         * Converts a user ID string into a shorter, unique ID string.
         * @param {string} uid The full user ID.
         * @returns {string} A shortened, unique ID string.
         */
        const getShortUserId = (uid) => {
            if (!uid) return 'Anonymous';
            return uid.substring(0, 8);
        };

        const updateLocalSimulatedUser = (userId, name = "") => {
            let [id, user] = newUser(userId) 
            if (name != "") {
               user.name = name 
            }
            SIMULATED_USERS[id] = user
        }


        const newUser = (id) => {
            return [id, {
                id: id,
                name: ""
            }]
        }

        /**
         * Scrolls the message container to the bottom.
         */
        const scrollToBottom = () => {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        };
        
        /**
         * Updates the simulated user list displayed in the UI.
         */
        const updateUserList = () => {
            userListEl.innerHTML = '';
            SIMULATED_USERS.forEach(listuser => {
                const li = document.createElement('li');
                li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center', 'active-user-item');
                const span = document.createElement('span');
                span.textContent = listuser.id;
                li.setAttribute('contact-id', listuser.id)
                const namespan = document.createElement('span');
                namespan.textContent = listuser.name;
                li.appendChild(span);
                li.appendChild(namespan);
                if (listuser.id === LOCAL_USER_ID) {
                    const badge = document.createElement('span');
                    badge.classList.add('badge', 'badge-primary', 'badge-pill');
                    badge.textContent = 'You';
                    li.appendChild(badge);
                }
                userListEl.appendChild(li);
            });
        };

        /**
         * Renders a single message bubble into the chat area.
         * @param {object} message The message object.
         */
        const appendMessage = (message) => {
            const isCurrentUser = message.userId === LOCAL_USER_ID;
            const shortUserId = getShortUserId(message.userId);
            
            // Use local Date object for timestamp display
            const timestampValue = new Date(message.timestamp).toLocaleTimeString();

            const messageDiv = document.createElement('div');
            messageDiv.classList.add('d-flex');
            
            const alignmentClass = isCurrentUser ? 'justify-content-end' : 'justify-content-start';
            const bubbleClass = isCurrentUser ? 'message-bubble message-right' : 'message-bubble message-left';
            
            messageDiv.classList.add(alignmentClass);
            
            const bubble = document.createElement('div');
            bubble.className = bubbleClass;
            
            if (!isCurrentUser) {
                const senderSpan = document.createElement('span');
                senderSpan.classList.add('font-weight-bold', 'd-block', 'mb-1');
                senderSpan.style.fontSize = '0.7rem';
                senderSpan.textContent = shortUserId;
                bubble.appendChild(senderSpan);
            }
            
            const textContent = document.createTextNode(message.text);
            bubble.appendChild(textContent);

            const metaSpan = document.createElement('span');
            metaSpan.className = 'message-meta';
            metaSpan.textContent = timestampValue;
            bubble.appendChild(metaSpan);

            messageDiv.appendChild(bubble);
            messagesEl.appendChild(messageDiv);
        };

        /**
         * Simulates the connection and initialization of the APIRTC client.
         */
        const connectToApiRtc = () => {
            let userAgent = new apiRTC.UserAgent({
                uri: 'apzkey:b5f0036b112dcb3f6284a490b6361968'
            });
            userAgent.register({
                cloudUrl: 'https://cloud.apizee.com'
            }).then(function(session) {
                connectedSession = session;
                LOCAL_USER_ID = connectedSession.getId()
                userInfoEl.textContent = 'UserID: ' + getShortUserId(LOCAL_USER_ID);
                let userData = new apiRTC.UserData()
                connectedUsername = connectedUsername != "" ? connectedUsername : "Anonymous";  
                userData.setProp("name", connectedUsername)
                connectedSession.setUserData(userData)
                updateLocalSimulatedUser(LOCAL_USER_ID, connectedUsername)

                // for initial api call 
                updateUserList(); 
                // After connecting, hide loading overlay
                loadingOverlay.style.display = 'none';

                connectedSession.on('contactListUpdate', function(newJoineed) {
                    var contactListArray = connectedSession.getOnlineContactsArray()
                    contactListArray.forEach(onlineUser => {
                        updateLocalSimulatedUser(onlineUser.getId(), onlineUser.name ?? onlineUser.getUsername())
                    });
                    updateUserList(); 
                })
                
                //Listen to contact message events globally
                connectedSession.on('contactMessage', function(e) {

                    activeContact = connectedSession.getOrCreateContact(e.sender.getId()) 
                    updateActiveUserChatBox()

                    const newMessage = {
                        text: e.content,
                        userId: e.sender.getId(),
                        timestamp: new Date().getTime() // Local timestamp
                    };
                
                    appendMessage(newMessage);
                    scrollToBottom();
                });

            }).catch(function(error) {
                console.error('User agent registering failed', error);
            });
        };

        /**
         * Handles sending a new message (simulated API/WebRTC broadcast).
         * @param {Event} e The form submit event.
         */
        const sendMessage = async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            

            if (!text && activeContact == null) {
                return;
            }

            try {
                const newMessage = {
                    text: text,
                    userId: LOCAL_USER_ID,
                    timestamp: new Date().getTime() // Local timestamp
                };
                
                appendMessage(newMessage);
                scrollToBottom();
                activeContact.sendMessage(text)
                messageInput.value = '';
            } catch (error) {
                console.error("Error sending message (simulated):", error);
            }
        };

        /**
         * Initializes the chat interface and connection.
         */
        const initializeApp = async () => {
            await connectToApiRtc();
            
            

            // Attach event listeners
            inputForm.addEventListener('submit', sendMessage);
            
            audioCallBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleCallAction('Audio');
            });
            videoCallBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleCallAction('Video');
            });
        };

        // $('#usermodal').modal("show")

        // $("#usermodal").on('hide.bs.modal', function(e) {
        //     connectedUsername = userIdentifyName.value || "" 
        // }) 
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }


        const updateActiveUserChatBox = () => {
            if (activeContact != null) {
                activeUserHeader.innerHTML = activeContact.getUsername()
            }
        }


        document.querySelector("#user-list").addEventListener("click", e => {
            let allactiveuser = document.querySelectorAll(".active-user-item")
            allactiveuser.forEach(element => {
               element.classList.remove('active') 
            });
            let currentTarget = e.target;
            let closestLi = currentTarget.closest("li");
            let contactid = closestLi.getAttribute('contact-id')
            closestLi.classList.add('active')
            activeContact = connectedSession.getOrCreateContact(contactid) 
            updateActiveUserChatBox()
        })