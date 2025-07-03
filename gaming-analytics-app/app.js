// ===== 🚀 GAMING ANALYTICS DASHBOARD v3.0 - ENHANCED WITH EDITABLE TABLES =====

// ===== CORE VARIABLES =====
let allData = [];
let filteredData = [];
let currentChart = null;
let sortColumn = null;
let sortDirection = 'asc';
let currentPage = 0;
let isProcessing = false;

// Anagrafica e mappature
let anagraficaConcessioni = {};
let anagraficaData = [];
let nomiGiochiMapping = {};
let nomiGiochiData = []; // ⭐ NUOVO: Array per gestire i dati della tabella
let compartiMapping = {};
let compartiData = []; // ⭐ NUOVO: Array per gestire i dati della tabella

// Configurazione
let CHUNK_SIZE = 1000;
let MAX_DISPLAY_RECORDS = 50;
let DEBOUNCE_DELAY = 300;

// Storage keys
const STORAGE_KEY = 'gaming_analytics_data';
const ANAGRAFICA_STORAGE_KEY = 'gaming_analytics_anagrafica';
const NOMI_GIOCHI_STORAGE_KEY = 'gaming_analytics_nomi_giochi';
const COMPARTI_STORAGE_KEY = 'gaming_analytics_comparti';
const STORAGE_VERSION = '3.0';

// ===== MAPPATURE =====
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

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Gaming Analytics Dashboard v3.0 - Starting...');
    
    try {
        // 1. Setup event listeners
        setupEventListeners();
        
        // 2. Carica dati principali
        console.log('📂 Caricamento dati principali...');
        const hasMainData = loadStoredData();
        
        // 3. Carica mappature
        console.log('📖 Caricamento mappature...');
        loadStoredAnagrafica();
        loadStoredNomiGiochi();
        loadStoredComparti();
        
        // 4. Aggiorna stato e UI
        updateDataStatus();
        
        // 5. Attendi che il DOM sia completamente renderizzato, poi aggiorna le tabelle
        setTimeout(() => {
            console.log('🔄 Aggiornamento tabelle mappature...');
            updateAnagraficaTable();
            updateNomiGiochiTable();
            updateCompartiTable();
        }, 300);
        
        // 6. Messaggio finale
        if (hasMainData) {
            showStatus('✅ Sistema caricato con successo con dati esistenti!', 'success');
        } else {
            showStatus('💡 Sistema pronto! Carica i file Excel per iniziare.', 'info');
        }
        
        console.log('✅ Inizializzazione completata!');
        
    } catch (error) {
        console.error('❌ Errore inizializzazione:', error);
        showStatus('❌ Errore nell\'inizializzazione del sistema', 'error');
    }
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // File input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }

    // Chart controls
    ['chartType', 'chartMetric', 'chartGroupBy'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', debounce(updateChart, 200));
        }
    });

    // Chiudi dropdown
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.multi-select')) {
            document.querySelectorAll('.multi-select-dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
}

function handleFileSelection() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) return;
    
    let totalSize = 0;
    for (let file of files) {
        totalSize += file.size;
    }
    
    const warning = document.getElementById('fileSizeWarning');
    const estimatedTime = document.getElementById('estimatedTime');
    
    if (totalSize > 10 * 1024 * 1024 && warning) {
        warning.style.display = 'block';
        const estimatedSeconds = Math.ceil(totalSize / (1024 * 1024 * 2));
        if (estimatedTime) estimatedTime.textContent = `${estimatedSeconds} secondi`;
    } else if (warning) {
        warning.style.display = 'none';
    }
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

