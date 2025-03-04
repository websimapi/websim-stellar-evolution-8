import React from 'react';
import { formatNumber } from '../utils/formatting.js';

const StatusBar = ({ resources, alerts }) => {
  // Define resource icons as SVG
  const resourceIcons = {
    energy: (
      <svg className="resource-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    minerals: (
      <svg className="resource-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#3CDFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17l10 5 10-5" stroke="#3CDFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 12l10 5 10-5" stroke="#3CDFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    knowledge: (
      <svg className="resource-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" fill="#9C59FF"/>
        <path d="M12 6a1 1 0 00-1 1v5a1 1 0 00.51.87l4 2.5a1 1 0 101.08-1.68L13 11.41V7a1 1 0 00-1-1z" fill="#9C59FF"/>
      </svg>
    ),
    population: (
      <svg className="resource-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="7" r="4" stroke="#4CAF50" strokeWidth="2"/>
        <path d="M5 21v-2a7 7 0 0114 0v2" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  };

  return (
    <div className="status-bar">
      <div className="resources">
        {Object.entries(resources).map(([key, value]) => (
          <div key={key} className="resource">
            {resourceIcons[key]}
            <span>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
            <span className="resource-value">{formatNumber(value)}</span>
          </div>
        ))}
      </div>
      
      <div className="alerts">
        {alerts && alerts.map((alert, index) => (
          <div key={index} className="alert">{alert.text}</div>
        ))}
      </div>
    </div>
  );
};

export default StatusBar;

