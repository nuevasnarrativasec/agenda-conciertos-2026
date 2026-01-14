// ==========================================
// CONFIGURACIÓN - GOOGLE SHEETS
// ==========================================
const SHEET_ID = '19dEHaMULZ8lIPLFYY66jBtnTh0jXeQ9unG8ktL0nxbQ';
const SHEET_NAME = 'conciertos';

// URL para Google Sheets publicado como CSV con cache-busting
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}&t=${Date.now()}`;

// ==========================================
// DATOS - Se cargan desde Google Sheets
// ==========================================
let concertsData = [];

// ==========================================
// VARIABLES DE ESTADO
// ==========================================
let currentView = 'home'; // home, calendar, artists, detail
let currentCarouselIndex = 0;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = 2026;
let filteredConcerts = [];

// Variables para el carrusel de detalle
let detailCarouselIndex = 0;
let detailConcerts = [];

const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================
const monthSection = document.getElementById('monthSection');
const calendarSection = document.getElementById('calendarSection');
const artistsSection = document.getElementById('artistsSection');
const detailSection = document.getElementById('detailSection');
const carouselTrack = document.getElementById('carouselTrack');
const currentMonthTitle = document.getElementById('currentMonthTitle');
const calendarMonthTitle = document.getElementById('calendarMonthTitle');
const calendarDays = document.getElementById('calendarDays');
const artistsGrid = document.getElementById('artistsGrid');
const artistSearch = document.getElementById('artistSearch');
const detailCarouselTrack = document.getElementById('detailCarouselTrack');
const detailMonthTitle = document.getElementById('detailMonthTitle');

// ==========================================
// FUNCIONES DE CARGA DE DATOS
// ==========================================
async function loadDataFromGoogleSheets() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        concertsData = parseCSV(csvText);
        
        if (concertsData.length === 0) {
            console.warn('No se encontraron datos en Google Sheets');
            showNoDataMessage();
            return;
        }
        
        initializeApp();
    } catch (error) {
        console.error('Error al cargar Google Sheets:', error);
        showErrorMessage();
    }
}

function showNoDataMessage() {
    carouselTrack.innerHTML = '<div class="concert-card"><p>No hay conciertos disponibles. Por favor, agregue datos al Google Sheet.</p></div>';
    currentMonthTitle.textContent = 'SIN DATOS';
}

function showErrorMessage() {
    carouselTrack.innerHTML = '<div class="concert-card"><p>Error al cargar los datos. Intente recargar la página.</p></div>';
    currentMonthTitle.textContent = 'ERROR';
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCSVLine(lines[i]);
        const concert = {};
        
        headers.forEach((header, index) => {
            concert[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
        });

        // Procesar fecha con parseo local para evitar desfase de timezone
        if (concert.date) {
            const dateInfo = parseLocalDate(concert.date);
            concert.dayNumber = dateInfo.dayNumber;
            concert.monthNumber = dateInfo.monthNumber;
            concert.month = dateInfo.month;
            concert.year = dateInfo.year;
            concert.dayName = dateInfo.dayName;
            concert.dateObj = dateInfo.dateObj;
        }

        concert.id = i;
        data.push(concert);
    }

    return data;
}

/**
 * Parsea una fecha en formato YYYY-MM-DD sin problemas de timezone
 * Esto evita que la fecha se mueva un día por interpretación UTC
 */
function parseLocalDate(dateString) {
    // Manejar diferentes formatos de fecha
    let year, month, day;
    
    if (dateString.includes('/')) {
        // Formato DD/MM/YYYY o MM/DD/YYYY
        const parts = dateString.split('/');
        if (parts[2] && parts[2].length === 4) {
            // Asumimos DD/MM/YYYY (formato común en Perú/España)
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = parseInt(parts[2], 10);
        } else {
            // Formato con año de 2 dígitos
            day = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
            year = 2000 + parseInt(parts[2], 10);
        }
    } else if (dateString.includes('-')) {
        // Formato YYYY-MM-DD (ISO)
        const parts = dateString.split('-');
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
    } else {
        // Intentar parsear como fecha normal pero crear local
        const tempDate = new Date(dateString);
        year = tempDate.getFullYear();
        month = tempDate.getMonth() + 1;
        day = tempDate.getDate();
    }
    
    // Crear fecha local (sin UTC) usando los componentes
    const dateObj = new Date(year, month - 1, day);
    
    return {
        dayNumber: day,
        monthNumber: month,
        month: monthNames[month - 1],
        year: year,
        dayName: dayNames[dateObj.getDay()],
        dateObj: dateObj
    };
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// ==========================================
// FUNCIONES DE INICIALIZACIÓN
// ==========================================
function initializeApp() {
    // Ordenar conciertos por fecha
    concertsData.sort((a, b) => {
        if (a.dateObj && b.dateObj) {
            return a.dateObj - b.dateObj;
        }
        return new Date(a.date) - new Date(b.date);
    });
    
    // Encontrar el próximo concierto
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    const upcomingConcerts = concertsData.filter(c => {
        if (c.dateObj) {
            return c.dateObj >= today;
        }
        return new Date(c.date) >= today;
    });
    
    if (upcomingConcerts.length > 0) {
        filteredConcerts = upcomingConcerts;
        currentCalendarMonth = upcomingConcerts[0].monthNumber - 1;
        currentCalendarYear = upcomingConcerts[0].year;
    } else {
        filteredConcerts = concertsData;
        if (concertsData.length > 0) {
            currentCalendarMonth = concertsData[0].monthNumber - 1;
            currentCalendarYear = concertsData[0].year;
        }
    }

    // Inicializar en el primer concierto
    currentCarouselIndex = 0;
    
    renderCalendar();
    renderArtists();
    setupEventListeners();
    
    // Renderizar carrusel
    renderCarousel();
    
    // Configurar IntersectionObserver para lazy loading de videos
    setupVideoObserver();
    
    // Actualizar botones del carrusel
    updateCarouselButtons();
    
    // Inicializar vista home con colores correctos
    cambiarVista('home');
}

// ==========================================
// VIDEO LAZY LOADING CON INTERSECTION OBSERVER
// ==========================================
let videoObserver = null;
let activeVideoIndex = -1;

function setupVideoObserver() {
    const options = {
        root: null,
        rootMargin: '50px',
        threshold: 0.5
    };

    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const container = entry.target;
            const videoIndex = parseInt(container.getAttribute('data-video-index'));
            
            if (entry.isIntersecting && videoIndex === currentCarouselIndex) {
                // Cargar y reproducir video cuando es visible
                loadAndPlayVideo(container, videoIndex, 'main');
            } else if (!entry.isIntersecting) {
                // Pausar video cuando sale de vista
                pauseVideo(container);
            }
        });
    }, options);

    observeVideoContainers();
}

function loadAndPlayVideo(container, index, carouselType) {
    const concerts = carouselType === 'main' ? filteredConcerts : detailConcerts;
    const concert = concerts[index];
    
    if (!concert || !concert.videoUrl) return;
    
    // Verificar si ya tiene un video cargado
    let video = container.querySelector('video');
    
    if (!video) {
        // Crear el elemento video con lazy loading
        container.innerHTML = renderVideo(concert.videoUrl, true);
        video = container.querySelector('video');
    }
    
    if (video && video.paused) {
        video.play().catch(e => {
            console.log('Autoplay bloqueado:', e);
        });
    }
    
    activeVideoIndex = index;
}

function pauseVideo(container) {
    const video = container.querySelector('video');
    if (video && !video.paused) {
        video.pause();
    }
}

function observeVideoContainers() {
    if (!videoObserver) return;
    
    videoObserver.disconnect();
    
    const videoContainers = carouselTrack.querySelectorAll('.video-container');
    videoContainers.forEach(container => {
        videoObserver.observe(container);
    });
}

function activateVideo(index) {
    const concert = filteredConcerts[index];
    if (!concert) return;
    
    // Pausar video anterior si existe
    if (activeVideoIndex !== -1 && activeVideoIndex !== index) {
        const prevContainer = carouselTrack.querySelector(`[data-video-index="${activeVideoIndex}"]`);
        if (prevContainer) {
            pauseVideo(prevContainer);
        }
    }
    
    // Activar nuevo video
    const container = carouselTrack.querySelector(`[data-video-index="${index}"]`);
    if (container && concert.videoUrl) {
        loadAndPlayVideo(container, index, 'main');
    }
    
    activeVideoIndex = index;
}

// ==========================================
// FUNCIONES DE RENDERIZADO
// ==========================================
function renderCarousel() {
    if (filteredConcerts.length === 0) {
        carouselTrack.innerHTML = '<div class="concert-card"><p>No hay conciertos programados</p></div>';
        currentMonthTitle.textContent = 'SIN EVENTOS';
        return;
    }

    const currentConcert = filteredConcerts[currentCarouselIndex];
    currentMonthTitle.textContent = currentConcert.month;

    carouselTrack.innerHTML = filteredConcerts.map((concert, index) => {
        return `
        <div class="concert-card" data-index="${index}">
            <p class="concert-date">${concert.dayName} ${concert.dayNumber}</p>
            <h3 class="concert-artist">${concert.artist}</h3>
            <div class="concert-media">
                <div class="video-container" data-video-index="${index}">
                    ${renderVideoPlaceholder(concert.videoUrl, concert.artistImage)}
                </div>
                <div class="concert-info-box">
                    <p class="concert-venue">${concert.venue}</p>
                    <p class="concert-time">${concert.time}</p>
                    <a href="${concert.ticketUrl}" target="_blank" class="ticket-btn">
                        <img src="../img/icon-ticket.png" width="100%">
                        <div class="box-ticket"> 
                            <p>Entradas en: </p>
                            <span>${concert.ticketProvider}</span>
                        </div>                        
                    </a>
                </div>
            </div>
        </div>
    `}).join('');

    carouselTrack.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    
    // Reconectar el observer después de renderizar
    setTimeout(() => {
        observeVideoContainers();
        // Cargar el video del slide actual
        if (filteredConcerts[currentCarouselIndex]?.videoUrl) {
            activateVideo(currentCarouselIndex);
        }
    }, 100);
}

/**
 * Renderiza un placeholder para el video (lazy loading)
 * El video real se carga cuando el slide es visible
 */
function renderVideoPlaceholder(videoUrl, posterImage) {
    if (videoUrl && videoUrl !== '') {
        // Mostrar poster con indicador de carga hasta que se cargue
        const poster = posterImage || '';
        return `
            <div class="video-placeholder" style="width:100%;height:100%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;">
                ${poster ? `<img src="${poster}" alt="Poster" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;opacity:0.5;" loading="lazy">` : ''}
                <div class="video-loading-spinner"></div>
            </div>
        `;
    }
    
    // Placeholder si no hay video
    return `
        <div style="width:100%;height:100%;background:#333;display:flex;align-items:center;justify-content:center;">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#666">
                <path d="M8 5v14l11-7z"/>
            </svg>
        </div>
    `;
}

/**
 * Renderiza el video MP4 nativo
 * @param {string} videoUrl - URL del video MP4
 * @param {boolean} autoplay - Si debe reproducirse automáticamente
 */
function renderVideo(videoUrl, autoplay = false) {
    if (videoUrl && videoUrl !== '') {
        return `
            <video 
                src="${videoUrl}"
                ${autoplay ? 'autoplay' : ''}
                muted
                loop
                playsinline
                preload="metadata"
                class="concert-video"
                style="width:100%;height:100%;object-fit:cover;">
                Tu navegador no soporta videos HTML5.
            </video>
        `;
    }
    
    // Placeholder si no hay video
    return `
        <div style="width:100%;height:100%;background:#333;display:flex;align-items:center;justify-content:center;">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="#666">
                <path d="M8 5v14l11-7z"/>
            </svg>
        </div>
    `;
}

function updateCarouselPosition() {
    carouselTrack.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    
    if (filteredConcerts.length > 0) {
        currentMonthTitle.textContent = filteredConcerts[currentCarouselIndex].month;
    }
    
    updateCarouselButtons();
}

function updateCarouselButtons() {
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    
    if (prevBtn) {
        if (currentCarouselIndex === 0) {
            prevBtn.classList.add('inactivo');
        } else {
            prevBtn.classList.remove('inactivo');
        }
    }
    
    if (nextBtn) {
        if (currentCarouselIndex >= filteredConcerts.length - 1) {
            nextBtn.classList.add('inactivo');
        } else {
            nextBtn.classList.remove('inactivo');
        }
    }
}

function renderCalendar() {
    calendarMonthTitle.textContent = monthNames[currentCalendarMonth];
    
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener conciertos del mes actual
    const monthConcerts = concertsData.filter(c => 
        c.monthNumber === currentCalendarMonth + 1 && c.year === currentCalendarYear
    );

    let html = '';

    // Días vacíos al inicio
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Días del mes
    for (let day = 1; day <= totalDays; day++) {
        const dayDate = new Date(currentCalendarYear, currentCalendarMonth, day);
        const isPast = dayDate < today;
        const hasConcert = monthConcerts.some(c => c.dayNumber === day);
        
        let classes = 'calendar-day';
        if (isPast) classes += ' past';
        if (hasConcert) classes += ' has-event';

        html += `<div class="${classes}" data-day="${day}" ${hasConcert ? 'onclick="showDayDetail(' + day + ')"' : ''}>${day}</div>`;
    }

    calendarDays.innerHTML = html;
}

function renderArtists() {
    // Obtener artistas únicos
    const uniqueArtists = [];
    const artistNames = new Set();

    concertsData.forEach(concert => {
        if (!artistNames.has(concert.artist)) {
            artistNames.add(concert.artist);
            uniqueArtists.push({
                name: concert.artist,
                image: concert.artistImage,
                concertId: concert.id,
                date: concert.date
            });
        }
    });

    artistsGrid.innerHTML = uniqueArtists.map(artist => `
        <div class="artist-card" onclick="showArtistDetail('${artist.name.replace(/'/g, "\\'")}')">
            <img src="${artist.image}" alt="${artist.name}" class="artist-image" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/333/fff?text=${encodeURIComponent(artist.name)}'">
            <div class="artist-name">${artist.name}</div>
        </div>
    `).join('');
}

function renderDetailConcerts(concerts, initialIndex = 0) {
    detailConcerts = concerts;
    detailCarouselIndex = initialIndex;
    
    if (concerts.length === 0) {
        detailCarouselTrack.innerHTML = '<div class="concert-card"><p>No hay conciertos programados</p></div>';
        return;
    }

    detailCarouselTrack.innerHTML = concerts.map((concert, index) => `
        <div class="concert-card" data-detail-index="${index}" style="color: var(--color-black);">
            <p class="concert-date" style="color: var(--color-magenta);">${concert.dayName} ${concert.dayNumber}</p>
            <h3 class="concert-artist">${concert.artist}</h3>
            <div class="concert-media">
                <div class="video-container" data-detail-video-index="${index}">
                    ${index === initialIndex ? renderVideo(concert.videoUrl, true) : renderVideoPlaceholder(concert.videoUrl, concert.artistImage)}
                </div>
                <div class="concert-info-box">
                    <p class="concert-venue">${concert.venue}</p>
                    <p class="concert-time">${concert.time}</p>
                    <a href="${concert.ticketUrl}" target="_blank" class="ticket-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z"/>
                        </svg>
                        Entradas en ${concert.ticketProvider}
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    detailCarouselTrack.style.transform = `translateX(-${initialIndex * 100}%)`;
    updateDetailCarouselButtons();
}

