// Variabili globali
let allData = [];
let filteredData = [];
let currentChart = null;
let sortColumn = null;
let sortDirection = 'asc';

// Costanti per localStorage
const STORAGE_KEY = 'gaming_analytics_data';
const STORAGE_VERSION = '1.1'; // Aggiornata per i nuovi campi

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
    'online': '💻 Online'
};

// Inizializzazione - carica dati salvati
document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
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
                // Migra dati vecchi se necessario
                allData = parsed.data.map(item => ({
                    ...item,
                    canale: item.canale || 'fisico', // Default fisico per dati esistenti
                    quarterYear: item.quarterYear || `${item.quarter}/${item.year}`
                }));
                
                if (allData.length > 0) {
                    populateFilters();
                    showStatus(`Caricati ${allData.length} record salvati (${new Date(parsed.timestamp).toLocaleString('it-IT')})`, 'success');
                    document.getElementById('filtersSection').style.display = 'block';
                    applyFilters();
                }
                updateDataStatus();
                
                // Salva la migrazione
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
        
        // Reset interfaccia
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
    indicator.classList.add('show');
    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

function updateDataStatus() {
    const statusDiv = document.getElementById('dataStatus');
    if (allData.length > 0) {
        const uniqueFiles = [...new Set(allData.map(item => item.fileName))].length;
        const channels = [...new Set(allData.map(item => item.canale))];
        const dateRange = getDateRange();
        statusDiv.innerHTML = `📊 ${allData.length} record da ${uniqueFiles} file | 🌐 ${channels.map(c => channelNames[c] || c).join(', ')} | 📅 ${dateRange} | 💾 Salvato automaticamente`;
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
    const channelSelector = document.getElementById('channelSelector');
    const files = fileInput.files;
    const selectedChannel = channelSelector.value;
    
    if (files.length === 0) {
        showStatus('Seleziona almeno un file Excel', 'error');
        return;
    }

    showStatus(`Elaborazione file in corso per canale ${channelNames[selectedChannel]}...`, 'info');
    
    try {
        const newData = [];
        for (let file of files) {
            const data = await readExcelFile(file, selectedChannel);
            newData.push(...data);
        }
        
        if (newData.length > 0) {
            // Aggiungi ai dati esistenti evitando duplicati
            const existingKeys = new Set(allData.map(item => `${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.canale}`));
            const uniqueNewData = newData.filter(item => 
                !existingKeys.has(`${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.canale}`)
            );
            
            allData.push(...uniqueNewData);
            saveDataToStorage();
            
            populateFilters();
            showStatus(`Elaborati ${uniqueNewData.length} nuovi record ${channelNames[selectedChannel]} da ${files.length} file (${newData.length - uniqueNewData.length} duplicati ignorati)`, 'success');
            document.getElementById('filtersSection').style.display = 'block';
            applyFilters();
        } else {
            showStatus('Nessun dato trovato nei file', 'error');
        }
    } catch (error) {
        showStatus(`Errore nell'elaborazione: ${error.message}`, 'error');
    }
}

function readExcelFile(file, channel = 'fisico') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const parsedData = parseExcelData(jsonData, file.name, channel);
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

function parseExcelData(jsonData, fileName, channel = 'fisico') {
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
        month: month,
        year: year,
        monthYear: `${month}/${year}`,
        quarter: quarter,
        quarterYear: quarterYear,
        canale: channel,
        codiceConcessione: row[0]?.toString().trim() || '',
        ragioneSociale: row[1]?.toString().trim() || '',
        importoRaccolta: convertToItalianNumber(row[2]),
        percentualeRaccolta: row[3]?.toString() || '',
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        monthName: monthNames[month] || month,
        quarterName: quarterNames[quarter] || quarter,
        channelName: channelNames[channel] || channel,
        isNegativeSpesa: parseFloat(row[4]?.toString().replace(',', '.') || 0) < 0
    }));
}

