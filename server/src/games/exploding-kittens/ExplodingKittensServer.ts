import type { GameServer } from '../shared/GameServer.js';
import { explodingKittensRouter, createExplodingKittensSession, getExplodingKittensState, setWsBroadcast } from './network/Router.js';

export const explodingKittensServer: GameServer = {
  createSession: (sessionId, playerCount, settings) =>
    createExplodingKittensSession(sessionId, playerCount, settings),
  getState: (sessionId, playerIndex) => getExplodingKittensState(sessionId, playerIndex),
  setWsBroadcast: (sessionId, fn) => setWsBroadcast(sessionId, fn),
  getRouter: () => explodingKittensRouter,
};
