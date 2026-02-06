// Space Launch Tracker
// Fetches upcoming launches from The Space Devs API

const API_URL = 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=12&mode=detailed';

// DOM Elements
const launchesContainer = document.getElementById('launches');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const providerFilter = document.getElementById('provider-filter');
let allLaunches = [];
let countdownInterval = null;

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
    allLaunches = launches;
    
    // Build provider filter options
    const providers = [...new Set(launches.map(l => l.launch_service_provider?.name).filter(Boolean))];
    providers.sort();
    
    providerFilter.innerHTML = '<option value="all">All Providers</option>';
    providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider;
        option.textContent = provider;
        providerFilter.appendChild(option);
    });
    
    renderLaunches(launches);
    
    // Start countdown timers
    updateCountdowns();
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    countdownInterval = setInterval(updateCountdowns, 1000);
}

// Render launches to the grid
function renderLaunches(launches) {
    launchesContainer.innerHTML = '';
    
    launches.forEach(launch => {
        const card = createLaunchCard(launch);
        launchesContainer.appendChild(card);
    });
}

// Create a launch card element
function createLaunchCard(launch) {
    const card = document.createElement('div');
    card.className = 'launch-card';
    card.setAttribute('data-mission-uid', launch.id);
    
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
    
    card.onclick = () => DetailsPanelManager.reveal(launch.id);
    
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

// Filter event listener
if (providerFilter) {
    providerFilter.addEventListener('change', (e) => {
        const selected = e.target.value;
        
        if (selected === 'all') {
            renderLaunches(allLaunches);
            updateCountdowns();
        } else {
            const filtered = allLaunches.filter(
                launch => launch.launch_service_provider?.name === selected
            );
            renderLaunches(filtered);
            updateCountdowns();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchLaunches);

// Details Panel Manager - handles modal display and interactions
const DetailsPanelManager = {
    overlayElement: null,
    panelElement: null,
    contentArea: null,
    dismissButton: null,
    activeTimerRef: null,
    
    initialize() {
        this.overlayElement = document.getElementById('launch-modal');
        this.panelElement = this.overlayElement?.querySelector('.modal-container');
        this.contentArea = document.getElementById('modal-content');
        this.dismissButton = this.overlayElement?.querySelector('.modal-close');
        
        if (this.dismissButton) {
            this.dismissButton.onclick = () => this.dismiss();
        }
        
        if (this.overlayElement) {
            const backdrop = this.overlayElement.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.onclick = () => this.dismiss();
            }
        }
        
        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape' && this.overlayElement?.style.display !== 'none') {
                this.dismiss();
            }
        });
    },
    
    reveal(missionUid) {
        const missionData = allLaunches.find(item => item.id === missionUid);
        if (!missionData) return;
        
        this.populateContent(missionData);
        this.overlayElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        this.activeTimerRef = setInterval(() => this.refreshTimer(missionData.net), 1000);
        this.refreshTimer(missionData.net);
    },
    
    dismiss() {
        this.overlayElement.style.display = 'none';
        document.body.style.overflow = '';
        if (this.activeTimerRef) {
            clearInterval(this.activeTimerRef);
            this.activeTimerRef = null;
        }
    },
    
    populateContent(missionData) {
        const sections = [];
        
        const headerImg = missionData.image || 'https://via.placeholder.com/900x350/1a1a3a/6495ED?text=🚀+Mission';
        sections.push(`<img src="${headerImg}" alt="${missionData.name}" class="modal-header-image" onerror="this.src='https://via.placeholder.com/900x350/1a1a3a/6495ED?text=🚀+Mission'">`);
        
        sections.push(`<h2 class="modal-title">${missionData.name}</h2>`);
        
        const agencyData = missionData.launch_service_provider;
        if (agencyData?.name) {
            const logoHtml = agencyData.logo_url 
                ? `<img src="${agencyData.logo_url}" class="modal-provider-logo" alt="${agencyData.name} logo" onerror="this.style.display='none'">` 
                : '';
            sections.push(`<div class="modal-provider">${logoHtml}${agencyData.name}</div>`);
        }
        
        if (missionData.mission?.description) {
            sections.push(this.buildSection('📝 Mission Overview', missionData.mission.description));
        }
        
        const detailsData = [];
        if (missionData.mission?.type) {
            detailsData.push({ title: 'Mission Type', content: missionData.mission.type });
        }
        if (missionData.mission?.orbit?.name) {
            detailsData.push({ title: 'Target Orbit', content: missionData.mission.orbit.name });
        }
        if (missionData.window_start) {
            detailsData.push({ title: 'Window Opens', content: this.formatTimeString(missionData.window_start) });
        }
        if (missionData.window_end) {
            detailsData.push({ title: 'Window Closes', content: this.formatTimeString(missionData.window_end) });
        }
        
        if (detailsData.length > 0) {
            sections.push(this.buildInfoGrid('🎯 Launch Parameters', detailsData));
        }
        
        const vehicleData = missionData.rocket?.configuration;
        if (vehicleData) {
            const rocketDetails = [];
            if (vehicleData.full_name) {
                rocketDetails.push({ title: 'Vehicle', content: vehicleData.full_name });
            }
            if (vehicleData.variant) {
                rocketDetails.push({ title: 'Variant', content: vehicleData.variant });
            }
            if (vehicleData.maiden_flight) {
                rocketDetails.push({ title: 'First Flight', content: this.formatTimeString(vehicleData.maiden_flight) });
            }
            if (vehicleData.successful_launches !== undefined && vehicleData.failed_launches !== undefined) {
                const totalFlights = vehicleData.successful_launches + vehicleData.failed_launches;
                rocketDetails.push({ 
                    title: 'Flight Record', 
                    content: `${vehicleData.successful_launches}/${totalFlights} successful` 
                });
            }
            if (rocketDetails.length > 0) {
                sections.push(this.buildInfoGrid('🚀 Rocket Information', rocketDetails));
            }
        }
        
        const facilityData = missionData.pad;
        if (facilityData) {
            const padDetails = [];
            if (facilityData.name) {
                padDetails.push({ title: 'Launch Pad', content: facilityData.name });
            }
            if (facilityData.location?.name) {
                padDetails.push({ title: 'Facility', content: facilityData.location.name });
            }
            if (facilityData.latitude && facilityData.longitude) {
                const mapsUrl = `https://www.google.com/maps?q=${facilityData.latitude},${facilityData.longitude}`;
                padDetails.push({ 
                    title: 'Coordinates', 
                    content: `<a href="${mapsUrl}" target="_blank" style="color: #6495ED;">${facilityData.latitude.toFixed(4)}, ${facilityData.longitude.toFixed(4)}</a>` 
                });
            }
            if (padDetails.length > 0) {
                sections.push(this.buildInfoGrid('📍 Launch Site', padDetails));
            }
        }
        
        if (missionData.program && missionData.program.length > 0) {
            const programList = missionData.program.map(prog => prog.name).join(', ');
            sections.push(this.buildSection('🎓 Programs', programList));
        }
        
        const resourceLinks = [];
        if (missionData.mission?.wiki_url) {
            resourceLinks.push({ label: '📖 Wikipedia', url: missionData.mission.wiki_url });
        }
        if (agencyData?.info_url) {
            resourceLinks.push({ label: '🏢 Agency Info', url: agencyData.info_url });
        }
        if (missionData.vidURLs && missionData.vidURLs.length > 0) {
            missionData.vidURLs.forEach((vid, idx) => {
                resourceLinks.push({ label: `📺 Watch${vid.title ? ': ' + vid.title : ' ' + (idx + 1)}`, url: vid.url });
            });
        }
        if (resourceLinks.length > 0) {
            sections.push(this.buildLinksSection('🔗 External Resources', resourceLinks));
        }
        
        sections.push(`<div class="modal-section"><h3 class="modal-section-title">⏱️ Countdown</h3><div class="modal-countdown" id="modal-timer-display"><div class="countdown-timer"><div class="countdown-item"><span class="countdown-value days">--</span><span class="countdown-unit">Days</span></div><div class="countdown-item"><span class="countdown-value hours">--</span><span class="countdown-unit">Hours</span></div><div class="countdown-item"><span class="countdown-value minutes">--</span><span class="countdown-unit">Min</span></div><div class="countdown-item"><span class="countdown-value seconds">--</span><span class="countdown-unit">Sec</span></div></div></div></div>`);
        
        this.contentArea.innerHTML = sections.join('');
    },
    
    buildSection(heading, bodyText) {
        return `<div class="modal-section"><h3 class="modal-section-title">${heading}</h3><div class="modal-section-content">${bodyText}</div></div>`;
    },
    
    buildInfoGrid(heading, itemsArray) {
        const gridItems = itemsArray.map(item => 
            `<div class="modal-info-item"><div class="modal-info-label">${item.title}</div><div class="modal-info-value">${item.content}</div></div>`
        ).join('');
        return `<div class="modal-section"><h3 class="modal-section-title">${heading}</h3><div class="modal-info-grid">${gridItems}</div></div>`;
    },
    
    buildLinksSection(heading, linksArray) {
        const linkItems = linksArray.map(link => 
            `<a href="${link.url}" target="_blank" class="modal-link">${link.label}</a>`
        ).join('');
        return `<div class="modal-section"><h3 class="modal-section-title">${heading}</h3><div class="modal-links">${linkItems}</div></div>`;
    },
    
    formatTimeString(isoString) {
        const dateObj = new Date(isoString);
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    },
    
    refreshTimer(targetTime) {
        const timerDisplay = document.getElementById('modal-timer-display');
        if (!timerDisplay) return;
        
        const targetDate = new Date(targetTime);
        const currentDate = new Date();
        const delta = targetDate - currentDate;
        
        const daysEl = timerDisplay.querySelector('.days');
        const hoursEl = timerDisplay.querySelector('.hours');
        const minutesEl = timerDisplay.querySelector('.minutes');
        const secondsEl = timerDisplay.querySelector('.seconds');
        
        if (delta <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }
        
        const daysRemaining = Math.floor(delta / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
        const secondsRemaining = Math.floor((delta % (1000 * 60)) / 1000);
        
        daysEl.textContent = String(daysRemaining).padStart(2, '0');
        hoursEl.textContent = String(hoursRemaining).padStart(2, '0');
        minutesEl.textContent = String(minutesRemaining).padStart(2, '0');
        secondsEl.textContent = String(secondsRemaining).padStart(2, '0');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DetailsPanelManager.initialize();
});