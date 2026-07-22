import { useState, useCallback } from 'react';
import { api } from '../api/client.js';

export function useLobby() {
  const [lobby, setLobby] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [playerId, setPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (gameId: string, playerName: string, maxPlayers: number, settings?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createLobby({ gameId, playerName, maxPlayers, settings });
      setLobby(result.lobby);
      setPlayerId(result.playerId);
      // Retrieve existing players or just host
      const state = await api.getLobbyState(result.lobby.id);
      setPlayers(state.players);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const join = useCallback(async (code: string, playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.joinLobby(code, playerName);
      setLobby(result.lobby);
      setPlayerId(result.playerId);
      setPlayers(result.players);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleReady = useCallback(async (ready: boolean) => {
    if (!lobby) return;
    try {
      const result = await api.setReady(lobby.id, playerId, ready);
      setPlayers(result.players);
    } catch (e: any) {
      setError(e.message);
    }
  }, [lobby, playerId]);

  const start = useCallback(async () => {
    if (!lobby) return;
    setLoading(true);
    try {
      const result = await api.startGame(lobby.id, playerId);
      setLobby(result.lobby);
      setPlayers(result.players);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [lobby, playerId]);

  return { lobby, players, playerId, loading, error, create, join, toggleReady, start, setLobby, setPlayers };
}