function convertToItalianNumber(value) {
    if (value === null || value === undefined || value === '') return '0,00';
    
    let numStr = value.toString();
    
    if (typeof value === 'number') {
        return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    return numStr.replace('.', ',');
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
    const month = now.getMonth() + 1; // getMonth() returns 0-11
    const year = now.getFullYear();
    const quarter = getQuarter(month.toString().padStart(2, '0'));
    return `${quarter}/${year}`;
}

// ===== GESTIONE FILTRI MIGLIORATI =====

function populateFilters() {
    const games = [...new Set(allData.map(item => item.gameName))].sort();
    const years = [...new Set(allData.map(item => item.year))].sort();
    const quarters = [...new Set(allData.map(item => item.quarterYear))].sort();
    const months = [...new Set(allData.map(item => item.monthYear))].sort();
    const channels = [...new Set(allData.map(item => item.canale))].sort();
    const concessionari = [...new Set(allData.map(item => item.ragioneSociale))].sort();

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
    
    updateFilterCounts();
}

function populateMultiSelect(selectId, options, selectAll = false, displayFormatter = null) {
    const container = document.getElementById(selectId);
    const optionsContainer = container.querySelector('.multi-select-options');
    
    optionsContainer.innerHTML = '';
    
    // Aggiungi opzione "Seleziona tutto"
    const selectAllOption = document.createElement('div');
    selectAllOption.className = 'multi-select-option';
    selectAllOption.innerHTML = `
        <input type="checkbox" class="multi-select-checkbox select-all" ${selectAll ? 'checked' : ''}>
        <span><strong>Seleziona tutto</strong></span>
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
    separator.style.borderTop = '1px solid #e5e7eb';
    separator.style.margin = '4px 0';
    optionsContainer.appendChild(separator);
    
    // Opzioni individuali
    options.forEach(option => {
        const displayText = displayFormatter ? displayFormatter(option) : option;
        const shortText = displayText.length > 35 ? displayText.substring(0, 35) + '...' : displayText;
        
        const optionElement = document.createElement('div');
        optionElement.className = 'multi-select-option';
        optionElement.innerHTML = `
            <input type="checkbox" class="multi-select-checkbox" value="${option}" ${selectAll ? 'checked' : ''}>
            <span title="${displayText}">${shortText}</span>
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
        
        optionsContainer.appendChild(optionElement);
    });
    
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
    const selectedText = container.querySelector('.selected-text');
    const checkboxes = container.querySelectorAll('.multi-select-checkbox:not(.select-all):checked');
    
    if (checkboxes.length === 0) {
        selectedText.textContent = 'Nessuna selezione';
    } else if (checkboxes.length === 1) {
        const value = checkboxes[0].value;
        // Format display text based on filter type
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
    document.getElementById('gameCount').textContent = `(${[...new Set(allData.map(item => item.gameName))].length})`;
    document.getElementById('yearCount').textContent = `(${[...new Set(allData.map(item => item.year))].length})`;
    document.getElementById('quarterCount').textContent = `(${[...new Set(allData.map(item => item.quarterYear))].length})`;
    document.getElementById('monthCount').textContent = `(${[...new Set(allData.map(item => item.monthYear))].length})`;
    document.getElementById('channelCount').textContent = `(${[...new Set(allData.map(item => item.canale))].length})`;
    document.getElementById('concessionaryCount').textContent = `(${[...new Set(allData.map(item => item.ragioneSociale))].length})`;
}

