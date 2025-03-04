class ResourceManager {
  constructor(gameState) {
    this.gameState = gameState;
  }
  
  // Calculate current resource production rates
  calculateProductionRates() {
    const production = {
      energy: 0,
      minerals: 0,
      knowledge: 0,
      population: 0
    };
    
    // Base production from colonies
    this.gameState.colonies.forEach(colony => {
      const planet = this.getPlanetByColony(colony);
      
      if (planet) {
        // Add energy production from facilities
        planet.facilities.forEach(facility => {
          if (facility.status === 'OPERATIONAL') {
            switch (facility.type) {
              case 'SOLAR_ARRAY':
                production.energy += 10 * planet.resources.energy.extraction;
                break;
              case 'MINING_COMPLEX':
                production.minerals += 8 * planet.resources.minerals.extraction;
                break;
              case 'RESEARCH_CENTER':
                production.knowledge += 15;
                break;
              // Add more facility types as needed
            }
          }
        });
        
        // Population growth
        production.population += colony.population * 0.01; // 1% growth rate
      }
    });
    
    // Apply technology modifiers
    this.gameState.technologies.researched.forEach(tech => {
      switch (tech.id) {
        case 'solar-power':
          production.energy *= 1.1; // 10% increase
          break;
        case 'advanced-mining':
          production.minerals *= 1.2; // 20% increase
          break;
        case 'scientific-method':
          production.knowledge *= 1.3; // 30% increase
          break;
        case 'gene-therapy':
          production.population *= 1.15; // 15% increase
          break;
        // Add more technology modifiers as needed
      }
    });
    
    return production;
  }
  
  // Update resources based on time elapsed
  updateResources(timeElapsed) {
    const production = this.calculateProductionRates();
    const resources = { ...this.gameState.resources };
    
    // Apply production rates over time
    Object.keys(resources).forEach(key => {
      resources[key] += production[key] * timeElapsed;
    });
    
    // Apply resource consumption from active projects
    this.gameState.activeProjects.forEach(project => {
      if (project.type === 'CONSTRUCTION' && project.resourcesPerTurn) {
        Object.keys(project.resourcesPerTurn).forEach(key => {
          resources[key] -= project.resourcesPerTurn[key] * timeElapsed;
        });
      }
    });
    
    // Ensure resources don't go negative
    Object.keys(resources).forEach(key => {
      resources[key] = Math.max(0, resources[key]);
    });
    
    return {
      resources,
      production
    };
  }
  
  // Check if resources are sufficient for a cost
  canAfford(cost) {
    for (const resource in cost) {
      if (this.gameState.resources[resource] < cost[resource]) {
        return false;
      }
    }
    return true;
  }
  
  // Deduct resources
  spendResources(cost) {
    const newResources = { ...this.gameState.resources };
    
    for (const resource in cost) {
      newResources[resource] -= cost[resource];
      if (newResources[resource] < 0) {
        throw new Error(`Insufficient ${resource}`);
      }
    }
    
    return newResources;
  }
  
  // Helper to find planet by colony
  getPlanetByColony(colony) {
    const system = this.gameState.starSystems.find(system => system.id === colony.systemId);
    if (!system) return null;
    
    return system.bodies.find(body => body.id === colony.planetId);
  }
}

export default ResourceManager;