function showStatus(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Trova un elemento per mostrare lo status
    let statusElement = document.getElementById('uploadStatus') || 
                       document.getElementById('dataStatus') ||
                       document.querySelector('.status-message');
    
    if (!statusElement) {
        // Crea elemento temporaneo se non esiste
        statusElement = document.createElement('div');
        statusElement.className = 'fixed top-4 right-4 p-4 rounded-lg z-50 max-w-md';
        document.body.appendChild(statusElement);
        
        setTimeout(() => {
            if (statusElement && statusElement.parentNode) {
                statusElement.parentNode.removeChild(statusElement);
            }
        }, 5000);
    }
    
    // Stili basati sul tipo
    const styles = {
        success: 'bg-green-100 text-green-800 border border-green-200',
        error: 'bg-red-100 text-red-800 border border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        info: 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    
    statusElement.className = statusElement.className.replace(/bg-\w+-\d+.*/, '') + ' ' + (styles[type] || styles.info);
    statusElement.textContent = message;
}

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

// ===== FILE PROCESSING =====
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
        console.log('🚀 Avvio processing per', files.length, 'file(s)');
        const newData = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            updateProgressOverlay(`🔍 Lettura file ${i + 1}/${files.length}: ${file.name}`, (i / files.length) * 50);
            
            const fileData = await processFile(file);
            newData.push(...fileData);
            
            console.log(`✅ File ${file.name}: ${fileData.length} record processati`);
        }
        
        if (newData.length > 0) {
            updateProgressOverlay('🔧 Elaborazione dati...', 60);
            
            // Processa e arricchisci dati
            const processedData = newData.map(item => {
                let enrichedItem = enrichDataWithAnagrafica(item);
                enrichedItem = applyAllMappings(enrichedItem);
                return enrichedItem;
            });
            
            updateProgressOverlay('🧹 Filtraggio duplicati...', 80);
            
            // Filtra duplicati
            const uniqueData = filterDuplicates(processedData);
            
            // Aggiungi ai dati esistenti
            allData.push(...uniqueData);
            
            updateProgressOverlay('💾 Salvataggio...', 95);
            
            // Salva
            saveDataToStorage();
            
            updateProgressOverlay('✅ Completato!', 100);
            
            // Setup UI
            populateFilters();
            showStatus(`🎉 Elaborati ${uniqueData.length} nuovi record da ${files.length} file`, 'success');
            
            showFiltersSection();
            await applyFilters();
            
            console.log(`🏁 Processing completato: ${allData.length} record totali`);
        } else {
            showStatus('❌ Nessun dato trovato nei file', 'error');
        }
    } catch (error) {
        console.error('💥 Errore nel processing:', error);
        showStatus(`💥 Errore: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
        setTimeout(() => showProgressOverlay(false), 1000);
    }
}

async function processFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true });
                let sheetName = workbook.SheetNames[0];
                
                // Cerca foglio specifico per DB CPT
                if (workbook.SheetNames.includes('DB-MARKET SHARE-2022')) {
                    console.log('📊 Rilevato file DB CPT');
                    sheetName = 'DB-MARKET SHARE-2022';
                }
                
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                console.log(`📋 Dati Excel letti: ${jsonData.length} righe dal foglio ${sheetName}`);
                
                // Determina formato e parsa
                let parsedData;
                if (isHistoricalFormat(jsonData)) {
                    console.log(`🏛️ Formato STORICO rilevato`);
                    parsedData = parseHistoricalFormat(jsonData, file.name);
                } else if (isHippoFormat(jsonData)) {
                    console.log(`🎯 Formato IPPICO rilevato`);
                    parsedData = parseHippoFormat(jsonData, file.name);
                } else if (isNewFormat(jsonData)) {
                    console.log(`📊 Nuovo formato rilevato`);
                    parsedData = parseNewFormat(jsonData, file.name);
                } else {
                    console.log(`📋 Formato precedente rilevato`);
                    parsedData = parseStandardFormat(jsonData, file.name);
                }
                
                resolve(parsedData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error(`Errore lettura file ${file.name}`));
        reader.readAsBinaryString(file);
    });
}

// ===== FORMAT DETECTION =====
function isHistoricalFormat(jsonData) {
    if (jsonData.length < 2) return false;
    const headers = jsonData[0];
    if (!headers || headers.length < 12) return false;
    
    const expectedHeaders = ['ANNO', 'MESE', 'N.CONC.', 'RAGIONE SOCIALE'];
    return expectedHeaders.every((header, i) => headers[i] === header);
}

function isHippoFormat(jsonData) {
    if (jsonData.length < 4) return false;
    const titleRow = jsonData[0][0] || '';
    return titleRow.includes('Scommesse Ippica');
}

function isNewFormat(jsonData) {
    if (jsonData.length < 2) return false;
    const periodRow = jsonData[1][0] || '';
    return periodRow.includes('Periodo da') && !periodRow.includes('Scommesse Ippica');
}

// ===== PARSING FUNCTIONS (mantenute invariate) =====
function parseHistoricalFormat(jsonData, fileName) {
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1).filter(row => row && row[0] && row[1] && row[2] && row[3]);
    
    return dataRows.map(row => {
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
                dateObj = new Date((dateValue - 25569) * 86400 * 1000);
            }
            
            if (dateObj && !isNaN(dateObj)) {
                month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            }
        } catch (error) {
            console.warn('Errore parsing data:', error);
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
        
        const ggt = parseFloat(row[9]) || 0;
        const payout = parseFloat(row[10]) || 0;
        const spesa = parseFloat(row[11]) || 0;
        
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
            fileFormat: 'historicalFormat'
        };
    });
}

function parseHippoFormat(jsonData, fileName) {
    const gameName = 'Scommesse Ippica d\'agenzia';
    const periodRow = jsonData[1][0] || '';
    
    let month = 'Unknown', year = 'Unknown';
    const monthMatch = periodRow.match(/(\w+)\s+(\d{4})/);
    
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
            fileName,
            gameName,
            gameNameOriginal: gameName,
            tipoGioco,
            tipoGiocoName: tipoGiocoMappings[tipoGioco] || tipoGioco,
            gameNameComplete: `${gameName} - ${tipoGiocoMappings[tipoGioco] || tipoGioco}`,
            month,
            year,
            monthYear: `${month}/${year}`,
            quarter,
            quarterYear,
            codiceConcessione: row[0]?.toString().trim() || '',
            ragioneSociale: row[1]?.toString().trim() || '',
            importoRaccolta: convertToItalianNumber(row[3]),
            percentualeRaccolta: row[4]?.toString() || '',
            importoSpesa: convertToItalianNumber(row[5]),
            percentualeSpesa: row[6]?.toString() || '',
            monthName: monthNames[month] || month,
            quarterName: quarterNames[quarter] || quarter,
            isNegativeSpesa: parseItalianNumber(row[5]) < 0,
            canale: 'fisico',
            channelName: '📍 Fisico',
            concessionarioNome: row[1]?.toString().trim() || '',
            concessionarioProprietà: 'Non specificato',
            comparto: 'Ippica',
            fileFormat: 'hippoFormat'
        };
    });
}

function parseNewFormat(jsonData, fileName) {
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

    const dataRows = jsonData.slice(4).filter(row => row && row[0]);
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    return dataRows.map(row => ({
        fileName,
        gameName,
        gameNameOriginal: gameName,
        gameNameComplete: gameName,
        month,
        year,
        monthYear: `${month}/${year}`,
        quarter,
        quarterYear,
        codiceConcessione: row[0]?.toString().trim() || '',
        ragioneSociale: row[1]?.toString().trim() || '',
        importoRaccolta: convertToItalianNumber(row[2]),
        percentualeRaccolta: row[3]?.toString() || '',
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        isNegativeSpesa: parseItalianNumber(row[4]) < 0,
        canale: 'fisico',
        channelName: '📍 Fisico',
        concessionarioNome: row[1]?.toString().trim() || '',
        concessionarioProprietà: 'Non specificato',
        comparto: 'Non classificato',
        fileFormat: 'newFormat'
    }));
}

function parseStandardFormat(jsonData, fileName) {
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

    const dataRows = jsonData.slice(5).filter(row => row && row[0]);
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    return dataRows.map(row => ({
        fileName,
        gameName,
        gameNameOriginal: gameName,
        gameNameComplete: gameName,
        month,
        year,
        monthYear: `${month}/${year}`,
        quarter,
        quarterYear,
        codiceConcessione: row[0]?.toString().trim() || '',
        ragioneSociale: row[1]?.toString().trim() || '',
        importoRaccolta: convertToItalianNumber(row[2]),
        percentualeRaccolta: row[3]?.toString() || '',
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        isNegativeSpesa: parseItalianNumber(row[4]) < 0,
        canale: 'fisico',
        channelName: '📍 Fisico',
        concessionarioNome: row[1]?.toString().trim() || '',
        concessionarioProprietà: 'Non specificato',
        comparto: 'Non classificato',
        fileFormat: 'standardFormat'
    }));
}

// ===== HELPER FUNCTIONS =====
function getQuarter(month) {
    const monthNum = parseInt(month);
    if (monthNum >= 1 && monthNum <= 3) return 'Q1';
    if (monthNum >= 4 && monthNum <= 6) return 'Q2';
    if (monthNum >= 7 && monthNum <= 9) return 'Q3';
    return 'Q4';
}

function convertToItalianNumber(value) {
    if (value === null || value === undefined || value === '') return '0,00';
    
    if (typeof value === 'number') {
        return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // Se è già una stringa, gestisci conversione
    const numStr = value.toString().trim();
    if (!numStr) return '0,00';
    
    // Pattern per formato italiano
    const italianPattern = /^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$/;
    if (italianPattern.test(numStr)) {
        return numStr;
    }
    
    // Converti da formato americano/inglese
    try {
        const cleaned = numStr.replace(/[^\d.,+-]/g, '');
        const float = parseFloat(cleaned.replace(/,/g, ''));
        if (isNaN(float)) return '0,00';
        return float.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (error) {
        return '0,00';
    }
}

function parseItalianNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    const numStr = value.toString().trim().replace(/[^\d.,+-]/g, '');
    if (!numStr) return 0;
    
    // Se contiene virgola, è formato italiano
    if (numStr.includes(',')) {
        const cleaned = numStr.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    const parsed = parseFloat(numStr);
    return isNaN(parsed) ? 0 : parsed;
}

function filterDuplicates(newData) {
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

// ===== STORAGE MANAGEMENT =====
function saveDataToStorage() {
    try {
        const dataToSave = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: allData
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        showPersistenceIndicator();
        updateDataStatus();
        console.log(`💾 Salvati ${allData.length} record`);
    } catch (error) {
        console.error('❌ Errore salvataggio:', error);
        showStatus('❌ Errore nel salvataggio dati', 'error');
    }
}

function loadStoredData() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsed = JSON.parse(storedData);
            if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                allData = parsed.data;
                console.log(`💾 Caricati ${allData.length} record salvati`);
                
                // Popolamento filtri e UI
                populateFilters();
                showStatus(`📂 Caricati ${allData.length} record salvati`, 'success');
                showFiltersSection();
                
                // Applica filtri con delay per permettere il rendering
                setTimeout(() => {
                    applyFilters();
                }, 200);
                
                updateDataStatus();
                return true;
            }
        }
        console.log('💾 Nessun dato salvato trovato');
        return false;
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        return false;
    }
}

function clearStoredData() {
    if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa operazione non può essere annullata.')) {
        localStorage.removeItem(STORAGE_KEY);
        allData = [];
        filteredData = [];
        currentPage = 0;
        
        hideAllSections();
        updateDataStatus();
        showStatus('🗑️ Tutti i dati sono stati cancellati', 'success');
    }
}

function cleanupOldData() {
    try {
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - 12);
        
        const originalLength = allData.length;
        allData = allData.filter(item => {
            const itemDate = new Date(`${item.year}-${item.month}-01`);
            return itemDate >= cutoffDate;
        });
        
        const cleanedCount = originalLength - allData.length;
        
        saveDataToStorage();
        showStatus(`🧹 Pulizia completata: rimossi ${cleanedCount} record vecchi`, 'success');
        
        if (allData.length > 0) {
            populateFilters();
            applyFilters();
        } else {
            hideAllSections();
        }
        
    } catch (error) {
        showStatus('❌ Errore nella pulizia dati', 'error');
    }
}

// ===== UI MANAGEMENT =====
function showFiltersSection() {
    const filtersSection = document.getElementById('filtersSection');
    if (filtersSection) filtersSection.style.display = 'block';
}

function hideAllSections() {
    ['filtersSection', 'analyticsSection', 'tableSection'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

function updateDataStatus() {
    const dataStatus = document.getElementById('dataStatus');
    if (dataStatus) {
        if (allData.length > 0) {
            const files = [...new Set(allData.map(item => item.fileName))];
            dataStatus.textContent = `📊 ${allData.length} record caricati da ${files.length} file`;
        } else {
            dataStatus.textContent = '📁 Nessun dato caricato';
        }
    }
    
    // Aggiorna metriche performance
    const totalRecordsEl = document.getElementById('totalRecordsMetric');
    const filteredRecordsEl = document.getElementById('filteredRecordsMetric');
    
    if (totalRecordsEl) totalRecordsEl.textContent = allData.length;
    if (filteredRecordsEl) filteredRecordsEl.textContent = filteredData.length;
}

function showPersistenceIndicator() {
    const indicator = document.getElementById('persistenceIndicator');
    if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 3000);
    }
}

// ===== NAVIGATION =====
function switchTab(tabName) {
    console.log(`🔄 Cambiando tab a: ${tabName}`);
    
    // Rimuovi active da tutti i tab
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Attiva il tab selezionato
    const selectedTab = document.querySelector(`.nav-tab[onclick="switchTab('${tabName}')"]`);
    const selectedContent = document.getElementById(`tab-${tabName}`);
    
    if (selectedTab && selectedContent) {
        selectedTab.classList.add('active');
        selectedContent.classList.add('active');
        
        // Aggiorna indicatore sezione
        const indicator = document.getElementById('sectionIndicator');
        if (indicator) {
            const sectionNames = {
                'gestione': '⚙️ Gestione',
                'filtri': '🎛️ Filtri',
                'grafici': '📊 Grafici',
                'tabelle': '📋 Tabelle'
            };
            indicator.textContent = sectionNames[tabName] || '📊 Gaming Analytics';
        }
        
        // Aggiorna sezioni visibili basate sul tab
        updateSectionVisibility(tabName);
        
        // ⭐ NUOVO: Aggiorna le tabelle delle mappature quando si va nella gestione
        if (tabName === 'gestione') {
            setTimeout(() => {
                console.log('🔄 Aggiornamento tabelle mappature per tab gestione...');
                updateAnagraficaTable();
                updateNomiGiochiTable();
                updateCompartiTable();
            }, 100);
        }
    }
}

function updateSectionVisibility(tabName) {
    const hasData = allData.length > 0;
    
    switch(tabName) {
        case 'filtri':
            const filtersSection = document.getElementById('filtersSection');
            const noDataMessage = document.getElementById('noDataMessage');
            if (hasData) {
                if (filtersSection) filtersSection.style.display = 'block';
                if (noDataMessage) noDataMessage.style.display = 'none';
            } else {
                if (filtersSection) filtersSection.style.display = 'none';
                if (noDataMessage) noDataMessage.style.display = 'block';
            }
            break;
            
        case 'grafici':
            const analyticsSection = document.getElementById('analyticsSection');
            const noChartsMessage = document.getElementById('noChartsMessage');
            if (hasData && filteredData.length > 0) {
                if (analyticsSection) analyticsSection.style.display = 'flex';
                if (noChartsMessage) noChartsMessage.style.display = 'none';
                updateChart();
                updateSummaryStats();
            } else {
                if (analyticsSection) analyticsSection.style.display = 'none';
                if (noChartsMessage) noChartsMessage.style.display = 'block';
            }
            break;
            
        case 'tabelle':
            const tableSection = document.getElementById('tableSection');
            const noTableMessage = document.getElementById('noTableMessage');
            if (hasData && filteredData.length > 0) {
                if (tableSection) tableSection.style.display = 'block';
                if (noTableMessage) noTableMessage.style.display = 'none';
                updateTable();
            } else {
                if (tableSection) tableSection.style.display = 'none';
                if (noTableMessage) noTableMessage.style.display = 'block';
            }
            break;
    }
}

// ===== FILTERS (mantiene tutte le funzioni esistenti) =====
function populateFilters() {
    if (allData.length === 0) return;
    
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

    populateMultiSelect('gameFilter', games, true);
    populateMultiSelect('yearFilter', years, true);
    populateMultiSelect('quarterFilter', quarters, true, (q) => {
        const [quarter, year] = q.split('/');
        return `${quarterNames[quarter] || quarter} ${year}`;
    });
    populateMultiSelect('monthFilter', months, true, (m) => {
        const [month, year] = m.split('/');
        return `${monthNames[month] || month} ${year}`;
    });
    populateMultiSelect('channelFilter', channels, true, (c) => channelNames[c] || c);
    populateMultiSelect('concessionaryFilter', concessionari, true);
    populateMultiSelect('proprietaFilter', proprieta, true);
    populateMultiSelect('ragioneSocialeFilter', ragioneSociali, true);
    populateMultiSelect('compartoFilter', comparti, true);
    
    // Gestisci filtri condizionali
    const tipoGiocoFilterDiv = document.getElementById('tipoGiocoFilterDiv');
    if (tipiGiocoIppico.length > 0) {
        if (tipoGiocoFilterDiv) {
            tipoGiocoFilterDiv.style.display = 'block';
            populateMultiSelect('tipoGiocoFilter', tipiGiocoIppico, true);
        }
    } else if (tipoGiocoFilterDiv) {
        tipoGiocoFilterDiv.style.display = 'none';
    }
    
    const gruppoFilterDiv = document.getElementById('gruppoFilterDiv');
    if (gruppi.length > 0) {
        if (gruppoFilterDiv) {
            gruppoFilterDiv.style.display = 'block';
            populateMultiSelect('gruppoFilter', gruppi, true);
        }
    } else if (gruppoFilterDiv) {
        gruppoFilterDiv.style.display = 'none';
    }
    
    updateFilterCounts();
}

function populateMultiSelect(selectId, options, selectAll = false, displayFormatter = null) {
    const container = document.getElementById(selectId);
    if (!container) return;
    
    const optionsContainer = container.querySelector('.multi-select-options');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    
    // Seleziona tutto
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
    
    // Opzioni individuali
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
            
            updateMultiSelectText(selectId);
        });
        
        grid.appendChild(optionElement);
    });
    
    optionsContainer.appendChild(grid);
    updateMultiSelectText(selectId);
}

function toggleDropdown(selectId) {
    const container = document.getElementById(selectId);
    if (!container) return;
    
    const dropdown = container.querySelector('.multi-select-dropdown');
    if (!dropdown) return;
    
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
    
    if (!selectedText) return;
    
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
    const counts = {
        gameCount: [...new Set(allData.map(item => item.gameNameComplete || item.gameName))].length,
        yearCount: [...new Set(allData.map(item => item.year))].length,
        quarterCount: [...new Set(allData.map(item => item.quarterYear))].length,
        monthCount: [...new Set(allData.map(item => item.monthYear))].length,
        channelCount: [...new Set(allData.map(item => item.canale))].length,
        concessionaryCount: [...new Set(allData.map(item => item.concessionarioNome))].length,
        proprietaCount: [...new Set(allData.map(item => item.concessionarioProprietà))].length,
        ragioneSocialeCount: [...new Set(allData.map(item => item.ragioneSociale))].length,
        compartoCount: [...new Set(allData.map(item => item.comparto))].length
    };

    Object.entries(counts).forEach(([key, count]) => {
        const element = document.getElementById(key);
        if (element) element.textContent = `(${count})`;
    });
}

function getSelectedValues(selectId) {
    const container = document.getElementById(selectId);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('.multi-select-checkbox:not(.select-all):checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

const applyFilters = debounce(async function() {
    if (allData.length === 0) {
        filteredData = [];
        updateDisplays();
        return;
    }
    
    const startTime = performance.now();
    showStatus('🎛️ Applicazione filtri...', 'info');
    
    try {
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
        
        filteredData = allData.filter(item => {
            const gameToCheck = item.gameNameComplete || item.gameName;
            const tipoGiocoMatch = item.fileFormat === 'hippoFormat' ? 
                (filters.tipiGioco.length === 0 || filters.tipiGioco.includes(item.tipoGiocoName)) : 
                true;
            const gruppoMatch = item.fileFormat === 'historicalFormat' ? 
                (filters.gruppi.length === 0 || filters.gruppi.includes(item.gruppo)) : 
                true;
                
            return (filters.games.length === 0 || filters.games.includes(gameToCheck)) &&
                   (filters.years.length === 0 || filters.years.includes(item.year)) &&
                   (filters.quarters.length === 0 || filters.quarters.includes(item.quarterYear)) &&
                   (filters.months.length === 0 || filters.months.includes(item.monthYear)) &&
                   (filters.channels.length === 0 || filters.channels.includes(item.canale)) &&
                   (filters.concessionari.length === 0 || filters.concessionari.includes(item.concessionarioNome)) &&
                   (filters.proprieta.length === 0 || filters.proprieta.includes(item.concessionarioProprietà)) &&
                   (filters.ragioneSociali.length === 0 || filters.ragioneSociali.includes(item.ragioneSociale)) &&
                   (filters.comparti.length === 0 || filters.comparti.includes(item.comparto)) &&
                   tipoGiocoMatch &&
                   gruppoMatch;
        });
        
        const endTime = performance.now();
        const filterTime = Math.round(endTime - startTime);
        
        console.log(`⚡ Filtri applicati in ${filterTime}ms: ${filteredData.length} record`);
        
        currentPage = 0;
        updateDisplays();
        updateActiveFiltersDisplay();
        
        showStatus(`✅ Filtrati ${filteredData.length} record di ${allData.length} totali (${filterTime}ms)`, 'success');
        
        // Aggiorna metriche
        updateDataStatus();
        
        // Chiudi dropdown
        document.querySelectorAll('.multi-select-dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
        
    } catch (error) {
        showStatus(`❌ Errore nei filtri: ${error.message}`, 'error');
    }
}, DEBOUNCE_DELAY);

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const summaryDiv = document.getElementById('filterSummary');
    
    if (!activeFiltersDiv || !summaryDiv) return;
    
    // Conta totali
    const totals = {
        games: [...new Set(allData.map(item => item.gameNameComplete || item.gameName))].length,
        years: [...new Set(allData.map(item => item.year))].length,
        quarters: [...new Set(allData.map(item => item.quarterYear))].length,
        months: [...new Set(allData.map(item => item.monthYear))].length,
        channels: [...new Set(allData.map(item => item.canale))].length,
        concessionari: [...new Set(allData.map(item => item.concessionarioNome))].length,
        proprieta: [...new Set(allData.map(item => item.concessionarioProprietà))].length,
        ragioneSociali: [...new Set(allData.map(item => item.ragioneSociale))].length,
        comparti: [...new Set(allData.map(item => item.comparto))].length
    };
    
    // Conta selezionati
    const selected = {
        games: getSelectedValues('gameFilter').length,
        years: getSelectedValues('yearFilter').length,
        quarters: getSelectedValues('quarterFilter').length,
        months: getSelectedValues('monthFilter').length,
        channels: getSelectedValues('channelFilter').length,
        concessionari: getSelectedValues('concessionaryFilter').length,
        proprieta: getSelectedValues('proprietaFilter').length,
        ragioneSociali: getSelectedValues('ragioneSocialeFilter').length,
        comparti: getSelectedValues('compartoFilter').length
    };
    
    const filtersActive = Object.keys(totals).some(key => selected[key] < totals[key] && selected[key] > 0);
    
    if (filtersActive) {
        activeFiltersDiv.style.display = 'block';
        summaryDiv.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 text-xs">
                <div>🎮 Giochi: ${selected.games}/${totals.games}</div>
                <div>📅 Anni: ${selected.years}/${totals.years}</div>
                <div>📊 Trimestri: ${selected.quarters}/${totals.quarters}</div>
                <div>🗓️ Mesi: ${selected.months}/${totals.months}</div>
                <div>🌐 Canali: ${selected.channels}/${totals.channels}</div>
                <div>🏢 Concessionari: ${selected.concessionari}/${totals.concessionari}</div>
                <div>🔑 Proprietà: ${selected.proprieta}/${totals.proprieta}</div>
                <div>📄 Rag.Sociali: ${selected.ragioneSociali}/${totals.ragioneSociali}</div>
                <div>🏢 Comparti: ${selected.comparti}/${totals.comparti}</div>
            </div>
        `;
    } else {
        activeFiltersDiv.style.display = 'none';
    }
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
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = getQuarter(month.toString().padStart(2, '0'));
    const currentQuarter = `${quarter}/${year}`;
    
    const quarterContainer = document.getElementById('quarterFilter');
    if (!quarterContainer) return;
    
    const quarterCheckboxes = quarterContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
    quarterCheckboxes.forEach(cb => cb.checked = cb.value === currentQuarter);
    
    updateMultiSelectText('quarterFilter');
    applyFilters();
}