function getSelectedValues(selectId) {
    const container = document.getElementById(selectId);
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

// Funzioni helper per filtri rapidi
function filterByChannel(channel) {
    // Deseleziona tutti i canali
    const channelContainer = document.getElementById('channelFilter');
    const channelCheckboxes = channelContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
    channelCheckboxes.forEach(cb => cb.checked = cb.value === channel);
    
    // Aggiorna text e applica
    updateMultiSelectText('channelFilter');
    applyFilters();
}

function filterByCurrentQuarter() {
    const currentQuarter = getCurrentQuarter();
    
    // Deseleziona tutti i trimestri
    const quarterContainer = document.getElementById('quarterFilter');
    const quarterCheckboxes = quarterContainer.querySelectorAll('.multi-select-checkbox:not(.select-all)');
    quarterCheckboxes.forEach(cb => cb.checked = cb.value === currentQuarter);
    
    // Aggiorna text e applica
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

    filteredData = allData.filter(item => {
        return gameFilter.includes(item.gameName) &&
               yearFilter.includes(item.year) &&
               quarterFilter.includes(item.quarterYear) &&
               monthFilter.includes(item.monthYear) &&
               channelFilter.includes(item.canale) &&
               concessionaryFilter.includes(item.ragioneSociale);
    });

    updateDisplays();
    updateActiveFiltersDisplay();
    showStatus(`Filtrati ${filteredData.length} record di ${allData.length} totali`, 'info');
    
    // Chiudi dropdown
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
    
    const totalGames = [...new Set(allData.map(item => item.gameName))].length;
    const totalYears = [...new Set(allData.map(item => item.year))].length;
    const totalQuarters = [...new Set(allData.map(item => item.quarterYear))].length;
    const totalMonths = [...new Set(allData.map(item => item.monthYear))].length;
    const totalChannels = [...new Set(allData.map(item => item.canale))].length;
    const totalConcessionari = [...new Set(allData.map(item => item.ragioneSociale))].length;
    
    const filtersActive = 
        gameFilter.length < totalGames ||
        yearFilter.length < totalYears ||
        quarterFilter.length < totalQuarters ||
        monthFilter.length < totalMonths ||
        channelFilter.length < totalChannels ||
        concessionaryFilter.length < totalConcessionari;
    
    if (filtersActive) {
        activeFiltersDiv.style.display = 'block';
        summaryDiv.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                <div>🎮 Giochi: ${gameFilter.length}/${totalGames}</div>
                <div>📅 Anni: ${yearFilter.length}/${totalYears}</div>
                <div>📊 Trimestri: ${quarterFilter.length}/${totalQuarters}</div>
                <div>🗓️ Mesi: ${monthFilter.length}/${totalMonths}</div>
                <div>🌐 Canali: ${channelFilter.length}/${totalChannels}</div>
                <div>🏢 Concessionari: ${concessionaryFilter.length}/${totalConcessionari}</div>
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

function prepareChartData(metric, groupBy) {
    const grouped = _.groupBy(filteredData, groupBy);
    const labels = [];
    const data = [];
    
    Object.keys(grouped).forEach(groupKey => {
        // Format label based on group type
        let label = groupKey;
        if (groupBy === 'quarterYear') {
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
            const value = parseFloat(item[metric].toString().replace(',', '.')) || 0;
            return acc + value;
        }, 0);
        data.push(sum);
    });

    // Ordina per valore decrescente e prendi top 15
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
        'ragioneSociale': 'Concessionario',
        'canale': 'Canale',
        'quarterYear': 'Trimestre',
        'monthYear': 'Mese'
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
    
    const headers = ['Gioco', 'Anno', 'Trimestre', 'Mese', 'Canale', 'Codice', 'Ragione Sociale', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
    tableHead.innerHTML = `
        <tr>
            ${headers.map((header, index) => `
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sortable" 
                    onclick="sortTable(${index})">
                    ${header}
                    <span class="sort-arrow" id="arrow-${index}">▲</span>
                </th>
            `).join('')}
        </tr>
    `;
    
    const sortedData = getSortedData();
    tableBody.innerHTML = sortedData.map(row => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.gameName.length > 20 ? row.gameName.substring(0, 20) + '...' : row.gameName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.year}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.quarter}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.monthName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="channel-badge channel-${row.canale}">${row.channelName}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.codiceConcessione}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title="${row.ragioneSociale}">${row.ragioneSociale.length > 25 ? row.ragioneSociale.substring(0, 25) + '...' : row.ragioneSociale}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.importoRaccolta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.percentualeRaccolta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${row.isNegativeSpesa ? 'negative-value' : ''}">${row.importoSpesa}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.percentualeSpesa}</td>
        </tr>
    `).join('');
}

function sortTable(columnIndex) {
    const columns = ['gameName', 'year', 'quarter', 'monthName', 'canale', 'codiceConcessione', 'ragioneSociale', 'importoRaccolta', 'percentualeRaccolta', 'importoSpesa', 'percentualeSpesa'];
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

function getSortedData() {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];
        
        if (sortColumn.includes('importo')) {
            valueA = parseFloat(valueA.toString().replace(',', '.')) || 0;
            valueB = parseFloat(valueB.toString().replace(',', '.')) || 0;
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
    
    // Statistiche per canale
    const channelStats = stats.byChannel.map(ch => `
        <div class="bg-indigo-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-indigo-200">${ch.name}</h4>
            <p class="text-lg font-bold text-white">${ch.records} record</p>
            <p class="text-xs text-indigo-100">Raccolta: ${ch.raccolta}</p>
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
    `;
    
    // Mostra alert per valori negativi
    updateNegativeValuesAlert(stats.negativeValues);
}

function calculateStats() {
    const totalRecords = filteredData.length;
    const uniqueConcessionari = new Set(filteredData.map(item => item.ragioneSociale)).size;
    
    const totalRaccolta = filteredData.reduce((sum, item) => {
        const value = parseFloat(item.importoRaccolta.toString().replace(',', '.')) || 0;
        return sum + value;
    }, 0);
    
    const totalSpesa = filteredData.reduce((sum, item) => {
        const value = parseFloat(item.importoSpesa.toString().replace(',', '.')) || 0;
        return sum + value;
    }, 0);
    
    const negativeValues = filteredData.filter(item => item.isNegativeSpesa);
    
    // Statistiche per canale
    const byChannel = Object.entries(_.groupBy(filteredData, 'canale')).map(([channel, records]) => {
        const raccoltaSum = records.reduce((sum, item) => {
            const value = parseFloat(item.importoRaccolta.toString().replace(',', '.')) || 0;
            return sum + value;
        }, 0);
        
        return {
            name: channelNames[channel] || channel,
            records: records.length,
            raccolta: raccoltaSum.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        };
    });
    
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
    
    if (negativeValues.length > 0) {
        alertDiv.style.display = 'block';
        listDiv.innerHTML = negativeValues.map(item => 
            `• ${item.ragioneSociale} (${item.channelName}): ${item.importoSpesa} (${item.monthYear})`
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
    const headers = ['Gioco', 'Anno', 'Trimestre', 'Mese', 'Canale', 'Codice', 'Ragione Sociale', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
            `"${row.gameName}"`,
            `"${row.year}"`,
            `"${row.quarter}"`,
            `"${row.monthName}"`,
            `"${row.channelName}"`,
            `"${row.codiceConcessione}"`,
            `"${row.ragioneSociale}"`,
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
        'Gioco': row.gameName,
        'Anno': row.year,
        'Trimestre': row.quarter,
        'Mese': row.monthName,
        'Canale': row.channelName,
        'Codice': row.codiceConcessione,
        'Ragione Sociale': row.ragioneSociale,
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
