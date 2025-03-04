class EventManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.eventTypes = {
      EXPLORATION: {
        priority: 3,
        generateEvent: this.generateExplorationEvent
      },
      RESEARCH: {
        priority: 2,
        generateEvent: this.generateResearchEvent
      },
      CONSTRUCTION: {
        priority: 2,
        generateEvent: this.generateConstructionEvent
      },
      RESOURCE: {
        priority: 1,
        generateEvent: this.generateResourceEvent
      },
      POPULATION: {
        priority: 2,
        generateEvent: this.generatePopulationEvent
      },
      RANDOM: {
        priority: 4,
        generateEvent: this.generateRandomEvent,
        chance: 0.1 // 10% chance per turn
      }
    };
  }
  
  // Process events that should occur based on game state
  processEvents() {
    const newEvents = [];
    const resourceManager = new ResourceManager(this.gameState);
    const alertsToAdd = [];
    const alertsToRemove = [];
    
    // Check for resource shortages
    const resources = this.gameState.resources;
    const production = resourceManager.calculateProductionRates();
    
    for (const resource in resources) {
      // Alert if resource is low and decreasing
      if (resources[resource] < 100 && production[resource] < 0) {
        const existingAlert = this.gameState.alerts.find(a => a.type === 'RESOURCE_SHORTAGE' && a.resource === resource);
        
        if (!existingAlert) {
          alertsToAdd.push({
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'RESOURCE_SHORTAGE',
            resource: resource,
            text: `Low ${resource}`,
            severity: 'WARNING'
          });
          
          newEvents.push({
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'RESOURCE_SHORTAGE',
            text: `Your ${resource} reserves are critically low and still decreasing. Consider improving production or reducing consumption.`,
            tone: 'warning',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        // Remove alert if resource is no longer low or is increasing
        const existingAlertIndex = this.gameState.alerts.findIndex(a => a.type === 'RESOURCE_SHORTAGE' && a.resource === resource);
        if (existingAlertIndex >= 0) {
          alertsToRemove.push(existingAlertIndex);
        }
      }
    }
    
    // Check for completed research
    if (this.gameState.technologies.researching) {
      const research = this.gameState.technologies.researching;
      if (research.progress >= research.cost) {
        // Research completed
        newEvents.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'RESEARCH_COMPLETE',
          text: `Your scientists have successfully completed research on ${research.name}! New technologies and capabilities are now available.`,
          tone: 'positive',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Check for completed construction projects
    this.gameState.activeProjects.forEach(project => {
      if (project.type === 'CONSTRUCTION' && project.completionTurn <= this.gameState.turnNumber) {
        newEvents.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'CONSTRUCTION_COMPLETE',
          text: `Construction of ${project.name} at ${project.location} has been completed. The new facility is now operational.`,
          tone: 'positive',
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Generate random events based on chance
    if (Math.random() < this.eventTypes.RANDOM.chance) {
      const randomEvent = this.eventTypes.RANDOM.generateEvent(this.gameState);
      if (randomEvent) {
        newEvents.push(randomEvent);
      }
    }
    
    return {
      events: newEvents,
      alerts: {
        add: alertsToAdd,
        remove: alertsToRemove
      }
    };
  }
  
  // Event generator functions
  generateExplorationEvent(gameState) {
    // Example logic for exploration events
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'EXPLORATION',
      text: 'Your scouts have discovered an interesting anomaly in a nearby asteroid field. It appears to be artificial in origin.',
      tone: 'explore',
      timestamp: new Date().toISOString()
    };
  }
  
  generateResearchEvent(gameState) {
    // Example logic for research events
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'RESEARCH_BREAKTHROUGH',
      text: 'Your scientists report an unexpected breakthrough in their current research, accelerating progress by 10%.',
      tone: 'positive',
      timestamp: new Date().toISOString()
    };
  }
  
  generateConstructionEvent(gameState) {
    // Example logic for construction events
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'CONSTRUCTION_DELAY',
      text: 'A supply shortage has caused a slight delay in one of your construction projects.',
      tone: 'negative',
      timestamp: new Date().toISOString()
    };
  }
  
  generateResourceEvent(gameState) {
    // Example logic for resource events
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'RESOURCE_DISCOVERY',
      text: 'A mining team on Mars has discovered an unexpected vein of rare minerals, increasing production by 5%.',
      tone: 'positive',
      timestamp: new Date().toISOString()
    };
  }
  
  generatePopulationEvent(gameState) {
    // Example logic for population events
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'POPULATION_GROWTH',
      text: 'Favorable conditions on your main colony have led to increased population growth this cycle.',
      tone: 'positive',
      timestamp: new Date().toISOString()
    };
  }
  
  generateRandomEvent(gameState) {
    // A variety of possible random events
    const randomEvents = [
      {
        type: 'SOLAR_FLARE',
        text: 'A solar flare from your home star has temporarily disrupted communications with outer colonies.',
        tone: 'warning'
      },
      {
        type: 'FOREIGN_CONTACT',
        text: 'Your deep space sensors have detected what might be artificial signals from a distant star system.',
        tone: 'explore'
      },
      {
        type: 'ASTEROID_NEAR_MISS',
        text: 'A previously undetected asteroid passed dangerously close to one of your colonies. Consider improving your sensor network.',
        tone: 'warning'
      },
      {
        type: 'SCIENTIFIC_INSPIRATION',
        text: 'Exposure to a strange stellar phenomenon has inspired your scientists to explore new research avenues.',
        tone: 'positive'
      }
    ];
    
    const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    
    return {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event.type,
      text: event.text,
      tone: event.tone,
      timestamp: new Date().toISOString()
    };
  }
}

export default EventManager;

