import { ludoRouter, createLudoSession, getLudoState, setWsBroadcast } from './LudoRouter.js';

export const ludoServer = {
  createSession: (sessionId: string, playerCount: number) => createLudoSession(sessionId, playerCount),
  getState: (sessionId: string, playerIndex: number) => getLudoState(sessionId, playerIndex),
  setWsBroadcast: (sessionId: string, fn: (payload: any) => void) => setWsBroadcast(sessionId, fn),
  getRouter: () => ludoRouter,
};