function updateDetailCarouselPosition() {
    detailCarouselTrack.style.transform = `translateX(-${detailCarouselIndex * 100}%)`;
    
    // Actualizar el título del mes según el concierto actual
    if (detailConcerts.length > 0) {
        const currentConcert = detailConcerts[detailCarouselIndex];
        detailMonthTitle.textContent = currentConcert.month;
    }
    
    // Activar el video del concierto actual
    activateDetailVideo(detailCarouselIndex);
    updateDetailCarouselButtons();
}

function activateDetailVideo(index) {
    const concert = detailConcerts[index];
    if (!concert) return;
    
    // Pausar videos anteriores en el carrusel de detalle
    detailConcerts.forEach((c, i) => {
        if (i !== index) {
            const container = detailCarouselTrack.querySelector(`[data-detail-video-index="${i}"]`);
            if (container) {
                pauseVideo(container);
            }
        }
    });
    
    // Activar video actual
    if (concert.videoUrl) {
        const container = detailCarouselTrack.querySelector(`[data-detail-video-index="${index}"]`);
        if (container) {
            container.innerHTML = renderVideo(concert.videoUrl, true);
        }
    }
}

function updateDetailCarouselButtons() {
    const prevBtn = document.getElementById('detailCarouselPrev');
    const nextBtn = document.getElementById('detailCarouselNext');
    
    if (prevBtn) {
        if (detailCarouselIndex === 0) {
            prevBtn.classList.add('inactivo');
        } else {
            prevBtn.classList.remove('inactivo');
        }
    }
    
    if (nextBtn) {
        if (detailCarouselIndex >= detailConcerts.length - 1) {
            nextBtn.classList.add('inactivo');
        } else {
            nextBtn.classList.remove('inactivo');
        }
    }
}

