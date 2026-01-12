// ==========================================
        // CONFIGURACIÃ“N - GOOGLE SHEETS
        // ==========================================
        // Reemplaza este ID con el ID de tu Google Sheet
        const SHEET_ID = '19dEHaMULZ8lIPLFYY66jBtnTh0jXeQ9unG8ktL0nxbQ';
        const SHEET_NAME = 'conciertos'; // Nombre de la hoja
        const API_KEY = 'TU_API_KEY_AQUI'; // Opcional si el sheet es pÃºblico
        
        // URL para Google Sheets publicado como CSV
        // Formato: https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={SHEET_NAME}
        // Se agrega timestamp para evitar cachÃ©
        const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}&t=${Date.now()}`;

        // ==========================================
        // DATOS DE EJEMPLO (se reemplazarÃ¡n con Google Sheets)
        // ==========================================
        let concertsData = [
            {
                id: 1,
                artist: "LIMP BISKIT",
                date: "2026-01-09",
                dayName: "MARTES",
                dayNumber: 9,
                month: "ENERO",
                monthNumber: 1,
                year: 2026,
                venue: "Costa 21",
                time: "9:00 PM",
                videoId: "abc123", // ID de JWPlayer
                ticketUrl: "https://teleticket.com.pe",
                ticketProvider: "TELETICKET",
                artistImage: "https://via.placeholder.com/300x300/333/fff?text=Limp+Biskit"
            },
            {
                id: 2,
                artist: "JOHN SUMMIT",
                date: "2026-01-14",
                dayName: "MIÃ‰RCOLES",
                dayNumber: 14,
                month: "ENERO",
                monthNumber: 1,
                year: 2026,
                venue: "Arena PerÃº",
                time: "10:00 PM",
                videoId: "def456",
                ticketUrl: "https://joinnus.com",
                ticketProvider: "JOINNUS",
                artistImage: "https://via.placeholder.com/300x300/333/fff?text=John+Summit"
            },
            {
                id: 3,
                artist: "RAFO RÃEZ Y LOS PARANOIAS",
                date: "2026-01-23",
                dayName: "VIERNES",
                dayNumber: 23,
                month: "ENERO",
                monthNumber: 1,
                year: 2026,
                venue: "La Noche de Barranco",
                time: "8:00 PM",
                videoId: "ghi789",
                ticketUrl: "https://teleticket.com.pe",
                ticketProvider: "TELETICKET",
                artistImage: "https://via.placeholder.com/300x300/333/fff?text=Rafo+Raez"
            },
            {
                id: 4,
                artist: "POOCHI MARAMBIO Y TIERRA SUR",
                date: "2026-02-05",
                dayName: "JUEVES",
                dayNumber: 5,
                month: "FEBRERO",
                monthNumber: 2,
                year: 2026,
                venue: "Gran Teatro Nacional",
                time: "7:30 PM",
                videoId: "jkl012",
                ticketUrl: "https://teleticket.com.pe",
                ticketProvider: "TELETICKET",
                artistImage: "https://via.placeholder.com/300x300/333/fff?text=Poochi"
            },
            {
                id: 5,
                artist: "AXÃ‰ BAHIA",
                date: "2026-02-14",
                dayName: "SÃBADO",
                dayNumber: 14,
                month: "FEBRERO",
                monthNumber: 2,
                year: 2026,
                venue: "Explanada del Estadio Monumental",
                time: "6:00 PM",
                videoId: "mno345",
                ticketUrl: "https://joinnus.com",
                ticketProvider: "JOINNUS",
                artistImage: "https://via.placeholder.com/300x300/333/fff?text=Axe+Bahia"
            },
            {
                id: 6,
                artist: "MANUEL DONAYRE",
                date: "2026-12-09",
                dayName: "MIÃ‰RCOLES",
                dayNumber: 9,
                month: "DICIEMBRE",
                monthNumber: 12,
                year: 2026,
                venue: "Teatro Peruano JaponÃ©s",
                time: "8:00 PM",
                videoId: "pqr678",
                ticketUrl: "https://teleticket.com.pe",
                ticketProvider: "TELETICKET",
                artistImage: "https://via.placeholder.com/300x300/333/fff?text=Manuel+Donayre"
            }
        ];

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
        
        const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIÃ‰RCOLES', 'JUEVES', 'VIERNES', 'SÃBADO'];

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
                initializeApp();
            } catch (error) {
                console.log('Usando datos de ejemplo. Error al cargar Google Sheets:', error);
                initializeApp();
            }
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

                // Procesar fecha
                if (concert.date) {
                    const dateObj = new Date(concert.date);
                    concert.dayNumber = dateObj.getDate();
                    concert.monthNumber = dateObj.getMonth() + 1;
                    concert.month = monthNames[dateObj.getMonth()];
                    concert.year = dateObj.getFullYear();
                    concert.dayName = dayNames[dateObj.getDay()];
                }

                concert.id = i;
                data.push(concert);
            }

            return data;
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
        // FUNCIONES DE INICIALIZACIÃ“N
        // ==========================================
        function initializeApp() {
            // Ordenar conciertos por fecha
            concertsData.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Encontrar el prÃ³ximo concierto
            const today = new Date();
            const upcomingConcerts = concertsData.filter(c => new Date(c.date) >= today);
            
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
            
            // Configurar IntersectionObserver para autoplay
            setupVideoObserver();
            
            // Inicializar vista home con colores correctos
            cambiarVista('home');
        }

        // IntersectionObserver para detectar cuando el video es visible
        let videoObserver = null;
        let activeVideoIndex = -1; // Track del video actualmente reproduciÃ©ndose
        
        function setupVideoObserver() {
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            };

            videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const container = entry.target;
                    const videoIndex = parseInt(container.getAttribute('data-video-index'));
                    
                    if (entry.isIntersecting && videoIndex === currentCarouselIndex && activeVideoIndex !== videoIndex) {
                        // Activar este video
                        activateVideo(videoIndex);
                    }
                });
            }, options);

            observeVideoContainers();
        }

        function activateVideo(index) {
            const concert = filteredConcerts[index];
            if (!concert || !concert.videoId) return;
            
            // Pausar video anterior si existe
            if (activeVideoIndex !== -1 && activeVideoIndex !== index) {
                const prevContainer = carouselTrack.querySelector(`[data-video-index="${activeVideoIndex}"]`);
                if (prevContainer) {
                    const prevConcert = filteredConcerts[activeVideoIndex];
                    if (prevConcert && prevConcert.videoId) {
                        prevContainer.innerHTML = renderVideo(prevConcert.videoId, false);
                    }
                }
            }
            
            // Activar nuevo video
            const container = carouselTrack.querySelector(`[data-video-index="${index}"]`);
            if (container) {
                container.innerHTML = renderVideo(concert.videoId, true);
                activeVideoIndex = index;
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
                // Inicialmente sin autoplay, el observer lo activarÃ¡
                return `
                <div class="concert-card" data-index="${index}">
                    <p class="concert-date">${concert.dayName} ${concert.dayNumber}</p>
                    <h3 class="concert-artist">${concert.artist}</h3>
                    <div class="concert-media">
                        <div class="video-container" data-video-index="${index}">
                            ${renderVideo(concert.videoId, false)}
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
            `}).join('');

            carouselTrack.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
            
            // Reconectar el observer despuÃ©s de renderizar
            setTimeout(() => {
                observeVideoContainers();
            }, 100);
        }

        function renderVideo(videoId, autoplay = false) {
            // Para JWPlayer - usando el formato de content.jwplatform
            // ParÃ¡metros: mute=true, autostart segÃºn contexto, loop, sin videos relacionados
            if (videoId && videoId !== '') {
                const autoplayParam = autoplay ? 'true' : 'false';
                return `
                    <iframe 
                        src="https://content.jwplatform.com/players/${videoId}.html?mute=true&volume=0&autostart=${autoplayParam}&repeat=true&nextUpDisplay=false&related.autoplaytimer=0&related.onclick=none&displaytitle=false&displaydescription=false&playbackRateControls=false" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        scrolling="no"
                        title="Video del artista"
                        allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="jwplayer-iframe"
                        data-video-id="${videoId}"
                        ${autoplay ? 'data-autoplay="true"' : ''}>
                    </iframe>
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
        }

        function updateActiveVideo() {
            // Forzar activaciÃ³n del video actual
            activateVideo(currentCarouselIndex);
        }

        function renderCalendar() {
            calendarMonthTitle.textContent = monthNames[currentCalendarMonth];
            
            const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
            const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
            const startingDay = firstDay.getDay();
            const totalDays = lastDay.getDate();
            const today = new Date();

            // Obtener conciertos del mes actual
            const monthConcerts = concertsData.filter(c => 
                c.monthNumber === currentCalendarMonth + 1 && c.year === currentCalendarYear
            );

            let html = '';

            // DÃ­as vacÃ­os al inicio
            for (let i = 0; i < startingDay; i++) {
                html += '<div class="calendar-day empty"></div>';
            }

            // DÃ­as del mes
            for (let day = 1; day <= totalDays; day++) {
                const dayDate = new Date(currentCalendarYear, currentCalendarMonth, day);
                const isPast = dayDate < today && dayDate.toDateString() !== today.toDateString();
                const hasConcert = monthConcerts.some(c => c.dayNumber === day);
                
                let classes = 'calendar-day';
                if (isPast) classes += ' past';
                if (hasConcert) classes += ' has-event';

                html += `<div class="${classes}" data-day="${day}" ${hasConcert ? 'onclick="showDayDetail(' + day + ')"' : ''}>${day}</div>`;
            }

            calendarDays.innerHTML = html;
        }

        function renderArtists() {
            // Obtener artistas Ãºnicos
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
                <div class="artist-card" onclick="showArtistDetail('${artist.name}')">
                    <img src="${artist.image}" alt="${artist.name}" class="artist-image" onerror="this.src='https://via.placeholder.com/300x300/333/fff?text=${encodeURIComponent(artist.name)}'">
                    <div class="artist-name">${artist.name}</div>
                </div>
            `).join('');
        }

        function renderDetailConcerts(concerts) {
            detailConcerts = concerts;
            detailCarouselIndex = 0;
            
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
                            ${renderVideo(concert.videoId, index === 0)}
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

            detailCarouselTrack.style.transform = `translateX(0%)`;
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
            if (!concert || !concert.videoId) return;
            
            // Pausar videos anteriores en el carrusel de detalle
            detailConcerts.forEach((c, i) => {
                if (i !== index && c.videoId) {
                    const container = detailCarouselTrack.querySelector(`[data-detail-video-index="${i}"]`);
                    if (container) {
                        container.innerHTML = renderVideo(c.videoId, false);
                    }
                }
            });
            
            // Activar video actual
            const container = detailCarouselTrack.querySelector(`[data-detail-video-index="${index}"]`);
            if (container) {
                container.innerHTML = renderVideo(concert.videoId, true);
            }
        }

        function updateDetailCarouselButtons() {
            const prevBtn = document.getElementById('detailCarouselPrev');
            const nextBtn = document.getElementById('detailCarouselNext');
            
            if (prevBtn) {
                prevBtn.style.opacity = detailCarouselIndex === 0 ? '0.3' : '1';
                prevBtn.style.pointerEvents = detailCarouselIndex === 0 ? 'none' : 'auto';
            }
            if (nextBtn) {
                nextBtn.style.opacity = detailCarouselIndex >= detailConcerts.length - 1 ? '0.3' : '1';
                nextBtn.style.pointerEvents = detailCarouselIndex >= detailConcerts.length - 1 ? 'none' : 'auto';
            }
        }

        // ==========================================
        // FUNCIONES DE NAVEGACIÃ“N
        // ==========================================
        function showView(view) {
            currentView = view;
            
            // Pausar todos los videos al cambiar de vista
            pauseAllVideos();
            
            // Cambiar colores del crowd-container segÃºn la vista
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
            
            // Reemplazar todos los iframes con versiÃ³n sin autoplay para pausarlos
            const allIframes = document.querySelectorAll('.jwplayer-iframe');
            allIframes.forEach(iframe => {
                const videoId = iframe.getAttribute('data-video-id');
                if (videoId) {
                    const container = iframe.parentElement;
                    container.innerHTML = renderVideo(videoId, false);
                }
            });
        }

        function goToHome() {
            showView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function showDayDetail(day) {
            const dayConcerts = concertsData.filter(c => 
                c.dayNumber === day && 
                c.monthNumber === currentCalendarMonth + 1 && 
                c.year === currentCalendarYear
            );

            if (dayConcerts.length > 0) {
                detailMonthTitle.textContent = monthNames[currentCalendarMonth];
                renderDetailConcerts(dayConcerts);
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

            // NavegaciÃ³n del carrusel
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

            // NavegaciÃ³n del calendario
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

            // BotÃ³n volver al calendario
            document.getElementById('backToCalendarBtn').addEventListener('click', () => {
                showView('calendar');
            });

            // NavegaciÃ³n del carrusel de detalle
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
                });

                detailTrack.addEventListener('touchend', (e) => {
                    detailTouchEndX = e.changedTouches[0].screenX;
                    handleDetailSwipe();
                });
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

            // BÃºsqueda de artistas
            artistSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const artistCards = artistsGrid.querySelectorAll('.artist-card');
                
                artistCards.forEach(card => {
                    const name = card.querySelector('.artist-name').textContent.toLowerCase();
                    card.style.display = name.includes(searchTerm) ? 'block' : 'none';
                });
            });

            // Touch swipe para el carrusel
            let touchStartX = 0;
            let touchEndX = 0;

            carouselTrack.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });

            carouselTrack.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });

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
        }

        function cambiarVista(vista) {
            const body = document.body;
            // Remover todas las clases de secciÃ³n
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
        // INICIAR LA APLICACIÃ“N
        // ==========================================
        document.addEventListener('DOMContentLoaded', () => {
            // Intentar cargar desde Google Sheets, si falla usar datos de ejemplo
            loadDataFromGoogleSheets();
        });