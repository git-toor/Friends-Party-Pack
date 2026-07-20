import { useState, useCallback, useRef, useEffect } from 'react';
import { DiceOverlay, type DiceOverlayHandle, type DieType, type PerDieConfig } from '../../components/DiceOverlay.js';
import { ScoreCard } from './ScoreCard.js';
import { Button } from '../../components/Button.js';
import type { YahtzeeCategory, YahtzeeTurn, YahtzeePlayerState, YahtzeeGameState } from './types.js';

const EMPTY_TURN: YahtzeeTurn = { dice: [0, 0, 0, 0, 0], kept: [false, false, false, false, false], rollPhase: 1, phase: 'WAITING_FOR_ROLL' };
const EMPTY_PLAYER = (): YahtzeePlayerState => ({ scores: {}, yahtzeeBonusCount: 0, isCurrentPlayer: false, totalScore: 0, availableCategories: [] });

function createInitialState(playerCount: number): YahtzeeGameState {
  return { currentPlayerIndex: 0, round: 1, totalRounds: 13, winners: [], started: true, isMyTurn: true, turn: { ...EMPTY_TURN }, players: Array.from({ length: playerCount }, () => EMPTY_PLAYER()) };
}

interface YahtzeeGameProps {
  playerCount?: number; playerIndex?: number; playerName?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string }[]; playerId?: string;
  diceAppearance?: Record<string, PerDieConfig>;
  remoteRoll?: number;
  remoteVectors?: any;
  gameStatePush?: any;
}

