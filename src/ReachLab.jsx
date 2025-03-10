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
  const [useAdaptiveFrequency, setUseAdaptiveFrequency] = useState(true);
  
  // Stati nascosti (non mostrati nell'UI ma usati nei calcoli)
  const [campaignDays] = useState(30);
  const [channelPotential] = useState(80);
  
  // Stati per i risultati
  const [results, setResults] = useState({
    impressions: '-',
    grp: '-',
    reach: '-',
    reachPercentage: '-',
    reachUsersPercentage: '-',
    frequency: '-',
    costPerReach: '-',
    cpg: '-'
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
        if (!isNaN(g)) {
          drawReachCurve(p, g);
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
      // Ottieni i valori di input
      const targetSizeValue = parseInt(targetSize.replace(/\./g, ''), 10) || 0;
      const budgetValue = parseInt(budget.replace(/\./g, ''), 10) || 0;
      const cpmValue = parseFloat(cpm.replace(',', '.')) || 0;
      
      // Calcolo delle impressioni totali
      const totalImpressions = Math.floor(budgetValue / (cpmValue / 1000));
      
      // Calcolo dei GRP
      const calculatedGrps = (totalImpressions / targetSizeValue) * 100;
      
      // Parametri per il calcolo della reach
      const p = channelPotential;
      const g = calculatedGrps;
      
      // Formula della reach 1+ (percentuale del target) - Reach su devices
      const reach1Plus = (p * g) / (g + p);
      
      // Reach su users con fattore moltiplicatore 1.40 (considerando il pubblico one-to-many)
      const reachOnUsers = Math.min(reach1Plus * 1.40, 100); // Massimo 100%
      
      // Reach in valore assoluto
      const absoluteReach = Math.floor((reach1Plus / 100) * targetSizeValue);
      
      // Calcolo della frequenza media standard (GRP / reach)
      const standardFrequency = g / reach1Plus;
      
      // Frequenza finale da mostrare (standard o adattiva)
      let finalFrequency = standardFrequency;
      
      // Se il modello adattivo è attivo, calcola la frequenza adattiva
      if (useAdaptiveFrequency) {
        // Calcolo adattivo del fattore di scala per la frequenza
        const impressionDensity = totalImpressions / targetSizeValue;
        
        // Funzione che calcola un fattore di scala appropriato
        const calculateFrequencyFactor = (density) => {
          const minFactor = 1.0;
          const maxFactor = 2.0;
          const midDensity = 5.0;
          
          return minFactor + (maxFactor - minFactor) * (1 - Math.exp(-density / midDensity));
        };
        
        // Calcola il fattore basato sulla densità delle impressioni
        const frequencyFactor = calculateFrequencyFactor(impressionDensity);
        
        // Applica il fattore alla frequenza standard
        finalFrequency = standardFrequency * frequencyFactor;
      }
      
      // Costo per reach point
      const costPerReach = budgetValue / reach1Plus;
      
      // Calcolo corretto del CPG (Costo per GRP)
      const costPerGrp = budgetValue / calculatedGrps;
      
      // Aggiorna lo stato dei risultati
      setResults({
        impressions: formatNumber(totalImpressions),
        grp: formatPercentage(calculatedGrps),
        reach: formatNumber(absoluteReach),
        reachPercentage: formatPercentage(reach1Plus),
        reachUsersPercentage: formatPercentage(reachOnUsers),
        frequency: finalFrequency.toFixed(2),
        costPerReach: `€${formatNumber(costPerReach)}`,
        cpg: `€${formatNumber(costPerGrp)}`
      });
      
      // Disegna la curva di reach
      setTimeout(() => {
        drawReachCurve(p, g);
      }, 50);
    } catch (error) {
      console.error('Errore durante il calcolo:', error);
      alert('Si è verificato un errore durante il calcolo. Controlla i valori inseriti.');
    }
  };
  
  // Funzione per disegnare la curva di reach
  const drawReachCurve = (p, g) => {
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
    
    // Funzione di scala per X (GRP)
    function scaleX(value) {
      return margin.left + (value / maxGrp) * chartWidth;
    }
    
    // Funzione di scala per Y (Reach %)
    function scaleY(value) {
      return margin.top + chartHeight - (value / 100) * chartHeight;
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
    
    // Linee orizzontali e tick Y
    for (let i = 0; i <= 10; i++) {
      const y = scaleY(i * 10);
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartWidth, y);
      ctx.fillText(`${i * 10}%`, margin.left - 10, y + 5);
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
    
    // Disegna la curva di reach
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
    const currentReach = (p * g) / (g + p);
    const currentX = scaleX(g);
    const currentY = scaleY(currentReach);
    
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
        </div>
        
        <div className="switch-container">
          <label className="switch-label">
            <input
              type="checkbox"
              checked={useAdaptiveFrequency}
              onChange={(e) => setUseAdaptiveFrequency(e.target.checked)}
            />
            <span className="switch-text">Usa modello di frequenza adattivo</span>
          </label>
          <div className="switch-tooltip">
            Il modello adattivo simula una distribuzione di frequenza più realistica basata sulle dimensioni del target e del budget
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
            <p className="result-label text-success">Reach Stimata</p>
            <p className="result-value">{results.reach}</p>
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
              {useAdaptiveFrequency && (
                <span className="tooltip" title="Frequenza adattata per riflettere la distribuzione reale delle impressioni">ℹ️</span>
              )}
            </p>
            <p className="result-value">{results.frequency}</p>
          </div>
          
          <div className="result-box result-box-warning">
            <p className="result-label text-warning">Costo per Reach Point</p>
            <p className="result-value">{results.costPerReach}</p>
          </div>
          
          <div className="result-box result-box-warning">
            <p className="result-label text-warning">Costo per GRP</p>
            <p className="result-value">{results.cpg}</p>
          </div>
        </div>
      </Card>
      
      <Card>
        <h2 className="card-title">Curva di Reach</h2>
        <div ref={containerRef} className="canvas-container">
          <canvas ref={canvasRef}></canvas>
        </div>
      </Card>
    </div>
  );
};

export default ReachLab;