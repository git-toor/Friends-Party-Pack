import { monopolyRouter, createMonopolySession, getMonopolyState, setWsBroadcast } from './MonopolyRouter.js';
import type { GameServer } from '../shared/GameServer.js';

export const monopolyServer: GameServer = {
  createSession: (sessionId, playerCount) => createMonopolySession(sessionId, playerCount),
  getState: (sessionId, playerIndex) => getMonopolyState(sessionId, playerIndex),
  setWsBroadcast: (sessionId, fn) => setWsBroadcast(sessionId, fn),
  getRouter: () => monopolyRouter,
};
