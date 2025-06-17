// ===== 🚀 GAMING ANALYTICS DASHBOARD v3.0 - PERFORMANCE OPTIMIZED =====
// Ultra-ottimizzato per file enormi (100k+ record) senza crash

// ===== PERFORMANCE CORE CONSTANTS =====
let CHUNK_SIZE = 1000; // Record per chunk durante processing
let MAX_DISPLAY_RECORDS = 50; // Record per pagina tabella
let DEBOUNCE_DELAY = 300; // Millisecondi per debounce filtri
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB max localStorage
const PROGRESS_UPDATE_INTERVAL = 100; // Aggiorna progress ogni 100 record

// ===== VARIABILI GLOBALI OTTIMIZZATE =====
let allData = [];
let filteredData = []; // Mantenuto per compatibilità
let filteredIndices = []; // Solo indici, non dati completi!
let currentChart = null;
let sortColumn = null;
let sortDirection = 'asc';
let anagraficaConcessioni = {};
let anagraficaData = [];
let nomiGiochiMapping = {};
let compartiMapping = {};

// ===== PERFORMANCE TRACKING =====
let currentPage = 0;
let isProcessing = false;
let dataIndices = {}; // Indici per ricerca ultra-veloce
let processingController = null;
let lastFilterTime = 0;

// ===== STORAGE KEYS =====
const STORAGE_KEY = 'gaming_analytics_data';
const ANAGRAFICA_STORAGE_KEY = 'gaming_analytics_anagrafica';
const NOMI_GIOCHI_STORAGE_KEY = 'gaming_analytics_nomi_giochi';
const COMPARTI_STORAGE_KEY = 'gaming_analytics_comparti';
const STORAGE_VERSION = '3.0'; // Aggiornata per performance

// ===== MAPPA CONVERSIONI =====
const monthNames = {
    '01': 'Gennaio', '02': 'Febbraio', '03': 'Marzo', '04': 'Aprile',
    '05': 'Maggio', '06': 'Giugno', '07': 'Luglio', '08': 'Agosto',
    '09': 'Settembre', '10': 'Ottobre', '11': 'Novembre', '12': 'Dicembre'
};

const quarterNames = {
    'Q1': '🌱 Q1 (Gen-Mar)', 'Q2': '🌞 Q2 (Apr-Giu)', 
    'Q3': '🍂 Q3 (Lug-Set)', 'Q4': '❄️ Q4 (Ott-Dic)'
};

const channelNames = {
    'fisico': '📍 Fisico', 'online': '💻 Online',
    'FISICO': '📍 Fisico', 'ONLINE': '💻 Online'
};

// ===== 🚀 INIZIALIZZAZIONE OTTIMIZZATA =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Gaming Analytics Dashboard v3.0 - Performance Mode');
    autoConfigurePerformance();
    loadStoredDataOptimized();
    loadStoredAnagrafica();
    loadStoredNomiGiochi();
    loadStoredComparti();
    setupEventListenersOptimized();
    initPerformanceMonitoring();
});

// ===== 🎯 AUTO-CONFIGURAZIONE PERFORMANCE =====
function autoConfigurePerformance() {
    const memory = performance.memory;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (memory) {
        const availableMB = memory.jsHeapSizeLimit / 1024 / 1024;
        console.log(`💾 Memoria disponibile: ${Math.round(availableMB)}MB`);
        
        if (availableMB < 500) {
            // Dispositivo low-end
            CHUNK_SIZE = 500;
            MAX_DISPLAY_RECORDS = 25;
            DEBOUNCE_DELAY = 500;
            console.log('🐌 Modalità conservativa attivata');
        } else if (availableMB > 2000) {
            // Dispositivo high-end
            CHUNK_SIZE = 2000;
            MAX_DISPLAY_RECORDS = 100;
            DEBOUNCE_DELAY = 200;
            console.log('🚀 Modalità performance attivata');
        } else {
            // Dispositivo standard - usa defaults
            console.log('⚖️ Modalità bilanciata attivata');
        }
    }
    
    console.log(`🎯 Performance configurata:`, {
        CHUNK_SIZE,
        MAX_DISPLAY_RECORDS,
        DEBOUNCE_DELAY,
        cores: cores
    });
}

// ===== PERFORMANCE MONITORING =====
function initPerformanceMonitoring() {
    // Aggiorna metriche ogni 2 secondi
    setInterval(updatePerformanceMetrics, 2000);
    
    // Aggiorna memoria ogni 5 secondi
    setInterval(updateMemoryDisplay, 5000);
    
    console.log('📊 Performance monitoring attivato');
}

function updatePerformanceMetrics() {
    const totalRecordsEl = document.getElementById('totalRecordsMetric');
    const filteredRecordsEl = document.getElementById('filteredRecordsMetric');
    const indicesCountEl = document.getElementById('indicesCount');
    const lastFilterTimeEl = document.getElementById('lastFilterTime');
    
    if (totalRecordsEl) totalRecordsEl.textContent = allData.length;
    if (filteredRecordsEl) filteredRecordsEl.textContent = filteredIndices.length;
    if (indicesCountEl) indicesCountEl.textContent = Object.keys(dataIndices).length;
    if (lastFilterTimeEl) lastFilterTimeEl.textContent = lastFilterTime ? `${lastFilterTime}ms` : '-';
}

function updateMemoryDisplay() {
    const memoryIndicator = document.getElementById('memoryIndicator');
    const memoryUsage = document.getElementById('memoryUsage');
    
    if (performance.memory && memoryIndicator && memoryUsage) {
        const usedMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
        
        memoryUsage.textContent = `${usedMB}MB / ${limitMB}MB`;
        memoryIndicator.style.display = 'block';
        
        // Cambia colore basato sull'uso
        const usage = usedMB / limitMB;
        if (usage > 0.8) {
            memoryIndicator.className = 'memory-indicator danger';
        } else if (usage > 0.6) {
            memoryIndicator.className = 'memory-indicator warning';
        } else {
            memoryIndicator.className = 'memory-indicator';
        }
    }
}

// ===== EVENT LISTENERS OTTIMIZZATI =====
function setupEventListenersOptimized() {
    // Chart controls con debouncing
    const chartUpdate = debounce(updateChart, 200);
    document.getElementById('chartType')?.addEventListener('change', chartUpdate);
    document.getElementById('chartMetric')?.addEventListener('change', chartUpdate);
    document.getElementById('chartGroupBy')?.addEventListener('change', chartUpdate);
    
    // File input con size check
    document.getElementById('fileInput')?.addEventListener('change', checkFileSize);
    
    // Chiudi dropdown ottimizzato
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.multi-select')) {
            document.querySelectorAll('.multi-select-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
    
    console.log('🎛️ Event listeners ottimizzati inizializzati');
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function checkFileSize() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    const warning = document.getElementById('fileSizeWarning');
    const estimatedTime = document.getElementById('estimatedTime');
    
    if (!files || files.length === 0) return;
    
    let totalSize = 0;
    for (let file of files) {
        totalSize += file.size;
    }
    
    // Mostra warning per file > 10MB
    if (totalSize > 10 * 1024 * 1024 && warning) {
        warning.style.display = 'block';
        const estimatedSeconds = Math.ceil(totalSize / (1024 * 1024 * 2)); // 2MB/sec stimato
        if (estimatedTime) estimatedTime.textContent = `${estimatedSeconds} secondi`;
    } else if (warning) {
        warning.style.display = 'none';
    }
}

// ===== PROGRESS OVERLAY =====
function showProgressOverlay(show, text = '', percentage = 0) {
    let overlay = document.getElementById('progressOverlay');
    
    if (show && !overlay) {
        overlay = document.createElement('div');
        overlay.id = 'progressOverlay';
        overlay.className = 'progress-overlay';
        overlay.innerHTML = `
            <div class="progress-container">
                <div class="progress-text">Elaborazione in corso...</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-details">Attendere...</div>
                <div class="chunk-progress"></div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    if (overlay) {
        if (show) {
            overlay.style.display = 'flex';
            updateProgressOverlay(text, percentage);
        } else {
            overlay.style.display = 'none';
        }
    }
}

function updateProgressOverlay(text, percentage) {
    const overlay = document.getElementById('progressOverlay');
    if (!overlay) return;
    
    const progressText = overlay.querySelector('.progress-text');
    const progressFill = overlay.querySelector('.progress-fill');
    const progressDetails = overlay.querySelector('.progress-details');
    
    if (progressText) progressText.textContent = text;
    if (progressFill) progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    if (progressDetails) progressDetails.textContent = `${Math.round(percentage)}% completato`;
}

// ===== 🔄 CHUNKED FILE PROCESSING =====
async function processFiles() {
    if (isProcessing) {
        showStatus('⏳ Operazione in corso, attendere...', 'warning');
        return;
    }

    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showStatus('❌ Seleziona almeno un file Excel', 'error');
        return;
    }

    isProcessing = true;
    showProgressOverlay(true, 'Inizializzazione...', 0);
    
    try {
        console.log('🚀 Avvio processing ottimizzato per', files.length, 'file(s)');
        const newData = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            updateProgressOverlay(`🔍 Lettura file ${i + 1}/${files.length}: ${file.name}`, (i / files.length) * 30);
            
            // Processa file in chunks
            const fileData = await processFileOptimized(file);
            newData.push(...fileData);
            
            console.log(`✅ File ${file.name}: ${fileData.length} record processati`);
        }
        
        if (newData.length > 0) {
            updateProgressOverlay('🔧 Elaborazione dati in corso...', 40);
            
            // Processa dati in chunks per non bloccare UI
            const processedData = await processDataInChunks(newData);
            
            updateProgressOverlay('🔍 Costruzione indici di ricerca...', 70);
            
            // Costruisci indici per ricerca veloce
            await buildSearchIndicesOptimized(processedData);
            
            updateProgressOverlay('🧹 Filtraggio duplicati...', 85);
            
            // Filtra duplicati
            const uniqueData = await removeDuplicatesOptimized(processedData);
            
            // Aggiungi ai dati esistenti
            allData.push(...uniqueData);
            
            updateProgressOverlay('💾 Salvataggio dati...', 95);
            
            // Salva in modo ottimizzato
            await saveDataOptimized();
            
            updateProgressOverlay('✅ Completato!', 100);
            
            // Setup UI
            populateFilters();
            showStatus(`🎉 Elaborati ${uniqueData.length} nuovi record da ${files.length} file (${newData.length - uniqueData.length} duplicati ignorati)`, 'success');
            
            document.getElementById('filtersSection').style.display = 'block';
            await applyFilters();
            
            console.log(`🏁 Processing completato: ${allData.length} record totali in memoria`);
        } else {
            showStatus('❌ Nessun dato trovato nei file', 'error');
        }
    } catch (error) {
        console.error('💥 Errore nel processing:', error);
        showStatus(`💥 Errore nell'elaborazione: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        setTimeout(() => showProgressOverlay(false), 1000);
    }
}

// ===== PROCESSING FILE SINGOLO =====
async function processFileOptimized(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
                let sheetName = workbook.SheetNames[0];
                
                // Cerca foglio specifico per DB CPT
                if (workbook.SheetNames.includes('DB-MARKET SHARE-2022')) {
                    console.log('📊 Rilevato file DB CPT - usando foglio DB-MARKET SHARE-2022');
                    sheetName = 'DB-MARKET SHARE-2022';
                }
                
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log(`📋 Dati Excel letti: ${jsonData.length} righe dal foglio ${sheetName}`);
                
                // Determina formato basandosi sulla struttura
                let parsedData;
                if (isHistoricalFormat(jsonData)) {
                    console.log(`🏛️ Formato STORICO rilevato per ${file.name}`);
                    parsedData = await parseHistoricalFormatChunked(jsonData, file.name);
                } else if (isHippoFormat(jsonData)) {
                    console.log(`🎯 Formato IPPICO rilevato per ${file.name}`);
                    parsedData = parseHippoFormatExcelData(jsonData, file.name);
                } else if (jsonData.length > 1 && jsonData[1][0] && 
                    jsonData[1][0].toString().includes('Periodo da') && 
                    !jsonData[1][0].toString().includes('Scommesse Ippica')) {
                    console.log(`📊 Nuovo formato rilevato per ${file.name}`);
                    parsedData = parseNewFormatExcelData(jsonData, file.name);
                } else {
                    console.log(`📋 Formato precedente rilevato per ${file.name}`);
                    parsedData = parseExcelData(jsonData, file.name);
                }
                
                resolve(parsedData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error(`Errore nella lettura del file ${file.name}`));
        reader.readAsBinaryString(file);
    });
}

