// Space Launch Tracker
// Fetches upcoming launches from The Space Devs API

const API_URL = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=12&mode=detailed';

// DOM Elements
const launchesContainer = document.getElementById('launches');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');

// Fetch launches from API
async function fetchLaunches() {
    showLoading();
    
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch launches');
        }
        
        const data = await response.json();
        displayLaunches(data.results);
    } catch (error) {
        console.error('Error fetching launches:', error);
        showError();
    }
}

// Display launches in the grid
function displayLaunches(launches) {
    hideLoading();
    launchesContainer.innerHTML = '';
    
    launches.forEach(launch => {
        const card = createLaunchCard(launch);
        launchesContainer.appendChild(card);
    });
    
    // Start countdown timers
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
}

// Create a launch card element
function createLaunchCard(launch) {
    const card = document.createElement('div');
    card.className = 'launch-card';
    
    const imageUrl = launch.image || 'https://via.placeholder.com/400x200/1a1a3a/6495ED?text=🚀+Launch';
    const provider = launch.launch_service_provider?.name || 'Unknown Provider';
    const missionDescription = launch.mission?.description || 'Mission details to be announced.';
    const launchDate = new Date(launch.net);
    const location = launch.pad?.location?.name || 'Location TBD';
    const rocket = launch.rocket?.configuration?.name || 'Rocket TBD';
    const status = getStatusInfo(launch.status?.abbrev);
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${launch.name}" class="launch-image" onerror="this.src='https://via.placeholder.com/400x200/1a1a3a/6495ED?text=🚀+Launch'">
        <div class="launch-content">
            <span class="launch-provider">${provider}</span>
            <h2 class="launch-name">${launch.name}</h2>
            <p class="launch-mission">${truncateText(missionDescription, 120)}</p>
            
            <div class="launch-details">
                <div class="launch-detail">
                    <span class="icon">🚀</span>
                    <span>${rocket}</span>
                </div>
                <div class="launch-detail">
                    <span class="icon">📍</span>
                    <span>${location}</span>
                </div>
                <div class="launch-detail">
                    <span class="icon">📅</span>
                    <span>${formatDate(launchDate)}</span>
                </div>
                <div class="launch-detail">
                    <span class="icon">📊</span>
                    <span class="status-badge ${status.class}">${status.text}</span>
                </div>
            </div>
            
            <div class="countdown" data-launch-time="${launch.net}">
                <div class="countdown-label">Time Until Launch</div>
                <div class="countdown-timer">
                    <div class="countdown-item">
                        <span class="countdown-value days">--</span>
                        <span class="countdown-unit">Days</span>
                    </div>
                    <div class="countdown-item">
                        <span class="countdown-value hours">--</span>
                        <span class="countdown-unit">Hours</span>
                    </div>
                    <div class="countdown-item">
                        <span class="countdown-value minutes">--</span>
                        <span class="countdown-unit">Min</span>
                    </div>
                    <div class="countdown-item">
                        <span class="countdown-value seconds">--</span>
                        <span class="countdown-unit">Sec</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Get status badge info
function getStatusInfo(abbrev) {
    const statuses = {
        'Go': { text: 'Go for Launch', class: 'status-go' },
        'TBD': { text: 'To Be Determined', class: 'status-tbd' },
        'TBC': { text: 'To Be Confirmed', class: 'status-tbc' },
        'Success': { text: 'Success', class: 'status-go' }
    };
    
    return statuses[abbrev] || { text: abbrev || 'Unknown', class: 'status-tbd' };
}

// Update all countdown timers
function updateCountdowns() {
    const countdowns = document.querySelectorAll('.countdown');
    
    countdowns.forEach(countdown => {
        const launchTime = new Date(countdown.dataset.launchTime);
        const now = new Date();
        const diff = launchTime - now;
        
        if (diff <= 0) {
            countdown.querySelector('.countdown-label').textContent = 'Launched!';
            countdown.querySelector('.days').textContent = '00';
            countdown.querySelector('.hours').textContent = '00';
            countdown.querySelector('.minutes').textContent = '00';
            countdown.querySelector('.seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        countdown.querySelector('.days').textContent = String(days).padStart(2, '0');
        countdown.querySelector('.hours').textContent = String(hours).padStart(2, '0');
        countdown.querySelector('.minutes').textContent = String(minutes).padStart(2, '0');
        countdown.querySelector('.seconds').textContent = String(seconds).padStart(2, '0');
    });
}

// Utility: Format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Utility: Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Show/hide states
function showLoading() {
    loadingElement.style.display = 'flex';
    launchesContainer.style.display = 'none';
    errorElement.style.display = 'none';
}

function hideLoading() {
    loadingElement.style.display = 'none';
    launchesContainer.style.display = 'grid';
}

function showError() {
    loadingElement.style.display = 'none';
    launchesContainer.style.display = 'none';
    errorElement.style.display = 'block';
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchLaunches);