const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any).error || 'Request failed');
  return data as T;
}

export const api = {
  createLobby: (body: { gameId: string; playerName: string; maxPlayers: number }) =>
    request<{ lobby: any; playerId: string }>('/lobby/create', { method: 'POST', body: JSON.stringify(body) }),

  joinLobby: (code: string, playerName: string) =>
    request<{ lobbyId: string; playerId: string; lobby: any; players: any[] }>('/lobby/join', { method: 'POST', body: JSON.stringify({ code, playerName }) }),

  setReady: (lobbyId: string, playerId: string, ready: boolean) =>
    request<any>('/lobby/ready', { method: 'POST', body: JSON.stringify({ lobbyId, playerId, ready }) }),

  startGame: (lobbyId: string, playerId: string) =>
    request<any>('/lobby/start', { method: 'POST', body: JSON.stringify({ lobbyId, playerId }) }),

  getLobbyState: (lobbyId: string) =>
    request<any>('/lobby/state', { method: 'POST', body: JSON.stringify({ lobbyId }) }),
};
