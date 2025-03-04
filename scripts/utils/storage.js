// Save game state to storage
export const saveGame = async (gameState) => {
  try {
    // Convert the game state to string
    const gameStateString = JSON.stringify(gameState);
    
    // Save to local storage
    localStorage.setItem('stellarEvolution_gameState', gameStateString);
    
    return true;
  } catch (error) {
    console.error('Error saving game:', error);
    return false;
  }
};

// Load game state from storage
export const loadGame = async () => {
  try {
    // Try to get game state from local storage
    const gameStateString = localStorage.getItem('stellarEvolution_gameState');
    
    if (!gameStateString) {
      return null;
    }
    
    // Parse the game state
    return JSON.parse(gameStateString);
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
};

// Clear saved game
export const clearSavedGame = async () => {
  try {
    localStorage.removeItem('stellarEvolution_gameState');
    return true;
  } catch (error) {
    console.error('Error clearing saved game:', error);
    return false;
  }
};

