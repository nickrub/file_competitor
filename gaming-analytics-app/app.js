// Variabili globali
let allData = [];
let filteredData = [];
let currentChart = null;
let sortColumn = null;
let sortDirection = 'asc';
let anagraficaConcessioni = {};
let anagraficaData = [];
let nomiGiochiMapping = {};
let compartiMapping = {};

// 🚀 OTTIMIZZAZIONI PERFORMANCE
let dataIndices = {}; // Indici per accelerare i filtri
let isProcessing = false; // Flag per prevenire sovraccarichi
let displayedRows = []; // Righe attualmente visualizzate (virtual scrolling)
let currentPage = 0;
const CHUNK_SIZE = 1000; // Processa 1000 righe alla volta
const PAGE_SIZE = 50; // Mostra 50 righe per volta
const MAX_CHART_ITEMS = 20; // Massimo 20 elementi nei grafici

// Costanti per localStorage
const STORAGE_KEY = 'gaming_analytics_data';
const ANAGRAFICA_STORAGE_KEY = 'gaming_analytics_anagrafica';
const NOMI_GIOCHI_STORAGE_KEY = 'gaming_analytics_nomi_giochi';
const COMPARTI_STORAGE_KEY = 'gaming_analytics_comparti';
const STORAGE_VERSION = '3.0'; // Aggiornata per ottimizzazioni

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

// 🚀 PROGRESS BAR
function showProgress(message, percent = 0) {
    const progressDiv = document.getElementById('loadingProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressDiv && progressBar && progressText) {
        progressDiv.style.display = 'block';
        progressBar.style.width = `${percent}%`;
        progressText.textContent = message;
        
        if (percent >= 100) {
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 1000);
        }
    }
}

// 🚀 CHUNKED PROCESSING - Processa dati in blocchi piccoli
async function processDataInChunks(data, processor, chunkSize = CHUNK_SIZE) {
    const results = [];
    const totalChunks = Math.ceil(data.length / chunkSize);
    
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);
        
        // Aggiorna progress bar
        const progress = Math.round(((i + chunkSize) / data.length) * 100);
        showProgress(`Elaborazione dati: ${Math.min(progress, 100)}%`, Math.min(progress, 100));
        
        // Yield control per mantenere UI responsive
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    return results;
}

// 🚀 CREAZIONE INDICI per accelerare i filtri
function buildDataIndices() {
    console.log('🔍 Costruzione indici per accelerare i filtri...');
    
    dataIndices = {
        byGame: {},
        byYear: {},
        byQuarter: {},
        byMonth: {},
        byChannel: {},
        byConcessionario: {},
        byComparto: {},
        byGruppo: {}
    };
    
    allData.forEach((item, index) => {
        // Indice per gioco
        const game = item.gameNameComplete || item.gameName;
        if (!dataIndices.byGame[game]) dataIndices.byGame[game] = [];
        dataIndices.byGame[game].push(index);
        
        // Indice per anno
        if (!dataIndices.byYear[item.year]) dataIndices.byYear[item.year] = [];
        dataIndices.byYear[item.year].push(index);
        
        // Indice per trimestre
        if (!dataIndices.byQuarter[item.quarterYear]) dataIndices.byQuarter[item.quarterYear] = [];
        dataIndices.byQuarter[item.quarterYear].push(index);
        
        // Indice per mese
        if (!dataIndices.byMonth[item.monthYear]) dataIndices.byMonth[item.monthYear] = [];
        dataIndices.byMonth[item.monthYear].push(index);
        
        // Indice per canale
        if (!dataIndices.byChannel[item.canale]) dataIndices.byChannel[item.canale] = [];
        dataIndices.byChannel[item.canale].push(index);
        
        // Altri indici...
        if (item.concessionarioNome) {
            if (!dataIndices.byConcessionario[item.concessionarioNome]) dataIndices.byConcessionario[item.concessionarioNome] = [];
            dataIndices.byConcessionario[item.concessionarioNome].push(index);
        }
        
        if (item.comparto) {
            if (!dataIndices.byComparto[item.comparto]) dataIndices.byComparto[item.comparto] = [];
            dataIndices.byComparto[item.comparto].push(index);
        }
        
        if (item.gruppo) {
            if (!dataIndices.byGruppo[item.gruppo]) dataIndices.byGruppo[item.gruppo] = [];
            dataIndices.byGruppo[item.gruppo].push(index);
        }
    });
    
    console.log(`✅ Indici costruiti per ${allData.length} record`);
}

