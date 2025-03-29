import React, { useState, useEffect, useRef } from 'react';
import './ReachLab.css';

// Utilità per la formattazione dei numeri
const formatNumber = (num) => {
  return new Intl.NumberFormat('it-IT').format(Math.floor(num));
};

const formatPercentage = (num) => {
  return num.toFixed(2) + '%';
};

// Componente Card di base
const Card = ({ children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

// Componente principale
const ReachLab = () => {
  // Stati per gli input
  const [targetSize, setTargetSize] = useState('1.000.000');
  const [budget, setBudget] = useState('50.000');
  const [cpm, setCpm] = useState('25');
  const [campaignDays, setCampaignDays] = useState(30); // Durata della campagna in giorni
  
  // Stati nascosti (non mostrati nell'UI ma usati nei calcoli)
  const [channelPotential] = useState(80);
  
  // Stati per i risultati
  const [results, setResults] = useState({
    impressions: '-',
    grp: '-',
    uniqueDevices: '-',
    netContacts: '-',
    reachPercentage: '-',
    reachUsersPercentage: '-',
    frequency: '-',
    cpg: '-',
    costPerReachPointDevices: '-',
    costPerReachPointUsers: '-'
  });
  
  // Riferimento per il canvas
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Effetto per ridimensionare il canvas quando la finestra viene ridimensionata
  useEffect(() => {
    const handleResize = () => {
      if (results.impressions !== '-') {
        const p = channelPotential;
        const g = parseFloat(results.grp);
        const standardReach = (p * g) / (g + p);
        const userReach = parseFloat(results.reachUsersPercentage);
        if (!isNaN(g) && !isNaN(standardReach) && !isNaN(userReach)) {
          drawReachCurve(p, g, standardReach, userReach);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [results, channelPotential]);
  
  // Funzione per gestire l'input formattato con separatori delle migliaia
  const handleFormattedInput = (value, setter) => {
    // Rimuovi tutti i caratteri non numerici
    const numericValue = value.replace(/\D/g, '');
    
    // Verifica che ci sia un valore
    if (numericValue) {
      // Formatta il numero con i separatori delle migliaia
      const formattedValue = parseInt(numericValue, 10).toLocaleString('it-IT');
      setter(formattedValue);
    } else {
      setter('');
    }
  };
  
  // Funzione per validare input numerici semplici
  const handleNumericInput = (value, setter) => {
    const numericValue = value.replace(/[^\d,\.]/g, '');
    setter(numericValue);
  };
  
  // Funzione principale per il calcolo
  const calculateResults = () => {
    try {
      // Parametri per il calcolo del fattore di durata
      const DURATION_MAX_FACTOR = 1.2;  // Fattore massimo (campagne brevi)
      const DURATION_MIN_FACTOR = 0.8;  // Fattore minimo (campagne lunghe)
      const DURATION_REFERENCE = 30;    // Durata di riferimento in giorni
      const DURATION_SCALE = 150;       // Divisore per il cambiamento del fattore
      
      // Ottieni i valori di input
      const targetSizeClean = targetSize.replace(/\./g, '');
      const targetSizeValue = parseInt(targetSizeClean, 10) || 1000000;
      
      const budgetClean = budget.replace(/\./g, '');
      const budgetValue = parseInt(budgetClean, 10) || 50000;
      
      const cpmClean = cpm.replace(',', '.');
      const cpmValue = parseFloat(cpmClean) || 25;
      
      // Calcolo delle impressioni totali
      const totalImpressions = Math.floor(budgetValue / (cpmValue / 1000));
      
      // Calcolo dei GRP
      const calculatedGrps = (totalImpressions / targetSizeValue) * 100;
      
      // Parametri per il calcolo della reach
      const p = channelPotential;
      const g = calculatedGrps;
      
      // Calcolo standard come punto di partenza
      // Formula della reach 1+ (percentuale del target) - Reach su devices
      const standardReach1Plus = (p * g) / (g + p);
      
      // Calcolo della frequenza media standard (GRP / reach)
      const standardFrequency = g / standardReach1Plus;
      
      // Calcolo adattivo della frequenza basato sulla densità delle impressioni
      const impressionDensity = targetSizeValue > 0 ? totalImpressions / targetSizeValue : 0;
      
      // Determina midDensity in base alla dimensione del target
      let midDensity;
      if (targetSizeValue < 10000000) {
        // Target piccolo
        midDensity = 0.01;
      } else if (targetSizeValue < 25000000) {
        // Target medio
        midDensity = 0.0064;
      } else {
        // Target grande
        midDensity = 0.0090;
      }
      
      // Calcola il fattore di durata della campagna
      // Campagne più lunghe tendono ad avere una distribuzione delle impressioni più diluita
      const durationFactor = Math.min(DURATION_MAX_FACTOR, 
                                      Math.max(DURATION_MIN_FACTOR, 
                                              1 - (campaignDays - DURATION_REFERENCE) / DURATION_SCALE));
      
      // Nuovo calcolo della frequenza usando solo la densità delle impressioni e la durata
      const frequencyAdjustmentFactor = 1 + Math.log10(1 + impressionDensity / midDensity);
      
      // Applica i fattori di aggiustamento alla frequenza standard
      const finalFrequency = standardFrequency * frequencyAdjustmentFactor * durationFactor;
      
      // Ricalcola la reach in base alla frequenza adattata
      // Se f = g/r, allora r = g/f
      const finalReach1Plus = g / finalFrequency;
      
      // Reach su users con fattore moltiplicatore 1.40 (considerando il pubblico one-to-many)
      const finalReachOnUsers = Math.min(finalReach1Plus * 1.40, 100); // Massimo 100%
      
      // Unique Devices (ex Reach Stimata)
      const uniqueDevices = Math.floor((finalReach1Plus / 100) * targetSizeValue);
      
      // Contatti netti (nuova metrica: 1.4 * uniqueDevices)
      const netContacts = Math.floor(uniqueDevices * 1.4);
      
      // Costo per GRP
      const costPerGrp = budgetValue / calculatedGrps;
      
      // Costo per reach point/devices
      const costPerReachPointDevices = budgetValue / finalReach1Plus;
      
      // Costo per reach point/users
      const costPerReachPointUsers = budgetValue / finalReachOnUsers;
      
      // Aggiorna lo stato dei risultati
      setResults({
        impressions: formatNumber(totalImpressions),
        grp: formatPercentage(calculatedGrps),
        uniqueDevices: formatNumber(uniqueDevices),
        netContacts: formatNumber(netContacts),
        reachPercentage: formatPercentage(finalReach1Plus),
        reachUsersPercentage: formatPercentage(finalReachOnUsers),
        frequency: finalFrequency.toFixed(2),
        cpg: `€${formatNumber(costPerGrp)}`,
        costPerReachPointDevices: `€${formatNumber(costPerReachPointDevices)}`,
        costPerReachPointUsers: `€${formatNumber(costPerReachPointUsers)}`
      });
      
      // Disegna la curva di reach
      setTimeout(() => {
        drawReachCurve(p, g, standardReach1Plus, finalReachOnUsers);
      }, 50);
    } catch (error) {
      console.error('Errore durante il calcolo:', error);
      alert('Si è verificato un errore durante il calcolo. Controlla i valori inseriti.');
    }
  };
  
  // Funzione per disegnare la curva di reach
  const drawReachCurve = (p, g, standardReach, userReach) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    
    // Imposta dimensioni canvas in base alle dimensioni del contenitore
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Adatta il canvas per schermi ad alta densità
    const dpr = window.devicePixelRatio || 1;
    canvas.width *= dpr;
    canvas.height *= dpr;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    ctx.scale(dpr, dpr);
    
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    
    // Cancella il canvas
    ctx.clearRect(0, 0, width, height);
    
    // Definisci i margini
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    // Calcola il massimo GRP da visualizzare (1.5 volte il GRP attuale o almeno 1000)
    const maxGrp = Math.max(1000, g * 1.5);
    
    // Calcola il fattore di scala per l'asse Y in modo che alla posizione attuale mostri il valore di userReach
    const yScaleFactor = userReach / standardReach;
    
    // Funzione di scala per X (GRP)
    function scaleX(value) {
      return margin.left + (value / maxGrp) * chartWidth;
    }
    
    // Funzione di scala per Y (Reach %)
    // Modifica: scala l'asse Y in modo che alla posizione attuale mostri il valore di userReach
    function scaleY(value) {
      // Scala il valore in base al rapporto tra userReach e standardReach
      const scaledValue = value * yScaleFactor;
      return margin.top + chartHeight - (scaledValue / 100) * chartHeight;
    }
    
    // Disegna gli assi
    ctx.beginPath();
    ctx.strokeStyle = '#d1d5db';
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();
    
    // Disegna le etichette degli assi
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRP', margin.left + chartWidth / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, margin.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Reach %', 0, 0);
    ctx.restore();
    
    // Disegna le linee della griglia e i tick
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb';
    ctx.setLineDash([5, 5]);
    
    // Linee orizzontali e tick Y - scala adattata
    const yTickCount = 10;
    const maxTickValue = Math.min(100, Math.ceil(p * yScaleFactor / 10) * 10); // Arrotonda al decimo superiore, max 100%
    
    for (let i = 0; i <= yTickCount; i++) {
      const tickValue = (i / yTickCount) * maxTickValue;
      const y = margin.top + chartHeight - (tickValue / 100) * chartHeight;
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.fillText(`${Math.round(tickValue)}%`, margin.left - 10, y + 5);
    }
    
    // Linee verticali e tick X
    for (let i = 0; i <= 10; i++) {
      const x = scaleX(maxGrp * i / 10);
      ctx.moveTo(x, margin.top + chartHeight);
      ctx.lineTo(x, margin.top);
      ctx.fillText(`${Math.round(maxGrp * i / 10)}`, x, margin.top + chartHeight + 15);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Disegna la curva di reach potenziale
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    
    const points = [];
    const numPoints = 100;
    
    for (let i = 0; i < numPoints; i++) {
      const grpValue = (i / (numPoints - 1)) * maxGrp;
      const reachValue = (p * grpValue) / (grpValue + p);
      points.push({ x: scaleX(grpValue), y: scaleY(reachValue) });
    }
    
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    
    // Disegna il punto che rappresenta la posizione attuale
    const currentX = scaleX(g);
    const currentY = scaleY(standardReach); // Usiamo standardReach qui perché scaleY lo convertirà in userReach
    
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Aggiungi una legenda
    const legendX = margin.left + 20;
    const legendY = margin.top + 20;
    
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 30, legendY);
    ctx.stroke();
    
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'left';
    ctx.fillText('Reach (%)', legendX + 40, legendY + 4);
    
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    ctx.arc(legendX + 15, legendY + 20, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Posizione attuale', legendX + 40, legendY + 24);
  };
  
  return (
    <div className="reach-lab-container">
      <div className="reach-lab-title">
        <h1 className="reach-lab-title">Reach Lab - Advanced TV</h1>
      </div>
      
      <Card>
        <h2 className="card-title text-center">Parametri Campagna</h2>
        <div className="form-grid-centered">
          <div className="form-group">
            <label htmlFor="targetSize" className="form-label">
              Dimensione Target (persone)
            </label>
            <input
              type="text"
              id="targetSize"
              value={targetSize}
              onChange={(e) => handleFormattedInput(e.target.value, setTargetSize)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="budget" className="form-label">
              Budget (€)
            </label>
            <input
              type="text"
              id="budget"
              value={budget}
              onChange={(e) => handleFormattedInput(e.target.value, setBudget)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="cpm" className="form-label">
              CPM (€)
            </label>
            <input
              type="text"
              id="cpm"
              value={cpm}
              onChange={(e) => handleNumericInput(e.target.value, setCpm)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="campaignDays" className="form-label">
              Durata Campagna (giorni)
            </label>
            <input
              type="number"
              id="campaignDays"
              value={campaignDays}
              onChange={(e) => setCampaignDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="form-input"
            />
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={calculateResults}
            className="btn"
          >
            Calcola
          </button>
        </div>
      </Card>
      
      <Card>
        <h2 className="card-title">Risultati Stimati</h2>
        <div className="results-grid">
          <div className="result-box result-box-primary">
            <p className="result-label text-primary">Impressioni Totali</p>
            <p className="result-value">{results.impressions}</p>
          </div>
          
          <div className="result-box result-box-primary">
            <p className="result-label text-primary">GRP</p>
            <p className="result-value">{results.grp}</p>
          </div>
          
          <div className="result-box result-box-success">
            <p className="result-label text-success">Unique Devices</p>
            <p className="result-value">{results.uniqueDevices}</p>
          </div>
          
          <div className="result-box result-box-success">
            <p className="result-label text-success">Contatti Netti</p>
            <p className="result-value">{results.netContacts}</p>
          </div>
          
          <div className="result-box result-box-success">
            <p className="result-label text-success">Reach (% on Devices)</p>
            <p className="result-value">{results.reachPercentage}</p>
          </div>
          
          <div className="result-box result-box-success">
            <p className="result-label text-success">Reach (% on Users)</p>
            <p className="result-value">{results.reachUsersPercentage}</p>
          </div>
          
          <div className="result-box result-box-warning">
            <p className="result-label text-warning">
              Frequenza Media
              <span className="tooltip" title="Frequenza adattata per riflettere la distribuzione reale delle impressioni">ℹ️</span>
            </p>
            <p className="result-value">{results.frequency}</p>
          </div>
          
          <div className="result-box result-box-warning">
            <p className="result-label text-warning">Costo per GRP</p>
            <p className="result-value">{results.cpg}</p>
          </div>
          
          {/* Riga per i costi per reach point con container invisibili ai lati */}
          <div className="result-box invisible-box hide-on-small"></div>
          
          <div className="result-box result-box-warning">
            <p className="result-label text-warning">Costo per Reach Point/Devices</p>
            <p className="result-value">{results.costPerReachPointDevices}</p>
          </div>
          
          <div className="result-box result-box-warning">
            <p className="result-label text-warning">Costo per Reach Point/Users</p>
            <p className="result-value">{results.costPerReachPointUsers}</p>
          </div>
          
          <div className="result-box invisible-box hide-on-small"></div>
        </div>
      </Card>
      
      <Card>
        <h2 className="card-title">Curva di Reach</h2>
        <div ref={containerRef} className="canvas-container">
          <canvas ref={canvasRef}></canvas>
        </div>
      </Card>
      
      <Card>
        <h2 className="card-title">Note sul Modello di Calcolo</h2>
        <p>Questo calcolatore utilizza le formule standard dell'anatomia delle curve di reach, con adattamenti per la Advanced TV:</p>
        <ul className="list">
          <li>Formula fondamentale della reach: r = (pg)/(g+p) dove r è la reach, p è il potenziale del canale e g sono i GRP</li>
          <li>Frequenza media adattata in base alla densità delle impressioni e alla durata della campagna</li>
          <li>Fattore di conversione da reach su device a reach su utenti: 1.4x</li>
        </ul>
        <p>Il parametro "midDensity" viene calibrato automaticamente in base alla dimensione del target:</p>
        <ul className="list">
          <li>Target piccolo (&lt;10M): midDensity = 2.5</li>
          <li>Target medio (10M-25M): midDensity = 3.0</li>
          <li>Target grande (&gt;25M): midDensity = 4.0</li>
        </ul>
        <p>I parametri del fattore di durata della campagna sono configurabili nel codice:</p>
        <ul className="list">
          <li>DURATION_MAX_FACTOR = 1.2 (Fattore massimo per campagne brevi)</li>
          <li>DURATION_MIN_FACTOR = 0.8 (Fattore minimo per campagne lunghe)</li>
          <li>DURATION_REFERENCE = 30 (Durata di riferimento in giorni, dove il fattore è neutro)</li>
          <li>DURATION_SCALE = 150 (Divisore che controlla quanto rapidamente cambia il fattore)</li>
        </ul>
        <p>La durata della campagna influisce sulla distribuzione delle impressioni: campagne più lunghe tendono ad avere una frequenza più diluita.</p>
      </Card>
    </div>
  );
};

export default ReachLab;