const bottomBarStyle: React.CSSProperties = { padding:'12px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:'auto' };

export default function YahtzeeGame({ playerCount=2, playerIndex=0, sessionId, players, playerName='You', diceAppearance, remoteRoll, remoteVectors, gameStatePush }: YahtzeeGameProps) {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [gs, setGs] = useState<YahtzeeGameState>(() => createInitialState(playerCount));
  const [rolling, setRolling] = useState(false);
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<boolean[]>([false,false,false,false,false]);

  useEffect(() => {
    if (!diceAppearance || Object.keys(diceAppearance).length === 0) return;
    const t = setInterval(async () => {
      if (diceRef.current?.configure) {
        await diceRef.current.configure(diceAppearance);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, [diceAppearance]);

  useEffect(() => {
    if (gameStatePush && gameStatePush.turn) {
      const pushTurn = gameStatePush.turn as any;
      setGs((prev: YahtzeeGameState) => {
        if (prev.turn.rollPhase === pushTurn.rollPhase &&
            JSON.stringify(prev.turn.kept) === JSON.stringify(pushTurn.kept) &&
            JSON.stringify(prev.turn.dice) === JSON.stringify(pushTurn.dice) &&
            prev.turn.phase === pushTurn.phase &&
            prev.currentPlayerIndex === gameStatePush.currentPlayerIndex &&
            prev.round === gameStatePush.round) {
          return prev;
        }
        return gameStatePush as YahtzeeGameState;
      });
      for (let i = 0; i < 5; i++) {
        diceRef.current?.setDieKept(i, pushTurn.kept?.[i] || false);
        diceRef.current?.setDieSelected(i, false);
      }
    }
  }, [gameStatePush]);

  useEffect(() => {
    if (remoteRoll && remoteRoll > 0 && remoteVectors) {
      const values = remoteVectors?.values || null;
      if (values && values.length > 0) {
        diceRef.current?.roll('d6', values.length, `@${values.join(',')}`)?.catch(() => {});
      }
    }
  }, [remoteRoll, remoteVectors]);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/games/yahtzee/state/${sessionId}?playerIndex=${playerIndex}`);
        const data = await res.json();
        if (data.turn) setGs(data);
      } catch {}
    })();
  }, [sessionId, playerIndex]);

  const turn = gs.turn;
  const myState = gs.players[tab] || gs.players[gs.currentPlayerIndex] || EMPTY_PLAYER();
  const isMe = gs.isMyTurn || !sessionId;
  const canRoll = turn.phase === 'WAITING_FOR_ROLL' && !rolling && isMe;
  const canKeep = turn.phase === 'WAITING_FOR_KEEP' && selected.some(s=>s) && !rolling && isMe;
  const canScore = turn.phase === 'WAITING_FOR_CATEGORY' && isMe;

  const handleRoll = useCallback(async () => {
    if (!canRoll) return;
    setRolling(true);
    setSelected([false,false,false,false,false]);
    diceRef.current?.resetDieVisuals();
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'ROLL'}}) });
      const data = await res.json();
      if (!res.ok || data.error) { console.error('Roll:', data.error); setRolling(false); return; }
      if (data.diceValues) {
        const suffix = '@' + data.diceValues.join(',');
        setGs(p => ({...p, turn:{...p.turn, dice:data.diceValues, phase:'WAITING_FOR_KEEP' as YahtzeeTurn['phase'], rollPhase: (p.turn.rollPhase+1) as 1|2|3}}));
        await diceRef.current?.roll('d6', 5, suffix);
      }
    } else {
      await diceRef.current?.roll('d6', 5);
      setGs(p => ({...p, turn:{...p.turn, dice:[0,0,0,0,0], phase:'WAITING_FOR_KEEP' as YahtzeeTurn['phase'], rollPhase:(p.turn.rollPhase+1) as 1|2|3}}));
    }
    setRolling(false);
  }, [canRoll, sessionId, playerIndex]);

  const handleDieTap = useCallback((index: number) => {
    if (turn.phase !== 'WAITING_FOR_KEEP' || rolling || turn.kept[index]) return;
    setSelected(p => {
      const n = [...p];
      n[index] = !n[index];
      diceRef.current?.setDieSelected(index, n[index]);
      return n;
    });
  }, [turn.phase, rolling, turn.kept]);

  const handleKeep = useCallback(async () => {
    if (!canKeep) return;
    const indices: number[] = [];
    selected.forEach((s,i) => { if(s) indices.push(i); });
    for (const i of indices) {
      diceRef.current?.setDieKept(i, true);
      diceRef.current?.setDieSelected(i, false);
    }
    setSelected([false,false,false,false,false]);
    if (sessionId) {
      await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'KEEP',payload:{indices}}}) });
    } else {
      setGs(p => {
        const kept=[...p.turn.kept]; for(const i of indices) kept[i]=true;
        const ph = (p.turn.rollPhase>=3||kept.every(k=>k))?'WAITING_FOR_CATEGORY':'WAITING_FOR_ROLL';
        return {...p, turn:{...p.turn, kept, phase:ph as any}};
      });
    }
  }, [canKeep, selected, sessionId, playerIndex]);

  const handleScore = useCallback(async (cat: YahtzeeCategory) => {
    if (!canScore || myState.scores[cat] !== undefined) return;
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'SCORE',payload:{category:cat}}}) });
      const data = await res.json();
      if (!res.ok || data.error) { console.error('Score:', data.error); return; }
      if (data.state) setGs(data.state);
    } else {
      const cats: YahtzeeCategory[] = ['ones','twos','threes','fours','fives','sixes','three_of_a_kind','four_of_a_kind','full_house','small_straight','large_straight','yahtzee','chance'];
      const c=[0,0,0,0,0,0,0]; for(const d of turn.dice) c[d]++;
      const s=turn.dice.reduce((a,b)=>a+b,0), sorted=[...turn.dice].sort((a,b)=>a-b);
      const calc = (cat: YahtzeeCategory): number => {
        switch(cat){case'ones':return c[1]*1;case'twos':return c[2]*2;case'threes':return c[3]*3;case'fours':return c[4]*4;case'fives':return c[5]*5;case'sixes':return c[6]*6;
        case'three_of_a_kind':return c.some(x=>x>=3)?s:0;case'four_of_a_kind':return c.some(x=>x>=4)?s:0;case'full_house':return c.includes(3)&&c.includes(2)?25:0;
        case'small_straight':for(let i=1;i<=3;i++){if(sorted.includes(i)&&sorted.includes(i+1)&&sorted.includes(i+2)&&sorted.includes(i+3))return 30;}return 0;
        case'large_straight':return sorted.every((v,i)=>v===i+1)||sorted.every((v,i)=>v===i+2)?40:0;case'yahtzee':return c.some(x=>x>=5)?50:0;case'chance':return s;default:return 0;}
      };
      const score = calc(cat);
      setGs(p => {
        const ps=[...p.players]; const pl={...ps[p.currentPlayerIndex]}; pl.scores={...pl.scores,[cat]:score};
        let u=0,l=0; for(const c of cats.slice(0,6)) u+=pl.scores[c as YahtzeeCategory]||0; for(const c of cats.slice(6)) l+=pl.scores[c as YahtzeeCategory]||0;
        pl.totalScore=u+(u>=63?35:0)+l;
        ps[p.currentPlayerIndex]=pl;
        const filled=Object.keys(pl.scores).length; let np=p.currentPlayerIndex, nr=p.round;
        if(filled>=13){ np++; if(np>=playerCount){np=0;nr++;} }
        return {...p, turn:{...EMPTY_TURN}, currentPlayerIndex:np, round:nr, players:ps, winners:nr>13?[0]:[]};
      });
    }
  }, [canScore, myState.scores, turn.dice, playerCount, sessionId, playerIndex]);

  useEffect(() => {
    if (gs.winners.length > 0) setTimeout(() => alert(`Winner: Player ${gs.winners[0]+1}`), 500);
  }, [gs.winners]);

  useEffect(() => {
    if (turn.kept.some(k => k)) {
      for (let i = 0; i < 5; i++) {
        if (turn.kept[i]) diceRef.current?.setDieKept(i, true);
      }
    }
  }, [turn.kept]);

  useEffect(() => {
    if (turn.phase !== 'WAITING_FOR_KEEP' || rolling) {
      setSelected([false,false,false,false,false]);
    }
  }, [turn.phase, rolling]);

  // TEMP DEBUG
  useEffect(() => { console.log('[PHASE]', turn.phase, 'rollPhase:', turn.rollPhase, 'rolling:', rolling, 'canKeep:', canKeep, 'selected:', selected.some(s=>s)); }, [turn.phase, turn.rollPhase, rolling, canKeep, selected]);

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <DiceOverlay ref={diceRef} onDieTap={handleDieTap} />
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:12, textAlign:'center', background:'rgba(26,26,46,0.85)' }}>
          <span style={{ fontSize:13, color:'#999' }}>
            Round {gs.round}/{gs.totalRounds} ·&nbsp;
            {(() => {
              const cn = players?.[gs.currentPlayerIndex]?.name || `Player ${gs.currentPlayerIndex+1}`;
              if (sessionId) return gs.isMyTurn ? <b style={{color:'#e94560'}}>Your turn</b> : <>{cn}'s turn</>;
              return `Player ${gs.currentPlayerIndex+1}'s turn (local)`;
            })()}
          </span>
        </div>
        <div style={{ flex:1, minHeight:0 }} />
        <div style={bottomBarStyle}>
          {canRoll && <Button size="lg" onClick={handleRoll}>🎲 Roll ({turn.rollPhase}/3)</Button>}
          {canKeep && <Button variant="secondary" size="lg" onClick={handleKeep}>🔒 Hold ({selected.filter(Boolean).length})</Button>}
          {turn.phase === 'WAITING_FOR_CATEGORY' && canScore && <span style={{color:'#fbbf24',fontSize:12}}>Select a category to score</span>}
          {!canRoll && !canKeep && !canScore && sessionId && <span style={{color:'#999',fontSize:14}}>Waiting...</span>}
          <div style={{ alignSelf:'stretch', maxHeight:'45vh', overflowY:'auto' }}>
            <div style={{ display:'flex', gap:4, marginBottom:6 }}>
              {gs.players.map((_:any,i:number) => (
                <button key={i} onClick={()=>setTab(i)} style={{
                  padding:'3px 10px', borderRadius:10, border:'none', fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
                  background: tab===i ? '#e94560' : '#0f3460', color:'#fff', opacity: i===gs.currentPlayerIndex ? 1 : 0.6,
                }}>{players?.[i]?.name||`P${i+1}`}</button>
              ))}
            </div>
            <ScoreCard scores={myState.scores} dice={tab===gs.currentPlayerIndex ? turn.dice : []}
              canScore={canScore && tab===gs.currentPlayerIndex} onScore={canScore && tab===gs.currentPlayerIndex ? handleScore : undefined}
              totalScore={myState.totalScore} playerName={players?.[tab]?.name||`Player ${tab+1}`} isCurrentPlayer={tab===gs.currentPlayerIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