// 🚀 FILTRI OTTIMIZZATI usando gli indici
function applyFiltersOptimized() {
    if (isProcessing) return;
    isProcessing = true;
    
    console.log('🎛️ Applicazione filtri ottimizzati...');
    
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

    // Trova intersezioni usando gli indici (molto più veloce)
    let candidateIndices = new Set();
    let firstFilter = true;
    
    // Filtro per gioco (usa indice)
    if (gameFilter.length > 0) {
        const gameIndices = new Set();
        gameFilter.forEach(game => {
            if (dataIndices.byGame[game]) {
                dataIndices.byGame[game].forEach(idx => gameIndices.add(idx));
            }
        });
        candidateIndices = firstFilter ? gameIndices : intersection(candidateIndices, gameIndices);
        firstFilter = false;
    }
    
    // Filtro per anno (usa indice)
    if (yearFilter.length > 0) {
        const yearIndices = new Set();
        yearFilter.forEach(year => {
            if (dataIndices.byYear[year]) {
                dataIndices.byYear[year].forEach(idx => yearIndices.add(idx));
            }
        });
        candidateIndices = firstFilter ? yearIndices : intersection(candidateIndices, yearIndices);
        firstFilter = false;
    }
    
    // Continua per altri filtri...
    if (quarterFilter.length > 0) {
        const quarterIndices = new Set();
        quarterFilter.forEach(quarter => {
            if (dataIndices.byQuarter[quarter]) {
                dataIndices.byQuarter[quarter].forEach(idx => quarterIndices.add(idx));
            }
        });
        candidateIndices = firstFilter ? quarterIndices : intersection(candidateIndices, quarterIndices);
        firstFilter = false;
    }
    
    // Se nessun filtro è applicato, prendi tutti gli indici
    if (firstFilter) {
        candidateIndices = new Set(allData.map((_, idx) => idx));
    }
    
    // Applica filtri rimanenti solo sui candidati (molto più efficiente)
    filteredData = Array.from(candidateIndices)
        .map(idx => allData[idx])
        .filter(item => {
            // Filtri che non hanno indici ottimizzati
            const tipoGiocoMatch = item.fileFormat === 'hippoFormat' ? 
                (tipoGiocoFilter.length === 0 || tipoGiocoFilter.includes(item.tipoGiocoName)) : 
                true;

            const gruppoMatch = item.fileFormat === 'historicalFormat' ? 
                (gruppoFilter.length === 0 || gruppoFilter.includes(item.gruppo)) : 
                true;
                
            return monthFilter.includes(item.monthYear) &&
                   channelFilter.includes(item.canale) &&
                   concessionaryFilter.includes(item.concessionarioNome) &&
                   proprietaFilter.includes(item.concessionarioProprietà) &&
                   ragioneSocialeFilter.includes(item.ragioneSociale) &&
                   compartoFilter.includes(item.comparto) &&
                   tipoGiocoMatch &&
                   gruppoMatch;
        });

    console.log(`✅ Filtri applicati: ${filteredData.length} di ${allData.length} record`);
    
    updateDisplaysOptimized();
    updateActiveFiltersDisplay();
    showStatus(`Filtrati ${filteredData.length} record di ${allData.length} totali`, 'info');
    
    document.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    
    isProcessing = false;
}

// Helper per intersezione di Set
function intersection(setA, setB) {
    return new Set([...setA].filter(x => setB.has(x)));
}

