// Configuration de l'application
const CONFIG = {
    STORAGE_KEY: 'weather_app_prefs',
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    DEFAULT_LOCATION: 'Paris'
};

// Utilitaires
const utils = {
    // Debounce pour optimiser les recherches
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Animation smooth pour les transitions
    async animateElement(element, animation, duration = CONFIG.ANIMATION_DURATION) {
        return new Promise(resolve => {
            element.style.animation = `${animation} ${duration}ms ease-in-out`;
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    },

    // Sauvegarde des préférences utilisateur
    savePreferences(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Impossible de sauvegarder les préférences:', e);
        }
    },

    // Chargement des préférences
    loadPreferences() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.warn('Impossible de charger les préférences:', e);
            return null;
        }
    },

    // Format de température selon les préférences
    formatTemperature(temp, unit = 'C') {
        return `${Math.round(temp)}°${unit}`;
    },

    // Traduction des conditions météo
    translateCondition(condition) {
        const translations = {
            'sunny': 'Ensoleillé',
            'partly-cloudy': 'Partiellement nuageux',
            'cloudy': 'Nuageux',
            'rainy': 'Pluvieux',
            'thunder': 'Orageux',
            'partly-cloudy-rain': 'Averses éparses',
            'snow': 'Neigeux',
            'fog': 'Brouillard'
        };
        return translations[condition] || condition;
    }
};

// Icônes SVG intégrées pour éviter les erreurs 404
const weatherIcons = {
    'sunny': `<svg viewBox="0 0 24 24" fill="#ffd700" stroke="#ffd700" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>`,
    
    'partly-cloudy': `<svg viewBox="0 0 24 24" fill="#87ceeb" stroke="#87ceeb" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
        <circle cx="12" cy="8" r="3" fill="#ffd700" stroke="#ffd700"/>
    </svg>`,
    
    'cloudy': `<svg viewBox="0 0 24 24" fill="#87ceeb" stroke="#87ceeb" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>`,
    
    'rainy': `<svg viewBox="0 0 24 24" fill="#4682b4" stroke="#4682b4" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
        <line x1="8" y1="21" x2="8" y2="23"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="16" y1="21" x2="16" y2="23"/>
    </svg>`,
    
    'thunder': `<svg viewBox="0 0 24 24" fill="#483d8b" stroke="#ffd700" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="#483d8b"/>
        <polygon points="11,13 15,8 9,8 13,3 7,8 13,8" fill="#ffd700"/>
    </svg>`,
    
    'partly-cloudy-rain': `<svg viewBox="0 0 24 24" fill="#87ceeb" stroke="#87ceeb" stroke-width="2">
        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
        <circle cx="16" cy="6" r="2" fill="#ffd700" stroke="#ffd700"/>
        <line x1="10" y1="21" x2="10" y2="23" stroke="#4682b4"/>
        <line x1="14" y1="21" x2="14" y2="23" stroke="#4682b4"/>
    </svg>`
};

// Classe principale de l'application
class WeatherApp {
    constructor() {
        this.data = {
            current: {
                temp: 24,
                condition: "partly-cloudy",
                location: CONFIG.DEFAULT_LOCATION,
                high: 17,
                low: 4
            },
            hourly: [
                { time: "Maint.", temp: 13, condition: "partly-cloudy-rain" },
                { time: "16h", temp: 14, condition: "sunny" },
                { time: "17h", temp: 12, condition: "partly-cloudy" },
                { time: "18h", temp: 8, condition: "rainy" },
                { time: "19h", temp: 9, condition: "thunder" },
                { time: "20h", temp: 7, condition: "rainy" },
                { time: "21h", temp: 6, condition: "cloudy" }
            ],
            locations: [
                { name: "Paris", temp: 24, condition: "partly-cloudy" },
                { name: "Lyon", temp: 22, condition: "sunny" },
                { name: "Marseille", temp: 26, condition: "sunny" },
                { name: "Bordeaux", temp: 20, condition: "rainy" },
                { name: "Lille", temp: 18, condition: "cloudy" },
                { name: "Strasbourg", temp: 19, condition: "partly-cloudy" },
                { name: "Nantes", temp: 21, condition: "partly-cloudy" },
                { name: "Nice", temp: 25, condition: "sunny" },
                { name: "Toulouse", temp: 23, condition: "partly-cloudy" },
                { name: "Montpellier", temp: 24, condition: "sunny" }
            ]
        };
        
        this.elements = {};
        this.isLoading = false;
        this.preferences = utils.loadPreferences() || {};
        
        this.init();
    }

