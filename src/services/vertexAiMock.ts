// src/services/vertexAiMock.ts
// Mocks Google Vertex AI for the smart dynamic assistant.

import { type SimulationState } from './crowdSimulator';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actionType?: 'route' | 'order' | 'info' | 'upgrade' | 'alerts';
  actionData?: any;
}

export const generateAIResponse = async (query: string, state: SimulationState): Promise<ChatMessage> => {
  // Simulate network delay for Vertex AI model prediction request
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

  const lowerQuery = query.toLowerCase();
  
  let text = "I'm not sure about that. I can help you find amenities, check crowd levels, or order food!";
  let actionType: ChatMessage['actionType'] = undefined;
  let actionData: any = undefined;

  // Context-aware intents
  if (lowerQuery.includes('food') || lowerQuery.includes('hungry') || lowerQuery.includes('eat')) {
    const northConcession = state.zones.find(z => z.id === 'concession-north');
    if (northConcession && northConcession.status === 'high') {
      text = `The North Concessions are very crowded (${northConcession.waitTimeMin} min wait). I recommend ordering through Google Pay directly to your seat, or checking the South Concourse.`;
      actionType = 'order';
    } else {
      text = "The Concessions are relatively clear. You can head there now, or order to your seat.";
      actionType = 'order';
    }
  } else if (lowerQuery.includes('bathroom') || lowerQuery.includes('restroom') || lowerQuery.includes('accessible')) {
    const restroom = state.zones.find(z => z.id === 'restroom-east');
    if (restroom && restroom.density > 60) {
      text = `East Restrooms are currently busy (${restroom.density}% capacity). I'd suggest the West Restrooms instead. I've highlighted an accessible route on your map.`;
      actionType = 'route';
    } else {
      text = "The East Restrooms are nearby and not too crowded. I've loaded the smartest route for you.";
      actionType = 'route';
      actionData = { targetId: 'restroom-east' };
    }
  } else if (lowerQuery.includes('alert') || lowerQuery.includes('what')) {
    const criticalZones = state.zones.filter(z => z.status === 'critical');
    if (criticalZones.length > 0) {
      text = `Warning: ${criticalZones.map(z=>z.name).join(', ')} are over 90% capacity. Please avoid these areas. Also, halftime is in ${state.halftimeCountdownMin} mins!`;
    } else {
      text = `All systems nominal. Halftime is in ${state.halftimeCountdownMin} minutes.`;
    }
    actionType = 'alerts';
  } else if (lowerQuery.includes('exit') || lowerQuery.includes('leave')) {
    text = `Currently, ${state.telemetry.exitsPerMin} people are leaving per minute. The quickest exit is via the East Gates. Want directions?`;
    actionType = 'route';
  } else if (lowerQuery.includes('upgrade') || lowerQuery.includes('seat')) {
    text = "Great! There are VIP seats available in Section 110 for $45. Would you like to proceed via Google Pay?";
    actionType = 'upgrade';
  } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
    text = "Hi there! I'm StadiumIQ. How can I help make your event experience better today?";
  }

  return {
    id: Date.now().toString(),
    sender: 'assistant',
    text,
    timestamp: new Date(),
    actionType,
    actionData
  };
};
