// Modal functionality
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeBtns = document.getElementsByClassName('close');
const usernameDisplay = document.getElementById('usernameDisplay');

loginBtn.onclick = function() {
    loginModal.style.display = "block";
}

registerBtn.onclick = function() {
    registerModal.style.display = "block";
}

// Close button functionality
Array.from(closeBtns).forEach(btn => {
    btn.onclick = function() {
        btn.closest('.modal').style.display = "none";
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == loginModal) {
        loginModal.style.display = "none";
    }
    if (event.target == registerModal) {
        registerModal.style.display = "none";
    }
}

// Authentication token management
let authToken = localStorage.getItem('authToken');

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('authToken', token);
    console.log('Auth token set:', authToken);
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('authToken');
}

// Business Plan Generation
const generatePlanBtn = document.getElementById('generatePlan');
const businessTypeInput = document.getElementById('businessType');
const locationInput = document.getElementById('location');
const loadingIcon = document.getElementById('loadingIcon');
const resultDiv = document.getElementById('result');
const businessPlanDiv = document.getElementById('businessPlan');

generatePlanBtn.addEventListener('click', async function() {
    if (!authToken) {
        alert('Please log in to generate a business plan.');
        return;
    }

    console.log('Generate Plan button clicked');

    loadingIcon.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                businessIdea: businessTypeInput.value,
                location: locationInput.value
            }),
        });

        console.log('Request sent to /api/generate-plan');

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error response:', errorData);
            throw new Error(errorData.error || 'Failed to generate business plan');
        }

        const data = await response.json();
        console.log('Response received from /api/generate-plan:', data);

        businessPlanDiv.innerHTML = ''; // Clear previous content
        const sections = data.businessPlan.split(/\n(?=\d\.)/).filter(section => section.trim());
        sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.classList.add('section', 'p-4', 'mb-4', 'bg-white', 'rounded-lg', 'shadow-md');

            const sectionTitle = section.split('\n')[0];
            const sectionContent = section.split('\n').slice(1).join('\n');

            sectionDiv.innerHTML = `
                <h3 class="font-bold text-lg mb-2">${sectionTitle}</h3>
                <p class="section-content mb-2 whitespace-pre-line">${sectionContent}</p>
                <button class="learn-more-btn text-blue-500 underline">Learn More</button>
            `;
            businessPlanDiv.appendChild(sectionDiv);
        });

        addLearnMoreFunctionality();
        resultDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Error generating business plan:', error);
        alert(`Failed to generate business plan: ${error.message}`);
    } finally {
        loadingIcon.classList.add('hidden');
    }
});

// Expand section functionality
function addLearnMoreFunctionality() {
    const sections = businessPlanDiv.querySelectorAll('div.section');
    sections.forEach(section => {
        const learnMoreBtn = section.querySelector('.learn-more-btn');

        learnMoreBtn.addEventListener('click', async function() {
            const sectionTitle = section.querySelector('h3').textContent;
            try {
                const response = await fetch('/api/expand-section', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        sectionTitle: sectionTitle,
                        businessIdea: businessTypeInput.value,
                        location: locationInput.value
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to expand section');
                }

                const data = await response.json();
                section.querySelector('.section-content').innerHTML = data.expandedContent;
                learnMoreBtn.style.display = 'none'; // Hide the button after expanding
            } catch (error) {
                console.error('Error expanding section:', error);
                alert(`Failed to expand section: ${error.message}`);
            }
        });
    });
}

// Chat Functionality
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');
const chatMessages = document.getElementById('chatMessages');

sendChatBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

async function sendChatMessage() {
    if (!authToken) {
        alert('Please log in to use the chat feature.');
        return;
    }

    const question = chatInput.value.trim();
    if (question === '') return;

    displayMessage('You', question);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                question: question,
                context: businessPlanDiv.innerText
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get answer');
        }

        const data = await response.json();
        
        displayMessage('Assistant', data.answer);
    } catch (error) {
        console.error('Error in chat:', error);
        displayMessage('System', `Failed to get an answer: ${error.message}`);
    }

    chatInput.value = '';
}

function displayMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'mb-2';
    messageElement.innerHTML = `<strong class="font-bold ${sender === 'You' ? 'text-blue-600' : 'text-green-600'}">${sender}:</strong> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Trending Business Ideas Ticker
const ticker = document.getElementById('ticker');

async function updateTicker() {
    try {
        const response = await fetch('/api/trending-ideas');
        if (!response.ok) {
            throw new Error('Failed to fetch trending ideas');
        }
        const data = await response.json();
        ticker.innerHTML = data.trendingIdeas.join(' &bull; ');
    } catch (error) {
        console.error('Error fetching trending ideas:', error);
        ticker.innerHTML = 'Failed to load trending ideas';
    }
}

updateTicker();
setInterval(updateTicker, 60000); // Update every minute

// Authentication
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        setAuthToken(data.token);
        loginModal.style.display = "none";
        alert('Logged in successfully!');
        updateUIForLoggedInUser(data.username); // Pass username to function
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        registerModal.style.display = "none";
        alert('Registered successfully! Please log in.');
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
});

function updateUIForLoggedInUser(username) {
    loginBtn.style.display = 'none';
    registerBtn.style.display = 'none';
    usernameDisplay.textContent = `Welcome ${username}`;
    const logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'py-2 px-3 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-400 transition duration-300';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = logout;
    registerBtn.parentNode.appendChild(logoutBtn);
}

function logout() {
    clearAuthToken();
    location.reload();
}

// Check authentication status on page load
window.addEventListener('load', function() {
    if (authToken) {
        // Fetch username from server or decode from token if included
        fetch('/api/get-username', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch username');
            }
            return response.json();
        })
        .then(data => {
            if (data.username) {
                updateUIForLoggedInUser(data.username);
            }
        })
        .catch(error => console.error('Error fetching username:', error));
    }
});
