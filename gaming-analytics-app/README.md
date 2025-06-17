# Gaming Analytics Dashboard

## 📊 Descrizione
App web professionale per l'analisi delle statistiche GAD (Quote spesa) per giochi. Supporta **4 formati Excel diversi** e permette di gestire centinaia di migliaia di record con analisi avanzate, filtri interattivi e visualizzazioni dinamiche.

## ✨ Funzionalità Principali

### 🔄 **Caricamento Dati Multi-Formato**
- ✅ **Formato Standard**: Statistiche GAD classiche
- ✅ **Formato Nuovo**: Con "Periodo da..." nella riga 2  
- ✅ **🆕 Formato Ippico**: Scommesse Ippica con tipi QF/TOTALIZZATORE/MULTIPLA
- ✅ **🆕 Formato Storico**: DB-MARKET SHARE con 99k+ record (2018-2025)
- ✅ Riconoscimento automatico del formato
- ✅ Caricamento multiplo file Excel (.xlsx, .xls)
- ✅ Parsing automatico nome gioco e periodo
- ✅ Conversione automatica numeri (punto → virgola)

### 🎛️ **Sistema di Filtri Avanzati**
- ✅ **Filtri Multi-Selezione**: Giochi, anni, mesi, trimestri, canali
- ✅ **🆕 Filtro Tipo Gioco Ippico**: Solo per dati ippici (QF, Totalizzatore, Multipla)
- ✅ **🆕 Filtro Gruppo**: Solo per dati storici (raggruppamento aziende)
- ✅ **🆕 Filtro Comparto**: Classificazione per settore di gioco
- ✅ Layout responsive su più righe con grid dinamica
- ✅ Filtri rapidi: Solo Fisico, Solo Online, Trimestre Corrente
- ✅ Riassunto filtri attivi con conteggi in tempo reale

### 📈 **Grafici e Analisi Interattive**
- ✅ Grafici: barre, linee, torta, ciambella
- ✅ **🆕 Raggruppamento per Gruppo**: Analisi per raggruppamenti aziendali
- ✅ **🆕 Raggruppamento per Comparto**: Analisi per settore di gioco  
- ✅ **🆕 Raggruppamento per Tipo Gioco Ippico**: Analisi scommesse ippiche
- ✅ Metriche: Importo Raccolta, Spesa, Percentuali
- ✅ Download grafici (PNG)
- ✅ Statistiche riassuntive con indicatori colorati

### 📋 **Tabelle con Ordinamento Avanzato**
- ✅ **🆕 Colonna Gruppo**: Visualizza raggruppamenti aziendali  
- ✅ **🆕 Evidenziazione Dati Storici**: Sfondo azzurro per record 2018-2025
- ✅ **🆕 Badge Tipo Gioco Ippico**: Colori distintivi per QF/Totalizzatore/Multipla
- ✅ Badge per canali, comparti e gruppi
- ✅ Ordinamento per tutte le colonne
- ✅ Scroll infinito per grandi dataset

### 💾 **Gestione Dati e Persistenza**
- ✅ **Salvataggio automatico** in localStorage
- ✅ **🆕 Gestione 99k+ record** con performance ottimizzate
- ✅ Prevenzione duplicati intelligente
- ✅ Versioning dati per compatibilità
- ✅ Indicatori di stato in tempo reale

### 🎯 **Sistema di Mappature**
- ✅ **🆕 Mappatura Nomi Giochi**: Personalizza nomi visualizzati
- ✅ **🆕 Mappatura Comparti**: Classifica giochi per settore
- ✅ Caricamento mappature da file Excel
- ✅ Applicazione automatica a dati esistenti

### 📖 **Anagrafica Concessioni Avanzata**
- ✅ Caricamento da file Excel (foglio "ANAGRAFICA CONCESSIONI")
- ✅ Editing inline con salvataggio automatico
- ✅ Arricchimento automatico dei dati
- ✅ Export/Import completo
- ✅ Gestione canali (Fisico/Online) e proprietà