    // Initialisation de l'application
    async init() {
        this.cacheElements();
        this.bindEvents();
        await this.loadSavedLocation();
        this.render();
        this.setupAccessibility();
        
        // Animation d'entrée
        await utils.animateElement(this.elements.container, 'fadeInUp');
    }

    // Cache des éléments DOM pour optimiser les performances
    cacheElements() {
        this.elements = {
            container: document.querySelector('.container'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            currentTemp: document.getElementById('current-temp'),
            currentCondition: document.getElementById('current-condition'),
            currentLocation: document.getElementById('current-location'),
            currentIcon: document.getElementById('current-icon'),
            highTemp: document.getElementById('high-temp'),
            lowTemp: document.getElementById('low-temp'),
            hourlyForecast: document.getElementById('hourly-forecast')
        };
    }

    // Liaison des événements avec optimisations
    bindEvents() {
        // Recherche avec debouncing
        const debouncedSearch = utils.debounce(() => this.searchLocation(), CONFIG.DEBOUNCE_DELAY);
        
        this.elements.searchBtn.addEventListener('click', () => this.searchLocation());
        
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation();
            }
        });

        // Autocomplétion en temps réel
        this.elements.searchInput.addEventListener('input', debouncedSearch);

        // Géolocalisation si disponible
        if (navigator.geolocation) {
            this.addGeolocationButton();
        }

        // Support du clavier pour l'accessibilité
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.elements.searchInput.blur();
            }
        });
    }

    // Ajout du bouton de géolocalisation
    addGeolocationButton() {
        const geoBtn = document.createElement('button');
        geoBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
        `;
        geoBtn.style.marginLeft = '8px';
        geoBtn.setAttribute('title', 'Utiliser ma position actuelle');
        geoBtn.addEventListener('click', () => this.requestGeolocation());
        
        this.elements.searchBtn.parentNode.appendChild(geoBtn);
    }

    // Demande de géolocalisation
    async requestGeolocation() {
        if (!navigator.geolocation) return;

        try {
            this.setLoading(true);
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                });
            });

            // Simuler la recherche d'une ville proche
            const nearbyCity = this.data.locations[Math.floor(Math.random() * this.data.locations.length)];
            await this.updateWeatherData(nearbyCity);
            this.showNotification('Position détectée !', 'success');
            
        } catch (error) {
            this.showNotification('Impossible de détecter votre position', 'error');
            console.warn('Erreur de géolocalisation:', error);
        } finally {
            this.setLoading(false);
        }
    }

    // Affichage des notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4757' : type === 'success' ? '#2ed573' : '#5352ed'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Suppression automatique
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // État de chargement
    setLoading(loading) {
        this.isLoading = loading;
        this.elements.container.classList.toggle('loading', loading);
        this.elements.searchBtn.disabled = loading;
        this.elements.searchInput.disabled = loading;
    }

    // Chargement de la dernière ville recherchée
    async loadSavedLocation() {
        if (this.preferences.lastLocation) {
            const savedLocation = this.data.locations.find(
                loc => loc.name === this.preferences.lastLocation
            );
            if (savedLocation) {
                await this.updateWeatherData(savedLocation, false);
            }
        }
    }

    // Recherche de localisation avec animations
    async searchLocation() {
        const searchTerm = this.elements.searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            this.elements.searchInput.focus();
            return;
        }

        this.setLoading(true);

        try {
            // Simulation d'un délai réseau
            await new Promise(resolve => setTimeout(resolve, 500));

            const location = this.data.locations.find(loc => 
                loc.name.toLowerCase().includes(searchTerm)
            );

            if (location) {
                await this.updateWeatherData(location);
                this.elements.searchInput.value = '';
                this.showNotification(`Météo mise à jour pour ${location.name}`, 'success');
                
                // Sauvegarder la préférence
                this.preferences.lastLocation = location.name;
                utils.savePreferences(this.preferences);
                
            } else {
                this.showNotification(
                    'Ville non trouvée. Essayez: Paris, Lyon, Marseille...', 
                    'error'
                );
                this.elements.searchInput.focus();
            }
        } catch (error) {
            this.showNotification('Erreur lors de la recherche', 'error');
            console.error('Erreur de recherche:', error);
        } finally {
            this.setLoading(false);
        }
    }

    // Mise à jour des données météo avec animations
    async updateWeatherData(location, animate = true) {
        if (animate) {
            await utils.animateElement(this.elements.container, 'pulse');
        }

        // Mise à jour des données
        this.data.current = {
            temp: location.temp,
            condition: location.condition,
            location: location.name,
            high: Math.round(location.temp + 2 + Math.random() * 3),
            low: Math.round(location.temp - 8 - Math.random() * 3)
        };

        // Génération de nouvelles prévisions horaires
        this.generateHourlyForecast(location.temp);
        
        // Mise à jour de l'affichage
        this.render();
    }

    // Génération des prévisions horaires optimisée
    generateHourlyForecast(baseTemp) {
        const conditions = ['sunny', 'partly-cloudy', 'cloudy', 'rainy', 'thunder', 'partly-cloudy-rain'];
        const times = ['Maint.', '16h', '17h', '18h', '19h', '20h', '21h'];

        this.data.hourly = times.map((time, index) => {
            const tempVariation = Math.random() * 4 - 2; // Variation de -2 à +2
            const temp = Math.max(
                Math.round(baseTemp + tempVariation - (index * 0.5)),
                -10 // Température minimale réaliste
            );
            
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            
            return { time, temp, condition };
        });
    }

    // Obtention des icônes météo
    getWeatherIcon(condition) {
        return weatherIcons[condition] || weatherIcons['partly-cloudy'];
    }

    // Rendu de l'interface avec optimisations
    render() {
        // Mise à jour des données principales
        this.elements.currentTemp.textContent = this.data.current.temp;
        this.elements.currentCondition.textContent = utils.translateCondition(this.data.current.condition);
        this.elements.currentLocation.textContent = this.data.current.location;
        this.elements.highTemp.textContent = this.data.current.high;
        this.elements.lowTemp.textContent = this.data.current.low;

        // Mise à jour de l'icône principale
        this.elements.currentIcon.innerHTML = this.getWeatherIcon(this.data.current.condition);

        // Rendu des prévisions horaires
        this.renderHourlyForecast();
    }

    // Rendu optimisé des prévisions horaires
    renderHourlyForecast() {
        // Utilisation de DocumentFragment pour optimiser le DOM
        const fragment = document.createDocumentFragment();
        
        this.data.hourly.forEach((hour, index) => {
            const hourBox = document.createElement('div');
            hourBox.className = `hour-box ${index === 0 ? 'active' : ''}`;
            hourBox.setAttribute('tabindex', '0');
            hourBox.setAttribute('role', 'button');
            hourBox.setAttribute('aria-label', 
                `${hour.time}: ${hour.temp}°, ${utils.translateCondition(hour.condition)}`
            );
            
            hourBox.innerHTML = `
                <div class="time">${hour.time}</div>
                <div class="icon">${this.getWeatherIcon(hour.condition)}</div>
                <div class="temp">${hour.temp}°</div>
            `;

            // Interaction avec les prévisions horaires
            hourBox.addEventListener('click', () => this.selectHour(index));
            hourBox.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.selectHour(index);
                }
            });
            
            fragment.appendChild(hourBox);
        });

        this.elements.hourlyForecast.innerHTML = '';
        this.elements.hourlyForecast.appendChild(fragment);
    }

    // Sélection d'une heure spécifique
    selectHour(index) {
        // Supprimer l'ancien état actif
        this.elements.hourlyForecast.querySelectorAll('.hour-box').forEach(box => {
            box.classList.remove('active');
        });

        // Activer la nouvelle sélection
        const selectedBox = this.elements.hourlyForecast.children[index];
        selectedBox.classList.add('active');
        
        // Animation de feedback
        utils.animateElement(selectedBox, 'pulse');
    }

    // Configuration de l'accessibilité
    setupAccessibility() {
        // Ajout d'attributs ARIA
        this.elements.searchInput.setAttribute('aria-label', 'Rechercher une ville');
        this.elements.searchBtn.setAttribute('aria-label', 'Lancer la recherche');
        this.elements.hourlyForecast.setAttribute('role', 'tablist');
        this.elements.hourlyForecast.setAttribute('aria-label', 'Prévisions horaires');

        // Support du mode sombre système
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        }
    }
}

// Initialisation de l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});

// Support PWA - Enregistrement du service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('Service Worker enregistré:', registration);
        } catch (error) {
            console.log('Échec d\'enregistrement du Service Worker:', error);
        }
    });
}