// ===== PROCESSING DATI IN CHUNKS =====
async function processDataInChunks(data) {
    const result = [];
    const totalItems = data.length;
    
    for (let i = 0; i < totalItems; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const progress = 40 + ((i / totalItems) * 25); // 40-65% della barra
        
        updateProgressOverlay(`🔧 Elaborazione chunk ${Math.floor(i/CHUNK_SIZE) + 1}/${Math.ceil(totalItems/CHUNK_SIZE)}`, progress);
        
        // Applica mappature e arricchimenti al chunk
        const processedChunk = chunk.map(item => {
            let enrichedItem = enrichDataWithAnagrafica(item);
            enrichedItem = applyAllMappings(enrichedItem);
            return enrichedItem;
        });
        
        result.push(...processedChunk);
        
        // Yielding per non bloccare UI
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return result;
}

// ===== COSTRUZIONE INDICI OTTIMIZZATA =====
async function buildSearchIndicesOptimized(data) {
    dataIndices = {
        byGame: {},
        byYear: {},
        byQuarter: {},
        byMonth: {},
        byChannel: {},
        byConcessionario: {},
        byProprieta: {},
        byRagioneSociale: {},
        byComparto: {},
        byTipoGioco: {},
        byGruppo: {}
    };
    
    const totalRecords = data.length;
    console.log(`🔍 Costruzione indici per ${totalRecords} record...`);
    
    for (let i = 0; i < totalRecords; i++) {
        const item = data[i];
        const globalIndex = allData.length + i; // Indice globale nel dataset completo
        
        // Aggiorna progress ogni 1000 record
        if (i % 1000 === 0) {
            const progress = 70 + ((i / totalRecords) * 15); // 70-85%
            updateProgressOverlay(`🔍 Costruzione indici: ${i}/${totalRecords}`, progress);
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Costruisci indici
        addToIndex(dataIndices.byGame, item.gameNameComplete || item.gameName, globalIndex);
        addToIndex(dataIndices.byYear, item.year, globalIndex);
        addToIndex(dataIndices.byQuarter, item.quarterYear, globalIndex);
        addToIndex(dataIndices.byMonth, item.monthYear, globalIndex);
        addToIndex(dataIndices.byChannel, item.canale, globalIndex);
        addToIndex(dataIndices.byConcessionario, item.concessionarioNome, globalIndex);
        addToIndex(dataIndices.byProprieta, item.concessionarioProprietà, globalIndex);
        addToIndex(dataIndices.byRagioneSociale, item.ragioneSociale, globalIndex);
        addToIndex(dataIndices.byComparto, item.comparto, globalIndex);
        
        if (item.fileFormat === 'hippoFormat' && item.tipoGiocoName) {
            addToIndex(dataIndices.byTipoGioco, item.tipoGiocoName, globalIndex);
        }
        
        if (item.fileFormat === 'historicalFormat' && item.gruppo) {
            addToIndex(dataIndices.byGruppo, item.gruppo, globalIndex);
        }
    }
    
    console.log('🔍 Indici costruiti:', Object.keys(dataIndices).map(key => 
        `${key}: ${Object.keys(dataIndices[key]).length} voci`
    ));
}

function addToIndex(index, key, recordIndex) {
    if (!key) return;
    if (!index[key]) {
        index[key] = [];
    }
    index[key].push(recordIndex);
}

// ===== RIMOZIONE DUPLICATI OTTIMIZZATA =====
async function removeDuplicatesOptimized(newData) {
    const existingKeys = new Set();
    
    // Crea set con chiavi esistenti
    allData.forEach(item => {
        const key = `${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.tipoGioco || 'standard'}`;
        existingKeys.add(key);
    });
    
    // Filtra duplicati
    return newData.filter(item => {
        const key = `${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.tipoGioco || 'standard'}`;
        return !existingKeys.has(key);
    });
}

// ===== GESTIONE DATI SALVATI OTTIMIZZATA =====
async function saveDataOptimized() {
    try {
        // Controlla dimensione prima di salvare
        const dataString = JSON.stringify(allData);
        const sizeInBytes = new Blob([dataString]).size;
        
        if (sizeInBytes > MAX_STORAGE_SIZE) {
            console.warn(`⚠️ Dati troppo grandi per localStorage (${Math.round(sizeInBytes / 1024 / 1024)}MB), utilizzando compressione`);
            
            // Salva solo i dati essenziali
            const essentialData = allData.map(item => ({
                fileName: item.fileName,
                gameName: item.gameName,
                gameNameComplete: item.gameNameComplete,
                month: item.month,
                year: item.year,
                monthYear: item.monthYear,
                quarter: item.quarter,
                quarterYear: item.quarterYear,
                codiceConcessione: item.codiceConcessione,
                ragioneSociale: item.ragioneSociale,
                concessionarioNome: item.concessionarioNome,
                importoRaccolta: item.importoRaccolta,
                importoSpesa: item.importoSpesa,
                percentualeRaccolta: item.percentualeRaccolta,
                percentualeSpesa: item.percentualeSpesa,
                canale: item.canale,
                channelName: item.channelName,
                concessionarioProprietà: item.concessionarioProprietà,
                comparto: item.comparto,
                gruppo: item.gruppo,
                fileFormat: item.fileFormat,
                tipoGioco: item.tipoGioco,
                tipoGiocoName: item.tipoGiocoName,
                monthName: item.monthName,
                quarterName: item.quarterName,
                isNegativeSpesa: item.isNegativeSpesa
            }));
            
            const compressedData = {
                version: STORAGE_VERSION,
                timestamp: new Date().toISOString(),
                data: essentialData,
                compressed: true
            };
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(compressedData));
        } else {
            // Salvataggio normale
            const dataToSave = {
                version: STORAGE_VERSION,
                timestamp: new Date().toISOString(),
                data: allData
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }
        
        showPersistenceIndicator();
        updateDataStatus();
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            showStatus('💾 Storage locale pieno, avvio pulizia automatica...', 'warning');
            await cleanupOldData();
        } else {
            console.error('❌ Errore nel salvataggio dati:', error);
        }
    }
}

function loadStoredDataOptimized() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.data) {
                allData = parsed.data.map(item => ({
                    ...item,
                    canale: item.canale || 'fisico',
                    quarterYear: item.quarterYear || `${item.quarter}/${item.year}`,
                    concessionarioNome: item.concessionarioNome || item.ragioneSociale,
                    concessionarioProprietà: item.concessionarioProprietà || 'Non specificato',
                    gameNameComplete: item.gameNameComplete || item.gameName,
                    comparto: item.comparto || 'Non classificato',
                    gruppo: item.gruppo || ''
                }));
                
                if (allData.length > 0) {
                    console.log(`💾 Caricati ${allData.length} record salvati`);
                    
                    // Costruisci indici in background
                    setTimeout(async () => {
                        await buildSearchIndicesOptimized(allData);
                        populateFilters();
                        showStatus(`📂 Caricati ${allData.length} record salvati (${new Date(parsed.timestamp).toLocaleString('it-IT')})`, 'success');
                        document.getElementById('filtersSection').style.display = 'block';
                        await applyFilters();
                    }, 100);
                }
                updateDataStatus();
                
                if (parsed.version !== STORAGE_VERSION) {
                    setTimeout(() => saveDataOptimized(), 1000);
                }
            }
        } else {
            showStatus('💡 Carica i tuoi file Excel per iniziare l\'analisi', 'info');
        }
    } catch (error) {
        console.error('❌ Errore nel caricamento dati salvati:', error);
        showStatus('💡 Carica i tuoi file Excel per iniziare l\'analisi', 'info');
    }
}

async function cleanupOldData() {
    try {
        // Mantieni solo gli ultimi 12 mesi di dati
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 12);
        
        const cutoffYear = cutoffDate.getFullYear();
        const cutoffMonth = cutoffDate.getMonth() + 1;
        
        const originalLength = allData.length;
        allData = allData.filter(item => {
            const itemYear = parseInt(item.year);
            const itemMonth = parseInt(item.month);
            
            if (itemYear > cutoffYear) return true;
            if (itemYear === cutoffYear && itemMonth >= cutoffMonth) return true;
            return false;
        });
        
        const cleanedCount = originalLength - allData.length;
        
        await saveDataOptimized();
        showStatus(`🧹 Pulizia completata: rimossi ${cleanedCount} record vecchi, mantenuti ${allData.length} record recenti`, 'success');
        
        // Ricostruisci indici e filtri
        await buildSearchIndicesOptimized(allData);
        populateFilters();
        await applyFilters();
        
    } catch (error) {
        showStatus('❌ Errore nella pulizia dati', 'error');
    }
}

