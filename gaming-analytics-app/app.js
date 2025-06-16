// Variabili globali
let allData = [];
let filteredData = [];
let currentChart = null;
let sortColumn = null;
let sortDirection = 'asc';
let anagraficaConcessioni = {}; // Mappa per anagrafica concessioni
let anagraficaData = []; // Array per gestione anagrafica
let nomiGiochiMapping = {}; // 🆕 Mappa per nomi giochi
let compartiMapping = {}; // 🆕 Mappa per comparti

// Costanti per localStorage
const STORAGE_KEY = 'gaming_analytics_data';
const ANAGRAFICA_STORAGE_KEY = 'gaming_analytics_anagrafica';
const NOMI_GIOCHI_STORAGE_KEY = 'gaming_analytics_nomi_giochi';
const COMPARTI_STORAGE_KEY = 'gaming_analytics_comparti';
const STORAGE_VERSION = '2.5'; // Aggiornata per mappature

// Mappa per conversione mesi
const monthNames = {
    '01': 'Gennaio', '02': 'Febbraio', '03': 'Marzo', '04': 'Aprile',
    '05': 'Maggio', '06': 'Giugno', '07': 'Luglio', '08': 'Agosto',
    '09': 'Settembre', '10': 'Ottobre', '11': 'Novembre', '12': 'Dicembre'
};

// Mappa per trimestri
const quarterNames = {
    'Q1': '🌱 Q1 (Gen-Mar)',
    'Q2': '🌞 Q2 (Apr-Giu)', 
    'Q3': '🍂 Q3 (Lug-Set)',
    'Q4': '❄️ Q4 (Ott-Dic)'
};

// Mappa per canali
const channelNames = {
    'fisico': '📍 Fisico',
    'online': '💻 Online',
    'FISICO': '📍 Fisico',
    'ONLINE': '💻 Online'
};

// Inizializzazione - carica dati salvati
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    loadStoredAnagrafica();
    loadStoredNomiGiochi();
    loadStoredComparti();
    setupEventListeners();
});

function setupEventListeners() {
    // Event listeners per i grafici
    document.getElementById('chartType').addEventListener('change', updateChart);
    document.getElementById('chartMetric').addEventListener('change', updateChart);
    document.getElementById('chartGroupBy').addEventListener('change', updateChart);
    
    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.multi-select')) {
            document.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
}

// ===== 🆕 GESTIONE NOMI GIOCHI =====