### 📤 **Export Multi-Formato**
- ✅ Export dati filtrati (CSV, Excel)
- ✅ Download grafici (PNG)
- ✅ **🆕 Include tutte le nuove colonne**: Gruppo, Comparto, Tipo Gioco
- ✅ Formattazione italiana preservata

### 🖥️ **Interfaccia Utente Moderna**
- ✅ **🆕 Sistema di navigazione a tab**: Gestione, Filtri, Grafici, Tabelle
- ✅ Design responsive per mobile e desktop
- ✅ Glass-morphism e animazioni fluide
- ✅ Indicatori di sezione attiva
- ✅ Dark mode integrato

## 📁 Struttura File Supportati

### **1. Formato Standard GAD**
```
Riga 1: "Statistiche mensili per [NOME_GIOCO]"
Riga 3: "Periodo di riferimento dal mese: MM/YYYY al mese: MM/YYYY"
Riga 5: Headers (CODICE, RAGIONE SOCIALE, etc.)
Riga 6+: Dati
```

### **2. Formato Nuovo**
```
Riga 1: "[NOME_GIOCO] - Descrizione"
Riga 2: "Periodo da [MESE] [ANNO]"
Riga 4: Headers
Riga 5+: Dati
```

### **3. 🆕 Formato Ippico**
```
Riga 1: "Scommesse Ippica d'agenzia"
Riga 2: "[MESE] [ANNO]"
Riga 4: Headers (inclusa colonna TIPO)
Riga 5+: Dati con QF/TOTALIZZATORE/MULTIPLA
```

### **4. 🆕 Formato Storico (DB-MARKET SHARE)**
```
Foglio: "DB-MARKET SHARE-2022"
Riga 1: ANNO | MESE | N.CONC. | RAGIONE SOCIALE | CONCESSIONARIO | CANALE | GRUPPO | COMPARTO | GIOCO | GGT (VA) | PAYOUT (VA) | SPESA (VA)
Riga 2+: Dati (99.000+ record dal 2018-2025)
```

## 🚀 Utilizzo

### **Step 1: Caricamento File**
1. Vai nella sezione **"⚙️ Gestione"**
2. Seleziona uno o più file Excel
3. Clicca **"Elabora File"**
4. L'app riconoscerà automaticamente il formato

### **Step 2: Configurazione (Opzionale)**
1. **Carica Anagrafica**: File con concessioni e canali
2. **Carica Mappature Nomi**: Personalizza nomi giochi
3. **Carica Mappature Comparti**: Classifica per settore

### **Step 3: Analisi**
1. Vai su **"🎛️ Filtri"** per selezionare i dati
2. Usa **"📊 Grafici e Statistiche"** per visualizzazioni
3. Consulta **"📋 Tabelle"** per dettagli completi

### **Step 4: Export**
1. Scarica grafici in PNG
2. Esporta dati filtrati in CSV/Excel
3. Tutti i formati includono le nuove colonne

## 🔧 Tecnologie

### **Frontend**
- **HTML5** con struttura semantica
- **CSS3** con Tailwind CSS
- **JavaScript ES6+** moderno

### **Librerie**
- **Chart.js 3.9.1**: Grafici interattivi
- **SheetJS (XLSX) 0.18.5**: Lettura file Excel
- **Lodash 4.17.21**: Manipolazione dati
- **Tailwind CSS 2.2.19**: Styling moderno

### **Gestione Dati**
- **localStorage**: Persistenza client-side
- **Parsing intelligente**: Riconoscimento automatico formati
- **Deduplicazione**: Prevenzione record duplicati

## 📊 Capacità e Performance

### **Volumi Supportati**
- ✅ **99.000+ record** (testato con DB storico 2018-2025)
- ✅ **File multipli** simultanei
- ✅ **4 formati Excel** diversi
- ✅ **Filtri real-time** anche su grandi dataset

### **Ottimizzazioni**
- ✅ **Lazy loading** per tabelle grandi
- ✅ **Caching intelligente** dei filtri
- ✅ **Compressione dati** in localStorage
- ✅ **Rendering ottimizzato** per grafici

