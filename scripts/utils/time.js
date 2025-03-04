import ResourceManager from '../managers/ResourceManager.js';
import EventManager from '../managers/EventManager.js';
import TechnologyManager from '../managers/TechnologyManager.js';

// Process time that has elapsed since last play
export const processTimeElapsed = (gameState) => {
  // Current time
  const now = new Date();
  
  // Last time updated (from the last event timestamp or now if no events)
  const lastEventTime = gameState.events.length > 0
    ? new Date(gameState.events[0].timestamp)
    : now;
  
  // Time elapsed in seconds
  const elapsedSeconds = Math.floor((now - lastEventTime) / 1000);
  
  // If less than a minute has passed, don't update
  if (elapsedSeconds < 60) {
    return gameState;
  }
  
  // Calculate elapsed game time
  // 1 real minute = 1 game cycle
  const elapsedCycles = Math.floor(elapsedSeconds / 60);
  
  if (elapsedCycles <= 0) {
    return gameState;
  }
  
  // Initialize managers
  const resourceManager = new ResourceManager(gameState);
  const eventManager = new EventManager(gameState);
  const techManager = new TechnologyManager(gameState);
  
  // Update resources based on elapsed time
  const { resources, production } = resourceManager.updateResources(elapsedCycles);
  
  // Update game time
  let { year, cycle } = gameState.gameTime;
  cycle += elapsedCycles;
  
  // 10 cycles = 1 year
  const additionalYears = Math.floor(cycle / 10);
  if (additionalYears > 0) {
    year += additionalYears;
    cycle = cycle % 10;
  }
  
  // Progress research if any is active
  let updatedTechnologies = { ...gameState.technologies };
  if (gameState.technologies.researching) {
    // Calculate knowledge gained during elapsed time
    const knowledgePerCycle = production.knowledge || 0;
    const totalKnowledgeGained = knowledgePerCycle * elapsedCycles;
    
    // Update research progress
    const updatedState = techManager.progressResearch(totalKnowledgeGained);
    updatedTechnologies = updatedState.technologies;
  }
  
  // Process any events that should have occurred
  const { events: newEvents, alerts } = eventManager.processEvents();
  
  // Add time-based event
  newEvents.unshift({
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'TIME_ELAPSED',
    text: `Your empire has progressed ${elapsedCycles} cycles (${additionalYears} years) while you were away.`,
    tone: 'neutral',
    timestamp: new Date().toISOString()
  });
  
  // Update active projects
  const completedProjects = [];
  const remainingProjects = [];
  
  for (const project of gameState.activeProjects) {
    if (project.completionTurn <= gameState.turnNumber + elapsedCycles) {
      // Project completed
      completedProjects.push(project);
      
      // Add event for completion
      newEvents.push({
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'PROJECT_COMPLETED',
        text: `Construction of ${project.subtype} at ${project.locationName} has been completed.`,
        tone: 'positive',
        timestamp: new Date().toISOString()
      });
    } else {
      // Project still in progress
      remainingProjects.push(project);
    }
  }
  
  // Update facilities from completed projects
  const updatedStarSystems = updateFacilitiesForCompletedProjects(gameState.starSystems, completedProjects);
  
  // Remove completed alerts and add new ones
  const currentAlerts = [...gameState.alerts];
  for (const index of (alerts.remove || []).sort((a, b) => b - a)) {
    currentAlerts.splice(index, 1);
  }
  const updatedAlerts = [...currentAlerts, ...(alerts.add || [])];
  
  // Return updated game state
  return {
    ...gameState,
    gameTime: { year, cycle },
    resources,
    production,
    technologies: updatedTechnologies,
    events: [...newEvents, ...gameState.events],
    turnNumber: gameState.turnNumber + elapsedCycles,
    activeProjects: remainingProjects,
    starSystems: updatedStarSystems,
    alerts: updatedAlerts
  };
};

// Helper function to update facilities for completed projects
const updateFacilitiesForCompletedProjects = (starSystems, completedProjects) => {
  if (completedProjects.length === 0) return starSystems;
  
  return starSystems.map(system => {
    // Check if any projects are for this system
    const systemProjects = completedProjects.filter(p => {
      const location = p.location;
      
      // Check if it's directly for the system
      if (location === system.id) return true;
      
      // Check if it's for a body in this system
      for (const body of system.bodies) {
        if (location === body.id) return true;
        
        // Check if it's for a moon
        if (body.moons) {
          for (const moon of body.moons) {
            if (location === moon.id) return true;
          }
        }
      }
      
      return false;
    });
    
    if (systemProjects.length === 0) return system;
    
    // Update system facilities
    let updatedSystem = { ...system };
    
    // Update facilities directly on the system
    const systemDirectProjects = systemProjects.filter(p => p.location === system.id);
    if (systemDirectProjects.length > 0) {
      updatedSystem.facilities = (updatedSystem.facilities || []).map(facility => {
        const project = systemDirectProjects.find(p => p.facilityId === facility.id);
        if (project) {
          return { ...facility, status: 'OPERATIONAL' };
        }
        return facility;
      });
    }
    
    // Update facilities on bodies
    updatedSystem.bodies = updatedSystem.bodies.map(body => {
      // Check for projects on this body
      const bodyProjects = systemProjects.filter(p => p.location === body.id);
      
      if (bodyProjects.length > 0) {
        const updatedFacilities = (body.facilities || []).map(facility => {
          const project = bodyProjects.find(p => p.facilityId === facility.id);
          if (project) {
            return { ...facility, status: 'OPERATIONAL' };
          }
          return facility;
        });
        
        return { ...body, facilities: updatedFacilities };
      }
      
      // Check for projects on moons
      if (body.moons) {
        const updatedMoons = body.moons.map(moon => {
          const moonProjects = systemProjects.filter(p => p.location === moon.id);
          
          if (moonProjects.length > 0) {
            const updatedFacilities = (moon.facilities || []).map(facility => {
              const project = moonProjects.find(p => p.facilityId === facility.id);
              if (project) {
                return { ...facility, status: 'OPERATIONAL' };
              }
              return facility;
            });
            
            return { ...moon, facilities: updatedFacilities };
          }
          
          return moon;
        });
        
        return { ...body, moons: updatedMoons };
      }
      
      return body;
    });
    
    return updatedSystem;
  });
};

