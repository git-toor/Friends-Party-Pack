import { yahtzeeRouter, createYahtzeeSession, getYahtzeeState, setWsBroadcast } from './YahtzeeRouter.js';
import type { GameServer } from '../shared/GameServer.js';

export const yahtzeeServer: GameServer = {
  createSession: (sessionId, playerCount) => createYahtzeeSession(sessionId, playerCount),
  getState: (sessionId, playerIndex) => getYahtzeeState(sessionId, playerIndex),
  setWsBroadcast: (sessionId, fn) => setWsBroadcast(sessionId, fn),
  getRouter: () => yahtzeeRouter,
};
