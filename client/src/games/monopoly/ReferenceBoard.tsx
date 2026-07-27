import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { loadDiceAppearance } from '../../components/DiceAppearance.js';
// @ts-ignore
import { COLORSETS } from '../../dice/colorsets.js';

interface ReferenceBoardProps {
  players: { position: number; bankrupt: boolean }[];
  propertyOwners?: Record<number, number>;
  propertyBuildings?: Record<number, number>;
  stepAnim?: { playerIndex: number; from: number; to: number } | null;
  playerCount: number;
  playerModels?: number[];
  onStepAnimDone?: () => void;
}

export interface ReferenceBoardHandle {
  rollDice: () => Promise<[number, number]>;
  rollDiceForced: (values: [number, number]) => Promise<void>;
}

const DEFAULT_CONFIG: { colorset: string; texture: string; material: string; textColor: string } = { colorset: 'glitterparty_3', texture: 'metal', material: 'metal', textColor: '#ffffff' };

function getColorsetColors(key: string | undefined): { bg: string; fg: string } {
  key = key || 'glitterparty';
  const cs = (COLORSETS as any)[key] || (COLORSETS as any)['glitterparty'] || {};
  const bg = Array.isArray(cs.background) ? cs.background[0] : (cs.background || '#ffffff');
  const fg = Array.isArray(cs.foreground) ? cs.foreground[0] : (cs.foreground || '#222222');
  return { bg, fg };
}

function buildDiceConfig(): any {
  const saved = loadDiceAppearance();
  const cfg0 = saved['dice_0'] || saved['dice_1'] || DEFAULT_CONFIG;
  const cfg1 = saved['dice_1'] || saved['dice_0'] || DEFAULT_CONFIG;
  const c0 = getColorsetColors(cfg0.colorset);
  const c1 = getColorsetColors(cfg1.colorset);
  return {
    dice0: { bg: c0.bg, fg: c0.fg, texture: cfg0.texture ? cfg0.texture : 'none', material: cfg0.material ? cfg0.material : 'none' },
    dice1: { bg: c1.bg, fg: c1.fg, texture: cfg1.texture ? cfg1.texture : 'none', material: cfg1.material ? cfg1.material : 'none' },
  };
}

let rollIdCounter = 0;

export const ReferenceBoard = forwardRef<ReferenceBoardHandle, ReferenceBoardProps>(
  function ReferenceBoard({ players, propertyOwners, propertyBuildings, stepAnim, playerCount, playerModels, onStepAnimDone }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const boardReadyRef = useRef(false);
    const prevPositionsRef = useRef<number[]>([]);
    const pendingRollsRef = useRef<Map<number, { resolve: (...args: any[]) => void }>>(new Map());
    const [playersReady, setPlayersReady] = useState(false);

    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (!event.data || !event.data.type) return;
        if (event.data.type === 'boardReady') {
          boardReadyRef.current = true;
          const dc = buildDiceConfig();
          iframeRef.current?.contentWindow?.postMessage({ type: 'setDiceConfig', config: dc }, '*');
          const positions = players.map(p => p.position);
          iframeRef.current?.contentWindow?.postMessage({
            type: 'addPlayers',
            count: playerCount,
            positions: positions,
            tokens: playerModels || players.map((_, i) => i),
          }, '*');
        }
        if (event.data.type === 'playersAdded') {
          prevPositionsRef.current = players.map(p => p.position);
          setPlayersReady(true);
        }
        if (event.data.type === 'diceResult') {
          const entry = pendingRollsRef.current.get(event.data.id);
          if (entry) {
            entry.resolve(event.data.values);
            pendingRollsRef.current.delete(event.data.id);
          }
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [playerCount]);

    useImperativeHandle(ref, () => ({
      rollDice: () => {
        return new Promise<[number, number]>((resolve) => {
          const id = ++rollIdCounter;
          pendingRollsRef.current.set(id, { resolve });
          const win = iframeRef.current?.contentWindow;
          if (win && boardReadyRef.current) {
            win.postMessage({ type: 'rollDice', id }, '*');
            setTimeout(() => {
              const entry = pendingRollsRef.current.get(id);
              if (entry) {
                entry.resolve([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
                pendingRollsRef.current.delete(id);
              }
            }, 8000);
          } else {
            resolve([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)]);
            pendingRollsRef.current.delete(id);
          }
        });
      },
      rollDiceForced: (values: [number, number]) => {
        return new Promise<void>((resolve) => {
          const id = ++rollIdCounter;
          pendingRollsRef.current.set(id, { resolve: () => resolve() });
          const win = iframeRef.current?.contentWindow;
          if (win && boardReadyRef.current) {
            win.postMessage({ type: 'rollDiceForced', id, values }, '*');
            setTimeout(() => {
              const entry = pendingRollsRef.current.get(id);
              if (entry) { entry.resolve(); pendingRollsRef.current.delete(id); }
            }, 8000);
          } else {
            pendingRollsRef.current.delete(id);
            resolve();
          }
        });
      },
    }), []);

    useEffect(() => {
      if (!boardReadyRef.current || !playersReady) return;
      const current = players.map(p => p.position);
      const prev = prevPositionsRef.current;
      for (let i = 0; i < current.length; i++) {
        if (!players[i].bankrupt && (prev.length <= i || prev[i] !== current[i])) {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'movePlayer',
            playerIndex: i,
            tileId: current[i],
          }, '*');
        }
      }
      prevPositionsRef.current = current;
    }, [playersReady, players.map(p => p.position).join(',')]);

    useEffect(() => {
      if (!boardReadyRef.current || !playersReady || !propertyOwners) return;
      for (const [tileId, ownerIdx] of Object.entries(propertyOwners)) {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'addPropertyMark',
          tileId: parseInt(tileId),
          playerIndex: ownerIdx,
        }, '*');
      }
    }, [playersReady, propertyOwners]);

    useEffect(() => {
      if (!boardReadyRef.current || !playersReady || !propertyBuildings) return;
      for (const [tileId, houses] of Object.entries(propertyBuildings)) {
        const num = houses as number;
        if (num >= 4) {
          iframeRef.current?.contentWindow?.postMessage({
            type: 'addHotel',
            tileId: parseInt(tileId),
          }, '*');
        } else {
          for (let i = 0; i < num; i++) {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'addHouse',
              tileId: parseInt(tileId),
            }, '*');
          }
        }
      }
    }, [playersReady, propertyBuildings]);

    return (
      <iframe
        ref={iframeRef}
        src="/board.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        title="Monopoly 3D Board"
      />
    );
  }
);
