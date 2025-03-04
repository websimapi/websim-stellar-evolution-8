class TechnologyManager {
  constructor(gameState) {
    this.gameState = gameState;
    
    // Technology tree structure
    this.technologyTree = {
      // Energy technologies
      'solar-power': {
        name: 'Solar Power',
        description: 'Efficient capture of stellar energy using photovoltaic arrays.',
        category: 'ENERGY',
        tier: 1,
        cost: 500,
        effects: {
          energy_production: 1.1 // +10% energy production
        },
        unlocks: ['fusion-power', 'orbital-solar-arrays']
      },
      'fusion-power': {
        name: 'Fusion Power',
        description: 'Harness the power of stars through controlled fusion reactions.',
        category: 'ENERGY',
        tier: 2,
        cost: 1000,
        prerequisites: ['solar-power'],
        effects: {
          energy_production: 1.5 // +50% energy production
        },
        unlocks: ['antimatter-power']
      },
      'antimatter-power': {
        name: 'Antimatter Power',
        description: 'Generate immense energy through matter-antimatter annihilation.',
        category: 'ENERGY',
        tier: 3,
        cost: 2500,
        prerequisites: ['fusion-power'],
        effects: {
          energy_production: 2.0 // +100% energy production
        },
        unlocks: ['zero-point-energy']
      },
      
      // Propulsion technologies
      'combustion-engine': {
        name: 'Combustion Engine',
        description: 'Basic rocket technology for space exploration.',
        category: 'PROPULSION',
        tier: 1,
        cost: 400,
        effects: {
          exploration_speed: 1.0 // Base exploration speed
        },
        unlocks: ['ion-propulsion']
      },
      'ion-propulsion': {
        name: 'Ion Propulsion',
        description: 'Efficient propulsion using electrically charged particles.',
        category: 'PROPULSION',
        tier: 2,
        cost: 800,
        prerequisites: ['combustion-engine', 'solar-power'],
        effects: {
          exploration_speed: 1.5, // +50% exploration speed
          energy_consumption: 1.2 // +20% energy consumption
        },
        unlocks: ['fusion-drive']
      },
      'fusion-drive': {
        name: 'Fusion Drive',
        description: 'Interstellar-capable propulsion system using controlled fusion.',
        category: 'PROPULSION',
        tier: 3,
        cost: 1800,
        prerequisites: ['ion-propulsion', 'fusion-power'],
        effects: {
          exploration_speed: 2.5, // +150% exploration speed
          energy_consumption: 1.5 // +50% energy consumption
        },
        unlocks: ['warp-drive']
      },
      
      // Habitation technologies
      'basic-agriculture': {
        name: 'Basic Agriculture',
        description: 'Sustainable food production for space colonies.',
        category: 'HABITATION',
        tier: 1,
        cost: 300,
        effects: {
          population_growth: 1.1 // +10% population growth
        },
        unlocks: ['orbital-habitats', 'hydroponics']
      },
      'orbital-habitats': {
        name: 'Orbital Habitats',
        description: 'Self-contained habitation structures in orbit around celestial bodies.',
        category: 'HABITATION',
        tier: 2,
        cost: 1200,
        prerequisites: ['basic-agriculture'],
        effects: {
          colonization_options: ['orbital'] // Allow orbital colony type
        },
        unlocks: ['terraforming']
      },
      'terraforming': {
        name: 'Terraforming',
        description: 'Planetary engineering to make hostile worlds habitable.',
        category: 'HABITATION',
        tier: 3,
        cost: 3000,
        prerequisites: ['orbital-habitats', 'atmospheric-processors'],
        effects: {
          colonization_options: ['terraform'], // Allow terraforming
          population_capacity: 1.5 // +50% population capacity
        },
        unlocks: ['planetary-engineering']
      }
      
      // Add more technologies as needed
    };
  }
  
  // Get available technologies that can be researched
  getAvailableTechnologies() {
    const researched = this.gameState.technologies.researched.map(tech => tech.id);
    const available = [];
    
    // Check all technologies in the tree
    for (const techId in this.technologyTree) {
      const tech = this.technologyTree[techId];
      
      // Skip if already researched
      if (researched.includes(techId)) continue;
      
      // Check prerequisites
      const prerequisites = tech.prerequisites || [];
      const meetsPrerequisites = prerequisites.every(prereq => researched.includes(prereq));
      
      if (meetsPrerequisites) {
        available.push({
          id: techId,
          name: tech.name,
          description: tech.description,
          cost: tech.cost,
          progress: 0
        });
      }
    }
    
    return available;
  }
  
  // Start researching a technology
  startResearch(techId) {
    const tech = this.technologyTree[techId];
    
    if (!tech) {
      throw new Error(`Technology ${techId} not found`);
    }
    
    // Check if already researched
    if (this.gameState.technologies.researched.some(t => t.id === techId)) {
      throw new Error(`Technology ${tech.name} already researched`);
    }
    
    // Check prerequisites
    const researched = this.gameState.technologies.researched.map(t => t.id);
    const prerequisites = tech.prerequisites || [];
    const meetsPrerequisites = prerequisites.every(prereq => researched.includes(prereq));
    
    if (!meetsPrerequisites) {
      throw new Error(`Prerequisites for ${tech.name} not met`);
    }
    
    // Set as the current research project
    return {
      ...this.gameState,
      technologies: {
        ...this.gameState.technologies,
        researching: {
          id: techId,
          name: tech.name,
          cost: tech.cost,
          progress: 0
        }
      }
    };
  }
  
  // Progress research based on knowledge generated
  progressResearch(knowledgeAmount) {
    if (!this.gameState.technologies.researching) {
      return this.gameState;
    }
    
    const researching = { ...this.gameState.technologies.researching };
    researching.progress += knowledgeAmount;
    
    // Check if research is complete
    if (researching.progress >= researching.cost) {
      // Add to researched technologies
      const newResearched = [
        ...this.gameState.technologies.researched,
        { 
          id: researching.id, 
          name: researching.name, 
          level: 1 
        }
      ];
      
      // Update available technologies
      const newAvailable = this.getAvailableTechnologies();
      
      return {
        ...this.gameState,
        technologies: {
          ...this.gameState.technologies,
          researched: newResearched,
          researching: null,
          available: newAvailable
        }
      };
    }
    
    // Research still in progress
    return {
      ...this.gameState,
      technologies: {
        ...this.gameState.technologies,
        researching: researching
      }
    };
  }
  
  // Get the effects of a technology
  getTechnologyEffects(techId) {
    const tech = this.technologyTree[techId];
    return tech ? tech.effects : {};
  }
  
  // Calculate combined effects from all researched technologies
  calculateTechnologyEffects() {
    const effects = {
      energy_production: 1.0,
      mineral_production: 1.0,
      knowledge_production: 1.0,
      population_growth: 1.0,
      exploration_speed: 1.0,
      colonization_options: [],
      special_abilities: []
    };
    
    // Apply effects from all researched technologies
    this.gameState.technologies.researched.forEach(tech => {
      const techEffects = this.getTechnologyEffects(tech.id);
      
      for (const key in techEffects) {
        if (Array.isArray(effects[key])) {
          // For array properties like colonization_options
          effects[key] = [...effects[key], ...techEffects[key]];
        } else {
          // For scalar multipliers
          effects[key] = effects[key] * techEffects[key];
        }
      }
    });
    
    return effects;
  }
}

export default TechnologyManager;