// 🚀 VIRTUAL SCROLLING per tabelle grandi
function updateTableWithVirtualScrolling() {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const tableContainer = document.querySelector('.table-container');
    
    if (!tableBody || filteredData.length === 0) return;
    
    // Headers ottimizzati
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
    
    // 🚀 VIRTUAL SCROLLING: mostra solo le prime righe
    const maxDisplayRows = Math.min(filteredData.length, PAGE_SIZE);
    displayedRows = filteredData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    
    tableBody.innerHTML = displayedRows.map((row, index) => {
        const tipoGiocoDisplay = row.fileFormat === 'hippoFormat' ? 
            `<span class="tipo-gioco-badge tipo-${row.tipoGioco?.toLowerCase()}">${row.tipoGiocoName || ''}</span>` : 
            '-';
        
        const gruppoDisplay = row.fileFormat === 'historicalFormat' && row.gruppo ? 
            `<span class="gruppo-badge">${row.gruppo.length > 15 ? row.gruppo.substring(0, 15) + '...' : row.gruppo}</span>` : 
            '-';
        
        let rowClass = 'hover:bg-gray-50';
        if (row.fileFormat === 'hippoFormat') {
            rowClass += ' hippo-row';
        } else if (row.fileFormat === 'historicalFormat') {
            rowClass += ' historical-row';
        }
        
        return `
        <tr class="${rowClass}">
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${truncateText(row.gameNameComplete || row.gameName, 15)}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${tipoGiocoDisplay}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                <span class="comparto-badge">${truncateText(row.comparto, 10)}</span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${gruppoDisplay}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.year}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.quarter}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.monthName}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm">
                <span class="channel-badge channel-${row.canale}">${row.channelName}</span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.codiceConcessione}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium" title="${row.concessionarioNome}">${truncateText(row.concessionarioNome, 15)}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.ragioneSociale}">${truncateText(row.ragioneSociale, 20)}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900" title="${row.concessionarioProprietà}">${truncateText(row.concessionarioProprietà, 15)}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.importoRaccolta}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.percentualeRaccolta}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900 ${row.isNegativeSpesa ? 'negative-value' : ''}">${row.importoSpesa}</td>
            <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${row.percentualeSpesa}</td>
        </tr>
        `;
    }).join('');
    
    // 🚀 PAGINAZIONE
    updatePaginationControls();
}

// Helper per troncare testo
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// 🚀 CONTROLLI PAGINAZIONE
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    const paginationDiv = document.getElementById('paginationControls');
    
    if (!paginationDiv) return;
    
    paginationDiv.innerHTML = `
        <div class="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200">
            <div class="flex justify-between flex-1 sm:hidden">
                <button onclick="previousPage()" ${currentPage === 0 ? 'disabled' : ''} 
                        class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Precedente
                </button>
                <button onclick="nextPage()" ${currentPage >= totalPages - 1 ? 'disabled' : ''} 
                        class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Successiva
                </button>
            </div>
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Mostra <span class="font-medium">${currentPage * PAGE_SIZE + 1}</span> -
                        <span class="font-medium">${Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length)}</span> di
                        <span class="font-medium">${filteredData.length}</span> risultati
                    </p>
                </div>
                <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button onclick="previousPage()" ${currentPage === 0 ? 'disabled' : ''} 
                                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                            ←
                        </button>
                        <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ${currentPage + 1} di ${totalPages}
                        </span>
                        <button onclick="nextPage()" ${currentPage >= totalPages - 1 ? 'disabled' : ''} 
                                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                            →
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    `;
}

function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        updateTableWithVirtualScrolling();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
    if (currentPage < totalPages - 1) {
        currentPage++;
        updateTableWithVirtualScrolling();
    }
}

