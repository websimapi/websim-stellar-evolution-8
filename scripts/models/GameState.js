class GameState {
  static createNewGame() {
    return {
      // Basic game information
      turnNumber: 1,
      gameTime: {
        year: 2150,
        cycle: 1
      },
      
      // Resource information
      resources: {
        energy: 1000,
        minerals: 800,
        knowledge: 500,
        population: 1.2e9 // 1.2 billion
      },
      
      // Production rates (per cycle)
      production: {
        energy: 50,
        minerals: 30,
        knowledge: 20,
        population: 0.01e9 // 10 million
      },
      
      // Star systems discovered
      starSystems: [
        {
          id: 'sol-system',
          name: 'Sol System',
          discovered: true,
          explored: true,
          type: 'G-type star',
          position: { x: 0, y: 0, z: 0 },
          bodies: [
            {
              id: 'earth',
              name: 'Earth',
              type: 'terrestrial',
              colonized: true,
              resources: {
                energy: { amount: 'moderate', extraction: 1.0 },
                minerals: { amount: 'moderate', extraction: 1.0 }
              },
              facilities: [
                { id: 'power-plant-1', type: 'SOLAR_ARRAY', status: 'OPERATIONAL' },
                { id: 'mining-complex-1', type: 'MINING_COMPLEX', status: 'OPERATIONAL' },
                { id: 'research-lab-1', type: 'RESEARCH_CENTER', status: 'OPERATIONAL' }
              ],
              population: 1.2e9
            },
            {
              id: 'mars',
              name: 'Mars',
              type: 'terrestrial',
              colonized: false,
              resources: {
                energy: { amount: 'low', extraction: 0.6 },
                minerals: { amount: 'high', extraction: 1.5 }
              },
              facilities: [],
              population: 0
            },
            {
              id: 'jupiter',
              name: 'Jupiter',
              type: 'gas-giant',
              colonized: false,
              resources: {
                energy: { amount: 'high', extraction: 1.5 },
                minerals: { amount: 'low', extraction: 0.3 }
              },
              moons: [
                {
                  id: 'europa',
                  name: 'Europa',
                  type: 'ice-moon',
                  colonized: false,
                  resources: {
                    energy: { amount: 'low', extraction: 0.5 },
                    minerals: { amount: 'moderate', extraction: 1.0 }
                  }
                }
              ],
              facilities: [],
              population: 0
            }
          ]
        }
      ],
      
      // Technologies
      technologies: {
        researched: [
          { id: 'basic-agriculture', name: 'Basic Agriculture', level: 1 },
          { id: 'solar-power', name: 'Solar Power', level: 1 },
          { id: 'combustion-engine', name: 'Combustion Engine', level: 1 }
        ],
        researching: null,
        available: [
          { id: 'fusion-power', name: 'Fusion Power', requirements: ['solar-power'], cost: 1000, progress: 0 },
          { id: 'ion-propulsion', name: 'Ion Propulsion', requirements: ['combustion-engine'], cost: 800, progress: 0 },
          { id: 'orbital-habitats', name: 'Orbital Habitats', requirements: ['basic-agriculture'], cost: 1200, progress: 0 }
        ]
      },
      
      // Colonies and outposts
      colonies: [
        {
          id: 'earth-colony',
          planetId: 'earth',
          systemId: 'sol-system',
          name: 'Earth',
          founded: 2100,
          population: 1.2e9,
          focus: 'BALANCED',
          specialization: null
        }
      ],
      
      // Fleet assets
      fleet: [
        {
          id: 'scout-1',
          name: 'Explorer I',
          type: 'SCOUT',
          status: 'OPERATIONAL',
          location: 'sol-system',
          capabilities: ['SURVEY', 'EXPLORATION']
        }
      ],
      
      // Game events and history
      events: [
        {
          id: 'event-001',
          type: 'GAME_START',
          text: 'You take leadership of humanity's stellar civilization in the year 2150. Earth is our home, but the stars await.',
          tone: 'positive',
          timestamp: new Date().toISOString(),
          command: null
        },
        {
          id: 'event-002',
          type: 'TUTORIAL',
          text: 'Your civilization has developed basic interplanetary capabilities. Try exploring your home system further or directing your scientists to research new technologies.',
          tone: 'neutral',
          timestamp: new Date().toISOString(),
          command: null
        }
      ],
      
      // Command history
      commandHistory: [],
      lastCommand: null,
      
      // Discoveries and context
      discoveryContext: {},
      
      // Active constructions and research
      activeProjects: [],
      
      // Alerts and notifications
      alerts: [],
      
      // Game settings
      settings: {
        speechEnabled: false,
        autoSave: true,
        notificationsEnabled: true
      }
    };
  }
}

export default GameState;

