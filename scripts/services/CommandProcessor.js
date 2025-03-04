import ResourceManager from '../managers/ResourceManager.js';
import TechnologyManager from '../managers/TechnologyManager.js';
import ExplorationManager from '../managers/ExplorationManager.js';
import EventManager from '../managers/EventManager.js';

class CommandProcessor {
  constructor() {
    // Command patterns for pattern matching
    this.commandPatterns = {
      EXPLORE: [
        /explore\s+(.+)/i,
        /survey\s+(.+)/i,
        /investigate\s+(.+)/i,
        /scan\s+(.+)/i
      ],
      RESEARCH: [
        /research\s+(.+)/i,
        /study\s+(.+)/i,
        /develop\s+(.+)/i,
        /investigate\s+(.+)\s+technology/i
      ],
      BUILD: [
        /build\s+(.+)\s+(?:on|in|at)\s+(.+)/i,
        /construct\s+(.+)\s+(?:on|in|at)\s+(.+)/i,
        /establish\s+(.+)\s+(?:on|in|at)\s+(.+)/i
      ],
      COLONIZE: [
        /colonize\s+(.+)/i,
        /settle\s+(.+)/i,
        /establish\s+colony\s+(?:on|in)\s+(.+)/i
      ],
      STATUS: [
        /status/i,
        /report/i,
        /overview/i,
        /situation/i
      ],
      HELP: [
        /help/i,
        /guide/i,
        /tutorial/i,
        /commands/i
      ]
    };
  }
  
  // Process a command and return the result
  async processCommand(command, gameState) {
    // Initialize managers
    const resourceManager = new ResourceManager(gameState);
    const techManager = new TechnologyManager(gameState);
    const explorationManager = new ExplorationManager(gameState);
    const eventManager = new EventManager(gameState);
    
    // Determine command type
    const commandType = this.identifyCommandType(command);
    let result = null;
    
    // Process based on command type
    switch (commandType) {
      case 'EXPLORE':
        result = this.processExploreCommand(command, gameState, explorationManager);
        break;
      case 'RESEARCH':
        result = this.processResearchCommand(command, gameState, techManager);
        break;
      case 'BUILD':
        result = this.processBuildCommand(command, gameState, resourceManager);
        break;
      case 'COLONIZE':
        result = this.processColonizeCommand(command, gameState, resourceManager);
        break;
      case 'STATUS':
        result = this.processStatusCommand(gameState);
        break;
      case 'HELP':
        result = this.processHelpCommand();
        break;
      default:
        // Use LLM via websim for natural language commands
        try {
          result = await this.processNaturalLanguageCommand(command, gameState);
        } catch (error) {
          result = {
            action: {
              type: 'UNKNOWN',
              success: false
            },
            gameStateChanges: {},
            narrative: {
              mainText: "I'm not sure how to process that command. Try something like 'explore Mars', 'research fusion power', or 'build mining facility on Europa'.",
              tone: 'neutral'
            },
            uiUpdates: {}
          };
        }
    }
    
    // Convert the result to an event entry
    const event = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      command: command,
      text: result.narrative.mainText,
      detail: result.narrative.detailText || null,
      tone: result.narrative.tone || 'neutral',
      timestamp: new Date().toISOString(),
      type: result.action.type
    };
    
    // Process any automatic events that should occur
    const eventResults = eventManager.processEvents();
    