// 🚀 GRAFICI OTTIMIZZATI - limita elementi mostrati
function prepareChartDataOptimized(metric, groupBy) {
    const grouped = _.groupBy(filteredData, groupBy);
    const labels = [];
    const data = [];
    
    Object.keys(grouped).forEach(groupKey => {
        let label = groupKey;
        
        // Gestione etichette ottimizzata
        if (groupBy === 'gameNameComplete') {
            label = groupKey.length > 20 ? groupKey.substring(0, 20) + '...' : groupKey;
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
        
        labels.push(label.length > 15 ? label.substring(0, 15) + '...' : label);
        
        const sum = grouped[groupKey].reduce((acc, item) => {
            const value = parseItalianNumber(item[metric]);
            return acc + value;
        }, 0);
        data.push(sum);
    });

    const combined = labels.map((label, index) => ({ label, value: data[index] }));
    combined.sort((a, b) => b.value - a.value);
    
    // 🚀 LIMITA A MAX_CHART_ITEMS per performance
    const topItems = combined.slice(0, MAX_CHART_ITEMS);

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

// 🚀 DISPLAYS OTTIMIZZATI
function updateDisplaysOptimized() {
    // Aggiorna chart con dati limitati
    updateChartOptimized();
    
    // Aggiorna tabella con virtual scrolling
    updateTableWithVirtualScrolling();
    
    // Aggiorna statistiche
    updateSummaryStatsOptimized();
    
    // Mostra sezioni
    document.getElementById('analyticsSection').style.display = 'flex';
    document.getElementById('tableSection').style.display = 'block';
}

function updateChartOptimized() {
    const chartType = document.getElementById('chartType').value;
    const metric = document.getElementById('chartMetric').value;
    const groupBy = document.getElementById('chartGroupBy').value;
    
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    const chartData = prepareChartDataOptimized(metric, groupBy);

    const config = {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `${getMetricTitle(metric)} per ${getGroupByTitle(groupBy)} (Top ${MAX_CHART_ITEMS})`
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

// 🚀 STATISTICHE OTTIMIZZATE
function updateSummaryStatsOptimized() {
    // Campiona solo i primi 10000 record per le statistiche se il dataset è troppo grande
    const sampleData = filteredData.length > 10000 ? 
        filteredData.slice(0, 10000) : 
        filteredData;
    
    const isSampled = filteredData.length > 10000;
    
    const stats = calculateStatsOptimized(sampleData, isSampled);
    const summaryDiv = document.getElementById('summaryStats');
    
    const channelStats = stats.byChannel.map(ch => `
        <div class="bg-indigo-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-indigo-200">${ch.name}</h4>
            <p class="text-lg font-bold text-white">${ch.records} record</p>
            <p class="text-xs text-indigo-100">Raccolta: ${ch.raccolta}</p>
        </div>
    `).join('');
    
    // Statistiche per tipi di gioco ippico
    const tipoGiocoStats = stats.byTipoGioco.map(tipo => `
        <div class="bg-purple-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-purple-200">${tipo.name}</h4>
            <p class="text-lg font-bold text-white">${tipo.records} record</p>
            <p class="text-xs text-purple-100">Spesa: ${tipo.spesa}</p>
        </div>
    `).join('');
    
    // Statistiche per comparti (solo top 5)
    const compartoStats = stats.byComparto.slice(0, 5).map(comp => `
        <div class="bg-orange-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-orange-200">${truncateText(comp.name, 15)}</h4>
            <p class="text-lg font-bold text-white">${comp.records} record</p>
            <p class="text-xs text-orange-100">Spesa: ${comp.spesa}</p>
        </div>
    `).join('');
    
    const sampledText = isSampled ? ' (campione 10k)' : '';
    
    summaryDiv.innerHTML = `
        <div class="bg-blue-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-blue-200">Totale Record</h4>
            <p class="text-2xl font-bold text-white">${stats.totalRecords}${sampledText}</p>
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
            <h4 class="text-sm font-medium text-yellow-200">Concessionari</h4>
            <p class="text-2xl font-bold text-white">${stats.uniqueConcessionari}</p>
        </div>
        ${channelStats}
        ${tipoGiocoStats}
        ${compartoStats}
    `;
    
    if (stats.negativeValues.length > 0) {
        updateNegativeValuesAlert(stats.negativeValues.slice(0, 10)); // Mostra solo primi 10
    }
}

function calculateStatsOptimized(data, isSampled = false) {
    const totalRecords = isSampled ? filteredData.length : data.length;
    const uniqueConcessionari = new Set(data.map(item => item.concessionarioNome)).size;
    
    const totalRaccolta = data.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoRaccolta);
        return sum + value;
    }, 0);
    
    const totalSpesa = data.reduce((sum, item) => {
        const value = parseItalianNumber(item.importoSpesa);
        return sum + value;
    }, 0);
    
    const negativeValues = data.filter(item => item.isNegativeSpesa);
    
    const byChannel = Object.entries(_.groupBy(data, 'canale')).map(([channel, records]) => {
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
    
    // Statistiche per tipi di gioco ippico
    const hippoData = data.filter(item => item.fileFormat === 'hippoFormat');
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
    
    // Statistiche per comparti (top 10 per performance)
    const byComparto = Object.entries(_.groupBy(data, 'comparto'))
        .map(([comparto, records]) => {
            const spesaSum = records.reduce((sum, item) => {
                const value = parseItalianNumber(item.importoSpesa);
                return sum + value;
            }, 0);
            
            return {
                name: comparto,
                records: records.length,
                spesa: spesaSum.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                spesaNum: spesaSum
            };
        })
        .sort((a, b) => b.spesaNum - a.spesaNum); // Ordina per spesa
    
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

// 🚀 CARICAMENTO FILE OTTIMIZZATO
async function processFilesOptimized() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showStatus('Seleziona almeno un file Excel', 'error');
        return;
    }

    if (isProcessing) {
        showStatus('Elaborazione in corso, attendere...', 'warning');
        return;
    }

    isProcessing = true;
    showProgress('Avvio elaborazione...', 0);
    
    try {
        const newData = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            showProgress(`Lettura file ${i + 1}/${files.length}: ${file.name}`, (i / files.length) * 50);
            
            const data = await readExcelFileOptimized(file);
            newData.push(...data);
        }
        
        if (newData.length > 0) {
            showProgress('Applicazione mappature...', 60);
            
            // Applica mappature in chunked processing
            const enrichedData = await processDataInChunks(newData, async (chunk) => {
                return chunk.map(item => {
                    let enrichedItem = enrichDataWithAnagrafica(item);
                    enrichedItem = applyAllMappings(enrichedItem);
                    return enrichedItem;
                });
            });
            
            showProgress('Rimozione duplicati...', 80);
            
            // Deduplicazione ottimizzata
            const existingKeys = new Set(allData.map(item => 
                `${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.tipoGioco || 'standard'}`
            ));
            
            const uniqueNewData = enrichedData.filter(item => 
                !existingKeys.has(`${item.fileName}-${item.codiceConcessione}-${item.monthYear}-${item.tipoGioco || 'standard'}`)
            );
            
            showProgress('Finalizzazione...', 90);
            
            allData.push(...uniqueNewData);
            
            // Costruisci indici per accelerare i filtri
            buildDataIndices();
            
            saveDataToStorage();
            populateFilters();
            
            showProgress('Completato!', 100);
            showStatus(`Elaborati ${uniqueNewData.length} nuovi record da ${files.length} file (${newData.length - uniqueNewData.length} duplicati ignorati)`, 'success');
            
            document.getElementById('filtersSection').style.display = 'block';
            applyFiltersOptimized();
        } else {
            showProgress('Errore', 100);
            showStatus('Nessun dato trovato nei file', 'error');
        }
    } catch (error) {
        showProgress('Errore', 100);
        showStatus(`Errore nell'elaborazione: ${error.message}`, 'error');
    } finally {
        isProcessing = false;
    }
}

// 🚀 LETTURA FILE OTTIMIZZATA
async function readExcelFileOptimized(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { 
                    type: 'binary', 
                    cellDates: true,
                    // Ottimizzazioni XLSX
                    cellStyles: false, // Non caricare stili
                    cellFormulas: false, // Non caricare formule
                    sheetStubs: false // Non caricare celle vuote
                });
                
                // Se il file ha più fogli, cerca prima il foglio DB-MARKET SHARE-2022
                let sheetName = workbook.SheetNames[0];
                let worksheet = workbook.Sheets[sheetName];
                
                // Controllo speciale per il file DB CPT - cerca il foglio storico
                if (workbook.SheetNames.includes('DB-MARKET SHARE-2022')) {
                    console.log('Rilevato file DB CPT - usando foglio DB-MARKET SHARE-2022');
                    sheetName = 'DB-MARKET SHARE-2022';
                    worksheet = workbook.Sheets[sheetName];
                }
                
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 🚀 PARSING OTTIMIZZATO PER GRANDI FILE
                let parsedData;
                
                if (isHistoricalFormat(jsonData)) {
                    console.log(`Riconosciuto formato STORICO per file: ${file.name} (foglio: ${sheetName})`);
                    // Chunked processing per file storici grandi
                    parsedData = await parseHistoricalFormatExcelDataOptimized(jsonData, file.name);
                }
                else if (isHippoFormat(jsonData)) {
                    console.log(`Riconosciuto formato IPPICO per file: ${file.name}`);
                    parsedData = parseHippoFormatExcelData(jsonData, file.name);
                }
                else if (jsonData.length > 1 && jsonData[1][0] && 
                    jsonData[1][0].toString().includes('Periodo da') && 
                    !jsonData[1][0].toString().includes('Scommesse Ippica')) {
                    
                    console.log(`Riconosciuto nuovo formato per file: ${file.name}`);
                    parsedData = parseNewFormatExcelData(jsonData, file.name);
                } else {
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

// 🚀 PARSING STORICO OTTIMIZZATO con chunked processing
async function parseHistoricalFormatExcelDataOptimized(jsonData, fileName) {
    if (jsonData.length < 2) {
        throw new Error(`File ${fileName}: formato storico non valido (troppo poche righe)`);
    }

    const headers = jsonData[0];
    console.log('Headers formato storico:', headers);

    // Filtra le righe con dati validi
    const dataRows = jsonData.slice(1).filter(row => 
        row && row[0] && row[1] && row[2] && row[3]
    );
    
    console.log(`Formato storico: elaborando ${dataRows.length} righe di dati`);
    
    // 🚀 CHUNKED PROCESSING per file grandi
    const results = await processDataInChunks(dataRows, async (chunk) => {
        return chunk.map((row, index) => {
            // Estrazione e conversione dei campi (ottimizzata)
            const anno = row[0];
            
            // Conversione della data Excel ottimizzata
            let month = '01';
            try {
                const dateValue = row[1];
                if (dateValue instanceof Date) {
                    month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
                } else if (typeof dateValue === 'string') {
                    const dateObj = new Date(dateValue);
                    month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                } else if (typeof dateValue === 'number') {
                    const dateObj = new Date((dateValue - 25569) * 86400 * 1000);
                    month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                }
            } catch (error) {
                month = '01'; // Fallback
            }

            const year = anno.toString();
            const quarter = getQuarter(month);
            const quarterYear = `${quarter}/${year}`;
            
            // Mappatura campi ottimizzata
            const codiceConcessione = (row[2] || '').toString().trim();
            const ragioneSociale = (row[3] || '').toString().trim();
            const concessionario = (row[4] || '').toString().trim();
            const canale = (row[5] || 'fisico').toString().toLowerCase().trim();
            const gruppo = (row[6] || '').toString().trim();
            const comparto = (row[7] || 'Non classificato').toString().trim();
            const gioco = (row[8] || 'Gioco Sconosciuto').toString().trim();
            
            // Valori numerici ottimizzati
            const ggt = Number(row[9]) || 0;
            const payout = Number(row[10]) || 0;
            const spesa = Number(row[11]) || 0;
            
            // Conversione per compatibilità
            const importoRaccolta = ggt.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const importoSpesa = spesa.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            // Calcolo percentuali ottimizzato
            let percentualeRaccolta = '0%';
            let percentualeSpesa = '0%';
            
            if (ggt > 0) {
                const percSpesa = (spesa / ggt) * 100;
                percentualeSpesa = percSpesa.toFixed(2) + '%';
                
                const percPayout = (payout / ggt) * 100;
                percentualeRaccolta = percPayout.toFixed(2) + '%';
            }

            return {
                fileName: fileName,
                gameName: gioco,
                gameNameOriginal: gioco,
                gameNameComplete: gioco,
                month: month,
                year: year,
                monthYear: `${month}/${year}`,
                quarter: quarter,
                quarterYear: quarterYear,
                codiceConcessione: codiceConcessione,
                ragioneSociale: ragioneSociale,
                concessionarioNome: concessionario,
                importoRaccolta: importoRaccolta,
                percentualeRaccolta: percentualeRaccolta,
                importoSpesa: importoSpesa,
                percentualeSpesa: percentualeSpesa,
                monthName: monthNames[month] || month,
                quarterName: quarterNames[quarter] || quarter,
                isNegativeSpesa: spesa < 0,
                canale: canale,
                channelName: channelNames[canale] || canale,
                concessionarioProprietà: 'Non specificato',
                comparto: comparto,
                gruppo: gruppo,
                ggt: ggt,
                payout: payout,
                spesaNumerica: spesa,
                fileFormat: 'historicalFormat'
            };
        });
    }, 500); // Chunk più piccoli per file storici
    
    return results;
}

// ===== INIZIALIZZAZIONE E HELPER FUNCTIONS =====

document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    loadStoredAnagrafica();
    loadStoredNomiGiochi();
    loadStoredComparti();
    setupEventListeners();
});