// ==========================================
// FUNCIONES DE NAVEGACIÓN
// ==========================================
function showView(view) {
    currentView = view;
    
    // Pausar todos los videos al cambiar de vista
    pauseAllVideos();
    
    // Cambiar colores del crowd-container según la vista
    cambiarVista(view);
    
    monthSection.classList.remove('hidden');
    calendarSection.classList.remove('active');
    artistsSection.classList.remove('active');
    detailSection.classList.remove('active');

    switch(view) {
        case 'home':
            monthSection.classList.remove('hidden');
            // Reconectar observer y activar video del carrusel actual
            setTimeout(() => {
                observeVideoContainers();
                activateVideo(currentCarouselIndex);
            }, 200);
            break;
        case 'calendar':
            monthSection.classList.add('hidden');
            calendarSection.classList.add('active');
            break;
        case 'artists':
            monthSection.classList.add('hidden');
            artistsSection.classList.add('active');
            break;
        case 'detail':
            monthSection.classList.add('hidden');
            detailSection.classList.add('active');
            break;
    }
}

function pauseAllVideos() {
    // Desconectar observer
    if (videoObserver) {
        videoObserver.disconnect();
    }
    
    // Resetear tracking
    activeVideoIndex = -1;
    
    // Pausar todos los videos nativos
    const allVideos = document.querySelectorAll('.concert-video');
    allVideos.forEach(video => {
        if (!video.paused) {
            video.pause();
        }
    });
}