// ===== FILTRI ULTRA-OTTIMIZZATI =====
const applyFilters = debounce(async function() {
    if (isProcessing) return;
    
    const startTime = performance.now();
    showStatus('🎛️ Applicazione filtri in corso...', 'info');
    
    try {
        // Ottieni valori filtri
        const filters = {
            games: getSelectedValues('gameFilter'),
            years: getSelectedValues('yearFilter'),
            quarters: getSelectedValues('quarterFilter'),
            months: getSelectedValues('monthFilter'),
            channels: getSelectedValues('channelFilter'),
            concessionari: getSelectedValues('concessionaryFilter'),
            proprieta: getSelectedValues('proprietaFilter'),
            ragioneSociali: getSelectedValues('ragioneSocialeFilter'),
            comparti: getSelectedValues('compartoFilter'),
            tipiGioco: getSelectedValues('tipoGiocoFilter'),
            gruppi: getSelectedValues('gruppoFilter')
        };
        
        // Usa indici per filtrare velocemente
        if (Object.keys(dataIndices).length > 0) {
            filteredIndices = await getFilteredIndicesOptimized(filters);
        } else {
            // Fallback se indici non disponibili
            filteredData = allData.filter(item => {
                const gameToCheck = item.gameNameComplete || item.gameName;
                const tipoGiocoMatch = item.fileFormat === 'hippoFormat' ? 
                    (filters.tipiGioco.length === 0 || filters.tipiGioco.includes(item.tipoGiocoName)) : 
                    true;
                const gruppoMatch = item.fileFormat === 'historicalFormat' ? 
                    (filters.gruppi.length === 0 || filters.gruppi.includes(item.gruppo)) : 
                    true;
                    
                return filters.games.includes(gameToCheck) &&
                       filters.years.includes(item.year) &&
                       filters.quarters.includes(item.quarterYear) &&
                       filters.months.includes(item.monthYear) &&
                       filters.channels.includes(item.canale) &&
                       filters.concessionari.includes(item.concessionarioNome) &&
                       filters.proprieta.includes(item.concessionarioProprietà) &&
                       filters.ragioneSociali.includes(item.ragioneSociale) &&
                       filters.comparti.includes(item.comparto) &&
                       tipoGiocoMatch &&
                       gruppoMatch;
            });
            
            filteredIndices = filteredData.map((_, index) => index);
        }
        
        const endTime = performance.now();
        lastFilterTime = Math.round(endTime - startTime);
        console.log(`⚡ Filtri applicati in ${lastFilterTime}ms a ${filteredIndices.length} record`);
        
        // Aggiorna display
        currentPage = 0; // Reset pagination
        updateDisplays();
        updateActiveFiltersDisplay();
        
        showStatus(`✅ Filtrati ${filteredIndices.length} record di ${allData.length} totali (${lastFilterTime}ms)`, 'success');
        
        // Chiudi dropdown
        document.querySelectorAll('.multi-select-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
    } catch (error) {
        showStatus(`❌ Errore nei filtri: ${error.message}`, 'error');
    }
}, DEBOUNCE_DELAY);

// Filtraggio ottimizzato usando indici
async function getFilteredIndicesOptimized(filters) {
    const intersections = [];
    
    // Usa indici per ogni filtro attivo
    if (filters.games.length > 0 && filters.games.length < Object.keys(dataIndices.byGame).length) {
        const gameIndices = [];
        filters.games.forEach(game => {
            if (dataIndices.byGame[game]) {
                gameIndices.push(...dataIndices.byGame[game]);
            }
        });
        intersections.push(new Set(gameIndices));
    }
    
    if (filters.years.length > 0 && filters.years.length < Object.keys(dataIndices.byYear).length) {
        const yearIndices = [];
        filters.years.forEach(year => {
            if (dataIndices.byYear[year]) {
                yearIndices.push(...dataIndices.byYear[year]);
            }
        });
        intersections.push(new Set(yearIndices));
    }
    
    if (filters.quarters.length > 0 && filters.quarters.length < Object.keys(dataIndices.byQuarter).length) {
        const quarterIndices = [];
        filters.quarters.forEach(quarter => {
            if (dataIndices.byQuarter[quarter]) {
                quarterIndices.push(...dataIndices.byQuarter[quarter]);
            }
        });
        intersections.push(new Set(quarterIndices));
    }
    
    if (filters.months.length > 0 && filters.months.length < Object.keys(dataIndices.byMonth).length) {
        const monthIndices = [];
        filters.months.forEach(month => {
            if (dataIndices.byMonth[month]) {
                monthIndices.push(...dataIndices.byMonth[month]);
            }
        });
        intersections.push(new Set(monthIndices));
    }
    
    if (filters.channels.length > 0 && filters.channels.length < Object.keys(dataIndices.byChannel).length) {
        const channelIndices = [];
        filters.channels.forEach(channel => {
            if (dataIndices.byChannel[channel]) {
                channelIndices.push(...dataIndices.byChannel[channel]);
            }
        });
        intersections.push(new Set(channelIndices));
    }
    
    if (filters.concessionari.length > 0 && filters.concessionari.length < Object.keys(dataIndices.byConcessionario).length) {
        const concessionarioIndices = [];
        filters.concessionari.forEach(concessionario => {
            if (dataIndices.byConcessionario[concessionario]) {
                concessionarioIndices.push(...dataIndices.byConcessionario[concessionario]);
            }
        });
        intersections.push(new Set(concessionarioIndices));
    }
    
    if (filters.proprieta.length > 0 && filters.proprieta.length < Object.keys(dataIndices.byProprieta).length) {
        const proprietaIndices = [];
        filters.proprieta.forEach(proprieta => {
            if (dataIndices.byProprieta[proprieta]) {
                proprietaIndices.push(...dataIndices.byProprieta[proprieta]);
            }
        });
        intersections.push(new Set(proprietaIndices));
    }
    
    if (filters.ragioneSociali.length > 0 && filters.ragioneSociali.length < Object.keys(dataIndices.byRagioneSociale).length) {
        const ragioneSocialeIndices = [];
        filters.ragioneSociali.forEach(ragioneSociale => {
            if (dataIndices.byRagioneSociale[ragioneSociale]) {
                ragioneSocialeIndices.push(...dataIndices.byRagioneSociale[ragioneSociale]);
            }
        });
        intersections.push(new Set(ragioneSocialeIndices));
    }
    
    if (filters.comparti.length > 0 && filters.comparti.length < Object.keys(dataIndices.byComparto).length) {
        const compartoIndices = [];
        filters.comparti.forEach(comparto => {
            if (dataIndices.byComparto[comparto]) {
                compartoIndices.push(...dataIndices.byComparto[comparto]);
            }
        });
        intersections.push(new Set(compartoIndices));
    }
    
    if (filters.tipiGioco.length > 0 && Object.keys(dataIndices.byTipoGioco).length > 0) {
        const tipoGiocoIndices = [];
        filters.tipiGioco.forEach(tipoGioco => {
            if (dataIndices.byTipoGioco[tipoGioco]) {
                tipoGiocoIndices.push(...dataIndices.byTipoGioco[tipoGioco]);
            }
        });
        if (tipoGiocoIndices.length > 0) {
            intersections.push(new Set(tipoGiocoIndices));
        }
    }
    
    if (filters.gruppi.length > 0 && Object.keys(dataIndices.byGruppo).length > 0) {
        const gruppoIndices = [];
        filters.gruppi.forEach(gruppo => {
            if (dataIndices.byGruppo[gruppo]) {
                gruppoIndices.push(...dataIndices.byGruppo[gruppo]);
            }
        });
        if (gruppoIndices.length > 0) {
            intersections.push(new Set(gruppoIndices));
        }
    }
    
    // Se nessun filtro, restituisci tutti gli indici
    if (intersections.length === 0) {
        return Array.from({ length: allData.length }, (_, i) => i);
    }
    
    // Intersezione di tutti i set
    let result = intersections[0];
    for (let i = 1; i < intersections.length; i++) {
        result = new Set([...result].filter(x => intersections[i].has(x)));
    }
    
    return Array.from(result).sort((a, b) => a - b);
}

// ===== VIRTUAL SCROLLING TABELLA =====
function updateTable() {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    if (!tableHead || !tableBody) return;
    
    // Headers
    const headers = ['Gioco', 'Tipo', 'Comparto', 'Gruppo', 'Anno', 'Trimestre', 'Mese', 'Canale', 'Codice', 'Concessionario', 'Ragione Sociale', 'Proprietà', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
    tableHead.innerHTML = `
        <tr>
            ${headers.map((header, index) => `
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable" 
                    onclick="sortTable(${index})">
                    ${header}
                    <span class="sort-arrow" id="arrow-${index}">▲</span>
                </th>
            `).join('')}
        </tr>
    `;
    
    // Calcola pagination
    const totalRecords = filteredIndices.length;
    const startIndex = currentPage * MAX_DISPLAY_RECORDS;
    const endIndex = Math.min(startIndex + MAX_DISPLAY_RECORDS, totalRecords);
    
    // Prendi solo i record della pagina corrente
    const pageIndices = filteredIndices.slice(startIndex, endIndex);
    const pageData = pageIndices.map(index => allData[index]);
    
    // Renderizza solo la pagina corrente
    tableBody.innerHTML = pageData.map(row => {
        const tipoGiocoDisplay = row.fileFormat === 'hippoFormat' ? 
            `<span class="tipo-gioco-badge tipo-${row.tipoGioco?.toLowerCase()}">${row.tipoGiocoName || ''}</span>` : 
            '-';
        
        const gruppoDisplay = row.fileFormat === 'historicalFormat' && row.gruppo ? 
            `<span class="gruppo-badge">${row.gruppo}</span>` : 
            '-';
        
        let rowClass = 'hover:bg-gray-50';
        if (row.fileFormat === 'hippoFormat') {
            rowClass += ' hippo-row';
        } else if (row.fileFormat === 'historicalFormat') {
            rowClass += ' historical-row';
        }
        
        return `
        <tr class="${rowClass}">
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.gameNameComplete || row.gameName}">${(row.gameNameComplete || row.gameName).length > 15 ? (row.gameNameComplete || row.gameName).substring(0, 15) + '...' : (row.gameNameComplete || row.gameName)}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${tipoGiocoDisplay}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                <span class="comparto-badge">${row.comparto}</span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${gruppoDisplay}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.year}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.quarter}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.monthName}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm">
                <span class="channel-badge channel-${row.canale}">${row.channelName}</span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.codiceConcessione}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium" title="${row.concessionarioNome}">${row.concessionarioNome.length > 15 ? row.concessionarioNome.substring(0, 15) + '...' : row.concessionarioNome}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.ragioneSociale}">${row.ragioneSociale.length > 20 ? row.ragioneSociale.substring(0, 20) + '...' : row.ragioneSociale}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.concessionarioProprietà}">${row.concessionarioProprietà.length > 15 ? row.concessionarioProprietà.substring(0, 15) + '...' : row.concessionarioProprietà}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.importoRaccolta}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.percentualeRaccolta}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 ${row.isNegativeSpesa ? 'negative-value' : ''}">${row.importoSpesa}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.percentualeSpesa}</td>
        </tr>
    `;
    }).join('');
    
    // Aggiungi pagination controls
    updatePaginationControls(totalRecords);
}

// ===== PAGINAZIONE =====
function updatePaginationControls(totalRecords) {
    const totalPages = Math.ceil(totalRecords / MAX_DISPLAY_RECORDS);
    let container = document.getElementById('paginationControls');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'paginationControls';
        document.getElementById('tableSection')?.appendChild(container);
    }
    
    const startRecord = (currentPage * MAX_DISPLAY_RECORDS) + 1;
    const endRecord = Math.min((currentPage + 1) * MAX_DISPLAY_RECORDS, totalRecords);
    
    container.innerHTML = `
        <div class="pagination-container">
            <div class="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200">
                <div class="text-sm text-gray-700">
                    Visualizzando <span class="font-medium">${startRecord}</span> - <span class="font-medium">${endRecord}</span> 
                    di <span class="font-medium">${totalRecords}</span> record
                    <span class="ml-2 text-xs text-gray-500">(${MAX_DISPLAY_RECORDS} per pagina)</span>
                </div>
                <div class="flex space-x-1">
                    <button onclick="changePage(0)" 
                            class="pagination-button ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${currentPage === 0 ? 'disabled' : ''}>
                        ⏮️ Prima
                    </button>
                    <button onclick="changePage(${currentPage - 1})" 
                            class="pagination-button ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${currentPage === 0 ? 'disabled' : ''}>
                        ⏪ Prec
                    </button>
                    <span class="pagination-button pagination-current">
                        ${currentPage + 1} / ${totalPages}
                    </span>
                    <button onclick="changePage(${currentPage + 1})" 
                            class="pagination-button ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
                        ⏩ Succ
                    </button>
                    <button onclick="changePage(${totalPages - 1})" 
                            class="pagination-button ${currentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
                        ⏭️ Ultima
                    </button>
                </div>
            </div>
        </div>
    `;
}

function changePage(newPage) {
    const totalPages = Math.ceil(filteredIndices.length / MAX_DISPLAY_RECORDS);
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
        currentPage = newPage;
        updateTable();
        
        // Scroll to top della tabella
        document.getElementById('tableSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===== PARSING FORMATO STORICO CHUNKED =====
async function parseHistoricalFormatChunked(jsonData, fileName) {
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1).filter(row => 
        row && row[0] && row[1] && row[2] && row[3]
    );
    
    const result = [];
    const totalRows = dataRows.length;
    
    console.log(`🏛️ Formato storico: elaborando ${totalRows} righe in chunks di ${CHUNK_SIZE}`);
    
    // Processa in chunks
    for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
        const chunk = dataRows.slice(i, i + CHUNK_SIZE);
        const progress = 30 + ((i / totalRows) * 10); // 30-40% della barra
        
        updateProgressOverlay(`📊 Elaborazione record ${i + 1}-${Math.min(i + CHUNK_SIZE, totalRows)} di ${totalRows}`, progress);
        
        // Processa chunk
        const chunkData = chunk.map(row => parseHistoricalRow(row, fileName));
        result.push(...chunkData);
        
        // Yielding per non bloccare UI
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return result;
}

function parseHistoricalRow(row, fileName) {
    const anno = row[0];
    let month = '01';
    
    try {
        const dateValue = row[1];
        let dateObj;
        
        if (dateValue instanceof Date) {
            dateObj = dateValue;
        } else if (typeof dateValue === 'string') {
            dateObj = new Date(dateValue);
        } else if (typeof dateValue === 'number') {
            // Excel serial date
            dateObj = new Date((dateValue - 25569) * 86400 * 1000);
        } else {
            throw new Error('Formato data non riconosciuto');
        }
        
        month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    } catch (error) {
        month = '01'; // Fallback
    }

    const year = anno.toString();
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    const codiceConcessione = row[2]?.toString().trim() || '';
    const ragioneSociale = row[3]?.toString().trim() || '';
    const concessionario = row[4]?.toString().trim() || '';
    const canale = row[5]?.toString().toLowerCase().trim() || 'fisico';
    const gruppo = row[6]?.toString().trim() || '';
    const comparto = row[7]?.toString().trim() || 'Non classificato';
    const gioco = row[8]?.toString().trim() || 'Gioco Sconosciuto';
    
    const ggt = row[9] || 0;
    const payout = row[10] || 0;
    const spesa = row[11] || 0;
    
    const importoRaccolta = ggt.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const importoSpesa = spesa.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    let percentualeRaccolta = '0%';
    let percentualeSpesa = '0%';
    
    if (ggt > 0) {
        const percSpesa = (spesa / ggt) * 100;
        percentualeSpesa = percSpesa.toFixed(2) + '%';
        
        const percPayout = (payout / ggt) * 100;
        percentualeRaccolta = percPayout.toFixed(2) + '%';
    }

    return {
        fileName,
        gameName: gioco,
        gameNameOriginal: gioco,
        gameNameComplete: gioco,
        month,
        year,
        monthYear: `${month}/${year}`,
        quarter,
        quarterYear,
        codiceConcessione,
        ragioneSociale,
        concessionarioNome: concessionario,
        importoRaccolta,
        percentualeRaccolta,
        importoSpesa,
        percentualeSpesa,
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        isNegativeSpesa: spesa < 0,
        canale,
        channelName: channelNames[canale] || canale,
        concessionarioProprietà: 'Non specificato',
        comparto,
        gruppo,
        ggt,
        payout,
        spesaNumerica: spesa,
        fileFormat: 'historicalFormat'
    };
}

// ===== ALTRE FUNZIONI DI PARSING (mantenute invariate) =====

function isHistoricalFormat(jsonData) {
    if (jsonData.length < 2) return false;
    
    const headers = jsonData[0];
    if (!headers || headers.length < 12) return false;
    
    const expectedHeaders = ['ANNO', 'MESE', 'N.CONC.', 'RAGIONE SOCIALE', 'CONCESSIONARIO', 'CANALE', 'GRUPPO', 'COMPARTO', 'GIOCO', 'GGT (VA)', 'PAYOUT (VA)', 'SPESA (VA)'];
    
    for (let i = 0; i < Math.min(expectedHeaders.length, headers.length); i++) {
        if (headers[i] !== expectedHeaders[i]) {
            return false;
        }
    }
    
    return true;
}

function isHippoFormat(jsonData) {
    if (jsonData.length < 4) return false;
    
    const titleRow = jsonData[0][0] || '';
    if (!titleRow.includes('Scommesse Ippica')) return false;
    
    for (let i = 4; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (row && row[2]) {
            const tipoGioco = row[2].toString().trim();
            if (tipoGioco === 'QF' || tipoGioco === 'TOTALIZZATORE' || tipoGioco === 'MULTIPLA') {
                return true;
            }
        }
    }
    
    return false;
}

function parseExcelData(jsonData, fileName) {
    if (jsonData.length < 6) {
        throw new Error(`File ${fileName}: formato non valido`);
    }

    const titleRow = jsonData[0][0] || '';
    const gameMatch = titleRow.match(/per\s+(.+)$/);
    const gameName = gameMatch ? gameMatch[1].trim().replace(/&agrave;/g, 'à') : 'Gioco Sconosciuto';

    const periodRow = jsonData[2][0] || '';
    const monthMatch = periodRow.match(/dal mese:\s*(\d{2})\/(\d{4})/);
    let month = 'Unknown', year = 'Unknown';
    
    if (monthMatch) {
        month = monthMatch[1];
        year = monthMatch[2];
    }

    const headers = jsonData[4];
    if (!headers || headers.length < 6) {
        throw new Error(`File ${fileName}: headers non trovati`);
    }

    const dataRows = jsonData.slice(5).filter(row => row && row[0]);
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    return dataRows.map(row => ({
        fileName: fileName,
        gameName: gameName,
        gameNameOriginal: gameName,
        gameNameComplete: gameName,
        month: month,
        year: year,
        monthYear: `${month}/${year}`,
        quarter: quarter,
        quarterYear: quarterYear,
        codiceConcessione: row[0]?.toString().trim() || '',
        ragioneSociale: row[1]?.toString().trim() || '',
        importoRaccolta: convertToItalianNumber(row[2]),
        percentualeRaccolta: row[3]?.toString() || '',
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        isNegativeSpesa: parseItalianNumber(row[4]) < 0,
        fileFormat: 'oldFormat'
    }));
}

function parseNewFormatExcelData(jsonData, fileName) {
    if (jsonData.length < 4) {
        throw new Error(`File ${fileName}: formato non valido (troppo poche righe)`);
    }

    const titleRow = jsonData[0][0] || '';
    const gameNameMatch = titleRow.split('-')[0].trim();
    const gameName = gameNameMatch || 'Gioco Sconosciuto';

    const periodRow = jsonData[1][0] || '';
    const monthMatch = periodRow.match(/(\w+)\s+(\d{4})/);
    
    let month = 'Unknown', year = 'Unknown';
    if (monthMatch) {
        const monthNamesItalian = {
            'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
            'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
            'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
        };
        
        const monthName = monthMatch[1].toLowerCase();
        month = monthNamesItalian[monthName] || 'Unknown';
        year = monthMatch[2];
    }

    const headers = jsonData[3];
    if (!headers || headers.length < 6) {
        throw new Error(`File ${fileName}: headers non trovati o incompleti`);
    }

    const dataRows = jsonData.slice(4).filter(row => row && row[0]);
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    return dataRows.map(row => ({
        fileName: fileName,
        gameName: gameName,
        gameNameOriginal: gameName,
        gameNameComplete: gameName,
        month: month,
        year: year,
        monthYear: `${month}/${year}`,
        quarter: quarter,
        quarterYear: quarterYear,
        codiceConcessione: row[0]?.toString().trim() || '',
        ragioneSociale: row[1]?.toString().trim() || '',
        importoRaccolta: convertToItalianNumber(row[2]),
        percentualeRaccolta: row[3]?.toString() || '',
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        isNegativeSpesa: parseItalianNumber(row[4]) < 0,
        fileFormat: 'newFormat'
    }));
}

function parseHippoFormatExcelData(jsonData, fileName) {
    if (jsonData.length < 5) {
        throw new Error(`File ${fileName}: formato ippico non valido (troppo poche righe)`);
    }

    const titleRow = jsonData[0][0] || '';
    const gameName = 'Scommesse Ippica d\'agenzia';

    const periodRow = jsonData[1][0] || '';
    const monthMatch = periodRow.match(/(\w+)\s+(\d{4})/);
    
    let month = 'Unknown', year = 'Unknown';
    if (monthMatch) {
        const monthNamesItalian = {
            'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
            'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
            'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
        };
        
        const monthName = monthMatch[1].toLowerCase();
        month = monthNamesItalian[monthName] || 'Unknown';
        year = monthMatch[2];
    }

    const headers = jsonData[3];
    if (!headers || headers.length < 7) {
        throw new Error(`File ${fileName}: headers non trovati o incompleti per formato ippico`);
    }

    const dataRows = jsonData.slice(4).filter(row => 
        row && row[0] && row[1] && row[2] && 
        (row[2] === 'QF' || row[2] === 'TOTALIZZATORE' || row[2] === 'MULTIPLA')
    );
    
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    return dataRows.map(row => {
        const tipoGioco = row[2].toString().trim();
        
        const tipoGiocoMappings = {
            'QF': '🎯 Quota Fissa',
            'TOTALIZZATORE': '🎲 Totalizzatore', 
            'MULTIPLA': '🎪 Multipla'
        };
        
        return {
            fileName: fileName,
            gameName: gameName,
            gameNameOriginal: gameName,
            tipoGioco: tipoGioco,
            tipoGiocoName: tipoGiocoMappings[tipoGioco] || tipoGioco,
            gameNameComplete: `${gameName} - ${tipoGiocoMappings[tipoGioco] || tipoGioco}`,
            month: month,
            year: year,
            monthYear: `${month}/${year}`,
            quarter: quarter,
            quarterYear: quarterYear,
            codiceConcessione: row[0]?.toString().trim() || '',
            ragioneSociale: row[1]?.toString().trim() || '',
            importoRaccolta: convertToItalianNumber(row[3]),
            percentualeRaccolta: row[4]?.toString() || '',
            importoSpesa: convertToItalianNumber(row[5]),
            percentualeSpesa: row[6]?.toString() || '',
            monthName: monthNames[month] || month,
            quarterName: quarterNames[quarter] || quarter,
            isNegativeSpesa: parseItalianNumber(row[5]) < 0,
            fileFormat: 'hippoFormat'
        };
    });
}

// ===== CONVERSIONI NUMERI =====
function convertToItalianNumber(value) {
    if (value === null || value === undefined || value === '') return '0,00';
    
    if (typeof value === 'number') {
        return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    let numStr = value.toString().trim();
    if (!numStr) return '0,00';
    
    const italianPattern = /^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$/;
    const americanPattern = /^[+-]?\d{1,3}(,\d{3})*(\.\d+)?$/;
    const simplePattern = /^[+-]?\d+([.,]\d+)?$/;
    
    if (italianPattern.test(numStr)) {
        return numStr;
    }
    
    if (americanPattern.test(numStr)) {
        const parts = numStr.split('.');
        const integerPart = parts[0].replace(/,/g, '');
        const decimalPart = parts[1] || '00';
        
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedInteger},${decimalPart}`;
    }
    
    if (simplePattern.test(numStr)) {
        if (numStr.includes('.')) {
            numStr = numStr.replace('.', ',');
        }
        
        const parts = numStr.split(',');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '';
        
        if (integerPart.length > 3) {
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            numStr = decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
        }
        
        return numStr;
    }
    
    const cleaned = numStr.replace(/[^\d.,+-]/g, '');
    if (!cleaned) return '0,00';
    
    try {
        const dots = (cleaned.match(/\./g) || []).length;
        const commas = (cleaned.match(/,/g) || []).length;
        
        if (dots > commas) {
            return cleaned;
        } else {
            const parts = cleaned.split('.');
            const integerPart = parts[0].replace(/,/g, '');
            const decimalPart = parts[1] || '00';
            
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return `${formattedInteger},${decimalPart}`;
        }
    } catch (error) {
        console.error(`Errore nella conversione di: ${numStr}`, error);
        return numStr;
    }
}

function parseItalianNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    let numStr = value.toString().trim();
    if (!numStr) return 0;
    
    numStr = numStr.replace(/[^\d.,+-]/g, '');
    if (!numStr) return 0;
    
    if (numStr.includes(',')) {
        const cleaned = numStr.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    if (numStr.includes('.')) {
        const cleaned = numStr.replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    const parsed = parseFloat(numStr);
    return isNaN(parsed) ? 0 : parsed;
}

function getQuarter(month) {
    const monthNum = parseInt(month);
    if (monthNum >= 1 && monthNum <= 3) return 'Q1';
    if (monthNum >= 4 && monthNum <= 6) return 'Q2';
    if (monthNum >= 7 && monthNum <= 9) return 'Q3';
    return 'Q4';
}

function getCurrentQuarter() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = getQuarter(month.toString().padStart(2, '0'));
    return `${quarter}/${year}`;
}

// ===== GESTIONE ANAGRAFICA CONCESSIONI =====

function loadStoredAnagrafica() {
    try {
        const storedAnagrafica = localStorage.getItem(ANAGRAFICA_STORAGE_KEY);
        if (storedAnagrafica) {
            const parsed = JSON.parse(storedAnagrafica);
            anagraficaData = parsed.data || [];
            buildAnagraficaMap();
            updateAnagraficaTable();
            showStatus(`📖 Caricata anagrafica con ${anagraficaData.length} concessioni`, 'success');
        }
    } catch (error) {
        console.error('Errore nel caricamento anagrafica:', error);
    }
}

function saveAnagraficaToStorage() {
    try {
        const dataToSave = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: anagraficaData
        };
        localStorage.setItem(ANAGRAFICA_STORAGE_KEY, JSON.stringify(dataToSave));
        buildAnagraficaMap();
        showStatus('📖 Anagrafica salvata', 'success');
    } catch (error) {
        console.error('Errore nel salvataggio anagrafica:', error);
        showStatus('Errore nel salvataggio anagrafica', 'error');
    }
}

function buildAnagraficaMap() {
    anagraficaConcessioni = {};
    anagraficaData.forEach(item => {
        const codiceConcessione = item.codiceConcessione?.toString().trim();
        if (codiceConcessione) {
            anagraficaConcessioni[codiceConcessione] = item;
        }
    });
    console.log(`📖 Mappa anagrafica costruita con ${Object.keys(anagraficaConcessioni).length} concessioni`);
}

async function loadAnagraficaFromExcel() {
    const fileInput = document.getElementById('anagraficaFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona un file Excel per caricare l\'anagrafica', 'error');
        return;
    }
    
    try {
        showStatus('📖 Caricamento anagrafica in corso...', 'info');
        const anagraficaFromExcel = await readAnagraficaFromExcel(file);
        
        anagraficaData = anagraficaFromExcel;
        saveAnagraficaToStorage();
        updateAnagraficaTable();
        
        if (allData.length > 0) {
            allData = allData.map(item => enrichDataWithAnagrafica(item));
            await saveDataOptimized();
            populateFilters();
            await applyFilters();
        }
        
        showStatus(`📖 Caricata anagrafica con ${anagraficaData.length} concessioni dal file Excel`, 'success');
    } catch (error) {
        showStatus(`Errore nel caricamento anagrafica: ${error.message}`, 'error');
    }
}

function readAnagraficaFromExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                
                let anagraficaSheet = null;
                if (workbook.Sheets['ANAGRAFICA CONCESSIONI']) {
                    anagraficaSheet = workbook.Sheets['ANAGRAFICA CONCESSIONI'];
                } else {
                    const firstSheetName = workbook.SheetNames[0];
                    anagraficaSheet = workbook.Sheets[firstSheetName];
                }
                
                const jsonData = XLSX.utils.sheet_to_json(anagraficaSheet, { header: 1 });
                const parsedAnagrafica = parseAnagraficaData(jsonData);
                resolve(parsedAnagrafica);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error(`Errore nella lettura del file ${file.name}`));
        };
        
        reader.readAsBinaryString(file);
    });
}

function parseAnagraficaData(jsonData) {
    if (jsonData.length < 2) {
        throw new Error('File anagrafica: formato non valido');
    }
    
    let headerRowIndex = -1;
    for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row[0] && row[0].toString().includes('CONC')) {
            headerRowIndex = i;
            break;
        }
    }
    
    if (headerRowIndex === -1) {
        throw new Error('Headers non trovati nel file anagrafica');
    }
    
    const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => row && row[0]);
    
    return dataRows.map(row => ({
        codiceConcessione: row[0]?.toString().trim() || '',
        concessionario: row[1]?.toString().trim() || '',
        ragioneSociale: row[2]?.toString().trim() || '',
        canale: row[3]?.toString().trim().toLowerCase() || 'fisico',
        proprieta: row[4]?.toString().trim() || ''
    }));
}

function enrichDataWithAnagrafica(dataItem) {
    const anagrafica = anagraficaConcessioni[dataItem.codiceConcessione];
    if (anagrafica) {
        return {
            ...dataItem,
            canale: anagrafica.canale,
            channelName: channelNames[anagrafica.canale] || anagrafica.canale,
            concessionarioNome: anagrafica.concessionario,
            concessionarioProprietà: anagrafica.proprieta
        };
    }
    return {
        ...dataItem,
        concessionarioNome: dataItem.ragioneSociale,
        concessionarioProprietà: 'Non specificato'
    };
}

function updateAnagraficaTable() {
    const tableBody = document.getElementById('anagraficaTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = anagraficaData.map((item, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 text-sm text-gray-900">${item.codiceConcessione}</td>
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.concessionario}" 
                       onchange="updateAnagraficaItem(${index}, 'concessionario', this.value)"
                       class="w-full p-1 border rounded">
            </td>
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.ragioneSociale}" 
                       onchange="updateAnagraficaItem(${index}, 'ragioneSociale', this.value)"
                       class="w-full p-1 border rounded">
            </td>
            <td class="px-4 py-2 text-sm text-gray-900">
                <select onchange="updateAnagraficaItem(${index}, 'canale', this.value)"
                        class="w-full p-1 border rounded">
                    <option value="fisico" ${item.canale === 'fisico' ? 'selected' : ''}>Fisico</option>
                    <option value="online" ${item.canale === 'online' ? 'selected' : ''}>Online</option>
                </select>
            </td>
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.proprieta}" 
                       onchange="updateAnagraficaItem(${index}, 'proprieta', this.value)"
                       class="w-full p-1 border rounded">
            </td>
            <td class="px-4 py-2 text-sm">
                <button onclick="deleteAnagraficaItem(${index})" 
                        class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                    Elimina
                </button>
            </td>
        </tr>
    `).join('');
    
    const countElement = document.getElementById('anagraficaCount');
    if (countElement) {
        countElement.textContent = anagraficaData.length;
    }
}

function updateAnagraficaItem(index, field, value) {
    if (anagraficaData[index]) {
        anagraficaData[index][field] = value;
        saveAnagraficaToStorage();
        
        if (allData.length > 0) {
            allData = allData.map(item => enrichDataWithAnagrafica(item));
            saveDataOptimized();
            populateFilters();
            applyFilters();
        }
    }
}

function deleteAnagraficaItem(index) {
    if (confirm('Sei sicuro di voler eliminare questa concessione?')) {
        anagraficaData.splice(index, 1);
        saveAnagraficaToStorage();
        updateAnagraficaTable();
    }
}

function addNewAnagraficaItem() {
    const newItem = {
        codiceConcessione: '',
        concessionario: '',
        ragioneSociale: '',
        canale: 'fisico',
        proprieta: ''
    };
    anagraficaData.push(newItem);
    updateAnagraficaTable();
}

function exportAnagrafica() {
    const worksheet = XLSX.utils.json_to_sheet(anagraficaData.map(item => ({
        'N. CONC.': item.codiceConcessione,
        'CONCESSIONARIO': item.concessionario,
        'RAGIONE SOCIALE': item.ragioneSociale,
        'CANALE': item.canale.toUpperCase(),
        'PROPRIETA': item.proprieta
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ANAGRAFICA CONCESSIONI');
    XLSX.writeFile(workbook, `anagrafica-concessioni-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ===== GESTIONE NOMI GIOCHI =====

function loadStoredNomiGiochi() {
    try {
        const storedNomiGiochi = localStorage.getItem(NOMI_GIOCHI_STORAGE_KEY);
        if (storedNomiGiochi) {
            const parsed = JSON.parse(storedNomiGiochi);
            nomiGiochiMapping = parsed.data || {};
            console.log(`🎮 Caricata mappatura nomi giochi con ${Object.keys(nomiGiochiMapping).length} voci`);
        }
    } catch (error) {
        console.error('Errore nel caricamento nomi giochi:', error);
    }
}

function saveNomiGiochiToStorage() {
    try {
        const dataToSave = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: nomiGiochiMapping
        };
        localStorage.setItem(NOMI_GIOCHI_STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('🎮 Mappatura nomi giochi salvata');
    } catch (error) {
        console.error('Errore nel salvataggio nomi giochi:', error);
    }
}

async function loadNomiGiochiFromExcel() {
    const fileInput = document.getElementById('nomiGiochiFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona un file Excel per caricare i nomi giochi', 'error');
        return;
    }
    
    try {
        showStatus('🎮 Caricamento nomi giochi in corso...', 'info');
        const nomiGiochiFromExcel = await readNomiGiochiFromExcel(file);
        
        nomiGiochiMapping = nomiGiochiFromExcel;
        saveNomiGiochiToStorage();
        
        if (allData.length > 0) {
            allData = allData.map(item => applyGameNameMapping(item));
            await saveDataOptimized();
            populateFilters();
            await applyFilters();
        }
        
        showStatus(`🎮 Caricata mappatura con ${Object.keys(nomiGiochiMapping).length} nomi giochi`, 'success');
    } catch (error) {
        showStatus(`Errore nel caricamento nomi giochi: ${error.message}`, 'error');
    }
}

function readNomiGiochiFromExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const mapping = {};
                
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[0] && row[1]) {
                        const nomeOriginale = row[0].toString().trim();
                        const nomeMostrato = row[1].toString().trim();
                        mapping[nomeOriginale] = nomeMostrato;
                    }
                }
                
                resolve(mapping);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error(`Errore nella lettura del file ${file.name}`));
        };
        
        reader.readAsBinaryString(file);
    });
}

// ===== GESTIONE COMPARTI =====

function loadStoredComparti() {
    try {
        const storedComparti = localStorage.getItem(COMPARTI_STORAGE_KEY);
        if (storedComparti) {
            const parsed = JSON.parse(storedComparti);
            compartiMapping = parsed.data || {};
            console.log(`🏢 Caricata mappatura comparti con ${Object.keys(compartiMapping).length} voci`);
        }
    } catch (error) {
        console.error('Errore nel caricamento comparti:', error);
    }
}

function saveCompartiToStorage() {
    try {
        const dataToSave = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: compartiMapping
        };
        localStorage.setItem(COMPARTI_STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('🏢 Mappatura comparti salvata');
    } catch (error) {
        console.error('Errore nel salvataggio comparti:', error);
    }
}

async function loadCompartiFromExcel() {
    const fileInput = document.getElementById('compartiFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona un file Excel per caricare i comparti', 'error');
        return;
    }
    
    try {
        showStatus('🏢 Caricamento comparti in corso...', 'info');
        const compartiFromExcel = await readCompartiFromExcel(file);
        
        compartiMapping = compartiFromExcel;
        saveCompartiToStorage();
        
        if (allData.length > 0) {
            allData = allData.map(item => applyCompartoMapping(item));
            await saveDataOptimized();
            populateFilters();
            await applyFilters();
        }
        
        showStatus(`🏢 Caricata mappatura con ${Object.keys(compartiMapping).length} comparti`, 'success');
    } catch (error) {
        showStatus(`Errore nel caricamento comparti: ${error.message}`, 'error');
    }
}

function readCompartiFromExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const mapping = {};
                
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[0] && row[1]) {
                        const nomeGioco = row[0].toString().trim();
                        const comparto = row[1].toString().trim();
                        mapping[nomeGioco] = comparto;
                    }
                }
                
                resolve(mapping);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error(`Errore nella lettura del file ${file.name}`));
        };
        
        reader.readAsBinaryString(file);
    });
}

// ===== APPLICAZIONE MAPPATURE =====

function applyGameNameMapping(dataItem) {
    const originalGameName = dataItem.gameName;
    const mappedGameName = nomiGiochiMapping[originalGameName] || originalGameName;
    
    return {
        ...dataItem,
        gameNameOriginal: originalGameName,
        gameName: mappedGameName,
        gameNameComplete: dataItem.fileFormat === 'hippoFormat' ? 
            `${mappedGameName} - ${dataItem.tipoGiocoName}` : mappedGameName
    };
}

function applyCompartoMapping(dataItem) {
    const gameNameForMapping = dataItem.gameName || dataItem.gameNameOriginal;
    const comparto = compartiMapping[gameNameForMapping] || 'Non classificato';
    
    return {
        ...dataItem,
        comparto: comparto
    };
}

function applyAllMappings(dataItem) {
    let item = applyGameNameMapping(dataItem);
    item = applyCompartoMapping(item);
    return item;
}

// ===== GESTIONE FILTRI =====

function populateFilters() {
    const games = [...new Set(allData.map(item => item.gameNameComplete || item.gameName))].sort();
    const years = [...new Set(allData.map(item => item.year))].sort();
    const quarters = [...new Set(allData.map(item => item.quarterYear))].sort();
    const months = [...new Set(allData.map(item => item.monthYear))].sort();
    const channels = [...new Set(allData.map(item => item.canale))].sort();
    const concessionari = [...new Set(allData.map(item => item.concessionarioNome))].sort();
    const proprieta = [...new Set(allData.map(item => item.concessionarioProprietà))].sort();
    const ragioneSociali = [...new Set(allData.map(item => item.ragioneSociale))].sort();
    const comparti = [...new Set(allData.map(item => item.comparto))].sort();

    const tipiGiocoIppico = [...new Set(allData
        .filter(item => item.fileFormat === 'hippoFormat')
        .map(item => item.tipoGiocoName))].sort();

    const gruppi = [...new Set(allData
        .filter(item => item.fileFormat === 'historicalFormat' && item.gruppo)
        .map(item => item.gruppo))].sort();

    populateMultiSelectImproved('gameFilter', games, true);
    populateMultiSelectImproved('yearFilter', years, true);
    populateMultiSelectImproved('quarterFilter', quarters, true, (q) => {
        const [quarter, year] = q.split('/');
        return `${quarterNames[quarter] || quarter} ${year}`;
    });
    populateMultiSelectImproved('monthFilter', months, true, (m) => {
        const [month, year] = m.split('/');
        return `${monthNames[month] || month} ${year}`;
    });
    populateMultiSelectImproved('channelFilter', channels, true, (c) => channelNames[c] || c);
    populateMultiSelectImproved('concessionaryFilter', concessionari, true);
    populateMultiSelectImproved('proprietaFilter', proprieta, true);
    populateMultiSelectImproved('ragioneSocialeFilter', ragioneSociali, true);
    populateMultiSelectImproved('compartoFilter', comparti, true);
    
    const tipoGiocoFilterDiv = document.getElementById('tipoGiocoFilterDiv');
    if (tipiGiocoIppico.length > 0) {
        if (tipoGiocoFilterDiv) {
            tipoGiocoFilterDiv.style.display = 'block';
            populateMultiSelectImproved('tipoGiocoFilter', tipiGiocoIppico, true);
        }
    } else if (tipoGiocoFilterDiv) {
        tipoGiocoFilterDiv.style.display = 'none';
    }
    
    const gruppoFilterDiv = document.getElementById('gruppoFilterDiv');
    if (gruppi.length > 0) {
        if (gruppoFilterDiv) {
            gruppoFilterDiv.style.display = 'block';
            populateMultiSelectImproved('gruppoFilter', gruppi, true);
        }
    } else if (gruppoFilterDiv) {
        gruppoFilterDiv.style.display = 'none';
    }
    
    updateFilterCounts();
}

function populateMultiSelectImproved(selectId, options, selectAll = false, displayFormatter = null) {
    const container = document.getElementById(selectId);
    if (!container) return;
    
    const optionsContainer = container.querySelector('.multi-select-options');
    optionsContainer.innerHTML = '';
    
    // Aggiungi opzione "Seleziona tutto"
    const selectAllOption = document.createElement('div');
    selectAllOption.className = 'multi-select-option select-all-option';
    selectAllOption.innerHTML = `
        <input type="checkbox" class="multi-select-checkbox select-all" ${selectAll ? 'checked' : ''}>
        <span><strong>Seleziona tutto (${options.length})</strong></span>
    `;
    selectAllOption.addEventListener('click', function(e) {
        e.stopPropagation();
        const checkbox = this.querySelector('input');
        const allCheckboxes = optionsContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
        
        checkbox.checked = !checkbox.checked;
        allCheckboxes.forEach(cb => cb.checked = checkbox.checked);
        
        updateMultiSelectText(selectId);
    });
    optionsContainer.appendChild(selectAllOption);
    
    // Separatore
    const separator = document.createElement('div');
    separator.className = 'filter-separator';
    optionsContainer.appendChild(separator);
    
    // Opzioni individuali organizzate in colonne
    const grid = document.createElement('div');
    grid.className = 'filter-options-grid';
    
    options.forEach(option => {
        const displayText = displayFormatter ? displayFormatter(option) : option;
        
        const optionElement = document.createElement('div');
        optionElement.className = 'multi-select-option grid-option';
        optionElement.innerHTML = `
            <input type="checkbox" class="multi-select-checkbox" value="${option}" ${selectAll ? 'checked' : ''}>
            <span class="option-text" title="${displayText}">${displayText}</span>
        `;
        
        optionElement.addEventListener('click', function(e) {
            e.stopPropagation();
            const checkbox = this.querySelector('input');
            checkbox.checked = !checkbox.checked;
            
            // Aggiorna "Seleziona tutto"
            const allCheckboxes = optionsContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
            const checkedBoxes = optionsContainer.querySelectorAll('.multi-select-checkbox:not(.select-all):checked');
            const selectAllCheckbox = optionsContainer.querySelector('.select-all');
            
            selectAllCheckbox.checked = allCheckboxes.length === checkedBoxes.length;
            selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allCheckboxes.length;
            
            updateMultiSelectText(selectId);
        });
        
        grid.appendChild(optionElement);
    });
    
    optionsContainer.appendChild(grid);
    updateMultiSelectText(selectId);
}

function toggleDropdown(selectId) {
    const container = document.getElementById(selectId);
    const dropdown = container.querySelector('.multi-select-dropdown');
    
    // Chiudi tutti gli altri dropdown
    document.querySelectorAll('.multi-select-dropdown').forEach(dd => {
        if (dd !== dropdown) dd.classList.remove('show');
    });
    
    dropdown.classList.toggle('show');
}

function updateMultiSelectText(selectId) {
    const container = document.getElementById(selectId);
    if (!container) return;
    
    const selectedText = container.querySelector('.selected-text');
    const checkboxes = container.querySelectorAll('.multi-select-checkbox:not(.select-all):checked');
    
    if (checkboxes.length === 0) {
        selectedText.textContent = 'Nessuna selezione';
    } else if (checkboxes.length === 1) {
        const value = checkboxes[0].value;
        let displayValue = value;
        if (selectId === 'quarterFilter') {
            const [quarter, year] = value.split('/');
            displayValue = `${quarterNames[quarter] || quarter} ${year}`;
        } else if (selectId === 'monthFilter') {
            const [month, year] = value.split('/');
            displayValue = `${monthNames[month] || month} ${year}`;
        } else if (selectId === 'channelFilter') {
            displayValue = channelNames[value] || value;
        }
        selectedText.textContent = displayValue.length > 25 ? displayValue.substring(0, 25) + '...' : displayValue;
    } else {
        selectedText.textContent = `${checkboxes.length} elementi selezionati`;
    }
}

function updateFilterCounts() {
    const gameCountEl = document.getElementById('gameCount');
    const yearCountEl = document.getElementById('yearCount');
    const quarterCountEl = document.getElementById('quarterCount');
    const monthCountEl = document.getElementById('monthCount');
    const channelCountEl = document.getElementById('channelCount');
    const concessionaryCountEl = document.getElementById('concessionaryCount');
    const proprietaCountEl = document.getElementById('proprietaCount');
    const ragioneSocialeCountEl = document.getElementById('ragioneSocialeCount');
    const tipoGiocoCountEl = document.getElementById('tipoGiocoCount');
    const compartoCountEl = document.getElementById('compartoCount');
    const gruppoCountEl = document.getElementById('gruppoCount');

    if (gameCountEl) gameCountEl.textContent = `(${[...new Set(allData.map(item => item.gameNameComplete || item.gameName))].length})`;
    if (yearCountEl) yearCountEl.textContent = `(${[...new Set(allData.map(item => item.year))].length})`;
    if (quarterCountEl) quarterCountEl.textContent = `(${[...new Set(allData.map(item => item.quarterYear))].length})`;
    if (monthCountEl) monthCountEl.textContent = `(${[...new Set(allData.map(item => item.monthYear))].length})`;
    if (channelCountEl) channelCountEl.textContent = `(${[...new Set(allData.map(item => item.canale))].length})`;
    if (concessionaryCountEl) concessionaryCountEl.textContent = `(${[...new Set(allData.map(item => item.concessionarioNome))].length})`;
    if (proprietaCountEl) proprietaCountEl.textContent = `(${[...new Set(allData.map(item => item.concessionarioProprietà))].length})`;
    if (ragioneSocialeCountEl) ragioneSocialeCountEl.textContent = `(${[...new Set(allData.map(item => item.ragioneSociale))].length})`;
    if (compartoCountEl) compartoCountEl.textContent = `(${[...new Set(allData.map(item => item.comparto))].length})`;

    const tipiGiocoIppico = [...new Set(allData
        .filter(item => item.fileFormat === 'hippoFormat')
        .map(item => item.tipoGiocoName))];
        
    if (tipoGiocoCountEl && tipiGiocoIppico.length > 0) {
        tipoGiocoCountEl.textContent = `(${tipiGiocoIppico.length})`;
    }

    const gruppi = [...new Set(allData
        .filter(item => item.fileFormat === 'historicalFormat' && item.gruppo)
        .map(item => item.gruppo))];
        
    if (gruppoCountEl && gruppi.length > 0) {
        gruppoCountEl.textContent = `(${gruppi.length})`;
    }
}

function getSelectedValues(selectId) {
    const container = document.getElementById(selectId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.multi-select-checkbox:not(.select-all):checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function selectAllFilters() {
    document.querySelectorAll('.multi-select').forEach(select => {
        const checkboxes = select.querySelectorAll('.multi-select-checkbox');
        checkboxes.forEach(cb => cb.checked = true);
        updateMultiSelectText(select.id);
    });
}

function deselectAllFilters() {
    document.querySelectorAll('.multi-select').forEach(select => {
        const checkboxes = select.querySelectorAll('.multi-select-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        updateMultiSelectText(select.id);
    });
}

function resetFilters() {
    selectAllFilters();
    applyFilters();
}

function filterByChannel(channel) {
    const channelContainer = document.getElementById('channelFilter');
    if (!channelContainer) return;
    
    const channelCheckboxes = channelContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
    channelCheckboxes.forEach(cb => cb.checked = cb.value === channel);
    
    updateMultiSelectText('channelFilter');
    applyFilters();
}

function filterByCurrentQuarter() {
    const currentQuarter = getCurrentQuarter();
    
    const quarterContainer = document.getElementById('quarterFilter');
    if (!quarterContainer) return;
    
    const quarterCheckboxes = quarterContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
    quarterCheckboxes.forEach(cb => cb.checked = cb.value === currentQuarter);
    
    updateMultiSelectText('quarterFilter');
    applyFilters();
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const summaryDiv = document.getElementById('filterSummary');
    
    if (!activeFiltersDiv || !summaryDiv) return;
    
    const gameFilter = getSelectedValues('gameFilter');
    const yearFilter = getSelectedValues('yearFilter');
    const quarterFilter = getSelectedValues('quarterFilter');
    const monthFilter = getSelectedValues('monthFilter');
    const channelFilter = getSelectedValues('channelFilter');
    const concessionaryFilter = getSelectedValues('concessionaryFilter');
    const proprietaFilter = getSelectedValues('proprietaFilter');
    const ragioneSocialeFilter = getSelectedValues('ragioneSocialeFilter');
    const tipoGiocoFilter = getSelectedValues('tipoGiocoFilter');
    const compartoFilter = getSelectedValues('compartoFilter');
    const gruppoFilter = getSelectedValues('gruppoFilter');
    
    const totalGames = [...new Set(allData.map(item => item.gameNameComplete || item.gameName))].length;
    const totalYears = [...new Set(allData.map(item => item.year))].length;
    const totalQuarters = [...new Set(allData.map(item => item.quarterYear))].length;
    const totalMonths = [...new Set(allData.map(item => item.monthYear))].length;
    const totalChannels = [...new Set(allData.map(item => item.canale))].length;
    const totalConcessionari = [...new Set(allData.map(item => item.concessionarioNome))].length;
    const totalProprieta = [...new Set(allData.map(item => item.concessionarioProprietà))].length;
    const totalRagioneSociali = [...new Set(allData.map(item => item.ragioneSociale))].length;
    const totalTipiGioco = [...new Set(allData.filter(item => item.fileFormat === 'hippoFormat').map(item => item.tipoGiocoName))].length;
    const totalComparti = [...new Set(allData.map(item => item.comparto))].length;
    const totalGruppi = [...new Set(allData.filter(item => item.fileFormat === 'historicalFormat' && item.gruppo).map(item => item.gruppo))].length;
    
    const filtersActive = 
        gameFilter.length < totalGames ||
        yearFilter.length < totalYears ||
        quarterFilter.length < totalQuarters ||
        monthFilter.length < totalMonths ||
        channelFilter.length < totalChannels ||
        concessionaryFilter.length < totalConcessionari ||
        proprietaFilter.length < totalProprieta ||
        ragioneSocialeFilter.length < totalRagioneSociali ||
        compartoFilter.length < totalComparti ||
        (totalTipiGioco > 0 && tipoGiocoFilter.length < totalTipiGioco) ||
        (totalGruppi > 0 && gruppoFilter.length < totalGruppi);
    
    if (filtersActive) {
        activeFiltersDiv.style.display = 'block';
        const tipoGiocoSummary = totalTipiGioco > 0 ? `<div>🎯 Tipi Gioco: ${tipoGiocoFilter.length}/${totalTipiGioco}</div>` : '';
        const compartoSummary = totalComparti > 1 ? `<div>🏢 Comparti: ${compartoFilter.length}/${totalComparti}</div>` : '';
        const gruppoSummary = totalGruppi > 0 ? `<div>🏛️ Gruppi: ${gruppoFilter.length}/${totalGruppi}</div>` : '';
        summaryDiv.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2 text-xs">
                <div>🎮 Giochi: ${gameFilter.length}/${totalGames}</div>
                <div>📅 Anni: ${yearFilter.length}/${totalYears}</div>
                <div>📊 Trimestri: ${quarterFilter.length}/${totalQuarters}</div>
                <div>🗓️ Mesi: ${monthFilter.length}/${totalMonths}</div>
                <div>🌐 Canali: ${channelFilter.length}/${totalChannels}</div>
                ${tipoGiocoSummary}
                ${gruppoSummary}
                ${compartoSummary}
                <div>🏢 Concessionari: ${concessionaryFilter.length}/${totalConcessionari}</div>
                <div>🔑 Proprietà: ${proprietaFilter.length}/${totalProprieta}</div>
                <div>📄 Rag.Sociali: ${ragioneSocialeFilter.length}/${totalRagioneSociali}</div>
            </div>
        `;
    } else {
        activeFiltersDiv.style.display = 'none';
    }
}

// ===== VISUALIZZAZIONI =====

function updateDisplays() {
    updateChart();
    updateTable();
    updateSummaryStats();
    
    // Aggiorna visibilità basata sul tab attivo
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabName = activeTab.id.replace('tab-', '');
        updateSectionVisibility(tabName);
    }
}

function updateChart() {
    const chartType = document.getElementById('chartType')?.value || 'bar';
    const metric = document.getElementById('chartMetric')?.value || 'importoRaccolta';
    const groupBy = document.getElementById('chartGroupBy')?.value || 'concessionarioNome';
    
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('mainChart')?.getContext('2d');
    if (!ctx) return;
    
    const chartData = prepareChartData(metric, groupBy);

    const config = {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${getMetricTitle(metric)} per ${getGroupByTitle(groupBy)} (Top 20)`
                },
                legend: {
                    display: chartType === 'pie' || chartType === 'doughnut'
                }
            },
            scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
                y: {
                    beginAtZero: true
                }
            } : {}
        }
    };

    currentChart = new Chart(ctx, config);
}

function prepareChartData(metric, groupBy) {
    // Usa i dati filtrati correnti basati sugli indici
    const currentFilteredData = filteredIndices.map(index => allData[index]);
    const grouped = _.groupBy(currentFilteredData, groupBy);
    const labels = [];
    const data = [];
    
    Object.keys(grouped).forEach(groupKey => {
        let label = groupKey;
        
        if (groupBy === 'gameNameComplete') {
            label = groupKey.length > 25 ? groupKey.substring(0, 25) + '...' : groupKey;
        } else if (groupBy === 'tipoGiocoName') {
            label = groupKey;
        } else if (groupBy === 'quarterYear') {
            const [quarter, year] = groupKey.split('/');
            label = `${quarterNames[quarter] || quarter} ${year}`;
        } else if (groupBy === 'monthYear') {
            const [month, year] = groupKey.split('/');
            label = `${monthNames[month] || month} ${year}`;
        } else if (groupBy === 'canale') {
            label = channelNames[groupKey] || groupKey;
        }
        
        labels.push(label.length > 20 ? label.substring(0, 20) + '...' : label);
        
        const sum = grouped[groupKey].reduce((acc, item) => {
            const value = parseItalianNumber(item[metric]);
            return acc + value;
        }, 0);
        data.push(sum);
    });

    const combined = labels.map((label, index) => ({ label, value: data[index] }));
    combined.sort((a, b) => b.value - a.value);
    const topItems = combined.slice(0, 20); // Limita a 20 per performance

    return {
        labels: topItems.map(item => item.label),
        datasets: [{
            label: getMetricTitle(metric),
            data: topItems.map(item => item.value),
            backgroundColor: generateColors(topItems.length),
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
}

function getGroupByTitle(groupBy) {
    const titles = {
        'concessionarioNome': 'Concessionario',
        'ragioneSociale': 'Ragione Sociale',
        'canale': 'Canale',
        'quarterYear': 'Trimestre',
        'monthYear': 'Mese',
        'concessionarioProprietà': 'Proprietà',
        'gameNameComplete': 'Gioco',
        'tipoGiocoName': 'Tipo Gioco Ippico',
        'comparto': 'Comparto',
        'gruppo': 'Gruppo'
    };
    return titles[groupBy] || groupBy;
}

function generateColors(count) {
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(255, 99, 255, 0.8)',
        'rgba(99, 255, 132, 0.8)',
        'rgba(255, 159, 243, 0.8)',
        'rgba(159, 255, 64, 0.8)',
        'rgba(64, 159, 255, 0.8)',
        'rgba(255, 64, 159, 0.8)',
        'rgba(159, 64, 255, 0.8)'
    ];
    
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}

function getMetricTitle(metric) {
    const titles = {
        importoRaccolta: 'Importo Raccolta',
        importoSpesa: 'Importo Spesa',
        percentualeRaccolta: 'Percentuale Raccolta',
        percentualeSpesa: 'Percentuale Spesa'
    };
    return titles[metric] || metric;
}

function sortTable(columnIndex) {
    const columns = ['gameNameComplete', 'tipoGiocoName', 'comparto', 'gruppo', 'year', 'quarter', 'monthName', 'canale', 'codiceConcessione', 'concessionarioNome', 'ragioneSociale', 'concessionarioProprietà', 'importoRaccolta', 'percentualeRaccolta', 'importoSpesa', 'percentualeSpesa'];
    const column = columns[columnIndex];
    
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Riordina gli indici invece di tutti i dati
    filteredIndices.sort((indexA, indexB) => {
        const a = allData[indexA];
        const b = allData[indexB];
        
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];
        
        if (sortColumn === 'tipoGiocoName') {
            valueA = a.tipoGiocoName || '';
            valueB = b.tipoGiocoName || '';
        }
        
        if (sortColumn === 'gruppo') {
            valueA = a.gruppo || '';
            valueB = b.gruppo || '';
        }
        
        if (sortColumn === 'gameNameComplete') {
            valueA = a.gameNameComplete || a.gameName;
            valueB = b.gameNameComplete || b.gameName;
        }
        
        if (sortColumn.includes('importo')) {
            valueA = parseItalianNumber(valueA);
            valueB = parseItalianNumber(valueB);
        }
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Reset pagination e aggiorna tabella
    currentPage = 0;
    updateTable();
    updateSortArrows(columnIndex);
}

function updateSortArrows(activeColumn) {
    document.querySelectorAll('.sort-arrow').forEach((arrow, index) => {
        if (index === activeColumn) {
            arrow.textContent = sortDirection === 'asc' ? '▲' : '▼';
            arrow.style.opacity = '1';
        } else {
            arrow.textContent = '▲';
            arrow.style.opacity = '0.3';
        }
    });
}

function updateSummaryStats() {
    const stats = calculateStats();
    const summaryDiv = document.getElementById('summaryStats');
    
    if (!summaryDiv) return;
    
    const channelStats = stats.byChannel.map(ch => `
        <div class="bg-indigo-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-indigo-200">${ch.name}</h4>
            <p class="text-lg font-bold text-white">${ch.records} record</p>
            <p class="text-xs text-indigo-100">Raccolta: ${ch.raccolta}</p>
        </div>
    `).join('');
    
    const tipoGiocoStats = stats.byTipoGioco.map(tipo => `
        <div class="bg-purple-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-purple-200">${tipo.name}</h4>
            <p class="text-lg font-bold text-white">${tipo.records} record</p>
            <p class="text-xs text-purple-100">Spesa: ${tipo.spesa}</p>
        </div>
    `).join('');
    
    const compartoStats = stats.byComparto.map(comp => `
        <div class="bg-orange-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-orange-200">${comp.name}</h4>
            <p class="text-lg font-bold text-white">${comp.records} record</p>
            <p class="text-xs text-orange-100">Spesa: ${comp.spesa}</p>
        </div>
    `).join('');
    
    summaryDiv.innerHTML = `
        <div class="bg-blue-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-blue-200">Totale Record</h4>
            <p class="text-2xl font-bold text-white">${stats.totalRecords}</p>
        </div>
        <div class="bg-green-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-green-200">Totale Raccolta</h4>
            <p class="text-2xl font-bold text-white">${stats.totalRaccolta}</p>
        </div>
        <div class="bg-purple-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-purple-200">Totale Spesa</h4>
            <p class="text-2xl font-bold text-white ${stats.hasNegativeValues ? 'negative-value' : ''}">${stats.totalSpesa}</p>
        </div>
        <div class="bg-yellow-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-yellow-200">Concessionari Unici</h4>
            <p class="text-2xl font-bold text-white">${stats.uniqueConcessionari}</p>
        </div>
        ${channelStats}
        ${tipoGiocoStats}
        ${compartoStats}
    `;
    
    updateNegativeValuesAlert(stats.negativeValues);
}

function calculateStats() {
    // Calcola statistiche sui dati filtrati correnti
    const currentFilteredData = filteredIndices.map(index => allData[index]);
    
    const totalRecords = currentFilteredData.length;
    const uniqueConcessionari = new Set(currentFilteredData.map(item => item.concessionarioNome)).size;
    
    const totalRaccolta = currentFilteredData.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoRaccolta);
        return sum + value;
    }, 0);
    
    const totalSpesa = currentFilteredData.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoSpesa);
        return sum + value;
    }, 0);
    
    const negativeValues = currentFilteredData.filter(item => item.isNegativeSpesa);
    
    const byChannel = Object.entries(_.groupBy(currentFilteredData, 'canale')).map(([channel, records]) => {
        const raccoltaSum = records.reduce((sum, item) => {
            const value = parseItalianNumber(item.importoRaccolta);
            return sum + value;
        }, 0);
        
        return {
            name: channelNames[channel] || channel,
            records: records.length,
            raccolta: raccoltaSum.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        };
    });
    
    const hippoData = currentFilteredData.filter(item => item.fileFormat === 'hippoFormat');
    const byTipoGioco = hippoData.length > 0 ? Object.entries(_.groupBy(hippoData, 'tipoGiocoName')).map(([tipo, records]) => {
        const spesaSum = records.reduce((sum, item) => {
            const value = parseItalianNumber(item.importoSpesa);
            return sum + value;
        }, 0);
        
        return {
            name: tipo,
            records: records.length,
            spesa: spesaSum.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        };
    }) : [];
    
    const byComparto = Object.entries(_.groupBy(currentFilteredData, 'comparto')).map(([comparto, records]) => {
        const spesaSum = records.reduce((sum, item) => {
            const value = parseItalianNumber(item.importoSpesa);
            return sum + value;
        }, 0);
        
        return {
            name: comparto,
            records: records.length,
            spesa: spesaSum.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        };
    });
    
    return {
        totalRecords,
        uniqueConcessionari,
        totalRaccolta: totalRaccolta.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
        totalSpesa: totalSpesa.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
        hasNegativeValues: negativeValues.length > 0,
        negativeValues,
        byChannel,
        byTipoGioco,
        byComparto
    };
}

function updateNegativeValuesAlert(negativeValues) {
    const alertDiv = document.getElementById('negativeValuesAlert');
    const listDiv = document.getElementById('negativeValuesList');
    
    if (!alertDiv || !listDiv) return;
    
    if (negativeValues.length > 0) {
        alertDiv.style.display = 'block';
        listDiv.innerHTML = negativeValues.map(item => 
            `• ${item.concessionarioNome} (${item.channelName})${item.tipoGiocoName ? ` - ${item.tipoGiocoName}` : ''}: ${item.importoSpesa} (${item.monthYear})`
        ).join('<br>');
    } else {
        alertDiv.style.display = 'none';
    }
}

// ===== EXPORT =====

function downloadChart() {
    if (!currentChart) return;
    
    const link = document.createElement('a');
    link.download = `grafico-gaming-analytics-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = currentChart.toBase64Image();
    link.click();
}

function downloadTable(format) {
    if (format === 'csv') {
        downloadCSV();
    } else if (format === 'excel') {
        downloadExcel();
    }
}

function downloadCSV() {
    const headers = ['Gioco', 'Tipo Gioco', 'Comparto', 'Gruppo', 'Anno', 'Trimestre', 'Mese', 'Canale', 'Codice', 'Concessionario', 'Ragione Sociale', 'Proprietà', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
    const currentFilteredData = filteredIndices.map(index => allData[index]);
    
    const csvContent = [
        headers.join(','),
        ...currentFilteredData.map(row => [
            `"${row.gameNameComplete || row.gameName}"`,
            `"${row.fileFormat === 'hippoFormat' ? (row.tipoGiocoName || '') : ''}"`,
            `"${row.comparto}"`,
            `"${row.gruppo || ''}"`,
            `"${row.year}"`,
            `"${row.quarter}"`,
            `"${row.monthName}"`,
            `"${row.channelName}"`,
            `"${row.codiceConcessione}"`,
            `"${row.concessionarioNome}"`,
            `"${row.ragioneSociale}"`,
            `"${row.concessionarioProprietà}"`,
            `"${row.importoRaccolta}"`,
            `"${row.percentualeRaccolta}"`,
            `"${row.importoSpesa}"`,
            `"${row.percentualeSpesa}"`
        ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, `gaming-analytics-data-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
}

function downloadExcel() {
    const currentFilteredData = filteredIndices.map(index => allData[index]);
    
    const worksheet = XLSX.utils.json_to_sheet(currentFilteredData.map(row => ({
        'Gioco': row.gameNameComplete || row.gameName,
        'Tipo Gioco': row.fileFormat === 'hippoFormat' ? (row.tipoGiocoName || '') : '',
        'Comparto': row.comparto,
        'Gruppo': row.gruppo || '',
        'Anno': row.year,
        'Trimestre': row.quarter,
        'Mese': row.monthName,
        'Canale': row.channelName,
        'Codice': row.codiceConcessione,
        'Concessionario': row.concessionarioNome,
        'Ragione Sociale': row.ragioneSociale,
        'Proprietà': row.concessionarioProprietà,
        'Importo Raccolta': row.importoRaccolta,
        'Perc. Raccolta': row.percentualeRaccolta,

 // Fine del file - versione sicura
console.log('🚀 Gaming Analytics Dashboard v3.0 caricato');

// Notifica utente
if (document.readyState === 'complete') {
    setTimeout(function() {
        if (typeof showStatus === 'function') {
            showStatus('Sistema caricato e pronto!', 'success');
        }
    }, 1000);
}