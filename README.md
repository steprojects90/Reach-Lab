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

### Modello di Frequenza Adattivo

Reach Lab implementa un modello di frequenza adattivo che calibra la frequenza in base alla dimensione del target e alla densità delle impressioni. Questo modello simula più realisticamente la distribuzione delle impressioni nelle campagne reali.

#### Come funziona il modello adattivo:

1. **Calcolo della densità delle impressioni**:
   ```
   densità = impressioni_totali / dimensione_target
   ```

2. **Applicazione di fattori di adattamento basati sulla dimensione del target**:
   - Target piccolo (<10.000.000 persone): fattori più alti
   - Target medio (10.000.000-25.000.000 persone): fattori intermedi
   - Target grande (>25.000.000 persone): fattori più bassi

3. **Calcolo del fattore di frequenza**:
   ```
   fattore = minFactor + (maxFactor - minFactor) * (1 - exp(-densità / midDensity))
   ```

4. **Applicazione del fattore alla frequenza standard**:
   ```
   frequenza_adattata = frequenza_standard * fattore
   ```

5. **Ricalcolo della reach in base alla frequenza adattata**:
   ```
   reach_adattata = GRP / frequenza_adattata
   ```

#### Parametri di adattamento per dimensione del target:

| Dimensione Target | minFactor | maxFactor | midDensity | Categoria |
|-------------------|-----------|-----------|------------|-----------|
| <10.000.000       | 2.6       | 5.0       | 1.5        | Piccolo   |
| 10-25.000.000     | 2.5       | 5.0       | 3.0        | Medio     |
| >25.000.000       | 2.2       | 4.0       | 4.0        | Grande    |

Questi parametri sono stati calibrati empiricamente per produrre frequenze realistiche per diversi scenari di campagna.

### Parametri Avanzati

#### Potenziale del Canale
Il parametro "Potenziale del Canale" (impostato all'80% di default) rappresenta la massima percentuale del target che può essere raggiunta dal canale, anche con un numero infinito di GRP. È una caratteristica intrinseca del canale e della sua capacità di raggiungere il target.

#### Reach su Users
La "Reach (% on Users)" applica un fattore moltiplicatore di 1,40 alla Reach su device per riflettere la natura "one-to-many" dell'Advanced TV, considerando che davanti a un singolo schermo possono esserci più spettatori.

## Funzionalità

- **Calcolo delle Impressioni**: Basato sul budget e sul CPM.
- **Calcolo dei GRP**: Basato sulle impressioni e sulla dimensione del target.
- **Stima della Reach**: Utilizzando la formula fondamentale della reach.
- **Modello di Frequenza Adattivo**: Permette di simulare una distribuzione della frequenza più realistica.
- **Frequenza Media**: Calcolata come GRP / reach, e opzionalmente adattata.
- **Costo per Reach Point**: Quanto costa raggiungere ogni punto percentuale di reach.
- **Costo per GRP**: Costo di ogni punto GRP.
- **Visualizzazione della Curva di Reach**: Rappresentazione grafica della relazione tra GRP e reach.

## Come Usare il Modello di Frequenza Adattivo

1. **Attivare/Disattivare il Modello**: Utilizzare lo switch "Usa modello di frequenza adattivo" per passare tra il calcolo standard e quello adattivo.

2. **Effetti del Modello Adattivo**:
   - Quando attivato, il modello adatta la frequenza in base alla dimensione del target e alla densità delle impressioni
   - Tutti i valori correlati (Reach, Costo per Reach Point, ecc.) vengono ricalcolati di conseguenza
   - Appare un'icona informativa (ℹ️) accanto alla frequenza, indicando che è stata adattata

3. **Quando Usarlo**:
   - Per simulazioni più realistiche delle campagne
   - Per pianificazioni che richiedono frequenze specifiche
   - Per confrontare diversi scenari di allocazione del budget

## Limitazioni

- Il modello assume una distribuzione uniforme delle impressioni all'interno di ciascuna categoria di target.
- Non tiene conto di fattori quali la qualità del posizionamento, il formato pubblicitario o l'affinità del contenuto.
- La stima della reach su users è basata su un fattore moltiplicativo e potrebbe variare in base al contenuto e all'orario di trasmissione.
- I parametri di adattamento della frequenza sono calibrazioni empiriche e potrebbero richiedere aggiustamenti per casi d'uso specifici.

## Riferimenti Teorici

### Struttura delle Curve di Reach
Il modello matematico alla base di Reach Lab è derivato da una rigorosa analisi delle curve di reach media. Le formule utilizzate si basano su principi fondamentali dell'economia dell'attenzione e della distribuzione della frequenza.

Per approfondimenti sulla teoria delle curve di reach e la loro applicazione, consultare:
- L'articolo "Anatomy of Reach Curves" (Parti 1, 2 e 3)
- Il modello documentato nel file "Anatomy of Reach Curves - Model.docx"

### Ottimizzazione della Frequenza
Il modello adattivo implementa concetti di frequency capping e distribuzione non uniforme delle impressioni. Questo approccio è ispirato a:
- Modelli di distribuzione di Poisson utilizzati nelle analisi di reach
- Pattern empirici osservati nelle campagne Advanced TV
- Differenze di comportamento di visualizzazione tra target di diverse dimensioni