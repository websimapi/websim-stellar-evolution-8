import React from 'react';
import ReactDOM from 'react-dom';
import GameState from './models/GameState.js';
import ResourceManager from './managers/ResourceManager.js';
import EventManager from './managers/EventManager.js';
import TechnologyManager from './managers/TechnologyManager.js';
import ExplorationManager from './managers/ExplorationManager.js';
import GameUI from './components/GameUI.js';
import CommandProcessor from './services/CommandProcessor.js';
import SpeechService from './services/SpeechService.js';
import { saveGame, loadGame } from './utils/storage.js';
import { processTimeElapsed } from './utils/time.js';

const App = () => {
  const [gameState, setGameState] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [notification, setNotification] = React.useState(null);

  const room = React.useRef(new WebsimSocket());
  const commandProcessor = React.useRef(null);
  const speechService = React.useRef(null);
  
  // Initialize the game
  React.useEffect(() => {
    async function initGame() {
      try {
        // Try to load existing game state
        let initialState = await loadGame();
        
        if (!initialState) {
          // Create a new game state if none exists
          initialState = GameState.createNewGame();
          
          // Create the initial game state in the collection
          await room.current.collection('gameState').create({
            state: JSON.stringify(initialState),
            lastUpdated: new Date().toISOString()
          });
        } else {
          // Process any time that has elapsed since last play
          initialState = processTimeElapsed(initialState);
        }
        
        commandProcessor.current = new CommandProcessor();
        speechService.current = new SpeechService();
        
        setGameState(initialState);
        
        // Subscribe to gameState changes
        room.current.collection('gameState').subscribe((gameStateRecords) => {
          if (gameStateRecords.length > 0) {
            const latestState = JSON.parse(gameStateRecords[0].state);
            setGameState(latestState);
            
            // Save the game state locally for offline play
            saveGame(latestState);
          }
        });
        
      } catch (error) {
        console.error("Error initializing game:", error);
      } finally {
        setLoading(false);
      }
    }
    
    initGame();
    
    // Handle visibility change to update game when tab becomes active
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  
  // Handle visibility change
  const handleVisibilityChange = () => {
    if (!document.hidden && gameState) {
      // Process time elapsed while away
      const updatedState = processTimeElapsed(gameState);
      setGameState(updatedState);
      saveGame(updatedState);
    }
  };
  
  // Process a user command
  const processCommand = async (command) => {
    if (!command.trim() || processing) return;
    
    setProcessing(true);
    
    try {
      // Update game state with the new command
      const updatedState = {
        ...gameState,
        commandHistory: [...gameState.commandHistory, command],
        lastCommand: command,
        turnNumber: gameState.turnNumber + 1
      };
      
      setGameState(updatedState);
      
      // Process the command
      const result = await commandProcessor.current.processCommand(command, updatedState);
      
      // Apply game state changes
      const newState = {
        ...updatedState,
        ...result.gameStateChanges,
        events: [...updatedState.events, ...result.gameStateChanges.events || []]
      };
      
      // Update the game state
      setGameState(newState);
      
      // Save the game state
      await saveGame(newState);
      
      // Update the persistent state in the collection
      const gameStateRecords = room.current.collection('gameState').getList();
      if (gameStateRecords.length > 0) {
        await room.current.collection('gameState').update(gameStateRecords[0].id, {
          state: JSON.stringify(newState),
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Play speech if enabled
      if (gameState.settings.speechEnabled) {
        speechService.current.speak(result.narrative.mainText);
      }
      
      // Show notification if needed
      if (result.uiUpdates && result.uiUpdates.notifications) {
        result.uiUpdates.notifications.forEach(notification => {
          showNotification(notification.message || notification.type);
        });
      }
      
    } catch (error) {
      console.error("Error processing command:", error);
      showNotification("Error processing your command");
    } finally {
      setProcessing(false);
    }
  };
  
  // Show a notification
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };
  
  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Initializing stellar systems...</p>
        </div>
      </div>
    );
  }
  
  return (
    <GameUI
      gameState={gameState}
      processCommand={processCommand}
      processing={processing}
      notification={notification}
    />
  );
};

ReactDOM.render(<App />, document.getElementById('root'));

