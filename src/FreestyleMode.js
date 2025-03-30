import React, { useState, useEffect } from 'react';

const FreestyleMode = ({ onFrequencyCapChange, initialValue = 3.5 }) => {
  const [sliderValue, setSliderValue] = useState(initialValue);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const [isEnabled, setIsEnabled] = useState(false);
  
  // Handle slider change
  const handleSliderChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setSliderValue(newValue);
    setInputValue(newValue.toFixed(1));
    if (isEnabled) {
      onFrequencyCapChange(newValue);
    }
  };
  
  // Handle manual input change
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^\d.,]/g, '');
    setInputValue(value);
    
    const numericValue = parseFloat(value.replace(',', '.'));
    if (!isNaN(numericValue)) {
      setSliderValue(numericValue);
      if (isEnabled) {
        onFrequencyCapChange(numericValue);
      }
    }
  };
  
  // Handle input blur (when user finishes editing)
  const handleInputBlur = () => {
    const numericValue = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(numericValue)) {
      setInputValue(sliderValue.toFixed(1));
    } else {
      // Ensure value is within min/max range
      const boundedValue = Math.max(1, Math.min(10, numericValue));
      setSliderValue(boundedValue);
      setInputValue(boundedValue.toFixed(1));
      if (isEnabled) {
        onFrequencyCapChange(boundedValue);
      }
    }
  };
  
  // Handle toggle switch change
  const handleToggleChange = (e) => {
    const newEnabledState = e.target.checked;
    setIsEnabled(newEnabledState);
    
    // If enabling, pass the current frequency cap value to parent
    // If disabling, pass null to indicate no frequency cap
    onFrequencyCapChange(newEnabledState ? sliderValue : null);
  };
  
  // Update the bubble position on slider value change
  useEffect(() => {
    const slider = document.getElementById('frequency-cap-slider');
    const bubble = document.getElementById('frequency-cap-bubble');
    
    if (slider && bubble) {
      const min = parseFloat(slider.min) || 1;
      const max = parseFloat(slider.max) || 10;
      const newVal = ((sliderValue - min) * 100) / (max - min);
      bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    }
  }, [sliderValue]);
  
  return (
    <div className="card freestyle-mode-card" style={{ flex: 1 }}>
      <h2 className="card-title">Freestyle Mode</h2>
      <div className="freestyle-container">
        {/* Slider value bubble */}
        <div id="frequency-cap-bubble" className="frequency-bubble">
          {sliderValue.toFixed(1)}
        </div>
        
        {/* Arrow below bubble */}
        <div className="frequency-bubble-arrow"></div>
        
        {/* Slider container */}
        <div style={{ marginTop: '2rem', position: 'relative' }}>
          <input
            id="frequency-cap-slider"
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={sliderValue}
            onChange={handleSliderChange}
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                ((sliderValue - 1) * 100) / 9
              }%, #e0e0e0 ${((sliderValue - 1) * 100) / 9}%, #e0e0e0 100%)`
            }}
          />
        </div>
        
        {/* Control row with label, input and toggle */}
        <div className="frequency-controls">
          <label htmlFor="frequency-cap-input" className="frequency-label">
            lifetime Frequency CAP
          </label>
          
          <input
            id="frequency-cap-input"
            type="text"
            className="frequency-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
          />
          
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggleChange}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default FreestyleMode;