## 🆕 Novità Versione 2.5

### **Formato Storico DB-MARKET SHARE**
- ✅ **Support 99k+ record** dal 2018 al 2025
- ✅ **Riconoscimento automatico** foglio DB-MARKET SHARE-2022
- ✅ **Parsing ottimizzato** per grandi volumi
- ✅ **Conversione date Excel** automatica

### **Sistema Gruppi**
- ✅ **Filtro Gruppo** per raggruppamenti aziendali
- ✅ **Visualizzazione badge** nelle tabelle
- ✅ **Analisi per Gruppo** nei grafici
- ✅ **Export colonna Gruppo** in tutti i formati

### **Miglioramenti UX**
- ✅ **Navigazione a tab** per organizzazione migliore
- ✅ **Evidenziazione dati storici** (sfondo azzurro)
- ✅ **Performance migliorata** per dataset grandi
- ✅ **Indicatori di stato** più dettagliati

## 🔮 Roadmap Future

### **Versione 3.0 (Prevista)**
- [ ] **API REST**: Backend per gestione centralizzata
- [ ] **Database SQL**: Archiviazione permanente
- [ ] **Multi-utente**: Collaborazione in tempo reale
- [ ] **Dashboard avanzate**: KPI e metriche personalizzate

### **Miglioramenti Incrementali**
- [ ] **Import CSV**: Supporto file CSV nativi
- [ ] **Schedulazione export**: Export automatici programmati  
- [ ] **Notifiche**: Alert per anomalie nei dati
- [ ] **Backup cloud**: Sincronizzazione automatica

## 🛠️ Installazione e Deployment

### **Installazione Locale**
```bash
# Clona o scarica i file
# Nessuna dipendenza server richiesta
# Apri index.html nel browser
```

### **Deployment Web**
```bash
# Carica tutti i file su un web server
# Compatibile con: Apache, Nginx, GitHub Pages, Netlify, Vercel
# Nessuna configurazione server richiesta
```

### **Requisiti Browser**
- ✅ **Chrome 80+** (Raccomandato)
- ✅ **Firefox 75+**
- ✅ **Safari 13+**
- ✅ **Edge 80+**

## ⚠️ Note Tecniche

### **Limiti localStorage**
- **5-10MB** limite browser (sufficiente per ~100k record)
- **Persistenza locale**: Dati salvati solo sul dispositivo corrente
- **Compatibilità**: Modern browsers supportati

### **Performance**
- **Rendering**: Optimizzato per dataset 100k+ record
- **Memoria**: ~1MB RAM per 10k record
- **Filtri**: Risposta real-time fino a 50k record filtrati

### **Sicurezza**
- **Client-side**: Nessun dato inviato a server esterni
- **Privacy**: Tutti i dati rimangono sul dispositivo
- **GDPR compliant**: Nessun tracking o analytics

## 👨‍💻 Autore e Supporto

**Creato per l'analisi professionale delle statistiche gaming italiane**

### **Caratteristiche Tecniche**
- ✅ **Zero dipendenze server**
- ✅ **Compatibilità totale** con formati GAD esistenti
- ✅ **Prestazioni ottimizzate** per grandi dataset
- ✅ **Interfaccia moderna** e user-friendly

### **Supporto Formati**
- ✅ **Excel 2007+** (.xlsx)
- ✅ **Excel 97-2003** (.xls)  
- ✅ **Fogli multipli** con riconoscimento automatico
- ✅ **Date Excel** con conversione automatica

---

## 📈 Esempio di Utilizzo

```javascript
// L'app gestisce automaticamente:
// 1. Riconoscimento formato file
// 2. Parsing e validazione dati  
// 3. Applicazione mappature
// 4. Arricchimento con anagrafica
// 5. Salvataggio e persistenza
// 6. Filtri e visualizzazioni

// Nessun codice richiesto dall'utente!
```

**🚀 Ready for Professional Gaming Analytics!**