function setupEventListeners() {
    // Event listeners per i grafici con debouncing
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
    
    // Debounced chart updates
    const debouncedChartUpdate = debounce(updateChartOptimized, 300);
    
    document.getElementById('chartType').addEventListener('change', debouncedChartUpdate);
    document.getElementById('chartMetric').addEventListener('change', debouncedChartUpdate);
    document.getElementById('chartGroupBy').addEventListener('change', debouncedChartUpdate);
    
    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.multi-select')) {
            document.querySelectorAll('.multi-select-dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
}

// ===== MANTIENI TUTTE LE ALTRE FUNZIONI ORIGINALI =====
// (Le funzioni di gestione anagrafica, mappature, storage, etc. rimangono invariate)

// Override delle funzioni principali per usare le versioni ottimizzate
const processFiles = processFilesOptimized;
const applyFilters = applyFiltersOptimized;
const updateDisplays = updateDisplaysOptimized;
const updateTable = updateTableWithVirtualScrolling;
const updateChart = updateChartOptimized;
const updateSummaryStats = updateSummaryStatsOptimized;

// === INCLUDI TUTTE LE ALTRE FUNZIONI DAL FILE ORIGINALE ===
// (Per brevità non le ripeto tutte qui, ma dovrebbero essere incluse)

// Funzioni helper ottimizzate
function parseItalianNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    
    let numStr = value.toString().trim().replace(/[^\d.,+-]/g, '');
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

function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `mt-4 text-sm ${type === 'error' ? 'text-red-300' : type === 'success' ? 'text-green-300' : type === 'warning' ? 'text-yellow-300' : 'text-blue-300'}`;
    }
}

// ===== INCLUDE ALL OTHER FUNCTIONS FROM ORIGINAL FILE =====
// (Tutte le altre funzioni di gestione anagrafica, storage, etc.)