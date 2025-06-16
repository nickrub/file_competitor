# Gaming Analytics Dashboard

## Descrizione
App web per l'analisi delle statistiche GAD (Quote spesa) per giochi. Permette di caricare file Excel mensili, applicare filtri e generare grafici e tabelle interattive.

## Funzionalità
- ✅ Caricamento multiplo file Excel (.xlsx, .xls)
- ✅ Parsing automatico nome gioco e periodo dalla prima riga
- ✅ Conversione automatica numeri (punto → virgola)
- ✅ Filtri per: giochi, anni, mesi, concessionari
- ✅ Grafici interattivi (barre, linee, torta, ciambella)
- ✅ Tabelle con ordinamento
- ✅ Download di grafici (PNG)
- ✅ Export dati (CSV, Excel)
- ✅ Statistiche riassuntive

## Formato File Supportato
Il file Excel deve avere questa struttura:
- Riga 1: Titolo con nome gioco (dopo "per") e periodo
- Riga 3: Periodo di riferimento (dal mese: MM/YYYY al mese: MM/YYYY)
- Riga 5: Headers delle colonne
- Righe 6+: Dati (CODICE, RAGIONE SOCIALE, IMPORTO RACCOLTA, %, IMPORTO SPESA, %)

## Utilizzo
1. Apri `index.html` nel browser
2. Carica uno o più file Excel usando il bottone "Carica File Excel"
3. Clicca "Elabora File"
4. Usa i filtri per selezionare i dati da visualizzare
5. Visualizza grafici e tabelle
6. Scarica i risultati nei formati desiderati

## Tecnologie
- HTML5, CSS3, JavaScript
- Chart.js per i grafici
- SheetJS (XLSX) per leggere Excel
- Lodash per manipolazione dati
- Tailwind CSS per lo styling

## Autore
Creato per l'analisi delle statistiche gaming
