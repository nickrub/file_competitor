// Variabili globali
let allData = [];
let filteredData = [];
let currentChart = null;
let sortColumn = null;
let sortDirection = 'asc';

// Mappa per conversione mesi
const monthNames = {
    '01': 'Gennaio', '02': 'Febbraio', '03': 'Marzo', '04': 'Aprile',
    '05': 'Maggio', '06': 'Giugno', '07': 'Luglio', '08': 'Agosto',
    '09': 'Settembre', '10': 'Ottobre', '11': 'Novembre', '12': 'Dicembre'
};

// Funzione per processare i file Excel caricati
async function processFiles() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showStatus('Seleziona almeno un file Excel', 'error');
        return;
    }

    showStatus('Elaborazione file in corso...', 'info');
    allData = [];

    try {
        for (let file of files) {
            const data = await readExcelFile(file);
            allData.push(...data);
        }
        
        if (allData.length > 0) {
            populateFilters();
            showStatus(`Elaborati ${allData.length} record da ${files.length} file`, 'success');
            document.getElementById('filtersSection').style.display = 'block';
            applyFilters();
        } else {
            showStatus('Nessun dato trovato nei file', 'error');
        }
    } catch (error) {
        showStatus(`Errore nell'elaborazione: ${error.message}`, 'error');
    }
}

// Funzione per leggere un file Excel
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const parsedData = parseExcelData(jsonData, file.name);
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

// Funzione per parsare i dati Excel secondo il formato GAD
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
    
    return dataRows.map(row => ({
        fileName: fileName,
        gameName: gameName,
        month: month,
        year: year,
        monthYear: `${month}/${year}`,
        codiceConcessione: row[0]?.toString().trim() || '',
        ragioneSociale: row[1]?.toString().trim() || '',
        importoRaccolta: convertToItalianNumber(row[2]),
        percentualeRaccolta: row[3]?.toString() || '',
        importoSpesa: convertToItalianNumber(row[4]),
        percentualeSpesa: row[5]?.toString() || '',
        quarter: getQuarter(month),
        monthName: monthNames[month] || month
    }));
}

// Funzione per convertire numeri da formato inglese a italiano
function convertToItalianNumber(value) {
    if (value === null || value === undefined || value === '') return '0,00';
    
    let numStr = value.toString();
    
    // Se è già un numero, convertilo
    if (typeof value === 'number') {
        return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    // Se è una stringa, converti il punto in virgola
    return numStr.replace('.', ',');
}

// Funzione per determinare il trimestre
function getQuarter(month) {
    const monthNum = parseInt(month);
    if (monthNum >= 1 && monthNum <= 3) return 'Q1';
    if (monthNum >= 4 && monthNum <= 6) return 'Q2';
    if (monthNum >= 7 && monthNum <= 9) return 'Q3';
    return 'Q4';
}

// Funzione per popolare i filtri
function populateFilters() {
    const games = [...new Set(allData.map(item => item.gameName))].sort();
    const years = [...new Set(allData.map(item => item.year))].sort();
    const months = [...new Set(allData.map(item => item.monthYear))].sort();
    const concessionari = [...new Set(allData.map(item => item.ragioneSociale))].sort();

    populateSelect('gameFilter', games);
    populateSelect('yearFilter', years);
    populateSelect('monthFilter', months);
    populateSelect('concessionaryFilter', concessionari);
}

// Funzione helper per popolare select multipli
function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        optionElement.selected = true; // Seleziona tutto per default
        select.appendChild(optionElement);
    });
}

// Funzione per applicare i filtri
function applyFilters() {
    const gameFilter = Array.from(document.getElementById('gameFilter').selectedOptions).map(o => o.value);
    const yearFilter = Array.from(document.getElementById('yearFilter').selectedOptions).map(o => o.value);
    const monthFilter = Array.from(document.getElementById('monthFilter').selectedOptions).map(o => o.value);
    const concessionaryFilter = Array.from(document.getElementById('concessionaryFilter').selectedOptions).map(o => o.value);

    filteredData = allData.filter(item => {
        return gameFilter.includes(item.gameName) &&
               yearFilter.includes(item.year) &&
               monthFilter.includes(item.monthYear) &&
               concessionaryFilter.includes(item.ragioneSociale);
    });

    updateDisplays();
    showStatus(`Filtrati ${filteredData.length} record`, 'info');
}

// Funzione per resettare i filtri
function resetFilters() {
    document.querySelectorAll('#filtersSection select').forEach(select => {
        Array.from(select.options).forEach(option => option.selected = true);
    });
    applyFilters();
}

// Funzione per aggiornare tutte le visualizzazioni
function updateDisplays() {
    updateChart();
    updateTable();
    updateSummaryStats();
    
    document.getElementById('analyticsSection').style.display = 'grid';
    document.getElementById('tableSection').style.display = 'block';
}

