// Authentication token management
let authToken = localStorage.getItem('authToken');

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('authToken');
}

// Fetch User Profile
async function fetchUserProfile() {
    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        const profileContent = document.getElementById('profileContent');
        profileContent.innerHTML = `
            <h3 class="font-bold text-xl mb-4">Saved Business Plans</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${data.savedPlans.map((plan, index) => {
                    let parsedPlan;
                    try {
                        parsedPlan = JSON.parse(plan);
                    } catch (error) {
                        console.log('Plan is not in JSON format:', plan);
                        // Treat the plan as a simple string
                        parsedPlan = {
                            businessType: 'Unnamed Plan',
                            location: 'Unknown Location',
                            dateCreated: new Date().toISOString(),
                            content: plan
                        };
                    }
                    return `
                        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                            <h4 class="font-bold text-lg mb-2">${parsedPlan.businessType || 'Unnamed Plan'}</h4>
                            <p class="text-sm text-gray-600 mb-2">Created on: ${new Date(parsedPlan.dateCreated).toLocaleDateString()}</p>
                            <p class="text-sm">${(parsedPlan.content || parsedPlan.sections?.[0]?.content || '').substring(0, 100)}...</p>
                            <button onclick="expandPlan(${index})" class="mt-2 text-blue-500 hover:text-blue-700">View Full Plan</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        // Store the plans in localStorage for the expandPlan function to use
        localStorage.setItem('savedPlans', JSON.stringify(data.savedPlans));
    } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Failed to load profile. Please try again later.');
    }
}

// Function to expand a plan
function expandPlan(index) {
    const plans = JSON.parse(localStorage.getItem('savedPlans') || '[]');
    let plan = plans[index];
    let parsedPlan;
    
    try {
        parsedPlan = JSON.parse(plan);
    } catch (error) {
        console.log('Plan is not in JSON format:', plan);
        // Treat the plan as a simple string
        parsedPlan = {
            businessType: 'Unnamed Plan',
            location: 'Unknown Location',
            dateCreated: new Date().toISOString(),
            content: plan
        };
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
    modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white">
            <div class="mt-3 text-center">
                <h3 class="text-lg leading-6 font-medium text-gray-900">${parsedPlan.businessType || 'Unnamed Plan'}</h3>
                <div class="mt-2 px-7 py-3 text-left">
                    ${parsedPlan.sections ? 
                        parsedPlan.sections.map(section => `
                            <div class="mb-4">
                                <h4 class="font-bold">${section.title}</h4>
                                <p class="text-sm whitespace-pre-wrap">${section.content}</p>
                            </div>
                        `).join('') 
                        : 
                        `<p class="text-sm whitespace-pre-wrap">${parsedPlan.content}</p>`
                    }
                </div>
                <div class="items-center px-4 py-3">
                    <button id="closeModal" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('closeModal').onclick = () => modal.remove();
}

// Update UI for logged-in user
function updateUIForLoggedInUser(username) {
    document.getElementById('usernameDisplay').textContent = `Welcome, ${username}`;
}

// Logout function
document.getElementById('logoutBtn').addEventListener('click', () => {
    clearAuthToken();
    window.location.href = 'index.html';
});

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
                fetchUserProfile();
            }
        })
        .catch(error => {
            console.error('Error fetching username:', error);
            clearAuthToken();
            window.location.href = 'index.html';
        });
    } else {
        window.location.href = 'index.html';
    }
});

// Add event listener for profile refresh button if it exists
const refreshButton = document.getElementById('refreshProfile');
if (refreshButton) {
    refreshButton.addEventListener('click', fetchUserProfile);
}