function goToHome() {
    showView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showDayDetail(day) {
    // Obtener todos los conciertos del mes actual
    const monthConcerts = concertsData.filter(c => 
        c.monthNumber === currentCalendarMonth + 1 && 
        c.year === currentCalendarYear
    ).sort((a, b) => a.dayNumber - b.dayNumber);

    if (monthConcerts.length > 0) {
        // Encontrar el índice del primer concierto del día seleccionado
        let startIndex = monthConcerts.findIndex(c => c.dayNumber === day);
        if (startIndex === -1) {
            startIndex = 0; // Si no encuentra el día exacto, empezar desde el inicio
        }
        
        detailMonthTitle.textContent = monthNames[currentCalendarMonth];
        renderDetailConcerts(monthConcerts, startIndex);
        showView('detail');
    }
}

function showArtistDetail(artistName) {
    const artistConcerts = concertsData.filter(c => c.artist === artistName);
    
    if (artistConcerts.length > 0) {
        // Navegar al primer concierto del artista en el carrusel
        const index = filteredConcerts.findIndex(c => c.artist === artistName);
        if (index !== -1) {
            currentCarouselIndex = index;
        }
        showView('home');
        
        // Scroll al carrusel y activar video
        setTimeout(() => {
            updateCarouselPosition();
            monthSection.scrollIntoView({ behavior: 'smooth' });
            activateVideo(currentCarouselIndex);
        }, 200);
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    // Botones del hero
    document.getElementById('btnProximoEvento').addEventListener('click', () => {
        showView('home');
        setTimeout(() => {
            monthSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });

    document.getElementById('btnVerCalendario').addEventListener('click', () => {
        showView('calendar');
        setTimeout(() => {
            calendarSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });

    // Botones de filtro
    document.getElementById('btnFiltrarArtista').addEventListener('click', () => {
        showView('artists');
    });

    document.getElementById('btnFiltrarFecha').addEventListener('click', () => {
        showView('calendar');
    });

    // Navegación del carrusel principal
    document.getElementById('carouselPrev').addEventListener('click', () => {
        if (currentCarouselIndex > 0) {
            currentCarouselIndex--;
            updateCarouselPosition();
            activateVideo(currentCarouselIndex);
        }
    });

    document.getElementById('carouselNext').addEventListener('click', () => {
        if (currentCarouselIndex < filteredConcerts.length - 1) {
            currentCarouselIndex++;
            updateCarouselPosition();
            activateVideo(currentCarouselIndex);
        }
    });

    // Navegación del calendario
    document.getElementById('calendarPrevMonth').addEventListener('click', () => {
        currentCalendarMonth--;
        if (currentCalendarMonth < 0) {
            currentCalendarMonth = 11;
            currentCalendarYear--;
        }
        renderCalendar();
    });

    document.getElementById('calendarNextMonth').addEventListener('click', () => {
        currentCalendarMonth++;
        if (currentCalendarMonth > 11) {
            currentCalendarMonth = 0;
            currentCalendarYear++;
        }
        renderCalendar();
    });

    // Botones de home
    document.getElementById('calendarHomeBtn').addEventListener('click', goToHome);
    document.getElementById('artistsHomeBtn').addEventListener('click', goToHome);
    document.getElementById('detailHomeBtn').addEventListener('click', goToHome);

    // Botón volver al calendario
    document.getElementById('backToCalendarBtn').addEventListener('click', () => {
        showView('calendar');
    });

    // Navegación del carrusel de detalle
    document.getElementById('detailCarouselPrev').addEventListener('click', () => {
        if (detailCarouselIndex > 0) {
            detailCarouselIndex--;
            updateDetailCarouselPosition();
        }
    });

    document.getElementById('detailCarouselNext').addEventListener('click', () => {
        if (detailCarouselIndex < detailConcerts.length - 1) {
            detailCarouselIndex++;
            updateDetailCarouselPosition();
        }
    });

    // Touch swipe para el carrusel de detalle
    let detailTouchStartX = 0;
    let detailTouchEndX = 0;

    const detailTrack = document.getElementById('detailCarouselTrack');
    if (detailTrack) {
        detailTrack.addEventListener('touchstart', (e) => {
            detailTouchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        detailTrack.addEventListener('touchend', (e) => {
            detailTouchEndX = e.changedTouches[0].screenX;
            handleDetailSwipe();
        }, { passive: true });
    }

    function handleDetailSwipe() {
        const swipeThreshold = 50;
        const diff = detailTouchStartX - detailTouchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && detailCarouselIndex < detailConcerts.length - 1) {
                detailCarouselIndex++;
            } else if (diff < 0 && detailCarouselIndex > 0) {
                detailCarouselIndex--;
            }
            updateDetailCarouselPosition();
        }
    }

    // Búsqueda de artistas
    artistSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const artistCards = artistsGrid.querySelectorAll('.artist-card');
        
        artistCards.forEach(card => {
            const name = card.querySelector('.artist-name').textContent.toLowerCase();
            card.style.display = name.includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Touch swipe para el carrusel principal
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0 && currentCarouselIndex < filteredConcerts.length - 1) {
                currentCarouselIndex++;
            } else if (diff < 0 && currentCarouselIndex > 0) {
                currentCarouselIndex--;
            }
            updateCarouselPosition();
            activateVideo(currentCarouselIndex);
        }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (currentView === 'home') {
            if (e.key === 'ArrowLeft' && currentCarouselIndex > 0) {
                currentCarouselIndex--;
                updateCarouselPosition();
                activateVideo(currentCarouselIndex);
            } else if (e.key === 'ArrowRight' && currentCarouselIndex < filteredConcerts.length - 1) {
                currentCarouselIndex++;
                updateCarouselPosition();
                activateVideo(currentCarouselIndex);
            }
        } else if (currentView === 'detail') {
            if (e.key === 'ArrowLeft' && detailCarouselIndex > 0) {
                detailCarouselIndex--;
                updateDetailCarouselPosition();
            } else if (e.key === 'ArrowRight' && detailCarouselIndex < detailConcerts.length - 1) {
                detailCarouselIndex++;
                updateDetailCarouselPosition();
            }
        }
    });
}

function cambiarVista(vista) {
    const body = document.body;
    // Remover todas las clases de sección
    body.classList.remove('section-home', 'section-artistas', 'section-calendario');
    
    // Mapear vistas a clases CSS
    const vistaMap = {
        'home': 'section-home',
        'artists': 'section-artistas',
        'calendar': 'section-calendario',
        'detail': 'section-calendario' // detail usa el mismo color que calendario (amarillo)
    };
    
    // Agregar la nueva clase
    if (vistaMap[vista]) {
        body.classList.add(vistaMap[vista]);
    }
}

// ==========================================
// INICIAR LA APLICACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromGoogleSheets();
});