// Funzione per aggiornare il grafico
function updateChart() {
    const chartType = document.getElementById('chartType').value;
    const metric = document.getElementById('chartMetric').value;
    
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    const chartData = prepareChartData(metric);

    const config = {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: getMetricTitle(metric)
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

// Funzione per preparare i dati per il grafico
function prepareChartData(metric) {
    // Raggruppa per concessionario e somma i valori
    const grouped = _.groupBy(filteredData, 'ragioneSociale');
    const labels = [];
    const data = [];
    
    Object.keys(grouped).forEach(concessionary => {
        labels.push(concessionary);
        const sum = grouped[concessionary].reduce((acc, item) => {
            const value = parseFloat(item[metric].toString().replace(',', '.')) || 0;
            return acc + value;
        }, 0);
        data.push(sum);
    });

    // Prendi solo i top 10 per leggibilità
    const combined = labels.map((label, index) => ({ label, value: data[index] }));
    combined.sort((a, b) => b.value - a.value);
    const top10 = combined.slice(0, 10);

    return {
        labels: top10.map(item => item.label),
        datasets: [{
            label: getMetricTitle(metric),
            data: top10.map(item => item.value),
            backgroundColor: generateColors(top10.length),
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };
}

// Funzione per generare colori per il grafico
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
        'rgba(99, 255, 132, 0.8)'
    ];
    
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}

// Funzione per ottenere il titolo della metrica
function getMetricTitle(metric) {
    const titles = {
        importoRaccolta: 'Importo Raccolta',
        importoSpesa: 'Importo Spesa',
        percentualeRaccolta: 'Percentuale Raccolta',
        percentualeSpesa: 'Percentuale Spesa'
    };
    return titles[metric] || metric;
}

// Funzione per aggiornare la tabella
function updateTable() {
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    
    // Headers
    const headers = ['Gioco', 'Mese/Anno', 'Codice', 'Ragione Sociale', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
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
    
    // Body
    const sortedData = getSortedData();
    tableBody.innerHTML = sortedData.map(row => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.gameName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.monthYear}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.codiceConcessione}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.ragioneSociale}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.importoRaccolta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.percentualeRaccolta}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.importoSpesa}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${row.percentualeSpesa}</td>
        </tr>
    `).join('');
}

// Funzione per ordinare la tabella
function sortTable(columnIndex) {
    const columns = ['gameName', 'monthYear', 'codiceConcessione', 'ragioneSociale', 'importoRaccolta', 'percentualeRaccolta', 'importoSpesa', 'percentualeSpesa'];
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

// Funzione per ottenere i dati ordinati
function getSortedData() {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
        let valueA = a[sortColumn];
        let valueB = b[sortColumn];
        
        // Converti valori numerici
        if (sortColumn.includes('importo')) {
            valueA = parseFloat(valueA.toString().replace(',', '.')) || 0;
            valueB = parseFloat(valueB.toString().replace(',', '.')) || 0;
        }
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

// Funzione per aggiornare le frecce di ordinamento
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

// Funzione per aggiornare le statistiche riassuntive
function updateSummaryStats() {
    const stats = calculateStats();
    const summaryDiv = document.getElementById('summaryStats');
    
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
            <p class="text-2xl font-bold text-white">${stats.totalSpesa}</p>
        </div>
        <div class="bg-yellow-500 bg-opacity-20 rounded-lg p-4">
            <h4 class="text-sm font-medium text-yellow-200">Concessionari Unici</h4>
            <p class="text-2xl font-bold text-white">${stats.uniqueConcessionari}</p>
        </div>
    `;
}

// Funzione per calcolare le statistiche
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
    
    return {
        totalRecords,
        uniqueConcessionari,
        totalRaccolta: totalRaccolta.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
        totalSpesa: totalSpesa.toLocaleString('it-IT', { minimumFractionDigits: 2 })
    };
}

// Funzione per scaricare il grafico
function downloadChart() {
    if (!currentChart) return;
    
    const link = document.createElement('a');
    link.download = 'grafico-gaming-analytics.png';
    link.href = currentChart.toBase64Image();
    link.click();
}

// Funzione per scaricare la tabella
function downloadTable(format) {
    if (format === 'csv') {
        downloadCSV();
    } else if (format === 'excel') {
        downloadExcel();
    }
}

// Funzione per scaricare CSV
function downloadCSV() {
    const headers = ['Gioco', 'Mese/Anno', 'Codice', 'Ragione Sociale', 'Importo Raccolta', 'Perc. Raccolta', 'Importo Spesa', 'Perc. Spesa'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => [
            `"${row.gameName}"`,
            `"${row.monthYear}"`,
            `"${row.codiceConcessione}"`,
            `"${row.ragioneSociale}"`,
            `"${row.importoRaccolta}"`,
            `"${row.percentualeRaccolta}"`,
            `"${row.importoSpesa}"`,
            `"${row.percentualeSpesa}"`
        ].join(','))
    ].join('\n');
    
    downloadFile(csvContent, 'gaming-analytics-data.csv', 'text/csv');
}

// Funzione per scaricare Excel
function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(filteredData.map(row => ({
        'Gioco': row.gameName,
        'Mese/Anno': row.monthYear,
        'Codice': row.codiceConcessione,
        'Ragione Sociale': row.ragioneSociale,
        'Importo Raccolta': row.importoRaccolta,
        'Perc. Raccolta': row.percentualeRaccolta,
        'Importo Spesa': row.importoSpesa,
        'Perc. Spesa': row.percentualeSpesa
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gaming Analytics');
    XLSX.writeFile(workbook, 'gaming-analytics-data.xlsx');
}

// Funzione helper per scaricare file
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Funzione per mostrare stati
function showStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.textContent = message;
    statusDiv.className = `mt-4 text-sm ${type === 'error' ? 'text-red-300' : type === 'success' ? 'text-green-300' : 'text-blue-300'}`;
}

// Event listeners
document.getElementById('chartType').addEventListener('change', updateChart);
document.getElementById('chartMetric').addEventListener('change', updateChart);

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    showStatus('Carica i tuoi file Excel per iniziare l\'analisi', 'info');
});
