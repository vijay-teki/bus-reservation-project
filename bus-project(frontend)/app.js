document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://jetbus-api.onrender.com/api';

    // --- Global State ---
    let currentUser = null;
    let currentPage = 'auth';
    let selectedBusForBooking = null;
    let selectedSeatNumber = null;
    let allBusesCache = []; // Cache for buses to avoid re-fetching

    // --- DOM Elements ---
    const sections = {
        auth: document.getElementById('auth-section'),
        user: document.getElementById('user-dashboard-section'),
        admin: document.getElementById('admin-dashboard-section')
    };
    const navButtons = {
        auth: document.getElementById('nav-auth'),
        user: document.getElementById('nav-user-dashboard'),
        admin: document.getElementById('nav-admin-dashboard'),
        logout: document.getElementById('nav-logout')
    };

    // Auth Form
    const demoCredentialsBox = document.getElementById('demo-credentials-box');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const toggleLoginBtn = document.getElementById('toggle-login');
    const toggleRegisterBtn = document.getElementById('toggle-register');
    const nameField = document.getElementById('name-field');
    const authNameInput = document.getElementById('auth-name');
    const authEmailInput = document.getElementById('auth-email');
    const authPasswordInput = document.getElementById('auth-password');
    const roleSelectField = document.getElementById('role-select-field');
    const authRoleSelect = document.getElementById('auth-role');
    const authSubmitBtn = document.getElementById('auth-submit-btn');

    // User Dashboard
    const userNameDisplay = document.getElementById('user-name-display');
    const searchBusForm = document.getElementById('search-bus-form');
    const searchSourceInput = document.getElementById('search-source');
    const searchDestinationInput = document.getElementById('search-destination');
    const searchResultsDiv = document.getElementById('search-results');
    const userReservationsListDiv = document.getElementById('user-reservations-list');

    // Admin Dashboard
    const addBusForm = document.getElementById('add-bus-form');
    const allBusesListDiv = document.getElementById('all-buses-list');

    // Modals
    const messageModal = document.getElementById('message-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const seatSelectionModal = document.getElementById('seat-selection-modal');
    const editBusModal = document.getElementById('edit-bus-modal');

    const messageModalOkBtn = document.getElementById('message-modal-ok');
    const confirmModalOkBtn = document.getElementById('confirm-modal-ok');
    const seatModalBookBtn = document.getElementById('seat-modal-book-btn');
    const editBusForm = document.getElementById('edit-bus-form');
    const editBusIdInput = document.getElementById('edit-bus-id');
    
    let confirmCallback = null;

    // --- Utility Functions ---
    const showLoading = (button, text = "Loading...") => {
        if(button) {
            button.dataset.originalText = button.textContent;
            button.textContent = text;
            button.disabled = true;
        }
    };
    const hideLoading = (button) => {
        if(button && button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            button.disabled = false;
        }
    };

    const showModal = (modalElement) => modalElement.classList.remove('hidden');
    const hideModal = (modalElement) => modalElement.classList.add('hidden');
    
    function showMessage(title, message) {
        const modal = document.getElementById('message-modal');
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = `<p>${message}</p>`;
        showModal(modal);
    }

    function showConfirm(title, message, callback) {
        const modal = document.getElementById('confirm-modal');
        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-body').innerHTML = `<p>${message}</p>`;
        confirmCallback = callback;
        showModal(modal);
    }

    // --- Core UI Management ---
   function updateUIForAuthStatus() {
    Object.values(sections).forEach(section => section.classList.add('hidden'));
    Object.values(navButtons).forEach(btn => btn.classList.add('hidden'));

    if (currentUser) {
        // User is LOGGED IN
        navButtons.logout.classList.remove('hidden');
        if (demoCredentialsBox) demoCredentialsBox.classList.add('hidden'); // <-- Hides the instructions

        if (currentUser.role === 'USER') {
            navButtons.user.classList.remove('hidden');
            currentPage = 'user';
            sections.user.classList.remove('hidden');
            userNameDisplay.textContent = currentUser.name;
            fetchUserReservations();
            searchResultsDiv.innerHTML = '<p style="color:black;">Search for a bus to see available routes.</p>';
        } else if (currentUser.role === 'ADMIN') {
            navButtons.admin.classList.remove('hidden');
            currentPage = 'admin';
            sections.admin.classList.remove('hidden');
            fetchAllBusesForAdmin();
        }
    } else {
        // User is LOGGED OUT
        navButtons.auth.classList.remove('hidden');
        currentPage = 'auth';
        sections.auth.classList.remove('hidden');
        if (demoCredentialsBox) demoCredentialsBox.classList.remove('hidden'); // <-- Shows the instructions
        handleAuthToggle('login');
    }

    Object.values(navButtons).forEach(btn => btn.classList.remove('active'));
    if (navButtons[currentPage]) {
        navButtons[currentPage].classList.add('active');
    }
}
    
    // --- Navigation ---
    Object.keys(navButtons).forEach(key => {
        if(key !== 'logout') {
            navButtons[key].addEventListener('click', () => {
                const requiredRole = key === 'admin' ? 'ADMIN' : (key === 'user' ? 'USER' : null);
                if (!requiredRole || (currentUser && currentUser.role === requiredRole)) {
                    currentPage = key;
                    updateUIForAuthStatus();
                } else if (!currentUser && key === 'auth') {
                    currentPage = 'auth';
                    updateUIForAuthStatus();
                }
            });
        }
    });
    navButtons.logout.addEventListener('click', () => handleLogout());

    // --- Authentication ---
    let isRegisterMode = false;
    function handleAuthToggle(mode) {
        isRegisterMode = (mode === 'register');
        authTitle.textContent = isRegisterMode ? 'Create a New Account' : 'Login to Your Account';
        nameField.classList.toggle('hidden', !isRegisterMode);
        authNameInput.required = isRegisterMode;
        roleSelectField.classList.toggle('hidden', isRegisterMode);
        authSubmitBtn.textContent = isRegisterMode ? 'Register Account' : 'Login';
        toggleLoginBtn.classList.toggle('active', !isRegisterMode);
        toggleRegisterBtn.classList.toggle('active', isRegisterMode);
        authForm.reset();
    }
    toggleLoginBtn.addEventListener('click', () => handleAuthToggle('login'));
    toggleRegisterBtn.addEventListener('click', () => handleAuthToggle('register'));

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(authSubmitBtn, isRegisterMode ? "Registering..." : "Logging In...");
        
        const endpoint = isRegisterMode ? 'register' : 'login';
        const body = {
            email: authEmailInput.value,
            password: authPasswordInput.value,
        };
        if (isRegisterMode) body.name = authNameInput.value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (isRegisterMode) {
                const data = await response.json();
                if (response.ok) {
                    showMessage('Registration Success', `Welcome, ${data.name}! Please log in.`);
                    handleAuthToggle('login');
                } else {
                    showMessage('Registration Failed', data.message || 'An error occurred.');
                }
            } else { // Login
                 if (!response.ok) {
                    const errorMessage = await response.text();
                    showMessage('Login Failed', errorMessage || 'Invalid email or password.');
                    return;
                }
                const data = await response.json();
                if (data.role !== authRoleSelect.value) {
                    showMessage('Login Failed', `Authentication successful, but you tried to log in as ${authRoleSelect.value}. Your role is ${data.role}. Please select the correct role.`);
                    return;
                }
                currentUser = data;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUIForAuthStatus();
            }
        } catch (error) {
            console.error(`${endpoint} error:`, error);
            showMessage('Network Error', `Could not connect to the server. Please try again later.`);
        } finally {
            hideLoading(authSubmitBtn);
        }
    });
    
    function handleLogout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showMessage('Logged Out', 'You have been successfully logged out.');
        updateUIForAuthStatus();
    }

    // --- API Fetch Functions ---
    async function apiRequest(url, options = {}, triggerButton = null, loadingText = "Loading...") {
        if(triggerButton) showLoading(triggerButton, loadingText);
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
            if (response.status === 204) {
                 return null;
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            }
            return response.text();

        } catch (error) {
            console.error('API Request Error:', error);
            if (error.message.includes('Failed to fetch')) {
                 const method = options.method || 'GET';
                 let corsMessage = `For ${method} operations, ensure your Spring Boot backend is configured with @CrossOrigin to allow the ${method} method from this origin.`;
                 showMessage('Network Error', `Could not connect to the API. This can happen if the server is down or if a CORS policy is blocking the request. ${corsMessage}`);
            } else {
                 showMessage('API Error', error.message);
            }
            return Promise.reject(error);
        } finally {
            if(triggerButton) hideLoading(triggerButton);
        }
    }

    // --- User Dashboard ---
    searchBusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const source = searchSourceInput.value;
        const destination = searchDestinationInput.value;
        searchResultsDiv.innerHTML = '<p class="message info" style="color:black;">Searching for buses...</p>';
        try {
            const buses = await apiRequest(`${API_BASE_URL}/buses/search?source=${source}&destination=${destination}`);
            renderBusCards(buses);
        } catch (error) {
            searchResultsDiv.innerHTML = `<p class="message error" style="color:black;">Could not fetch buses. Please try again.</p>`;
        }
    });

    function renderBusCards(buses) {
        searchResultsDiv.innerHTML = '';
        if (!buses || buses.length === 0) {
            searchResultsDiv.innerHTML = '<p class="message info " style="color:black;">No buses found for this route.</p>';
            return;
        }
        buses.forEach(bus => {
            const bookedSeatsCount = Object.values(bus.bookedSeats ?? {}).filter(id => id !== null).length;
            const seatsAvailableCount = bus.totalSeats - bookedSeatsCount;
            const busCard = document.createElement('div');
            busCard.className = 'bus-card';
            busCard.innerHTML = `
                <div class="card-header">
                    <h4>${bus.busNumber}</h4>
                    <p class="route">${bus.source} to ${bus.destination}</p>
                </div>
                <div class="card-body">
                    <p><strong>Departure:</strong> ${bus.departureTime}</p>
                    <p><strong>Available Seats:</strong> ${seatsAvailableCount} / ${bus.totalSeats}</p>
                    <p class="price">₹${(bus.price ?? 0.00).toFixed(2)}</p>
                </div>
                <div class="card-footer">
                    <button
                        class="button success-button book-button full-width"
                        ${seatsAvailableCount === 0 || !currentUser || currentUser.role !== 'USER' ? 'disabled' : ''}>
                        ${seatsAvailableCount === 0 ? 'No Seats' : 'View Seats & Book'}
                    </button>
                </div>
            `;
            searchResultsDiv.appendChild(busCard);
            const bookButton = busCard.querySelector('.book-button');
            if (bookButton) {
                bookButton.addEventListener('click', () => openSeatSelectionModal(bus));
            }
        });
    }

    function openSeatSelectionModal(bus) {
        selectedBusForBooking = bus;
        selectedSeatNumber = null;
        const seatModalTitle = seatSelectionModal.querySelector('.modal-title');
        const selectedSeatDisplay = seatSelectionModal.querySelector('#selected-seat-display');
        const seatModalPriceDisplay = seatSelectionModal.querySelector('#seat-modal-price-display');
        const seatMapContainer = seatSelectionModal.querySelector('#seat-map-container');
        
        seatModalTitle.textContent = `Select a Seat for ${bus.busNumber}`;
        selectedSeatDisplay.innerHTML = 'Selected Seat: <strong>None</strong>';
        seatModalPriceDisplay.innerHTML = `<strong>Price:</strong> ₹${(bus.price ?? 0.00).toFixed(2)}`;
        seatModalBookBtn.disabled = true;
        
        renderSeatMap(seatMapContainer, bus);
        showModal(seatSelectionModal);
    }
    
   function renderSeatMap(seatMapContainer, bus) {
    seatMapContainer.innerHTML = ''; // Clear previous map
    for (let i = 1; i <= bus.totalSeats; i++) {
        const seatButton = document.createElement('button');
        const seatNumberSpan = document.createElement('span');
        seatNumberSpan.textContent = i;
        seatButton.appendChild(seatNumberSpan);

        seatButton.classList.add('seat-button');

        // Logic to place seats in a 2+2 layout with an aisle
        const seatMod = (i - 1) % 4; // 0, 1, 2, 3
        if (seatMod < 2) {
            // First 2 seats (columns 1 and 2)
            seatButton.style.gridColumn = seatMod + 1;
        } else {
            // Last 2 seats (columns 4 and 5, skipping column 3 for the aisle)
            seatButton.style.gridColumn = seatMod + 2;
        }

        const isBooked = bus.bookedSeats && bus.bookedSeats[i] != null;
        seatButton.classList.toggle('available', !isBooked);
        seatButton.classList.toggle('booked', isBooked);
        seatButton.disabled = isBooked;

        if (!isBooked) {
            seatButton.addEventListener('click', () => handleSeatSelection(i, seatButton, seatMapContainer));
        }
        seatMapContainer.appendChild(seatButton);
    }
}
    
    function handleSeatSelection(seatNum, clickedButton, seatMapContainer) {
        const previouslySelected = seatMapContainer.querySelector('.seat-button.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }
        clickedButton.classList.add('selected');
        selectedSeatNumber = seatNum;
        const selectedSeatDisplay = seatSelectionModal.querySelector('#selected-seat-display');
        selectedSeatDisplay.innerHTML = `Selected Seat: <strong>${seatNum}</strong>`;
        seatModalBookBtn.disabled = false;
    }
    
    // Located within the app.js file

function handleBookSeat() {
    if (!selectedBusForBooking || !selectedSeatNumber) {
        showMessage('Booking Error', 'Please select a seat before booking.');
        return;
    }
    showConfirm(
        'Confirm Booking',
        `Are you sure you want to book seat ${selectedSeatNumber} on bus ${selectedBusForBooking.busNumber} for ₹${(selectedBusForBooking.price ?? 0.00).toFixed(2)}?`,
        async (confirmed) => {
            if (confirmed) {
                const reservationData = {
                    userId: currentUser.id,
                    busId: selectedBusForBooking.id,
                    seatNumber: selectedSeatNumber,
                    date: new Date().toISOString().slice(0, 10),
                };
                try {
                    const data = await apiRequest(`${API_BASE_URL}/reservations/book`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reservationData),
                    }, seatModalBookBtn, 'Booking...');
                    
                    // --- FIX: Change the order of the next two lines ---
                    hideModal(seatSelectionModal); // Hide the modal first
                    showMessage('Booking Success', `Seat ${selectedSeatNumber} booked successfully! Your reservation ID is ${data.id}.`); // Then show the success message
                    
                    if (searchSourceInput.value && searchDestinationInput.value) {
                        searchBusForm.dispatchEvent(new Event('submit'));
                    }
                    fetchUserReservations();
                } catch (error) {
                    // Error message is handled by apiRequest
                }
            }
        }
    );
}

    async function fetchUserReservations() {
        userReservationsListDiv.innerHTML = '<p class="message info" style="color:black;">Loading reservations...</p>';
        try {
            const reservations = await apiRequest(`${API_BASE_URL}/reservations/user/${currentUser.id}`);
            if (!allBusesCache.length) {
                 allBusesCache = await apiRequest(`${API_BASE_URL}/buses/all`);
            }
            const busMap = new Map(allBusesCache.map(bus => [bus.id, bus]));
            
            const reservationsWithBusInfo = reservations.map(res => ({
                ...res,
                busDetails: busMap.get(res.busId)
            }));
            renderUserReservations(reservationsWithBusInfo);
        } catch (error) {
            userReservationsListDiv.innerHTML = `<p class="message error" style="color:black;">Could not load reservations.</p>`;
        }
    }

    function renderUserReservations(reservations) {
        userReservationsListDiv.innerHTML = '';
        if (reservations.length === 0) {
            userReservationsListDiv.innerHTML = '<p class="message info" style="color:black;">You have no active or past reservations.</p>';
            return;
        }
        reservations.sort((a, b) => (a.status === 'BOOKED' ? -1 : 1) || new Date(b.date) - new Date(a.date));
        reservations.forEach(res => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            const busInfo = res.busDetails ? `${res.busDetails.busNumber} (${res.busDetails.source} to ${res.busDetails.destination})` : 'Bus details unavailable';
            const statusClass = res.status === 'BOOKED' ? 'status-booked' : 'status-cancelled';
            card.innerHTML = `
                <h4>${busInfo}</h4>
                <p><strong>Seat:</strong> ${res.seatNumber} | <strong>Date:</strong> ${res.date}</p>
                <p><strong>Status:</strong> <span class="${statusClass}">${res.status}</span></p>
                ${res.status === 'BOOKED' ? `
                <button class="button danger-button cancel-reservation-btn" data-reservation-id="${res.id}">Cancel</button>` : ''}
            `;
            userReservationsListDiv.appendChild(card);
        });

        document.querySelectorAll('.cancel-reservation-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const reservationId = e.target.dataset.reservationId;
                showConfirm('Confirm Cancellation', 'Are you sure you want to cancel this reservation?', async (confirmed) => {
                    if(confirmed) {
                        try {
                           const message = await apiRequest(`${API_BASE_URL}/reservations/cancel/${reservationId}`, { method: 'PUT' }, e.target, 'Cancelling...');
                           showMessage('Success', message);
                           fetchUserReservations();
                           if (searchSourceInput.value && searchDestinationInput.value) {
                                searchBusForm.dispatchEvent(new Event('submit'));
                           }
                        } catch(error) { /* Handled by apiRequest */ }
                    }
                });
            });
        });
    }

    // --- Admin Dashboard ---
    addBusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const triggerButton = e.target.querySelector('button[type="submit"]');
        const busData = {
            busNumber: e.target.elements.busNumber.value,
            source: e.target.elements.source.value,
            destination: e.target.elements.destination.value,
            departureTime: e.target.elements.departureTime.value,
            totalSeats: parseInt(e.target.elements.totalSeats.value, 10),
            price: parseFloat(e.target.elements.price.value)
        };
        try {
            const data = await apiRequest(`${API_BASE_URL}/buses/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(busData),
            }, triggerButton, 'Adding...');
            showMessage('Success', `Bus ${data.busNumber} added successfully!`);
            addBusForm.reset();
            fetchAllBusesForAdmin();
        } catch (error) { /* Handled by apiRequest */ }
    });

    async function fetchAllBusesForAdmin() {
        allBusesListDiv.innerHTML = '<p class="message info" style="color:black;">Loading all buses...</p>';
        try {
            const buses = await apiRequest(`${API_BASE_URL}/buses/all`);
            allBusesCache = buses;
            renderAdminBusCards(buses);
        } catch (error) {
            allBusesListDiv.innerHTML = `<p class="message error" style="color:black;">Could not load buses.</p>`;
        }
    }

    function renderAdminBusCards(buses) {
        allBusesListDiv.innerHTML = '';
        if (buses.length === 0) {
            allBusesListDiv.innerHTML = '<p class="message info" style="color:black;">No buses found in the system.</p>';
            return;
        }
        buses.forEach(bus => {
            const bookedSeatsCount = Object.values(bus.bookedSeats ?? {}).filter(id => id !== null).length;
            const card = document.createElement('div');
            card.className = 'bus-card admin-bus-card';
            card.innerHTML = `
                <h4>${bus.busNumber}</h4>
                <p><strong>ID:</strong> ${bus.id.substring(0, 8)}...</p>
                <p><strong>Route:</strong> ${bus.source} to ${bus.destination}</p>
                <p><strong>Departure:</strong> ${bus.departureTime}</p>
                <p><strong>Price:</strong> ₹${(bus.price ?? 0.00).toFixed(2)}</p>
                <p><strong>Seats:</strong> ${bookedSeatsCount} booked / ${bus.totalSeats} total</p>
                <div class="button-group">
                    <button class="button warning-button edit-bus-btn">Edit</button>
                    <button class="button danger-button delete-bus-btn">Delete</button>
                </div>
            `;
            allBusesListDiv.appendChild(card);
            
            card.querySelector('.edit-bus-btn').addEventListener('click', () => openEditBusModal(bus));
            card.querySelector('.delete-bus-btn').addEventListener('click', (e) => handleDeleteBus(bus.id, e.target));
        });
    }

    function openEditBusModal(bus) {
        editBusForm.reset();
        editBusIdInput.value = bus.id;
        editBusForm.elements.busNumber.value = bus.busNumber;
        editBusForm.elements.source.value = bus.source;
        editBusForm.elements.destination.value = bus.destination;
        editBusForm.elements.departureTime.value = bus.departureTime;
        editBusForm.elements.totalSeats.value = bus.totalSeats;
        editBusForm.elements.price.value = bus.price;
        showModal(editBusModal);
    }
    
    editBusForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const busId = editBusIdInput.value;
        const triggerButton = e.target.querySelector('button[type="submit"]');
        const updatedBusData = {
            busNumber: e.target.elements.busNumber.value,
            source: e.target.elements.source.value,
            destination: e.target.elements.destination.value,
            departureTime: e.target.elements.departureTime.value,
            totalSeats: parseInt(e.target.elements.totalSeats.value, 10),
            price: parseFloat(e.target.elements.price.value) 
        };
        try {
            const data = await apiRequest(`${API_BASE_URL}/buses/update/${busId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedBusData),
            }, triggerButton, 'Updating...');
            showMessage('Success', `Bus ${data.busNumber} updated successfully!`);
            hideModal(editBusModal);
            fetchAllBusesForAdmin();
        } catch (error) { /* Handled by apiRequest */ }
    });

    function handleDeleteBus(busId, triggerButton) {
        showConfirm('Confirm Deletion', 'Are you sure you want to delete this bus? This action cannot be undone.', async (confirmed) => {
            if (confirmed) {
                try {
                    const message = await apiRequest(`${API_BASE_URL}/buses/delete/${busId}`, { method: 'DELETE' }, triggerButton, 'Deleting...');
                    showMessage('Success', message || 'Bus deleted successfully.');
                    fetchAllBusesForAdmin();
                } catch(error) { /* Handled by apiRequest */ }
            }
        });
    }

    // --- Modal Event Listeners ---
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal);
                if(modal.id === 'confirm-modal' && confirmCallback) {
                    confirmCallback(false);
                }
            }
        });
        modal.querySelectorAll('.modal-close-button, .secondary-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                hideModal(modal);
                if(modal.id === 'confirm-modal' && confirmCallback) {
                    confirmCallback(false);
                }
            });
        });
    });

    messageModalOkBtn.addEventListener('click', () => hideModal(messageModal));
    
    confirmModalOkBtn.addEventListener('click', () => {
        hideModal(confirmModal);
        if (confirmCallback) confirmCallback(true);
    });

    seatModalBookBtn.addEventListener('click', handleBookSeat);


    // --- Initial Load ---
    function initializeApp() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
            } catch (e) {
                console.error("Failed to parse stored user:", e);
                localStorage.removeItem('currentUser');
                currentUser = null;
            }
        }
        updateUIForAuthStatus();
    }

    initializeApp();
});



// --- Password Preview Toggle Logic ---
document.addEventListener('click', function(e) {
    const icon = e.target.closest('.password-toggle-icon');
    if (!icon) return;

    const passwordInput = icon.previousElementSibling;
    const eyeOpen = icon.querySelector('.eye-open');
    const eyeClosed = icon.querySelector('.eye-closed');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        passwordInput.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }

});
