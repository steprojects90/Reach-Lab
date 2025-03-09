# Reach Lab - Advanced TV

## Descrizione
Reach Lab è uno strumento di calcolo avanzato per la pianificazione e l'analisi delle campagne pubblicitarie su Advanced TV. Permette di stimare la reach, la frequenza e altri parametri chiave in base al budget, al target e ad altri fattori.

## Modello di Calcolo

### Formule Principali
Il calcolatore utilizza le formule standard dell'anatomia delle curve di reach:

1. **Formula fondamentale della reach**:
   ```
   r = (pg)/(g+p)
   ```
   dove:
   - r è la reach (percentuale del target raggiunto)
   - p è il potenziale del canale (percentuale massima del target raggiungibile)
   - g sono i GRP (Gross Rating Points)

2. **Reach a frequenza f o superiore**:
   ```
   r_f = p * (g/(g+p))^f
   ```
   dove:
   - r_f è la reach a frequenza f o superiore
   - p è il potenziale del canale
   - g sono i GRP
   - f è la frequenza minima desiderata

3. **Frequenza media**:
   ```
   f = g/r
   ```
   dove:
   - f è la frequenza media
   - g sono i GRP
   - r è la reach

### Parametri Avanzati

#### Potenziale del Canale
Il parametro "Potenziale del Canale" (impostato all'80% di default) rappresenta la massima percentuale del target che può essere raggiunta dal canale, anche con un numero infinito di GRP. È una caratteristica intrinseca del canale e della sua capacità di raggiungere il target.

#### Reach su Users
La "Reach (% on Users)" applica un fattore moltiplicatore di 1,40 alla Reach su device per riflettere la natura "one-to-many" dell'Advanced TV, considerando che davanti a un singolo schermo possono esserci più spettatori.

## Funzionalità

- **Calcolo delle Impressioni**: Basato sul budget e sul CPM.
- **Calcolo dei GRP**: Basato sulle impressioni e sulla dimensione del target.
- **Stima della Reach**: Utilizzando la formula fondamentale della reach.
- **Frequenza Media**: Calcolata come GRP / reach.
- **Costo per Reach Point**: Quanto costa raggiungere ogni punto percentuale di reach.
- **Visualizzazione della Curva di Reach**: Rappresentazione grafica della relazione tra GRP e reach.

## Limitazioni

- Il modello assume una distribuzione uniforme delle impressioni.
- Non tiene conto di fattori quali la qualità del posizionamento, il formato pubblicitario o l'affinità del contenuto.
- La stima della reach su users è basata su un fattore moltiplicativo e potrebbe variare in base al contenuto e all'orario di trasmissione.

## Riferimenti Teorici

### Struttura delle Curve di Reach
Il modello matematico alla base di Reach Lab è derivato da una rigorosa analisi delle curve di reach media. Le formule utilizzate si basano su principi fondamentali dell'economia dell'attenzione e della distribuzione della frequenza.

Per approfondimenti sulla teoria delle curve di reach e la loro applicazione, consultare:
- L'articolo "Anatomy of Reach Curves" (Parti 1, 2 e 3)
- Il modello documentato nel file "Anatomy of Reach Curves - Model.docx"

### Ottimizzazione della Frequenza
Per campagne con obiettivi specifici di frequenza, è possibile utilizzare la formula della reach a frequenza f o superiore per determinare il livello ottimale di GRP necessari.