// ===== DISPLAYS =====
function updateDisplays() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    const tabName = activeTab.id.replace('tab-', '');
    updateSectionVisibility(tabName);
    
    if (tabName === 'grafici' && filteredData.length > 0) {
        updateChart();
        updateSummaryStats();
    }
    
    if (tabName === 'tabelle' && filteredData.length > 0) {
        updateTable();
    }
}

// ===== CHARTS (mantiene tutte le funzioni esistenti) =====
function updateChart() {
    const chartType = document.getElementById('chartType')?.value || 'bar';
    const metric = document.getElementById('chartMetric')?.value || 'importoRaccolta';
    const groupBy = document.getElementById('chartGroupBy')?.value || 'concessionarioNome';
    
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('mainChart')?.getContext('2d');
    if (!ctx || filteredData.length === 0) return;
    
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
    const grouped = {};
    
    filteredData.forEach(item => {
        const key = item[groupBy];
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });
    
    const labels = [];
    const data = [];
    
    Object.keys(grouped).forEach(groupKey => {
        let label = groupKey;
        
        if (groupBy === 'gameNameComplete') {
            label = groupKey.length > 25 ? groupKey.substring(0, 25) + '...' : groupKey;
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

    // Ordina e prendi top 20
    const combined = labels.map((label, index) => ({ label, value: data[index] }));
    combined.sort((a, b) => b.value - a.value);
    const topItems = combined.slice(0, 20);

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

function generateColors(count) {
    const colors = [
        'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)', 'rgba(255, 99, 255, 0.8)',
        'rgba(99, 255, 132, 0.8)', 'rgba(255, 159, 243, 0.8)', 'rgba(159, 255, 64, 0.8)',
        'rgba(64, 159, 255, 0.8)', 'rgba(255, 64, 159, 0.8)', 'rgba(159, 64, 255, 0.8)'
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

// ===== STATISTICS =====
function updateSummaryStats() {
    const stats = calculateStats();
    const summaryDiv = document.getElementById('summaryStats');
    
    if (!summaryDiv) return;
    
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
            <p class="text-2xl font-bold text-white ${stats.hasNegativeValues ? 'text-red-300' : ''}">${stats.totalSpesa}</p>
        </div>
        <div class="bg-yellow-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-yellow-200">Concessionari Unici</h4>
            <p class="text-2xl font-bold text-white">${stats.uniqueConcessionari}</p>
        </div>
        ${stats.byChannel.map(ch => `
            <div class="bg-indigo-500 bg-opacity-20 rounded-lg p-4">
                <h4 class="text-sm font-medium text-indigo-200">${ch.name}</h4>
                <p class="text-lg font-bold text-white">${ch.records} record</p>
            </div>
        `).join('')}
    `;
    
    updateNegativeValuesAlert(stats.negativeValues);
}

function calculateStats() {
    const totalRecords = filteredData.length;
    const uniqueConcessionari = new Set(filteredData.map(item => item.concessionarioNome)).size;
    
    const totalRaccolta = filteredData.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoRaccolta);
        return sum + value;
    }, 0);
    
    const totalSpesa = filteredData.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoSpesa);
        return sum + value;
    }, 0);
    
    const negativeValues = filteredData.filter(item => item.isNegativeSpesa);
    
    const channelGroups = {};
    filteredData.forEach(item => {
        const channel = item.canale;
        if (!channelGroups[channel]) {
            channelGroups[channel] = [];
        }
        channelGroups[channel].push(item);
    });
    
    const byChannel = Object.entries(channelGroups).map(([channel, records]) => ({
        name: channelNames[channel] || channel,
        records: records.length
    }));
    
    return {
        totalRecords,
        uniqueConcessionari,
        totalRaccolta: totalRaccolta.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
        totalSpesa: totalSpesa.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
        hasNegativeValues: negativeValues.length > 0,
        negativeValues,
        byChannel
    };
}

function updateNegativeValuesAlert(negativeValues) {
    const alertDiv = document.getElementById('negativeValuesAlert');
    const listDiv = document.getElementById('negativeValuesList');
    
    if (!alertDiv || !listDiv) return;
    
    if (negativeValues.length > 0) {
        alertDiv.style.display = 'block';
        listDiv.innerHTML = negativeValues.map(item => 
            `• ${item.concessionarioNome} (${item.channelName}): ${item.importoSpesa} (${item.monthYear})`
        ).join('<br>');
    } else {
        alertDiv.style.display = 'none';
    }
}

// ===== TABLES (mantiene tutte le funzioni esistenti) =====
function updateTable() {
    if (filteredData.length === 0) return;
    
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
    
    // Paginazione
    const startIndex = currentPage * MAX_DISPLAY_RECORDS;
    const endIndex = Math.min(startIndex + MAX_DISPLAY_RECORDS, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Righe tabella
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
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.gameNameComplete || row.gameName}">
                ${truncateText(row.gameNameComplete || row.gameName, 15)}
            </td>
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
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium" title="${row.concessionarioNome}">
                ${truncateText(row.concessionarioNome, 15)}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.ragioneSociale}">
                ${truncateText(row.ragioneSociale, 20)}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.concessionarioProprietà}">
                ${truncateText(row.concessionarioProprietà, 15)}
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.importoRaccolta}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.percentualeRaccolta}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 ${row.isNegativeSpesa ? 'negative-value' : ''}">${row.importoSpesa}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.percentualeSpesa}</td>
        </tr>
        `;
    }).join('');
    
    updatePaginationControls(filteredData.length);
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

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
    const totalPages = Math.ceil(filteredData.length / MAX_DISPLAY_RECORDS);
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
        currentPage = newPage;
        updateTable();
        
        document.getElementById('tableSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    
    filteredData.sort((a, b) => {
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];
        
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
    
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
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
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gaming-analytics-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(row => ({
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
        'Importo Spesa': row.importoSpesa,
        'Perc. Spesa': row.percentualeSpesa
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dati Filtrati');
    XLSX.writeFile(workbook, `gaming-analytics-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ===== ANAGRAFICA MANAGEMENT =====
function loadStoredAnagrafica() {
    try {
        const storedAnagrafica = localStorage.getItem(ANAGRAFICA_STORAGE_KEY);
        if (storedAnagrafica) {
            const parsed = JSON.parse(storedAnagrafica);
            anagraficaData = parsed.data || [];
            buildAnagraficaMap();
            updateAnagraficaTable();
            console.log(`📖 Caricata anagrafica con ${anagraficaData.length} concessioni`);
        }
    } catch (error) {
        console.error('Errore caricamento anagrafica:', error);
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
        concessionarioProprietà: 'Non specificato',
        channelName: channelNames[dataItem.canale] || dataItem.canale
    };
}

async function loadAnagraficaFromExcel() {
    const fileInput = document.getElementById('anagraficaFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona un file Excel per l\'anagrafica', 'error');
        return;
    }
    
    try {
        showStatus('📖 Caricamento anagrafica...', 'info');
        const anagraficaFromExcel = await readAnagraficaFromExcel(file);
        
        anagraficaData = anagraficaFromExcel;
        saveAnagraficaToStorage();
        updateAnagraficaTable();
        
        if (allData.length > 0) {
            allData = allData.map(item => enrichDataWithAnagrafica(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
        
        showStatus(`📖 Caricata anagrafica con ${anagraficaData.length} concessioni`, 'success');
    } catch (error) {
        showStatus(`Errore anagrafica: ${error.message}`, 'error');
    }
}

function readAnagraficaFromExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Trova header row
                let headerRowIndex = -1;
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row[0] && row[0].toString().includes('CONC')) {
                        headerRowIndex = i;
                        break;
                    }
                }
                
                if (headerRowIndex === -1) {
                    throw new Error('Headers non trovati');
                }
                
                const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => row && row[0]);
                
                const parsedData = dataRows.map(row => ({
                    codiceConcessione: row[0]?.toString().trim() || '',
                    concessionario: row[1]?.toString().trim() || '',
                    ragioneSociale: row[2]?.toString().trim() || '',
                    canale: row[3]?.toString().trim().toLowerCase() || 'fisico',
                    proprieta: row[4]?.toString().trim() || ''
                }));
                
                resolve(parsedData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Errore lettura file'));
        reader.readAsBinaryString(file);
    });
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
    } catch (error) {
        console.error('Errore salvataggio anagrafica:', error);
    }
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
    if (countElement) countElement.textContent = anagraficaData.length;
}

function updateAnagraficaItem(index, field, value) {
    if (anagraficaData[index]) {
        anagraficaData[index][field] = value;
        saveAnagraficaToStorage();
        
        if (allData.length > 0) {
            allData = allData.map(item => enrichDataWithAnagrafica(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
    }
}

function deleteAnagraficaItem(index) {
    if (confirm('Elimina questa concessione?')) {
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

// ===== 🎮 MAPPATURA NOMI GIOCHI - FUNZIONI COMPLETE =====

function loadStoredNomiGiochi() {
    try {
        const stored = localStorage.getItem(NOMI_GIOCHI_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.data && Array.isArray(parsed.data)) {
                nomiGiochiData = parsed.data;
                buildNomiGiochiMap();
                
                // Aggiorna la tabella solo se esiste l'elemento DOM
                setTimeout(() => {
                    updateNomiGiochiTable();
                }, 100);
                
                console.log(`🎮 Caricata mappatura nomi giochi con ${nomiGiochiData.length} voci`);
                return true;
            }
        }
        
        // Se non ci sono dati, inizializza array vuoto
        nomiGiochiData = [];
        nomiGiochiMapping = {};
        updateNomiGiochiTable();
        console.log('🎮 Nessuna mappatura nomi giochi trovata');
        return false;
    } catch (error) {
        console.error('❌ Errore caricamento nomi giochi:', error);
        nomiGiochiData = [];
        nomiGiochiMapping = {};
        return false;
    }
}

function buildNomiGiochiMap() {
    nomiGiochiMapping = {};
    if (Array.isArray(nomiGiochiData)) {
        nomiGiochiData.forEach(item => {
            if (item && item.nomeOriginale && item.nomeVisualizzato) {
                nomiGiochiMapping[item.nomeOriginale] = item.nomeVisualizzato;
            }
        });
    }
    console.log(`🎮 Costruita mappa nomi giochi: ${Object.keys(nomiGiochiMapping).length} voci`);
}

async function loadNomiGiochiFromExcel() {
    const fileInput = document.getElementById('nomiGiochiFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona file per nomi giochi', 'error');
        return;
    }
    
    try {
        showStatus('🎮 Caricamento nomi giochi...', 'info');
        const mapping = await readMappingFromExcel(file);
        
        // Converti mapping in array per la tabella
        nomiGiochiData = Object.entries(mapping).map(([nomeOriginale, nomeVisualizzato]) => ({
            nomeOriginale,
            nomeVisualizzato
        }));
        
        saveNomiGiochiToStorage();
        updateNomiGiochiTable();
        
        if (allData.length > 0) {
            allData = allData.map(item => applyAllMappings(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
        
        showStatus(`🎮 Caricati ${nomiGiochiData.length} nomi giochi`, 'success');
    } catch (error) {
        showStatus(`Errore nomi giochi: ${error.message}`, 'error');
    }
}

function saveNomiGiochiToStorage() {
    try {
        const dataToSave = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: nomiGiochiData
        };
        localStorage.setItem(NOMI_GIOCHI_STORAGE_KEY, JSON.stringify(dataToSave));
        buildNomiGiochiMap();
    } catch (error) {
        console.error('Errore salvataggio nomi giochi:', error);
    }
}

function updateNomiGiochiTable() {
    const tableBody = document.getElementById('nomiGiochiTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = nomiGiochiData.map((item, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.nomeOriginale}" 
                       onchange="updateNomiGiochiItem(${index}, 'nomeOriginale', this.value)"
                       class="w-full p-1 border rounded" placeholder="Nome originale">
            </td>
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.nomeVisualizzato}" 
                       onchange="updateNomiGiochiItem(${index}, 'nomeVisualizzato', this.value)"
                       class="w-full p-1 border rounded" placeholder="Nome da visualizzare">
            </td>
            <td class="px-4 py-2 text-sm">
                <button onclick="deleteNomiGiochiItem(${index})" 
                        class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                    Elimina
                </button>
            </td>
        </tr>
    `).join('');
    
    const countElement = document.getElementById('nomiGiochiCount');
    if (countElement) countElement.textContent = nomiGiochiData.length;
}

function updateNomiGiochiItem(index, field, value) {
    if (nomiGiochiData[index]) {
        nomiGiochiData[index][field] = value;
        saveNomiGiochiToStorage();
        
        if (allData.length > 0) {
            allData = allData.map(item => applyAllMappings(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
    }
}

function deleteNomiGiochiItem(index) {
    if (confirm('Elimina questa mappatura gioco?')) {
        nomiGiochiData.splice(index, 1);
        saveNomiGiochiToStorage();
        updateNomiGiochiTable();
    }
}

function addNewNomiGiochiItem() {
    const newItem = {
        nomeOriginale: '',
        nomeVisualizzato: ''
    };
    nomiGiochiData.push(newItem);
    updateNomiGiochiTable();
}

function exportNomiGiochi() {
    const worksheet = XLSX.utils.json_to_sheet(nomiGiochiData.map(item => ({
        'Nome Originale': item.nomeOriginale,
        'Nome Visualizzato': item.nomeVisualizzato
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MAPPATURA NOMI GIOCHI');
    XLSX.writeFile(workbook, `mappatura-nomi-giochi-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ===== 🏢 MAPPATURA COMPARTI - FUNZIONI COMPLETE =====

function loadStoredComparti() {
    try {
        const stored = localStorage.getItem(COMPARTI_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.data && Array.isArray(parsed.data)) {
                compartiData = parsed.data;
                buildCompartiMap();
                
                // Aggiorna la tabella solo se esiste l'elemento DOM
                setTimeout(() => {
                    updateCompartiTable();
                }, 100);
                
                console.log(`🏢 Caricata mappatura comparti con ${compartiData.length} voci`);
                return true;
            }
        }
        
        // Se non ci sono dati, inizializza array vuoto
        compartiData = [];
        compartiMapping = {};
        updateCompartiTable();
        console.log('🏢 Nessuna mappatura comparti trovata');
        return false;
    } catch (error) {
        console.error('❌ Errore caricamento comparti:', error);
        compartiData = [];
        compartiMapping = {};
        return false;
    }
}

function buildCompartiMap() {
    compartiMapping = {};
    if (Array.isArray(compartiData)) {
        compartiData.forEach(item => {
            if (item && item.nomeGioco && item.comparto) {
                compartiMapping[item.nomeGioco] = item.comparto;
            }
        });
    }
    console.log(`🏢 Costruita mappa comparti: ${Object.keys(compartiMapping).length} voci`);
}

async function loadCompartiFromExcel() {
    const fileInput = document.getElementById('compartiFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona file per comparti', 'error');
        return;
    }
    
    try {
        showStatus('🏢 Caricamento comparti...', 'info');
        const mapping = await readMappingFromExcel(file);
        
        // Converti mapping in array per la tabella
        compartiData = Object.entries(mapping).map(([nomeGioco, comparto]) => ({
            nomeGioco,
            comparto
        }));
        
        saveCompartiToStorage();
        updateCompartiTable();
        
        if (allData.length > 0) {
            allData = allData.map(item => applyAllMappings(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
        
        showStatus(`🏢 Caricati ${compartiData.length} comparti`, 'success');
    } catch (error) {
        showStatus(`Errore comparti: ${error.message}`, 'error');
    }
}

function saveCompartiToStorage() {
    try {
        const dataToSave = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: compartiData
        };
        localStorage.setItem(COMPARTI_STORAGE_KEY, JSON.stringify(dataToSave));
        buildCompartiMap();
    } catch (error) {
        console.error('Errore salvataggio comparti:', error);
    }
}

function updateCompartiTable() {
    const tableBody = document.getElementById('compartiTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = compartiData.map((item, index) => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.nomeGioco}" 
                       onchange="updateCompartiItem(${index}, 'nomeGioco', this.value)"
                       class="w-full p-1 border rounded" placeholder="Nome gioco">
            </td>
            <td class="px-4 py-2 text-sm text-gray-900">
                <input type="text" value="${item.comparto}" 
                       onchange="updateCompartiItem(${index}, 'comparto', this.value)"
                       class="w-full p-1 border rounded" placeholder="Comparto">
            </td>
            <td class="px-4 py-2 text-sm">
                <button onclick="deleteCompartiItem(${index})" 
                        class="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                    Elimina
                </button>
            </td>
        </tr>
    `).join('');
    
    const countElement = document.getElementById('compartiCount');
    if (countElement) countElement.textContent = compartiData.length;
}

function updateCompartiItem(index, field, value) {
    if (compartiData[index]) {
        compartiData[index][field] = value;
        saveCompartiToStorage();
        
        if (allData.length > 0) {
            allData = allData.map(item => applyAllMappings(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
    }
}

function deleteCompartiItem(index) {
    if (confirm('Elimina questa mappatura comparto?')) {
        compartiData.splice(index, 1);
        saveCompartiToStorage();
        updateCompartiTable();
    }
}

function addNewCompartiItem() {
    const newItem = {
        nomeGioco: '',
        comparto: ''
    };
    compartiData.push(newItem);
    updateCompartiTable();
}

function exportComparti() {
    const worksheet = XLSX.utils.json_to_sheet(compartiData.map(item => ({
        'Nome Gioco': item.nomeGioco,
        'Comparto': item.comparto
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MAPPATURA COMPARTI');
    XLSX.writeFile(workbook, `mappatura-comparti-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ===== HELPER MAPPING FUNCTIONS =====

function readMappingFromExcel(file) {
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
                        const key = row[0].toString().trim();
                        const value = row[1].toString().trim();
                        mapping[key] = value;
                    }
                }
                
                resolve(mapping);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => reject(new Error('Errore lettura file'));
        reader.readAsBinaryString(file);
    });
}

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

// ===== PERFORMANCE FUNCTIONS =====
function optimizePerformance() {
    showStatus('🚀 Ottimizzazione sistema in corso...', 'info');
    
    // Auto-detect optimal settings
    const memory = performance.memory;
    if (memory) {
        const availableMB = memory.jsHeapSizeLimit / 1024 / 1024;
        
        if (availableMB < 500) {
            CHUNK_SIZE = 500;
            MAX_DISPLAY_RECORDS = 25;
            DEBOUNCE_DELAY = 500;
        } else if (availableMB > 2000) {
            CHUNK_SIZE = 2000;
            MAX_DISPLAY_RECORDS = 100;
            DEBOUNCE_DELAY = 200;
        }
    }
    
    // Update display
    document.getElementById('chunkSizeDisplay').textContent = CHUNK_SIZE;
    document.getElementById('maxRecordsDisplay').textContent = MAX_DISPLAY_RECORDS;
    
    showStatus('🚀 Sistema ottimizzato per le tue risorse!', 'success');
}

function updateChunkSize() {
    const select = document.getElementById('chunkSizeSelect');
    if (select) {
        CHUNK_SIZE = parseInt(select.value);
        document.getElementById('chunkSizeDisplay').textContent = CHUNK_SIZE;
    }
}

function updatePageSize() {
    const select = document.getElementById('pageSizeSelect');
    if (select) {
        MAX_DISPLAY_RECORDS = parseInt(select.value);
        document.getElementById('maxRecordsDisplay').textContent = MAX_DISPLAY_RECORDS;
        currentPage = 0;
        if (filteredData.length > 0) updateTable();
    }
}

function updateDebounce() {
    const select = document.getElementById('debounceSelect');
    if (select) {
        DEBOUNCE_DELAY = parseInt(select.value);
    }
}

function resetToDefaults() {
    CHUNK_SIZE = 1000;
    MAX_DISPLAY_RECORDS = 50;
    DEBOUNCE_DELAY = 300;
    
    document.getElementById('chunkSizeSelect').value = '1000';
    document.getElementById('pageSizeSelect').value = '50';
    document.getElementById('debounceSelect').value = '300';
    
    document.getElementById('chunkSizeDisplay').textContent = CHUNK_SIZE;
    document.getElementById('maxRecordsDisplay').textContent = MAX_DISPLAY_RECORDS;
    
    showStatus('🔄 Impostazioni ripristinate ai valori predefiniti', 'success');
}

async function benchmarkPerformance() {
    showStatus('🏃‍♂️ Test performance in corso...', 'info');
    
    const startTime = performance.now();
    
    // Test filtri
    if (allData.length > 0) {
        await applyFilters();
    }
    
    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    
    showStatus(`🏃‍♂️ Test completato: ${totalTime}ms - ${allData.length} record`, 'success');
}

// ===== FINAL LOG =====
console.log('🚀 Gaming Analytics Dashboard v3.0 Enhanced - Ready with Editable Tables!');
console.log('📋 Funzioni disponibili:');
console.log('  - debugSystem(): Visualizza stato completo del sistema');
console.log('  - Tutte le funzioni CRUD per anagrafica, nomi giochi e comparti');
console.log('  - Sistema di caricamento e salvataggio ottimizzato');
console.log('✅ Sistema completamente inizializzato!');