document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const closeBtns = document.getElementsByClassName('close');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const myProfileBtn = document.getElementById('myProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (loginBtn) {
        loginBtn.onclick = function() {
            loginModal.style.display = "block";
        }
    }

    if (registerBtn) {
        registerBtn.onclick = function() {
            registerModal.style.display = "block";
        }
    }

    // Close button functionality
    Array.from(closeBtns).forEach(btn => {
        btn.onclick = function() {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = "none";
            } else {
                console.warn('Modal not found for this close button');
            }
        }
    });

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (loginModal && event.target == loginModal) {
            loginModal.style.display = "none";
        }
        if (registerModal && event.target == registerModal) {
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
    const businessForm = document.getElementById('businessForm');
    const businessTypeInput = document.getElementById('businessType');
    const locationInput = document.getElementById('location');
    const loadingIcon = document.getElementById('loadingIcon');
    const resultDiv = document.getElementById('result');
    const businessPlanDiv = document.getElementById('businessPlan');
    const saveEntirePlanBtn = document.getElementById('saveEntirePlan');

    if (businessForm) {
        businessForm.addEventListener('submit', async function(e) {
            e.preventDefault();
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
                saveEntirePlanBtn.classList.remove('hidden');
            } catch (error) {
                console.error('Error generating business plan:', error);
                alert(`Failed to generate business plan: ${error.message}`);
            } finally {
                loadingIcon.classList.add('hidden');
            }
        });
    }

    // Save Entire Plan functionality
    if (saveEntirePlanBtn) {
        saveEntirePlanBtn.addEventListener('click', async function() {
            if (!authToken) {
                alert('Please log in to save the business plan.');
                return;
            }

            console.log('Save Entire Plan button clicked');

            try {
                const sections = businessPlanDiv.querySelectorAll('.section');
                let fullPlanContent = [];
                sections.forEach(section => {
                    const title = section.querySelector('h3').textContent;
                    const content = section.querySelector('.section-content').textContent;
                    fullPlanContent.push({ title, content });
                });

                const planToSave = {
                    businessType: businessTypeInput.value,
                    location: locationInput.value,
                    dateCreated: new Date().toISOString(),
                    sections: fullPlanContent
                };

                console.log('Plan to save:', planToSave); // Debugging line

                const response = await fetch('/api/save-plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ planContent: planToSave }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to save entire plan');
                }

                const responseData = await response.json();
                console.log('Server response:', responseData); // Debugging line

                alert('Entire business plan saved successfully!');
            } catch (error) {
                console.error('Error saving entire plan:', error);
                alert(`Failed to save entire plan: ${error.message}`);
            }
        });
    }

    // Expand section functionality with visualizations
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
                    
                    // Generate and add visualizations
                    const visualizations = generateVisualizations(data.expandedContent, sectionTitle);
                    if (visualizations.length > 0) {
                        const visualizationContainer = document.createElement('div');
                        visualizationContainer.className = 'visualization-container mt-4';
                        visualizations.forEach(viz => {
                            visualizationContainer.appendChild(viz);
                        });
                        section.appendChild(visualizationContainer);
                    }
                    
                    learnMoreBtn.style.display = 'none'; // Hide the button after expanding
                } catch (error) {
                    console.error('Error expanding section:', error);
                    alert(`Failed to expand section: ${error.message}`);
                }
            });
        });
    }

    function generateVisualizations(content, sectionTitle) {
        const visualizations = [];
        
        // Extract numerical data from the content
        const numbers = content.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length > 1) {
            // Create a bar chart
            const barChartContainer = document.createElement('div');
            barChartContainer.style.width = '100%';
            barChartContainer.style.height = '300px';
            
            const barChart = new Chart(barChartContainer, {
                type: 'bar',
                data: {
                    labels: numbers.map((_, index) => `Data ${index + 1}`),
                    datasets: [{
                        label: 'Numerical Data',
                        data: numbers.map(Number),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: `${sectionTitle} - Data Visualization`
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
            
            visualizations.push(barChartContainer);
        }
        
        // Add more visualization types based on the content and section title
        if (sectionTitle.toLowerCase().includes('financial') || sectionTitle.toLowerCase().includes('projection')) {
            // Create a line chart for financial projections
            const lineChartContainer = document.createElement('div');
            lineChartContainer.style.width = '100%';
            lineChartContainer.style.height = '300px';
            
            const projectionData = extractProjectionData(content);
            const lineChart = new Chart(lineChartContainer, {
                type: 'line',
                data: {
                    labels: projectionData.labels,
                    datasets: [{
                        label: 'Financial Projection',
                        data: projectionData.data,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    title: {
                        display: true,
                        text: 'Financial Projections'
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
            
            visualizations.push(lineChartContainer);
        }
        
        return visualizations;
    }

    function extractProjectionData(content) {
        // This is a simplified example. You may need to adjust this based on the actual content structure.
        const yearsRegex = /Year (\d+)[\s\S]*?(\$[\d,]+)/g;
        const matches = [...content.matchAll(yearsRegex)];
        
        return {
            labels: matches.map(match => `Year ${match[1]}`),
            data: matches.map(match => parseFloat(match[2].replace('$', '').replace(',', '')))
        };
    }

    // Chat Functionality
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendChatMessage();
        });
    }

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

    if (ticker) {
        updateTicker();
        setInterval(updateTicker, 60000); // Update every minute
    }

    // Authentication
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
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
                localStorage.setItem('username', data.username); // Store username
                loginModal.style.display = "none";
                updateUIForLoggedInUser(data.username);
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    const registerPassword = document.getElementById('registerPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');

    if (registerForm) {
        // Password strength checker
        registerPassword.addEventListener('input', function() {
            const password = this.value;
            let strength = 0;
            
            if (password.match(/[a-z]+/)) strength += 1;
            if (password.match(/[A-Z]+/)) strength += 1;
            if (password.match(/[0-9]+/)) strength += 1;
            if (password.match(/[$@#&!]+/)) strength += 1;
            if (password.length >= 8) strength += 1;

            switch (strength) {
                case 0:
                case 1:
                    passwordStrength.textContent = 'Weak';
                    passwordStrength.className = 'text-sm mt-1 text-red-500';
                    break;
                case 2:
                case 3:
                    passwordStrength.textContent = 'Moderate';
                    passwordStrength.className = 'text-sm mt-1 text-yellow-500';
                    break;
                case 4:
                case 5:
                    passwordStrength.textContent = 'Strong';
                    passwordStrength.className = 'text-sm mt-1 text-green-500';
                    break;
            }
        });

        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const password = registerPassword.value;
            const confirmedPassword = confirmPassword.value;

            // Check if passwords match
            if (password !== confirmedPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            // Check password strength
            if (passwordStrength.textContent === 'Weak') {
                alert('Please choose a stronger password.');
                return;
            }

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
    }

    function updateUIForLoggedInUser(username) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (myProfileBtn) myProfileBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (usernameDisplay) {
            usernameDisplay.textContent = `Welcome, ${username}`;
            usernameDisplay.style.display = 'inline-block';
        }
    }

    function updateUIForLoggedOutUser() {
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (myProfileBtn) myProfileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (usernameDisplay) {
            usernameDisplay.textContent = '';
            usernameDisplay.style.display = 'none';
        }
    }

    function logout() {
        clearAuthToken();
        localStorage.removeItem('username'); // Clear stored username
        updateUIForLoggedOutUser();
        window.location.href = '/index.html'; // Redirect to home page after logout
    }

    // Update the profile button click handler
    if (myProfileBtn) {
        myProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (authToken) {
                window.location.href = '/profile.html';
            } else {
                alert('Please log in to view your profile.');
            }
        });
    }

    // Logout button functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Check authentication status on page load
    function checkAuthStatus() {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
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
                    if (window.location.pathname === '/profile.html') {
                        fetchUserProfile();
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching username:', error);
                clearAuthToken();
                updateUIForLoggedOutUser();
                if (window.location.pathname === '/profile.html') {
                    window.location.href = '/index.html';
                }
            });
        } else {
            updateUIForLoggedOutUser();
            if (window.location.pathname === '/profile.html') {
                window.location.href = '/index.html';
            }
        }
    }

    // Call checkAuthStatus on page load
    checkAuthStatus();

    // Initial UI update based on authentication status
    checkAuthStatus();
});