function loadStoredNomiGiochi() {
    try {
        const storedNomiGiochi = localStorage.getItem(NOMI_GIOCHI_STORAGE_KEY);
        if (storedNomiGiochi) {
            const parsed = JSON.parse(storedNomiGiochi);
            nomiGiochiMapping = parsed.data || {};
            console.log(`Caricata mappatura nomi giochi con ${Object.keys(nomiGiochiMapping).length} voci`);
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
        console.log('Mappatura nomi giochi salvata');
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
        showStatus('Caricamento nomi giochi in corso...', 'info');
        const nomiGiochiFromExcel = await readNomiGiochiFromExcel(file);
        
        nomiGiochiMapping = nomiGiochiFromExcel;
        saveNomiGiochiToStorage();
        
        // Aggiorna i dati esistenti se ci sono
        if (allData.length > 0) {
            allData = allData.map(item => applyGameNameMapping(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
        
        showStatus(`Caricata mappatura con ${Object.keys(nomiGiochiMapping).length} nomi giochi`, 'success');
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
                
                // Salta la prima riga (headers) e processa i dati
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

// ===== 🆕 GESTIONE COMPARTI =====

function loadStoredComparti() {
    try {
        const storedComparti = localStorage.getItem(COMPARTI_STORAGE_KEY);
        if (storedComparti) {
            const parsed = JSON.parse(storedComparti);
            compartiMapping = parsed.data || {};
            console.log(`Caricata mappatura comparti con ${Object.keys(compartiMapping).length} voci`);
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
        console.log('Mappatura comparti salvata');
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
        showStatus('Caricamento comparti in corso...', 'info');
        const compartiFromExcel = await readCompartiFromExcel(file);
        
        compartiMapping = compartiFromExcel;
        saveCompartiToStorage();
        
        // Aggiorna i dati esistenti se ci sono
        if (allData.length > 0) {
            allData = allData.map(item => applyCompartoMapping(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
        
        showStatus(`Caricata mappatura con ${Object.keys(compartiMapping).length} comparti`, 'success');
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
                
                // Salta la prima riga (headers) e processa i dati
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

// ===== 🆕 APPLICAZIONE MAPPATURE =====

function applyGameNameMapping(dataItem) {
    // Applica la mappatura del nome gioco se esiste
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
    // Applica la mappatura del comparto se esiste
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

// ===== GESTIONE ANAGRAFICA CONCESSIONI =====

function loadStoredAnagrafica() {
    try {
        const storedAnagrafica = localStorage.getItem(ANAGRAFICA_STORAGE_KEY);
        if (storedAnagrafica) {
            const parsed = JSON.parse(storedAnagrafica);
            anagraficaData = parsed.data || [];
            buildAnagraficaMap();
            updateAnagraficaTable();
            showStatus(`Caricata anagrafica con ${anagraficaData.length} concessioni`, 'success');
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
        showStatus('Anagrafica salvata', 'success');
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
    console.log(`Mappa anagrafica costruita con ${Object.keys(anagraficaConcessioni).length} concessioni`);
}

async function loadAnagraficaFromExcel() {
    const fileInput = document.getElementById('anagraficaFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('Seleziona un file Excel per caricare l\'anagrafica', 'error');
        return;
    }
    
    try {
        showStatus('Caricamento anagrafica in corso...', 'info');
        const anagraficaFromExcel = await readAnagraficaFromExcel(file);
        
        anagraficaData = anagraficaFromExcel;
        saveAnagraficaToStorage();
        updateAnagraficaTable();
        
        // Aggiorna i filtri se ci sono dati caricati
        if (allData.length > 0) {
            // Ricalcola i dati esistenti con la nuova anagrafica
            allData = allData.map(item => enrichDataWithAnagrafica(item));
            saveDataToStorage();
            populateFilters();
            applyFilters();
        }
        
        showStatus(`Caricata anagrafica con ${anagraficaData.length} concessioni dal file Excel`, 'success');
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
                
                // Cerca il foglio ANAGRAFICA CONCESSIONI
                let anagraficaSheet = null;
                if (workbook.Sheets['ANAGRAFICA CONCESSIONI']) {
                    anagraficaSheet = workbook.Sheets['ANAGRAFICA CONCESSIONI'];
                } else {
                    // Se non trova il foglio specifico, usa il primo foglio
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
    
    // Trova la riga degli headers
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
        
        // Se ci sono dati caricati, aggiorna anche quelli
        if (allData.length > 0) {
            allData = allData.map(item => enrichDataWithAnagrafica(item));
            saveDataToStorage();
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

// ===== GESTIONE PERSISTENZA DATI =====

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
    } catch (error) {
        console.error('Errore nel salvataggio dati:', error);
        showStatus('Errore nel salvataggio dati automatico', 'warning');
    }
}

function loadStoredData() {
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
                    comparto: item.comparto || 'Non classificato'
                }));
                
                if (allData.length > 0) {
                    populateFilters();
                    showStatus(`Caricati ${allData.length} record salvati (${new Date(parsed.timestamp).toLocaleString('it-IT')})`, 'success');
                    document.getElementById('filtersSection').style.display = 'block';
                    applyFilters();
                }
                updateDataStatus();
                
                if (parsed.version !== STORAGE_VERSION) {
                    saveDataToStorage();
                }
            }
        } else {
            showStatus('Carica i tuoi file Excel per iniziare l\'analisi', 'info');
        }
    } catch (error) {
        console.error('Errore nel caricamento dati salvati:', error);
        showStatus('Carica i tuoi file Excel per iniziare l\'analisi', 'info');
    }
}

function clearStoredData() {
    if (confirm('Sei sicuro di voler cancellare tutti i dati salvati? Questa azione non può essere annullata.')) {
        localStorage.removeItem(STORAGE_KEY);
        allData = [];
        filteredData = [];
        
        document.getElementById('filtersSection').style.display = 'none';
        document.getElementById('analyticsSection').style.display = 'none';
        document.getElementById('tableSection').style.display = 'none';
        
        if (currentChart) {
            currentChart.destroy();
            currentChart = null;
        }
        
        showStatus('Tutti i dati sono stati cancellati', 'info');
        updateDataStatus();
    }
}

function showPersistenceIndicator() {
    const indicator = document.getElementById('persistenceIndicator');
    if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }
}

function updateDataStatus() {
    const statusDiv = document.getElementById('dataStatus');
    if (allData.length > 0) {
        const uniqueFiles = [...new Set(allData.map(item => item.fileName))].length;
        const channels = [...new Set(allData.map(item => item.canale))];
        const dateRange = getDateRange();
        const hippoCount = allData.filter(item => item.fileFormat === 'hippoFormat').length;
        const hippoText = hippoCount > 0 ? ` | 🎯 ${hippoCount} ippici` : '';
        const comparti = [...new Set(allData.map(item => item.comparto))];
        const compartiText = comparti.length > 1 ? ` | 🏢 ${comparti.length} comparti` : '';
        statusDiv.innerHTML = `📊 ${allData.length} record da ${uniqueFiles} file | 🌐 ${channels.map(c => channelNames[c] || c).join(', ')} | 📅 ${dateRange}${hippoText}${compartiText} | 💾 Salvato automaticamente`;
    } else {
        statusDiv.innerHTML = '💡 Nessun dato caricato';
    }
}

function getDateRange() {
    if (allData.length === 0) return '';
    
    const dates = allData.map(item => new Date(`${item.year}-${item.month}-01`));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    if (minDate.getTime() === maxDate.getTime()) {
        return `${monthNames[minDate.getMonth().toString().padStart(2, '0')] || minDate.getMonth() + 1} ${minDate.getFullYear()}`;
    } else {
        return `${monthNames[(minDate.getMonth() + 1).toString().padStart(2, '0')] || minDate.getMonth() + 1} ${minDate.getFullYear()} - ${monthNames[(maxDate.getMonth() + 1).toString().padStart(2, '0')] || maxDate.getMonth() + 1} ${maxDate.getFullYear()}`;
    }
}

// ===== GESTIONE FILE EXCEL =====

async function processFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showStatus('Seleziona almeno un file Excel', 'error');
        return;
    }

    showStatus('Elaborazione file in corso...', 'info');
    
    try {
        const newData = [];
        for (let file of files) {
            const data = await readExcelFile(file);
            newData.push(...data);
        }
        
        if (newData.length > 0) {
            // Applica tutte le mappature e arricchimenti
            const enrichedData = newData.map(item => {
                let enrichedItem = enrichDataWithAnagrafica(item);
                enrichedItem = applyAllMappings(enrichedItem);
                return enrichedItem;
            });
            
            // Aggiungi ai dati esistenti evitando duplicati
            const existingKeys = new Set(allData.map(item => 
                `${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.tipoGioco || 'standard'}`
            ));
            const uniqueNewData = enrichedData.filter(item => 
                !existingKeys.has(`${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.tipoGioco || 'standard'}`)
            );
            
            allData.push(...uniqueNewData);
            saveDataToStorage();
            
            populateFilters();
            showStatus(`Elaborati ${uniqueNewData.length} nuovi record da ${files.length} file (${newData.length - uniqueNewData.length} duplicati ignorati)`, 'success');
            document.getElementById('filtersSection').style.display = 'block';
            applyFilters();
        } else {
            showStatus('Nessun dato trovato nei file', 'error');
        }
    } catch (error) {
        showStatus(`Errore nell'elaborazione: ${error.message}`, 'error');
    }
}

// 🆕 Funzione per riconoscere il formato ippico
function isHippoFormat(jsonData) {
    if (jsonData.length < 4) return false;
    
    // Controlla se la riga 0 contiene "Scommesse Ippica d'agenzia"
    const titleRow = jsonData[0][0] || '';
    if (!titleRow.includes('Scommesse Ippica')) return false;
    
    // Controlla se ci sono righe con QF, TOTALIZZATORE, MULTIPLA nella colonna C (indice 2)
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

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Riconosce il formato basandosi sulla struttura
                let parsedData;
                
                // 🆕 CONTROLLO PER FORMATO IPPICO
                if (isHippoFormat(jsonData)) {
                    console.log(`Riconosciuto formato IPPICO per file: ${file.name}`);
                    parsedData = parseHippoFormatExcelData(jsonData, file.name);
                }
                // Controlla se è il nuovo formato (riga 1 contiene "Periodo da")
                else if (jsonData.length > 1 && jsonData[1][0] && 
                    jsonData[1][0].toString().includes('Periodo da') && 
                    !jsonData[1][0].toString().includes('Scommesse Ippica')) {
                    
                    console.log(`Riconosciuto nuovo formato per file: ${file.name}`);
                    parsedData = parseNewFormatExcelData(jsonData, file.name);
                } else {
                    // Formato precedente
                    console.log(`Riconosciuto formato precedente per file: ${file.name}`);
                    parsedData = parseExcelData(jsonData, file.name);
                }
                
                resolve(parsedData);
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

// Funzione per il formato precedente (mantenuta inalterata)
function parseExcelData(jsonData, fileName) {
    if (jsonData.length < 6) {
        throw new Error(`File ${fileName}: formato non valido`);
    }

    // Estrazione del nome del gioco dalla prima riga
    const titleRow = jsonData[0][0] || '';
    const gameMatch = titleRow.match(/per\s+(.+)$/);
    const gameName = gameMatch ? gameMatch[1].trim().replace(/&agrave;/g, 'à') : 'Gioco Sconosciuto';

    // Estrazione del periodo dalla riga 2
    const periodRow = jsonData[2][0] || '';
    const monthMatch = periodRow.match(/dal mese:\s*(\d{2})\/(\d{4})/);
    let month = 'Unknown', year = 'Unknown';
    
    if (monthMatch) {
        month = monthMatch[1];
        year = monthMatch[2];
    }

    // I dati iniziano dalla riga 5 (indice 4)
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

// Nuova funzione per il formato con "Periodo da..." 
function parseNewFormatExcelData(jsonData, fileName) {
    if (jsonData.length < 4) {
        throw new Error(`File ${fileName}: formato non valido (troppo poche righe)`);
    }

    // Estrazione del nome del gioco dalla prima riga (prima del -)
    const titleRow = jsonData[0][0] || '';
    const gameNameMatch = titleRow.split('-')[0].trim();
    const gameName = gameNameMatch || 'Gioco Sconosciuto';

    // Estrazione del periodo dalla seconda riga
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

    // Headers alla riga 3, dati dalla riga 4
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
        importoRaccolta: convertToItalianNumber(row[2]), // Movimento netto
        percentualeRaccolta: row[3]?.toString() || '', // Quota movimento
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        isNegativeSpesa: parseItalianNumber(row[4]) < 0,
        fileFormat: 'newFormat' // Flag per identificare il nuovo formato
    }));
}

// 🆕 Nuova funzione per il parsing del formato ippico
function parseHippoFormatExcelData(jsonData, fileName) {
    if (jsonData.length < 5) {
        throw new Error(`File ${fileName}: formato ippico non valido (troppo poche righe)`);
    }

    // Estrazione del nome del gioco dalla prima riga
    const titleRow = jsonData[0][0] || '';
    const gameName = 'Scommesse Ippica d\'agenzia'; // Nome fisso per il gioco ippico

    // Estrazione del periodo dalla seconda riga
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

    // Headers alla riga 3, dati dalla riga 4
    const headers = jsonData[3];
    if (!headers || headers.length < 7) {
        throw new Error(`File ${fileName}: headers non trovati o incompleti per formato ippico`);
    }

    // Filtra le righe con dati validi
    const dataRows = jsonData.slice(4).filter(row => 
        row && row[0] && row[1] && row[2] && 
        (row[2] === 'QF' || row[2] === 'TOTALIZZATORE' || row[2] === 'MULTIPLA')
    );
    
    const quarter = getQuarter(month);
    const quarterYear = `${quarter}/${year}`;
    
    return dataRows.map(row => {
        const tipoGioco = row[2].toString().trim();
        
        // Mappa i nomi dei tipi di gioco
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
            gameNameComplete: `${gameName} - ${tipoGiocoMappings[tipoGioco] || tipoGioco}`, // Nome completo per i filtri
            month: month,
            year: year,
            monthYear: `${month}/${year}`,
            quarter: quarter,
            quarterYear: quarterYear,
            codiceConcessione: row[0]?.toString().trim() || '',
            ragioneSociale: row[1]?.toString().trim() || '',
            importoRaccolta: convertToItalianNumber(row[3]), // Colonna D (indice 3)
            percentualeRaccolta: row[4]?.toString() || '',    // Colonna E (indice 4)
            importoSpesa: convertToItalianNumber(row[5]),     // Colonna F (indice 5)
            percentualeSpesa: row[6]?.toString() || '',       // Colonna G (indice 6)
            monthName: monthNames[month] || month,
            quarterName: quarterNames[quarter] || quarter,
            isNegativeSpesa: parseItalianNumber(row[5]) < 0,
            fileFormat: 'hippoFormat' // Flag per identificare il formato ippico
        };
    });
}

// FUNZIONE CORRETTA PER LA CONVERSIONE DEI NUMERI IN FORMATO ITALIANO (PER DISPLAY)
function convertToItalianNumber(value) {
    if (value === null || value === undefined || value === '') return '0,00';
    
    // Se è già un numero JavaScript, formattalo in italiano
    if (typeof value === 'number') {
        return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    let numStr = value.toString().trim();
    
    // Se è vuoto, ritorna zero
    if (!numStr) return '0,00';
    
    // Pattern per riconoscere formato italiano: 54.548.383,95
    // Uno o più gruppi di 1-3 cifre separati da punti, seguito da virgola e decimali
    const italianPattern = /^[+-]?\d{1,3}(\.\d{3})*(,\d+)?$/;
    
    // Pattern per formato americano: 54,548,383.95
    // Uno o più gruppi di 1-3 cifre separati da virgole, seguito da punto e decimali
    const americanPattern = /^[+-]?\d{1,3}(,\d{3})*(\.\d+)?$/;
    
    // Pattern per numero semplice: 12345.67 o 12345,67 o 12345
    const simplePattern = /^[+-]?\d+([.,]\d+)?$/;
    
    // Controlla se è già in formato italiano - NON MODIFICARE
    if (italianPattern.test(numStr)) {
        console.log(`Numero già in formato italiano: ${numStr} - mantenuto invariato`);
        return numStr;
    }
    
    // Controlla se è in formato americano - CONVERTI
    if (americanPattern.test(numStr)) {
        console.log(`Convertendo da formato americano: ${numStr}`);
        
        // Separa parte intera e decimale
        const parts = numStr.split('.');
        const integerPart = parts[0].replace(/,/g, ''); // Rimuovi virgole (separatori migliaia)
        const decimalPart = parts[1] || '00';
        
        // Ricomponi in formato italiano
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const result = `${formattedInteger},${decimalPart}`;
        console.log(`Convertito in: ${result}`);
        return result;
    }
    
    // Numero semplice - aggiungi formattazione italiana se necessario
    if (simplePattern.test(numStr)) {
        console.log(`Numero semplice: ${numStr}`);
        
        // Converte punto in virgola per decimali
        if (numStr.includes('.')) {
            numStr = numStr.replace('.', ',');
        }
        
        // Aggiungi separatori migliaia se necessario
        const parts = numStr.split(',');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '';
        
        if (integerPart.length > 3) {
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            numStr = decimalPart ? `${formattedInteger},${decimalPart}` : formattedInteger;
        }
        
        return numStr;
    }
    
    // Se non riconosce il formato, prova a pulire e convertire
    console.warn(`Formato non riconosciuto: ${numStr} - tentativo di conversione`);
    
    // Rimuovi tutto tranne cifre, punti e virgole
    const cleaned = numStr.replace(/[^\d.,+-]/g, '');
    
    if (!cleaned) return '0,00';
    
    // Prova a interpretare come numero pulito
    try {
        // Se ha più punti che virgole, probabilmente è formato italiano
        const dots = (cleaned.match(/\./g) || []).length;
        const commas = (cleaned.match(/,/g) || []).length;
        
        if (dots > commas) {
            // Probabilmente formato italiano - lascia com'è
            return cleaned;
        } else {
            // Probabilmente formato americano - converti
            const parts = cleaned.split('.');
            const integerPart = parts[0].replace(/,/g, '');
            const decimalPart = parts[1] || '00';
            
            const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            return `${formattedInteger},${decimalPart}`;
        }
    } catch (error) {
        console.error(`Errore nella conversione di: ${numStr}`, error);
        return numStr; // Ritorna il valore originale
    }
}

// ✅ FUNZIONE HELPER PER CONVERTIRE NUMERI ITALIANI IN NUMERI JAVASCRIPT (PER CALCOLI)
function parseItalianNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    
    // Se è già un numero JavaScript
    if (typeof value === 'number') return value;
    
    let numStr = value.toString().trim();
    
    // Se è vuoto
    if (!numStr) return 0;
    
    // Rimuovi caratteri non numerici tranne punti, virgole e segni
    numStr = numStr.replace(/[^\d.,+-]/g, '');
    
    if (!numStr) return 0;
    
    // Se è in formato italiano (punti per migliaia, virgola per decimali)
    // Esempi: "54.548.383,95" o "1.234,56" o "123,45"
    if (numStr.includes(',')) {
        // Rimuovi tutti i punti (separatori migliaia) e sostituisci virgola con punto
        const cleaned = numStr.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    // Se è in formato americano o semplice
    // Esempi: "54,548,383.95" o "1234.56"
    if (numStr.includes('.')) {
        // Se ha anche virgole, rimuovile (sono separatori migliaia in formato americano)
        const cleaned = numStr.replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    
    // Solo cifre, nessun separatore decimale
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

// ===== 🆕 GESTIONE FILTRI MIGLIORATI (SU PIÙ RIGHE) =====

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

    // 🆕 Aggiunto filtro per tipi di gioco ippico se ci sono dati ippici
    const tipiGiocoIppico = [...new Set(allData
        .filter(item => item.fileFormat === 'hippoFormat')
        .map(item => item.tipoGiocoName))].sort();

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
    
    // 🆕 Mostra filtro tipo gioco solo se ci sono dati ippici
    const tipoGiocoFilterDiv = document.getElementById('tipoGiocoFilterDiv');
    if (tipiGiocoIppico.length > 0) {
        if (tipoGiocoFilterDiv) {
            tipoGiocoFilterDiv.style.display = 'block';
            populateMultiSelectImproved('tipoGiocoFilter', tipiGiocoIppico, true);
        }
    } else if (tipoGiocoFilterDiv) {
        tipoGiocoFilterDiv.style.display = 'none';
    }
    
    updateFilterCounts();
}

// 🆕 Versione migliorata dei filtri con layout su più righe
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

    if (gameCountEl) gameCountEl.textContent = `(${[...new Set(allData.map(item => item.gameNameComplete || item.gameName))].length})`;
    if (yearCountEl) yearCountEl.textContent = `(${[...new Set(allData.map(item => item.year))].length})`;
    if (quarterCountEl) quarterCountEl.textContent = `(${[...new Set(allData.map(item => item.quarterYear))].length})`;
    if (monthCountEl) monthCountEl.textContent = `(${[...new Set(allData.map(item => item.monthYear))].length})`;
    if (channelCountEl) channelCountEl.textContent = `(${[...new Set(allData.map(item => item.canale))].length})`;
    if (concessionaryCountEl) concessionaryCountEl.textContent = `(${[...new Set(allData.map(item => item.concessionarioNome))].length})`;
    if (proprietaCountEl) proprietaCountEl.textContent = `(${[...new Set(allData.map(item => item.concessionarioProprietà))].length})`;
    if (ragioneSocialeCountEl) ragioneSocialeCountEl.textContent = `(${[...new Set(allData.map(item => item.ragioneSociale))].length})`;
    if (compartoCountEl) compartoCountEl.textContent = `(${[...new Set(allData.map(item => item.comparto))].length})`;

    // 🆕 Aggiunto conteggio per tipi di gioco ippico
    const tipiGiocoIppico = [...new Set(allData
        .filter(item => item.fileFormat === 'hippoFormat')
        .map(item => item.tipoGiocoName))];
        
    if (tipoGiocoCountEl && tipiGiocoIppico.length > 0) {
        tipoGiocoCountEl.textContent = `(${tipiGiocoIppico.length})`;
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

function applyFilters() {
    const gameFilter = getSelectedValues('gameFilter');
    const yearFilter = getSelectedValues('yearFilter');
    const quarterFilter = getSelectedValues('quarterFilter');
    const monthFilter = getSelectedValues('monthFilter');
    const channelFilter = getSelectedValues('channelFilter');
    const concessionaryFilter = getSelectedValues('concessionaryFilter');
    const proprietaFilter = getSelectedValues('proprietaFilter');
    const ragioneSocialeFilter = getSelectedValues('ragioneSocialeFilter');
    const tipoGiocoFilter = getSelectedValues('tipoGiocoFilter');
    const compartoFilter = getSelectedValues('compartoFilter'); // 🆕

    filteredData = allData.filter(item => {
        const gameToCheck = item.gameNameComplete || item.gameName;
        const tipoGiocoMatch = item.fileFormat === 'hippoFormat' ? 
            (tipoGiocoFilter.length === 0 || tipoGiocoFilter.includes(item.tipoGiocoName)) : 
            true; // Se non è formato ippico, passa sempre il filtro tipo gioco
            
        return gameFilter.includes(gameToCheck) &&
               yearFilter.includes(item.year) &&
               quarterFilter.includes(item.quarterYear) &&
               monthFilter.includes(item.monthYear) &&
               channelFilter.includes(item.canale) &&
               concessionaryFilter.includes(item.concessionarioNome) &&
               proprietaFilter.includes(item.concessionarioProprietà) &&
               ragioneSocialeFilter.includes(item.ragioneSociale) &&
               compartoFilter.includes(item.comparto) && // 🆕
               tipoGiocoMatch;
    });

    updateDisplays();
    updateActiveFiltersDisplay();
    showStatus(`Filtrati ${filteredData.length} record di ${allData.length} totali`, 'info');
    
    document.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

function updateActiveFiltersDisplay() {
    const activeFiltersDiv = document.getElementById('activeFilters');
    const summaryDiv = document.getElementById('filterSummary');
    
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
        (totalTipiGioco > 0 && tipoGiocoFilter.length < totalTipiGioco);
    
    if (filtersActive) {
        activeFiltersDiv.style.display = 'block';
        const tipoGiocoSummary = totalTipiGioco > 0 ? `<div>🎯 Tipi Gioco: ${tipoGiocoFilter.length}/${totalTipiGioco}</div>` : '';
        const compartoSummary = totalComparti > 1 ? `<div>🏢 Comparti: ${compartoFilter.length}/${totalComparti}</div>` : '';
        summaryDiv.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-10 gap-2 text-xs">
                <div>🎮 Giochi: ${gameFilter.length}/${totalGames}</div>
                <div>📅 Anni: ${yearFilter.length}/${totalYears}</div>
                <div>📊 Trimestri: ${quarterFilter.length}/${totalQuarters}</div>
                <div>🗓️ Mesi: ${monthFilter.length}/${totalMonths}</div>
                <div>🌐 Canali: ${channelFilter.length}/${totalChannels}</div>
                ${tipoGiocoSummary}
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
    
    document.getElementById('analyticsSection').style.display = 'grid';
    document.getElementById('tableSection').style.display = 'block';
}

function updateChart() {
    const chartType = document.getElementById('chartType').value;
    const metric = document.getElementById('chartMetric').value;
    const groupBy = document.getElementById('chartGroupBy').value;
    
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    const chartData = prepareChartData(metric, groupBy);

    const config = {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${getMetricTitle(metric)} per ${getGroupByTitle(groupBy)}`
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

// ✅ CORREZIONE: Usa parseItalianNumber per i calcoli dei grafici
function prepareChartData(metric, groupBy) {
    const grouped = _.groupBy(filteredData, groupBy);
    const labels = [];
    const data = [];
    
    Object.keys(grouped).forEach(groupKey => {
        let label = groupKey;
        
        // 🆕 Gestione etichette per i dati ippici
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
            const value = parseItalianNumber(item[metric]); // ✅ CORREZIONE QUI
            return acc + value;
        }, 0);
        data.push(sum);
    });

    const combined = labels.map((label, index) => ({ label, value: data[index] }));
    combined.sort((a, b) => b.value - a.value);
    const topItems = combined.slice(0, 15);

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
        'comparto': 'Comparto' // 🆕
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

function updateTable() {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    // 🆕 Headers aggiornati per includere comparto
    const headers = ['Gioco', 'Tipo', 'Comparto', 'Anno', 'Trimestre', 'Mese', 'Canale', 'Codice', 'Concessionario', 'Ragione Sociale', 'Proprietà', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
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
    
    const sortedData = getSortedData();
    tableBody.innerHTML = sortedData.map(row => {
        const tipoGiocoDisplay = row.fileFormat === 'hippoFormat' ? 
            `<span class="tipo-gioco-badge tipo-${row.tipoGioco?.toLowerCase()}">${row.tipoGiocoName || ''}</span>` : 
            '-';
        
        const rowClass = row.fileFormat === 'hippoFormat' ? 'hippo-row' : '';
        
        return `
        <tr class="hover:bg-gray-50 ${rowClass}">
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${(row.gameNameComplete || row.gameName).length > 15 ? (row.gameNameComplete || row.gameName).substring(0, 15) + '...' : (row.gameNameComplete || row.gameName)}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${tipoGiocoDisplay}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                <span class="comparto-badge">${row.comparto}</span>
            </td>
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
}

function sortTable(columnIndex) {
    const columns = ['gameNameComplete', 'tipoGiocoName', 'comparto', 'year', 'quarter', 'monthName', 'canale', 'codiceConcessione', 'concessionarioNome', 'ragioneSociale', 'concessionarioProprietà', 'importoRaccolta', 'percentualeRaccolta', 'importoSpesa', 'percentualeSpesa'];
    const column = columns[columnIndex];
    
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    updateTable();
    updateSortArrows(columnIndex);
}

// ✅ CORREZIONE: Usa parseItalianNumber per l'ordinamento
function getSortedData() {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];
        
        // 🆕 Gestione ordinamento per tipo gioco
        if (sortColumn === 'tipoGiocoName') {
            valueA = a.tipoGiocoName || '';
            valueB = b.tipoGiocoName || '';
        }
        
        if (sortColumn === 'gameNameComplete') {
            valueA = a.gameNameComplete || a.gameName;
            valueB = b.gameNameComplete || b.gameName;
        }
        
        if (sortColumn.includes('importo')) {
            valueA = parseItalianNumber(valueA); // ✅ CORREZIONE QUI
            valueB = parseItalianNumber(valueB); // ✅ CORREZIONE QUI
        }
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
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
    
    const channelStats = stats.byChannel.map(ch => `
        <div class="bg-indigo-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-indigo-200">${ch.name}</h4>
            <p class="text-lg font-bold text-white">${ch.records} record</p>
            <p class="text-xs text-indigo-100">Raccolta: ${ch.raccolta}</p>
        </div>
    `).join('');
    
    // 🆕 Statistiche per tipi di gioco ippico
    const tipoGiocoStats = stats.byTipoGioco.map(tipo => `
        <div class="bg-purple-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-purple-200">${tipo.name}</h4>
            <p class="text-lg font-bold text-white">${tipo.records} record</p>
            <p class="text-xs text-purple-100">Spesa: ${tipo.spesa}</p>
        </div>
    `).join('');
    
    // 🆕 Statistiche per comparti
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

// ✅ CORREZIONE: Usa parseItalianNumber per le statistiche
function calculateStats() {
    const totalRecords = filteredData.length;
    const uniqueConcessionari = new Set(filteredData.map(item => item.concessionarioNome)).size;
    
    const totalRaccolta = filteredData.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoRaccolta); // ✅ CORREZIONE QUI
        return sum + value;
    }, 0);
    
    const totalSpesa = filteredData.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoSpesa); // ✅ CORREZIONE QUI
        return sum + value;
    }, 0);
    
    const negativeValues = filteredData.filter(item => item.isNegativeSpesa);
    
    const byChannel = Object.entries(_.groupBy(filteredData, 'canale')).map(([channel, records]) => {
        const raccoltaSum = records.reduce((sum, item) => {
            const value = parseItalianNumber(item.importoRaccolta); // ✅ CORREZIONE QUI
            return sum + value;
        }, 0);
        
        return {
            name: channelNames[channel] || channel,
            records: records.length,
            raccolta: raccoltaSum.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        };
    });
    
    // 🆕 Statistiche per tipi di gioco ippico
    const hippoData = filteredData.filter(item => item.fileFormat === 'hippoFormat');
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
    
    // 🆕 Statistiche per comparti
    const byComparto = Object.entries(_.groupBy(filteredData, 'comparto')).map(([comparto, records]) => {
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
        byComparto // 🆕
    };
}

function updateNegativeValuesAlert(negativeValues) {
    const alertDiv = document.getElementById('negativeValuesAlert');
    const listDiv = document.getElementById('negativeValuesList');
    
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
    const headers = ['Gioco', 'Tipo Gioco', 'Comparto', 'Anno', 'Trimestre', 'Mese', 'Canale', 'Codice', 'Concessionario', 'Ragione Sociale', 'Proprietà', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
            `"${row.gameNameComplete || row.gameName}"`,
            `"${row.fileFormat === 'hippoFormat' ? (row.tipoGiocoName || '') : ''}"`,
            `"${row.comparto}"`, // 🆕
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
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(row => ({
        'Gioco': row.gameNameComplete || row.gameName,
        'Tipo Gioco': row.fileFormat === 'hippoFormat' ? (row.tipoGiocoName || '') : '',
        'Comparto': row.comparto, // 🆕
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gaming Analytics');
    XLSX.writeFile(workbook, `gaming-analytics-data-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = message;
    statusDiv.className = `mt-4 text-sm ${type === 'error' ? 'text-red-300' : type === 'success' ? 'text-green-300' : type === 'warning' ? 'text-yellow-300' : 'text-blue-300'}`;
}

function toggleAnagraficaSection() {
    const section = document.getElementById('anagraficaSection');
    const button = document.querySelector('[onclick="toggleAnagraficaSection()"]');
    
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        button.textContent = '📖 Nascondi Anagrafica';
    } else {
        section.style.display = 'none';
        button.textContent = '📖 Gestisci Anagrafica';
    }
}

// 🆕 Funzioni per gestione sezioni mappature
function toggleMappingsSection() {
    const section = document.getElementById('mappingsSection');
    const button = document.querySelector('[onclick="toggleMappingsSection()"]');
    
    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        button.textContent = '🎯 Nascondi Mappature';
    } else {
        section.style.display = 'none';
        button.textContent = '🎯 Gestisci Mappature';
    }
}