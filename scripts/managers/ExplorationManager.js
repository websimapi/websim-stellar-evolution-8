class ExplorationManager {
  constructor(gameState) {
    this.gameState = gameState;
  }
  
  // Explore a specific location
  exploreLocation(locationId) {
    // Find the location to explore
    let location = null;
    let system = null;
    
    // Check if it's a star system
    system = this.gameState.starSystems.find(sys => sys.id === locationId);
    if (system) {
      return this.exploreStarSystem(system);
    }
    
    // Check if it's a planet or moon within a system
    for (const sys of this.gameState.starSystems) {
      // Check planets
      const planet = sys.bodies.find(body => body.id === locationId);
      if (planet) {
        return this.explorePlanet(planet, sys);
      }
      
      // Check moons
      for (const body of sys.bodies) {
        if (body.moons) {
          const moon = body.moons.find(m => m.id === locationId);
          if (moon) {
            return this.exploreMoon(moon, body, sys);
          }
        }
      }
    }
    
    throw new Error(`Location "${locationId}" not found`);
  }
  
  // Explore a star system
  exploreStarSystem(system) {
    // If system is already fully explored, just return details
    if (system.explored) {
      return {
        success: true,
        text: `${system.name} has already been thoroughly surveyed. It's a ${system.type} with ${system.bodies.length} major celestial bodies.`,
        discoveries: [],
        systemDetails: system
      };
    }
    
    // Mark as explored
    system.explored = true;
    
    // Determine any new findings or hazards
    const discoveries = [];
    
    // Reveal some previously hidden bodies or details
    for (const body of system.bodies) {
      if (!body.discovered) {
        body.discovered = true;
        discoveries.push({
          type: 'CELESTIAL_BODY',
          id: body.id,
          name: body.name,
          bodyType: body.type,
          description: this.generateDescription(body)
        });
      }
    }
    
    // Chance for special discovery
    if (Math.random() < 0.25) { // 25% chance
      const specialDiscovery = this.generateSpecialDiscovery(system);
      discoveries.push(specialDiscovery);
    }
    
    const explorationResult = {
      success: true,
      text: `Your survey vessels have completed a detailed exploration of the ${system.name} system. It's a ${system.type} with ${system.bodies.length} major celestial bodies.`,
      tone: 'explore',
      discoveries: discoveries,
      systemDetails: system
    };
    
    if (discoveries.length > 0) {
      explorationResult.text += ` Your team has made ${discoveries.length} notable discoveries.`;
    }
    
    return explorationResult;
  }
  
  // Explore a planet
  explorePlanet(planet, system) {
    // If planet is already explored, just return details
    if (planet.explored) {
      return {
        success: true,
        text: `${planet.name} has already been thoroughly explored. It's a ${planet.type} planet with ${planet.resources.energy.amount} energy and ${planet.resources.minerals.amount} mineral resources.`,
        discoveries: [],
        planetDetails: planet
      };
    }
    
    // Mark as explored
    planet.explored = true;
    
    // Determine detailed resource levels and other characteristics
    const detailedResources = {};
    for (const resource in planet.resources) {
      // Add some randomness to the exact resource amounts
      const variance = 0.2; // 20% variance
      const multiplier = 1 + (Math.random() * variance * 2 - variance);
      detailedResources[resource] = {
        ...planet.resources[resource],
        exactAmount: this.getResourceNumericValue(planet.resources[resource].amount) * multiplier
      };
    }
    
    // Discoveries on this planet
    const discoveries = [];
    
    // Adjust or reveal resource details
    planet.resources = {
      ...planet.resources,
      ...detailedResources
    };
    
    // Check for anomalies, ruins, or special features
    if (Math.random() < 0.3) { // 30% chance
      const anomaly = this.generateAnomaly(planet);
      planet.anomalies = planet.anomalies || [];
      planet.anomalies.push(anomaly);
      discoveries.push(anomaly);
    }
    
    // Generate description based on planet type
    const description = this.generateDescription(planet);
    
    return {
      success: true,
      text: `Your exploration team has completed its survey of ${planet.name}. ${description}`,
      tone: 'explore',
      discoveries: discoveries,
      planetDetails: planet
    };
  }
  
  // Explore a moon
  exploreMoon(moon, planet, system) {
    // Similar logic to explorePlanet but for moons
    // Would implement detailed moon exploration here
    return {
      success: true,
      text: `Your team has surveyed ${moon.name}, a moon of ${planet.name} in the ${system.name} system.`,
      tone: 'explore',
      discoveries: [],
      moonDetails: moon
    };
  }
  
  // Generate a random special discovery for a star system
  generateSpecialDiscovery(system) {
    const discoveries = [
      {
        type: 'STELLAR_PHENOMENON',
        name: 'Unusual Radiation Pattern',
        description: 'Your sensors detect an unusual radiation pattern emanating from the star, suggesting internal processes that don\'t match known stellar models.'
      },
      {
        type: 'ASTEROID_BELT',
        name: 'Resource-Rich Asteroid Belt',
        description: 'Scans reveal an asteroid belt with unusually high concentrations of rare minerals and metals.'
      },
      {
        type: 'SPATIAL_ANOMALY',
        name: 'Gravitational Anomaly',
        description: 'Sensors detect a localized gravitational distortion that doesn\'t correspond to any visible mass.'
      },
      {
        type: 'ANCIENT_PROBE',
        name: 'Derelict Probe',
        description: 'Your scouts discover an ancient probe of unknown origin, possibly millions of years old.'
      }
    ];
    
    return discoveries[Math.floor(Math.random() * discoveries.length)];
  }
  
  // Generate a random anomaly for a planet
  generateAnomaly(planet) {
    const anomalies = [
      {
        type: 'RUINS',
        name: 'Ancient Ruins',
        description: 'The survey team discovers what appear to be the remnants of an ancient structure, suggesting this planet once hosted intelligent life.'
      },
      {
        type: 'BIOLOGICAL',
        name: 'Unusual Life Signs',
        description: 'Sensors detect biological signatures unlike anything in our database. Further study is recommended.'
      },
      {
        type: 'GEOLOGICAL',
        name: 'Rare Geological Formation',
        description: 'The planet features an unusual geological formation that could yield valuable scientific insights.'
      },
      {
        type: 'METEOROLOGICAL',
        name: 'Extreme Weather Patterns',
        description: 'The planet experiences extreme and unpredictable weather patterns that may pose challenges for colonization.'
      }
    ];
    
    return anomalies[Math.floor(Math.random() * anomalies.length)];
  }
  
  // Generate descriptive text based on celestial body characteristics
  generateDescription(body) {
    let description = '';
    
    switch (body.type) {
      case 'terrestrial':
        description = `It's a rocky terrestrial planet with ${body.resources.energy.amount} energy and ${body.resources.minerals.amount} mineral resources.`;
        break;
      case 'gas-giant':
        description = `A massive gas giant with powerful storms in its upper atmosphere. Its many moons might hold valuable resources.`;
        break;
      case 'ice-planet':
        description = `A frozen world covered in thick ice sheets. Despite the harsh conditions, it contains ${body.resources.minerals.amount} mineral deposits.`;
        break;
      case 'desert':
        description = `A hot, arid world with minimal surface water. Solar energy potential is ${body.resources.energy.amount}.`;
        break;
      default:
        description = `A ${body.type} world with various resources and unique characteristics.`;
    }
    
    // Add habitability assessment if it's a terrestrial planet
    if (body.type === 'terrestrial') {
      const habitability = this.assessHabitability(body);
      description += ` Habitability assessment: ${habitability}.`;
    }
    
    return description;
  }
  
  // Assess the habitability of a planet
  assessHabitability(body) {
    // This would be more complex in a real implementation
    const habitabilityLevels = ['Low', 'Moderate', 'High'];
    return habitabilityLevels[Math.floor(Math.random() * habitabilityLevels.length)];
  }
  
  // Convert resource text amount to numeric value
  getResourceNumericValue(textAmount) {
    switch (textAmount.toLowerCase()) {
      case 'trace': return 0.2;
      case 'low': return 0.5;
      case 'moderate': return 1.0;
      case 'high': return 1.5;
      case 'abundant': return 2.0;
      default: return 1.0;
    }
  }
}

export default ExplorationManager;

