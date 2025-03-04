import React from 'react';
import StatusBar from './StatusBar.js';
import Terminal from './Terminal.js';
import InputArea from './InputArea.js';

const GameUI = ({ gameState, processCommand, processing, notification }) => {
  return (
    <div className="app-container">
      <StatusBar 
        resources={gameState.resources} 
        alerts={gameState.alerts} 
      />
      
      <Terminal 
        entries={gameState.events} 
        commandHistory={gameState.commandHistory}
      />
      
      <InputArea 
        onSendCommand={processCommand} 
        isProcessing={processing} 
      />
      
      {notification && (
        <div className="notification">{notification}</div>
      )}
    </div>
  );
};

export default GameUI;

