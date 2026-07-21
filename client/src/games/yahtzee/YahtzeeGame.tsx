import { useState, useCallback, useRef, useEffect } from 'react';
import { DiceOverlay, type DiceOverlayHandle, type DieType, type PerDieConfig } from '../../components/DiceOverlay.js';
import { ScoreCard } from './ScoreCard.js';
import { Button } from '../../components/Button.js';
import type { ChatMessage } from '../../components/ChatBox.js';
import type { YahtzeeCategory, YahtzeeTurn, YahtzeePlayerState, YahtzeeGameState } from './types.js';

const EMPTY_TURN: YahtzeeTurn = { dice: [0, 0, 0, 0, 0], kept: [false, false, false, false, false], rollPhase: 0, phase: 'WAITING_FOR_ROLL' };
const EMPTY_PLAYER = (): YahtzeePlayerState => ({ scores: {}, yahtzeeBonusCount: 0, isCurrentPlayer: false, totalScore: 0, availableCategories: [] });

function createInitialState(playerCount: number): YahtzeeGameState {
  const startIdx = Math.floor(Math.random() * playerCount);
  const players = Array.from({ length: playerCount }, (_, i) => {
    const p = EMPTY_PLAYER();
    p.isCurrentPlayer = i === startIdx;
    return p;
  });
  return { currentPlayerIndex: startIdx, round: 1, totalRounds: 13, winners: [], started: true, isMyTurn: true, turn: { ...EMPTY_TURN }, players };
}

interface YahtzeeGameProps {
  playerCount?: number; playerIndex?: number; playerName?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string }[]; playerId?: string;
  diceAppearance?: Record<string, PerDieConfig>;
  remoteRoll?: number;
  remoteVectors?: any;
  gameStatePush?: any;
}