    // Combine the command result with any automatic events
    return {
      action: result.action,
      gameStateChanges: {
        ...result.gameStateChanges,
        events: [event, ...eventResults.events],
        alerts: {
          add: eventResults.alerts.add,
          remove: eventResults.alerts.remove
        }
      },
      narrative: result.narrative,
      uiUpdates: result.uiUpdates || {}
    };
  }
  
  // Identify the type of command
  identifyCommandType(command) {
    for (const type in this.commandPatterns) {
      for (const pattern of this.commandPatterns[type]) {
        if (pattern.test(command)) {
          return type;
        }
      }
    }
    return 'NATURAL_LANGUAGE';
  }
  
  // Process explore commands
  processExploreCommand(command, gameState, explorationManager) {
    let target = null;
    
    // Extract target from command
    for (const pattern of this.commandPatterns.EXPLORE) {
      const match = command.match(pattern);
      if (match && match[1]) {
        target = match[1].trim();
        break;
      }
    }
    
    if (!target) {
      return {
        action: {
          type: 'EXPLORATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: "Please specify what you'd like to explore. For example, 'explore Mars' or 'explore Alpha Centauri'.",
          tone: 'neutral'
        }
      };
    }
    
    // Find the target in the game state
    let targetId = null;
    
    // Check for system names
    const system = gameState.starSystems.find(sys => 
      sys.name.toLowerCase() === target.toLowerCase() ||
      sys.id.toLowerCase() === target.toLowerCase()
    );
    
    if (system) {
      targetId = system.id;
    } else {
      // Check for planet/moon names across all systems
      for (const sys of gameState.starSystems) {
        // Check planets
        const planet = sys.bodies.find(body => 
          body.name.toLowerCase() === target.toLowerCase() ||
          body.id.toLowerCase() === target.toLowerCase()
        );
        
        if (planet) {
          targetId = planet.id;
          break;
        }
        
        // Check moons
        for (const body of sys.bodies) {
          if (body.moons) {
            const moon = body.moons.find(m => 
              m.name.toLowerCase() === target.toLowerCase() ||
              m.id.toLowerCase() === target.toLowerCase()
            );
            
            if (moon) {
              targetId = moon.id;
              break;
            }
          }
        }
        
        if (targetId) break;
      }
    }
    
    if (!targetId) {
      return {
        action: {
          type: 'EXPLORATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `I couldn't find "${target}" in your known celestial bodies. Try exploring a known location or check your star charts.`,
          tone: 'neutral'
        }
      };
    }
    
    // Perform the exploration
    try {
      const explorationResult = explorationManager.exploreLocation(targetId);
      
      // Update the game state with exploration results
      const newStarSystems = gameState.starSystems.map(sys => {
        if (sys.id === targetId) {
          return {
            ...sys,
            explored: true
          };
        }
        
        // Update system bodies if needed
        return {
          ...sys,
          bodies: sys.bodies.map(body => {
            if (body.id === targetId) {
              return {
                ...body,
                explored: true
              };
            }
            
            // Update moons if needed
            if (body.moons) {
              return {
                ...body,
                moons: body.moons.map(moon => {
                  if (moon.id === targetId) {
                    return {
                      ...moon,
                      explored: true
                    };
                  }
                  return moon;
                })
              };
            }
            
            return body;
          })
        };
      });
      
      return {
        action: {
          type: 'EXPLORATION',
          target: targetId,
          success: explorationResult.success
        },
        gameStateChanges: {
          starSystems: newStarSystems,
          discoveryContext: {
            ...gameState.discoveryContext,
            lastExplored: targetId,
            discoveries: explorationResult.discoveries || []
          }
        },
        narrative: {
          mainText: explorationResult.text,
          detailText: explorationResult.discoveries ? `You made ${explorationResult.discoveries.length} discoveries.` : null,
          tone: 'explore',
          imagePrompt: `space exploration of ${target}, cosmic view, stars`
        }
      };
      
    } catch (error) {
      return {
        action: {
          type: 'EXPLORATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `There was a problem exploring ${target}: ${error.message}`,
          tone: 'negative'
        }
      };
    }
  }
  
  // Process research commands
  processResearchCommand(command, gameState, techManager) {
    let technology = null;
    
    // Extract technology from command
    for (const pattern of this.commandPatterns.RESEARCH) {
      const match = command.match(pattern);
      if (match && match[1]) {
        technology = match[1].trim();
        break;
      }
    }
    
    if (!technology) {
      // List available technologies
      const availableTechs = gameState.technologies.available;
      
      return {
        action: {
          type: 'RESEARCH',
          success: true,
          subtype: 'LIST'
        },
        gameStateChanges: {},
        narrative: {
          mainText: 'Available technologies for research:',
          detailText: availableTechs.map(tech => `${tech.name}: ${tech.description} (Cost: ${tech.cost} knowledge)`).join('\n'),
          tone: 'neutral'
        }
      };
    }
    
    // Find the technology in available technologies
    let targetTech = null;
    let exactMatch = false;
    
    for (const tech of gameState.technologies.available) {
      // Check for exact match
      if (tech.name.toLowerCase() === technology.toLowerCase() || 
          tech.id.toLowerCase() === technology.toLowerCase()) {
        targetTech = tech;
        exactMatch = true;
        break;
      }
      
      // Check for partial match
      if (tech.name.toLowerCase().includes(technology.toLowerCase())) {
        targetTech = tech;
        // Don't break on partial match to allow for exact matches
      }
    }
    
    if (!targetTech) {
      return {
        action: {
          type: 'RESEARCH',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `I couldn't find "${technology}" in your available research options. Use "research" to see available technologies.`,
          tone: 'neutral'
        }
      };
    }
    
    // If already researching something else
    if (gameState.technologies.researching && gameState.technologies.researching.id !== targetTech.id) {
      const currentResearch = gameState.technologies.researching;
      
      return {
        action: {
          type: 'RESEARCH',
          success: false,
          subtype: 'ALREADY_RESEARCHING'
        },
        gameStateChanges: {},
        narrative: {
          mainText: `Your research teams are already focused on ${currentResearch.name} (${currentResearch.progress}/${currentResearch.cost}). Do you want to abandon this research and switch focus?`,
          tone: 'warning'
        }
      };
    }
    
    // Start or continue research
    try {
      let updatedState;
      let narrative;
      
      if (gameState.technologies.researching && gameState.technologies.researching.id === targetTech.id) {
        // Continue existing research
        const progress = gameState.technologies.researching.progress;
        const cost = gameState.technologies.researching.cost;
        
        narrative = {
          mainText: `Your scientists continue their work on ${targetTech.name}. Current progress: ${progress}/${cost} (${Math.round(progress / cost * 100)}%)`,
          tone: 'neutral'
        };
        
        updatedState = gameState;
      } else {
        // Start new research
        updatedState = techManager.startResearch(targetTech.id);
        
        narrative = {
          mainText: `Your scientists begin researching ${targetTech.name}. This technology will expand your civilization's capabilities when completed.`,
          detailText: `Research cost: ${targetTech.cost} knowledge points.`,
          tone: 'positive'
        };
      }
      
      return {
        action: {
          type: 'RESEARCH',
          target: targetTech.id,
          success: true,
          subtype: 'START'
        },
        gameStateChanges: {
          technologies: updatedState.technologies
        },
        narrative: narrative
      };
      
    } catch (error) {
      return {
        action: {
          type: 'RESEARCH',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `There was a problem researching ${technology}: ${error.message}`,
          tone: 'negative'
        }
      };
    }
  }
  
  // Process build commands
  processBuildCommand(command, gameState, resourceManager) {
    let facility = null;
    let location = null;
    
    // Extract facility and location from command
    for (const pattern of this.commandPatterns.BUILD) {
      const match = command.match(pattern);
      if (match && match[1] && match[2]) {
        facility = match[1].trim();
        location = match[2].trim();
        break;
      }
    }
    
    if (!facility || !location) {
      return {
        action: {
          type: 'CONSTRUCTION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: "Please specify what you'd like to build and where. For example, 'build mining facility on Mars' or 'construct research lab on Europa'.",
          tone: 'neutral'
        }
      };
    }
    
    // Determine facility type
    const facilityType = this.determineFacilityType(facility);
    
    if (!facilityType) {
      return {
        action: {
          type: 'CONSTRUCTION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `I don't recognize the facility type "${facility}". Try building a mining facility, power plant, research lab, or habitat.`,
          tone: 'neutral'
        }
      };
    }
    
    // Find the location in game state
    let targetLocation = null;
    
    // Check each system for the location
    for (const system of gameState.starSystems) {
      // Check if it's the system itself
      if (system.name.toLowerCase() === location.toLowerCase() ||
          system.id.toLowerCase() === location.toLowerCase()) {
        targetLocation = {
          id: system.id,
          name: system.name,
          type: 'SYSTEM'
        };
        break;
      }
      
      // Check planets in the system
      for (const body of system.bodies) {
        if (body.name.toLowerCase() === location.toLowerCase() ||
            body.id.toLowerCase() === location.toLowerCase()) {
          targetLocation = {
            id: body.id,
            name: body.name,
            type: 'PLANET',
            systemId: system.id,
            systemName: system.name
          };
          break;
        }
        
        // Check moons
        if (body.moons) {
          for (const moon of body.moons) {
            if (moon.name.toLowerCase() === location.toLowerCase() ||
                moon.id.toLowerCase() === location.toLowerCase()) {
              targetLocation = {
                id: moon.id,
                name: moon.name,
                type: 'MOON',
                planetId: body.id,
                planetName: body.name,
                systemId: system.id,
                systemName: system.name
              };
              break;
            }
          }
          
          if (targetLocation) break;
        }
      }
      
      if (targetLocation) break;
    }
    
    if (!targetLocation) {
      return {
        action: {
          type: 'CONSTRUCTION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `I couldn't find "${location}" in your known celestial bodies. Try building on a known location.`,
          tone: 'neutral'
        }
      };
    }
    
    // Check if we can build on this location type
    if (targetLocation.type === 'SYSTEM') {
      // Can only build specific things in a system (like space stations)
      if (facilityType.locationType !== 'SYSTEM') {
        return {
          action: {
            type: 'CONSTRUCTION',
            success: false
          },
          gameStateChanges: {},
          narrative: {
            mainText: `You can't build a ${facilityType.name} directly in a star system. Choose a planet or moon instead.`,
            tone: 'negative'
          }
        };
      }
    }
    
    // Check resource requirements
    if (!resourceManager.canAfford(facilityType.cost)) {
      return {
        action: {
          type: 'CONSTRUCTION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `You don't have enough resources to build a ${facilityType.name}. Required: ${Object.entries(facilityType.cost).map(([key, val]) => `${key}: ${val}`).join(', ')}`,
          tone: 'negative'
        }
      };
    }
    
    // Deduct resources
    let updatedResources;
    try {
      updatedResources = resourceManager.spendResources(facilityType.cost);
    } catch (error) {
      return {
        action: {
          type: 'CONSTRUCTION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: error.message,
          tone: 'negative'
        }
      };
    }
    
    // Create the new facility
    const facilityId = `${facilityType.id}-${Date.now().toString(36)}`;
    const completionTime = gameState.turnNumber + facilityType.buildTime;
    
    const newFacility = {
      id: facilityId,
      type: facilityType.id,
      name: facilityType.name,
      status: 'BUILDING',
      completionTurn: completionTime
    };
    
    // Add the project to active projects
    const newActiveProjects = [
      ...gameState.activeProjects,
      {
        id: `project-${Date.now().toString(36)}`,
        type: 'CONSTRUCTION',
        subtype: facilityType.id,
        facilityId: facilityId,
        location: targetLocation.id,
        locationName: targetLocation.name,
        completionTurn: completionTime,
        resourcesPerTurn: facilityType.maintenanceCost || {}
      }
    ];
    
    // Update the star systems with the new facility
    const updatedStarSystems = gameState.starSystems.map(system => {
      if (system.id === (targetLocation.systemId || targetLocation.id)) {
        // Update system or its bodies
        if (targetLocation.type === 'SYSTEM') {
          // Add facility to system
          return {
            ...system,
            facilities: [...(system.facilities || []), newFacility]
          };
        } else {
          // Update a planet or moon in the system
          return {
            ...system,
            bodies: system.bodies.map(body => {
              if (body.id === (targetLocation.planetId || targetLocation.id)) {
                // Update planet or its moons
                if (targetLocation.type === 'PLANET') {
                  // Add facility to planet
                  return {
                    ...body,
                    facilities: [...(body.facilities || []), newFacility]
                  };
                } else {
                  // Update a moon of this planet
                  return {
                    ...body,
                    moons: (body.moons || []).map(moon => {
                      if (moon.id === targetLocation.id) {
                        // Add facility to moon
                        return {
                          ...moon,
                          facilities: [...(moon.facilities || []), newFacility]
                        };
                      }
                      return moon;
                    })
                  };
                }
              }
              return body;
            })
          };
        }
      }
      return system;
    });
    
    return {
      action: {
        type: 'CONSTRUCTION',
        target: targetLocation.id,
        success: true,
        subtype: facilityType.id
      },
      gameStateChanges: {
        resources: updatedResources,
        activeProjects: newActiveProjects,
        starSystems: updatedStarSystems
      },
      narrative: {
        mainText: `Construction of a new ${facilityType.name} on ${targetLocation.name} has begun. Estimated completion in ${facilityType.buildTime} turns.`,
        detailText: facilityType.description,
        tone: 'positive'
      },
      uiUpdates: {
        highlightLocations: [targetLocation.id],
        notifications: [
          { type: 'CONSTRUCTION_STARTED', message: `Building ${facilityType.name} on ${targetLocation.name}` }
        ]
      }
    };
  }
  
  // Process colonize commands
  processColonizeCommand(command, gameState, resourceManager) {
    let target = null;
    
    // Extract target from command
    for (const pattern of this.commandPatterns.COLONIZE) {
      const match = command.match(pattern);
      if (match && match[1]) {
        target = match[1].trim();
        break;
      }
    }
    
    if (!target) {
      return {
        action: {
          type: 'COLONIZATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: "Please specify where you'd like to establish a colony. For example, 'colonize Mars' or 'settle Europa'.",
          tone: 'neutral'
        }
      };
    }
    
    // Find the target in the game state
    let targetPlanet = null;
    let parentSystem = null;
    
    // Check each system for the target
    for (const system of gameState.starSystems) {
      // Check planets in the system
      for (const body of system.bodies) {
        if (body.name.toLowerCase() === target.toLowerCase() ||
            body.id.toLowerCase() === target.toLowerCase()) {
          targetPlanet = body;
          parentSystem = system;
          break;
        }
        
        // Check moons
        if (body.moons) {
          for (const moon of body.moons) {
            if (moon.name.toLowerCase() === target.toLowerCase() ||
                moon.id.toLowerCase() === target.toLowerCase()) {
              targetPlanet = moon;
              parentSystem = system;
              break;
            }
          }
          
          if (targetPlanet) break;
        }
      }
      
      if (targetPlanet) break;
    }
    
    if (!targetPlanet) {
      return {
        action: {
          type: 'COLONIZATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `I couldn't find "${target}" in your known celestial bodies. Try colonizing a known planet or moon.`,
          tone: 'neutral'
        }
      };
    }
    
    // Check if already colonized
    if (targetPlanet.colonized) {
      return {
        action: {
          type: 'COLONIZATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `${targetPlanet.name} is already colonized.`,
          tone: 'neutral'
        }
      };
    }
    
    // Check if explored
    if (!targetPlanet.explored) {
      return {
        action: {
          type: 'COLONIZATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `You need to explore ${targetPlanet.name} before attempting colonization. Send a survey mission first.`,
          tone: 'warning'
        }
      };
    }
    
    // Define colonization cost
    const colonizationCost = {
      energy: 500,
      minerals: 300,
      population: 1e6 // 1 million
    };
    
    // Check resource requirements
    if (!resourceManager.canAfford(colonizationCost)) {
      return {
        action: {
          type: 'COLONIZATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: `You don't have enough resources to establish a colony on ${targetPlanet.name}. Required: ${Object.entries(colonizationCost).map(([key, val]) => `${key}: ${val}`).join(', ')}`,
          tone: 'negative'
        }
      };
    }
    
    // Deduct resources
    let updatedResources;
    try {
      updatedResources = resourceManager.spendResources(colonizationCost);
    } catch (error) {
      return {
        action: {
          type: 'COLONIZATION',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: error.message,
          tone: 'negative'
        }
      };
    }
    
    // Create the new colony
    const colonyId = `colony-${Date.now().toString(36)}`;
    
    const newColony = {
      id: colonyId,
      planetId: targetPlanet.id,
      systemId: parentSystem.id,
      name: targetPlanet.name,
      founded: gameState.gameTime.year,
      population: 1e6, // Initial population
      focus: 'BALANCED',
      specialization: null
    };
    
    // Add the colony
    const newColonies = [...gameState.colonies, newColony];
    
    // Update the planet to mark as colonized
    const updatedStarSystems = gameState.starSystems.map(system => {
      if (system.id === parentSystem.id) {
        return {
          ...system,
          bodies: system.bodies.map(body => {
            if (body.id === targetPlanet.id) {
              // Update the planet
              return {
                ...body,
                colonized: true,
                population: 1e6,
                facilities: [
                  {
                    id: `habitat-${Date.now().toString(36)}`,
                    type: 'HABITAT',
                    status: 'OPERATIONAL'
                  }
                ]
              };
            } else if (body.moons) {
              // Check if it's a moon of this planet
              return {
                ...body,
                moons: body.moons.map(moon => {
                  if (moon.id === targetPlanet.id) {
                    // Update the moon
                    return {
                      ...moon,
                      colonized: true,
                      population: 1e6,
                      facilities: [
                        {
                          id: `habitat-${Date.now().toString(36)}`,
                          type: 'HABITAT',
                          status: 'OPERATIONAL'
                        }
                      ]
                    };
                  }
                  return moon;
                })
              };
            }
            return body;
          })
        };
      }
      return system;
    });
    
    return {
      action: {
        type: 'COLONIZATION',
        target: targetPlanet.id,
        success: true
      },
      gameStateChanges: {
        resources: updatedResources,
        colonies: newColonies,
        starSystems: updatedStarSystems
      },
      narrative: {
        mainText: `You've successfully established a colony on ${targetPlanet.name}! The first settlers have begun building habitats and preparing the foundation for a growing settlement.`,
        detailText: `Initial population: 1 million. Focus: Balanced development.`,
        tone: 'positive',
        imagePrompt: `space colony on ${targetPlanet.name}, cosmic view, futuristic settlement`
      },
      uiUpdates: {
        highlightLocations: [targetPlanet.id],
        notifications: [
          { type: 'COLONY_ESTABLISHED', message: `New colony on ${targetPlanet.name}` }
        ]
      }
    };
  }
  
  // Process status command
  processStatusCommand(gameState) {
    // Prepare civilization overview
    const numPlanets = gameState.colonies.length;
    const totalPopulation = gameState.colonies.reduce((sum, colony) => sum + colony.population, 0);
    const currentResearch = gameState.technologies.researching 
      ? `${gameState.technologies.researching.name} (${Math.round(gameState.technologies.researching.progress / gameState.technologies.researching.cost * 100)}% complete)`
      : 'None';
    
    // List active projects
    const activeProjects = gameState.activeProjects.map(project => {
      const turnsRemaining = project.completionTurn - gameState.turnNumber;
      return `${project.subtype} at ${project.locationName} (${turnsRemaining} turns remaining)`;
    }).join('\n');
    
    return {
      action: {
        type: 'STATUS',
        success: true
      },
      gameStateChanges: {},
      narrative: {
        mainText: `Civilization Status - Year ${gameState.gameTime.year}, Cycle ${gameState.gameTime.cycle}`,
        detailText: `Colonies: ${numPlanets}\nTotal Population: ${(totalPopulation / 1e9).toFixed(2)} billion\nCurrent Research: ${currentResearch}\n\nActive Projects:\n${activeProjects || 'None'}`,
        tone: 'neutral'
      }
    };
  }
  
  // Process help command
  processHelpCommand() {
    return {
      action: {
        type: 'HELP',
        success: true
      },
      gameStateChanges: {},
      narrative: {
        mainText: 'Command Guide:',
        detailText: 
          'Here are some commands you can use:\n\n' +
          'EXPLORATION:\n' +
          '- "explore [location]" - Survey a planet, moon, or star system\n\n' +
          'RESEARCH:\n' +
          '- "research" - List available technologies\n' +
          '- "research [technology]" - Begin researching a specific technology\n\n' +
          'CONSTRUCTION:\n' +
          '- "build [facility] on [location]" - Construct a facility\n\n' +
          'COLONIZATION:\n' +
          '- "colonize [planet/moon]" - Establish a new colony\n\n' +
          'INFORMATION:\n' +
          '- "status" - View your civilization\'s current status\n\n' +
          'You can also use natural language to express commands. Try something like "establish a mining outpost on Mars" or "focus our scientists on developing fusion technology."',
        tone: 'neutral'
      }
    };
  }
  
  // Process natural language commands using the LLM
  async processNaturalLanguageCommand(command, gameState) {
    try {
      // Prepare the request for the LLM
      const completion = await websim.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are the game engine for "Stellar Evolution", a space exploration and civilization-building game.
Process the user's natural language command and return a structured JSON response.
The game is turn-based with resource management, technology research, and exploration.
Maintain consistency with the game's established lore and mechanics.
Parse the command intent and return a valid action type.

Valid action types:
- EXPLORATION: Discovering new celestial bodies
- RESEARCH: Advancing technologies
- CONSTRUCTION: Building structures or vessels
- COLONIZATION: Establishing new settlements
- PRODUCTION: Manufacturing resources or items
- DIPLOMACY: Interacting with other civilizations
- MANAGEMENT: Redistributing resources or population

Response format:
{
  "action": {
    "type": string,
    "subtype"?: string,
    "target"?: string,
    "resources"?: object,
    "success": boolean
  },
  "gameStateChanges": {
    // Any changes to the game state
  },
  "narrative": {
    "mainText": string,
    "detailText"?: string,
    "tone": "positive" | "negative" | "neutral" | "urgent" | "explore"
  },
  "uiUpdates"?: {
    "highlightLocations"?: string[],
    "notifications"?: array
  }
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Process this user command for the Stellar Evolution game: "${command}"

Current game state summary:
Turn: ${gameState.turnNumber}
Year: ${gameState.gameTime.year}
Resources: Energy: ${gameState.resources.energy}, Minerals: ${gameState.resources.minerals}, Knowledge: ${gameState.resources.knowledge}, Population: ${gameState.resources.population}
Known star systems: ${gameState.starSystems.map(s => s.name).join(', ')}
Colonies: ${gameState.colonies.map(c => c.name).join(', ')}
Researched technologies: ${gameState.technologies.researched.map(t => t.name).join(', ')}
Currently researching: ${gameState.technologies.researching ? gameState.technologies.researching.name : 'Nothing'}

Respond with only the JSON object, no explanation or other text.`
              }
            ]
          }
        ],
        json: true
      });
      
      // Parse the response
      let result;
      try {
        result = JSON.parse(completion.content);
      } catch (error) {
        console.error("Error parsing LLM response:", error);
        throw new Error("Failed to process command");
      }
      
      // Validate the result has the required structure
      if (!result.action || !result.action.type || !result.narrative || !result.narrative.mainText) {
        throw new Error("Invalid response format from language model");
      }
      
      return result;
      
    } catch (error) {
      console.error("Error in natural language processing:", error);
      
      // Fallback response
      return {
        action: {
          type: 'UNKNOWN',
          success: false
        },
        gameStateChanges: {},
        narrative: {
          mainText: "I couldn't process that command. Please try something more specific or use a basic command format.",
          tone: 'negative'
        },
        uiUpdates: {}
      };
    }
  }
  
  // Helper method to determine facility type from natural language
  determineFacilityType(facilityText) {
    const facilityTypes = {
      'MINING_FACILITY': {
        id: 'MINING_FACILITY',
        name: 'Mining Facility',
        description: 'Extracts and processes mineral resources.',
        patterns: ['mining', 'mine', 'extractor', 'mineral'],
        locationType: 'PLANET',
        cost: { energy: 200, minerals: 100 },
        buildTime: 3,
        maintenanceCost: { energy: 10 }
      },
      'POWER_PLANT': {
        id: 'POWER_PLANT',
        name: 'Power Plant',
        description: 'Generates energy from various sources.',
        patterns: ['power', 'energy', 'generator', 'plant'],
        locationType: 'PLANET',
        cost: { minerals: 150 },
        buildTime: 3,
        maintenanceCost: {}
      },
      'RESEARCH_LAB': {
        id: 'RESEARCH_LAB',
        name: 'Research Laboratory',
        description: 'Conducts scientific research and generates knowledge.',
        patterns: ['research', 'lab', 'laboratory', 'science'],
        locationType: 'PLANET',
        cost: { energy: 150, minerals: 100 },
        buildTime: 4,
        maintenanceCost: { energy: 15 }
      },
      'HABITAT': {
        id: 'HABITAT',
        name: 'Habitat Dome',
        description: 'Living quarters for colonists.',
        patterns: ['habitat', 'housing', 'dome', 'living'],
        locationType: 'PLANET',
        cost: { energy: 100, minerals: 200 },
        buildTime: 5,
        maintenanceCost: { energy: 5 }
      },
      'ORBITAL_STATION': {
        id: 'ORBITAL_STATION',
        name: 'Orbital Station',
        description: 'Space station in orbit around a celestial body.',
        patterns: ['station', 'orbital', 'space station'],
        locationType: 'SYSTEM',
        cost: { energy: 300, minerals: 250 },
        buildTime: 6,
        maintenanceCost: { energy: 20 }
      }
    };
    
    // Try to match the facility text to a known type
    for (const typeId in facilityTypes) {
      const type = facilityTypes[typeId];
      
      for (const pattern of type.patterns) {
        if (facilityText.toLowerCase().includes(pattern)) {
          return type;
        }
      }
    }
    
    return null;
  }
}

export default CommandProcessor;

