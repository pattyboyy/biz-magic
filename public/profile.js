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
        displayUserProfile(data);
    } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Failed to load profile. Please try again later.');
    }
}

// Display User Profile
function displayUserProfile(data) {
    const profileContent = document.getElementById('profileContent');
    const userEmail = document.getElementById('userEmail');
    const savedPlansContainer = document.getElementById('savedPlans');

    // Display user email
    userEmail.textContent = data.email || 'Email not available';

    // Display saved plans
    savedPlansContainer.innerHTML = ''; // Clear existing content
    if (data.savedPlans && data.savedPlans.length > 0) {
        data.savedPlans.forEach((plan, index) => {
            let parsedPlan;
            try {
                parsedPlan = JSON.parse(plan);
            } catch (error) {
                console.log('Plan is not in JSON format:', plan);
                parsedPlan = {
                    businessType: 'Unnamed Plan',
                    location: 'Unknown Location',
                    dateCreated: new Date().toISOString(),
                    content: plan
                };
            }
            const planElement = document.createElement('div');
            planElement.className = 'bg-white rounded-lg shadow-md p-4 mb-4';
            planElement.innerHTML = `
                <h4 class="font-bold text-lg mb-2">${parsedPlan.businessType || 'Unnamed Plan'}</h4>
                <p class="text-sm text-gray-600 mb-2">Created on: ${new Date(parsedPlan.dateCreated).toLocaleDateString()}</p>
                <p class="text-sm mb-2">Location: ${parsedPlan.location || 'Unknown Location'}</p>
                <button onclick="expandPlan(${index})" class="mt-2 text-blue-500 hover:text-blue-700">View Full Plan</button>
                <button onclick="deletePlan(${index})" class="mt-2 ml-2 text-red-500 hover:text-red-700">Delete Plan</button>
            `;
            savedPlansContainer.appendChild(planElement);
        });
    } else {
        savedPlansContainer.innerHTML = '<p>No saved plans yet.</p>';
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

// Function to delete a plan
async function deletePlan(index) {
    if (confirm('Are you sure you want to delete this plan?')) {
        try {
            const response = await fetch('/api/delete-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ planIndex: index }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete plan');
            }

            alert('Plan deleted successfully');
            fetchUserProfile(); // Refresh the profile to show updated list
        } catch (error) {
            console.error('Error deleting plan:', error);
            alert('Failed to delete plan. Please try again later.');
        }
    }
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