export default function YahtzeeGame({ playerCount=2, playerIndex=0, sessionId, players, playerName='You', playerId='', diceAppearance, remoteRoll, remoteVectors, gameStatePush }: YahtzeeGameProps) {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [gs, setGs] = useState<YahtzeeGameState>(() => createInitialState(playerCount));
  const [rolling, setRolling] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [selected, setSelected] = useState<boolean[]>([false,false,false,false,false]);
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      setChatMsgs(prev => [...prev, (e as CustomEvent).detail as ChatMessage]);
    };
    window.addEventListener('chat-message', handler as EventListener);
    return () => window.removeEventListener('chat-message', handler as EventListener);
  }, []);

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
        const p = diceRef.current?.roll('d6', values.length, `@${values.join(',')}`);
        p?.catch(e => console.error('[YahtzeeGame] remote roll error:', e));
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
  const myState = gs.players[gs.currentPlayerIndex] || EMPTY_PLAYER();
  const isMe = gs.isMyTurn || !sessionId;
  const canRoll = turn.phase === 'WAITING_FOR_ROLL' && !rolling && isMe;
  const canKeep = turn.phase === 'WAITING_FOR_KEEP' && !rolling && isMe;
  const canScore = turn.phase === 'WAITING_FOR_CATEGORY' && isMe;
  const hasSel = selected.some(s=>s);

  const handleRoll = useCallback(async () => {
    if (!canRoll) return;
    setRolling(true);
    setSelected([false,false,false,false,false]);
    diceRef.current?.resetDieVisuals();
    const newPhase = (gs.turn.rollPhase + 1) as 0|1|2|3;
    const nextTurnPhase: YahtzeeTurn['phase'] = newPhase >= 3 ? 'WAITING_FOR_CATEGORY' : 'WAITING_FOR_KEEP';
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'ROLL'}}) });
      const data = await res.json();
      if (!res.ok || data.error) { console.error('Roll:', data.error); setRolling(false); return; }
      if (data.diceValues) {
        const suffix = '@' + data.diceValues.join(',');
        setGs(p => ({...p, turn:{...p.turn, dice:data.diceValues, phase:nextTurnPhase, rollPhase: newPhase}}));
        await diceRef.current?.roll('d6', 5, suffix);
      }
    } else {
      await diceRef.current?.roll('d6', 5);
      setGs(p => ({...p, turn:{...p.turn, dice:[0,0,0,0,0], phase:nextTurnPhase, rollPhase: newPhase}}));
    }
    setRolling(false);
  }, [canRoll, sessionId, playerIndex, gs.turn.rollPhase]);

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
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'KEEP',payload:{indices}}}) });
      const data = await res.json();
      if (data.state) setGs(data.state);
    } else {
      setGs(p => {
        const kept=[...p.turn.kept]; for(const i of indices) kept[i]=true;
        const ph = kept.every(k=>k)?'WAITING_FOR_CATEGORY':'WAITING_FOR_ROLL';
        return {...p, turn:{...p.turn, kept, phase:ph as any}};
      });
    }
  }, [canKeep, selected, sessionId, playerIndex]);

  const handleScoreNow = useCallback(async () => {
    if (!canKeep) return;
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'SCORE_NOW'}}) });
      const data = await res.json();
      if (data.state) setGs(data.state);
    } else {
      setGs(p => ({...p, turn:{...p.turn, phase:'WAITING_FOR_CATEGORY' as YahtzeeTurn['phase']}}));
    }
  }, [canKeep, sessionId, playerIndex]);

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
        let np = p.currentPlayerIndex + 1;
        let nr = p.round;
        if (np >= playerCount) { np = 0; nr++; }
        const winners = nr > p.totalRounds ? calculateWinnersLocal(ps) : [];
        return {...p, turn:{...EMPTY_TURN}, currentPlayerIndex:np, round:nr, players:ps, winners};
      });
    }
  }, [canScore, myState.scores, turn.dice, playerCount, sessionId, playerIndex]);

  useEffect(() => {
    if (gs.winners.length > 0) setTimeout(() => setShowGameOver(true), 500);
  }, [gs.winners]);

  useEffect(() => {
    if (gs.winners.length === 0 && showGameOver) setShowGameOver(false);
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

  const handleRematch = useCallback(async () => {
    if (!sessionId) {
      setGs(createInitialState(playerCount));
      setShowGameOver(false);
      return;
    }
    const res = await fetch('/api/games/yahtzee/rematch', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId}) });
    if (res.ok) setShowGameOver(false);
  }, [sessionId, playerCount]);

  const scorePlayers = gs.players.map((p, i) => ({
    name: players?.[i]?.name || `Player ${i+1}`,
    scores: p.scores,
    totalScore: p.totalScore,
    isCurrent: i === gs.currentPlayerIndex,
  }));

  return (
    <div style={{ width:'100%', height:'100%', position:'relative', display:'flex', flexDirection:'column' }}>
      <DiceOverlay ref={diceRef} onDieTap={handleDieTap} />
      {/* Top bar */}
      <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(26,26,46,0.85)', zIndex:1 }}>
        <span style={{ fontSize:12, color:'#999' }}>
          Round {gs.round}/{gs.totalRounds} ·&nbsp;
          {(() => {
            const cn = players?.[gs.currentPlayerIndex]?.name || `Player ${gs.currentPlayerIndex+1}`;
            if (sessionId) return gs.isMyTurn ? <b style={{color:'#e94560'}}>Your turn</b> : <>{cn}'s turn</>;
            return `Player ${gs.currentPlayerIndex+1}'s turn (local)`;
          })()}
        </span>
      </div>

      {/* Game area (dice + floating chat go here) */}
      <div style={{ flex:1, minHeight:0 }} />

      {/* Chat messages above buttons */}
      <div style={{ padding:'2px 12px', display:'flex', flexDirection:'column-reverse', alignItems:'center', gap:1, overflow:'hidden', maxHeight:72, zIndex:1 }}>
        {chatMsgs.slice(-4).map((m, i) => {
          const isMe = m.playerId === playerId;
          const allMsgs = chatMsgs.slice(-4);
          const isNewest = i === allMsgs.length - 1;
          return (
            <div key={m.id} style={{
              padding:'2px 10px', borderRadius:6, fontSize:11,
              background: isMe ? 'rgba(15,52,96,0.8)' : 'rgba(26,26,46,0.8)',
              color:'#ddd', maxWidth:'80%', textAlign:'center',
              animation: isNewest ? 'chatFadeIn 0.3s ease' : 'none',
            }}>
              <span style={{ color:'#e94560', fontWeight:600, marginRight:4 }}>
                {isMe ? 'You' : m.playerName}:
              </span>{m.text}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ padding:'8px 12px', display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap', zIndex:1 }}>
        {canRoll && <Button size="lg" onClick={handleRoll}>🎲 Roll ({turn.rollPhase + 1}/3)</Button>}
        {canKeep && <Button variant="secondary" size="lg" onClick={handleKeep}>{hasSel ? `🔒 Hold (${selected.filter(Boolean).length})` : '🎲 Roll All'}</Button>}
        {canKeep && <Button variant="primary" size="lg" onClick={handleScoreNow}>Score</Button>}
        {turn.phase === 'WAITING_FOR_CATEGORY' && isMe && <span style={{color:'#fbbf24',fontSize:11}}>Select a category to score</span>}
        {!canRoll && !canKeep && !(turn.phase === 'WAITING_FOR_CATEGORY' && isMe) && sessionId && <span style={{color:'#999',fontSize:13}}>Waiting...</span>}
      </div>

      {/* Scorecard */}
      <div style={{ padding:'4px 8px 60px', zIndex:1 }}>
        <ScoreCard players={scorePlayers} currentPlayerIndex={gs.currentPlayerIndex}
          dice={turn.dice} canScore={canScore} onScore={canScore ? handleScore : undefined} />
      </div>
      <style>{`@keyframes chatFadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {showGameOver && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex',
          flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:1000,
        }}>
          <div style={{
            background:'#16213e', borderRadius:12, padding:24, maxWidth:420, width:'90%',
            maxHeight:'80vh', overflow:'auto',
          }}>
            <h2 style={{ color:'#e94560', textAlign:'center', margin:'0 0 4px', fontSize:20 }}>
              Game Over!
            </h2>
            <p style={{ color:'#fbbf24', textAlign:'center', margin:'0 0 16px', fontSize:14 }}>
              {gs.winners.length > 1 ? 'Tie' : 'Winner'}: {gs.winners.map(i => players?.[i]?.name || `Player ${i+1}`).join(', ')}
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:24, flexWrap:'wrap', marginBottom:16 }}>
              {gs.players.map((p, i) => (
                <div key={i} style={{
                  textAlign:'center', padding:'8px 16px', borderRadius:8,
                  background: gs.winners.includes(i) ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                  border: gs.winners.includes(i) ? '1px solid #fbbf24' : '1px solid transparent',
                }}>
                  <div style={{ color: gs.winners.includes(i) ? '#fbbf24' : '#aaa', fontSize:13, fontWeight:600 }}>
                    {players?.[i]?.name || `Player ${i+1}`}
                  </div>
                  <div style={{ color:'#fff', fontSize:22, fontWeight:700, marginTop:4 }}>
                    {p.totalScore}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
              <button onClick={handleRematch}
                style={{
                  padding:'10px 24px', background:'#0f3460', color:'#fff', border:'1px solid #e94560',
                  borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:600,
                }}>
                🔄 Rematch
              </button>
              <button onClick={() => window.location.href = '/'}
                style={{
                  padding:'10px 24px', background:'#e94560', color:'#fff', border:'none',
                  borderRadius:6, cursor:'pointer', fontSize:14, fontWeight:600,
                }}>
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function calculateWinnersLocal(players: YahtzeePlayerState[]): number[] {
  const cats: YahtzeeCategory[] = ['ones','twos','threes','fours','fives','sixes','three_of_a_kind','four_of_a_kind','full_house','small_straight','large_straight','yahtzee','chance'];
  const totals = players.map((p, i) => {
    let u=0,l=0; for(const c of cats.slice(0,6)) u+=p.scores[c as YahtzeeCategory]||0; for(const c of cats.slice(6)) l+=p.scores[c as YahtzeeCategory]||0;
    return { index: i, total: u+(u>=63?35:0)+l };
  });
  totals.sort((a,b) => b.total - a.total);
  const max = totals[0]?.total ?? 0;
  return totals.filter(t => t.total === max).map(t => t.index);
}
