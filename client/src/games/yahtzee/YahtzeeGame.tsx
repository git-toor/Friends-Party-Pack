import { useState, useCallback, useRef, useEffect } from 'react';
import { DiceOverlay, type DiceOverlayHandle } from '../../components/DiceOverlay.js';
import { ScoreCard } from './ScoreCard.js';
import { Button } from '../../components/Button.js';
import type { YahtzeeCategory, YahtzeeTurn, YahtzeePlayerState, YahtzeeGameState } from './types.js';

const CATEGORIES: YahtzeeCategory[] = ['ones','twos','threes','fours','fives','sixes','three_of_a_kind','four_of_a_kind','full_house','small_straight','large_straight','yahtzee','chance'];
const EMPTY_TURN: YahtzeeTurn = { dice: [0, 0, 0, 0, 0], kept: [false, false, false, false, false], rollPhase: 1, phase: 'WAITING_FOR_ROLL' };
const EMPTY_PLAYER = (): YahtzeePlayerState => ({ scores: {}, yahtzeeBonusCount: 0, isCurrentPlayer: false, totalScore: 0, availableCategories: [] });

function createInitialState(playerCount: number): YahtzeeGameState {
  return { currentPlayerIndex: 0, round: 1, totalRounds: 13, winners: [], started: true, isMyTurn: true, turn: { ...EMPTY_TURN }, players: Array.from({ length: playerCount }, () => EMPTY_PLAYER()) };
}

interface YahtzeeGameProps {
  playerCount?: number; playerIndex?: number; playerName?: string; sessionId?: string;
  players?: { name: string; index: number; id?: string }[]; playerId?: string;
}

function calcScore(dice: number[], cat: YahtzeeCategory): number {
  const c = [0,0,0,0,0,0,0]; for (const d of dice) c[d]++;
  const s = dice.reduce((a,b)=>a+b,0), sorted = [...dice].sort((a,b)=>a-b);
  switch (cat) {
    case 'ones': return c[1]*1; case 'twos': return c[2]*2; case 'threes': return c[3]*3;
    case 'fours': return c[4]*4; case 'fives': return c[5]*5; case 'sixes': return c[6]*6;
    case 'three_of_a_kind': return c.some(x=>x>=3)?s:0;
    case 'four_of_a_kind': return c.some(x=>x>=4)?s:0;
    case 'full_house': return c.includes(3)&&c.includes(2)?25:0;
    case 'small_straight': for(let i=1;i<=3;i++){if(sorted.includes(i)&&sorted.includes(i+1)&&sorted.includes(i+2)&&sorted.includes(i+3))return 30;} return 0;
    case 'large_straight': return sorted.every((v,i)=>v===i+1)||sorted.every((v,i)=>v===i+2)?40:0;
    case 'yahtzee': return c.some(x=>x>=5)?50:0;
    case 'chance': return s; default: return 0;
  }
}
const bottomBarStyle: React.CSSProperties = { padding:'12px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:'auto' };
function getTotal(scores: Partial<Record<YahtzeeCategory,number>>): number {
  let u=0,l=0; for(const c of CATEGORIES.slice(0,6)) u+=scores[c]||0; for(const c of CATEGORIES.slice(6)) l+=scores[c]||0; return u+(u>=63?35:0)+l;
}

const dieBoxStyle = (val: number, kept: boolean, selected: boolean, clickable: boolean): React.CSSProperties => ({
  width: 44, height: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 18, fontWeight: 700, cursor: clickable ? 'pointer' : 'default', userSelect: 'none',
  background: selected ? '#e94560' : (kept ? '#0f3460' : '#16213e'),
  border: selected ? '2px solid #fff' : (kept ? '1px solid #4ecca3' : '1px solid #333'),
  color: '#fff', opacity: kept ? 0.6 : 1,
});

export default function YahtzeeGame({ playerCount=2, playerIndex=0, sessionId, players, playerName='You' }: YahtzeeGameProps) {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [gs, setGs] = useState<YahtzeeGameState>(() => createInitialState(playerCount));
  const [sel, setSel] = useState<boolean[]>([false,false,false,false,false]);
  const [rolling, setRolling] = useState(false);
  const [tab, setTab] = useState(0);

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
  const canRoll = turn.phase === 'WAITING_FOR_ROLL' && !rolling && (gs.isMyTurn || !sessionId);
  const canKeep = turn.phase === 'WAITING_FOR_KEEP' && sel.some(s=>s) && !rolling && (gs.isMyTurn || !sessionId);
  const canScore = turn.phase === 'WAITING_FOR_CATEGORY' && (gs.isMyTurn || !sessionId);

  const handleRoll = useCallback(async () => {
    if (!canRoll) return;
    setRolling(true); setSel([false,false,false,false,false]);
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'ROLL'}}) });
      const data = await res.json();
      if (!res.ok || data.error) { console.error('Roll:', data.error); setRolling(false); return; }
      if (data.state) setGs(data.state);
      if (data.diceValues) {
        await diceRef.current?.roll();
        setGs(p => ({...p, turn:{...p.turn, dice: data.diceValues, phase:'WAITING_FOR_KEEP', rollPhase: (p.turn.rollPhase+1) as 1|2|3}}));
      }
    } else {
      const vals = await diceRef.current?.roll() || [];
      setGs(p => ({...p, turn:{...p.turn, dice:vals, phase:'WAITING_FOR_KEEP', rollPhase: (p.turn.rollPhase+1) as 1|2|3}}));
    }
    setRolling(false);
  }, [canRoll, sessionId, playerIndex]);

  const toggleSel = useCallback((i: number) => {
    if (turn.phase !== 'WAITING_FOR_KEEP' || rolling) return;
    setSel(p => { const n=[...p]; n[i]=!n[i]; return n; });
  }, [turn.phase, rolling]);

  const handleKeep = useCallback(async () => {
    if (!canKeep) return;
    const idxs: number[] = []; sel.forEach((s,i)=>{if(s)idxs.push(i);});
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'KEEP',payload:{indices:idxs}}}) });
      const data = await res.json();
      if (data.state) setGs(data.state);
    } else {
      setGs(p => {
        const kept=[...p.turn.kept]; for(const i of idxs) kept[i]=true;
        const ph = (p.turn.rollPhase>=3||kept.every(k=>k))?'WAITING_FOR_CATEGORY':'WAITING_FOR_ROLL';
        return {...p, turn:{...p.turn, kept, phase:ph as any}};
      });
    }
    setSel([false,false,false,false,false]);
  }, [canKeep, sel, sessionId, playerIndex]);

  const handleScore = useCallback(async (cat: YahtzeeCategory) => {
    if (!canScore || myState.scores[cat] !== undefined) return;
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'SCORE',payload:{category:cat}}}) });
      const data = await res.json();
      if (!res.ok || data.error) { console.error('Score:', data.error); return; }
      if (data.state) setGs(data.state);
    } else {
      const score = calcScore(turn.dice, cat);
      setGs(p => {
        const ps=[...p.players]; const pl={...ps[p.currentPlayerIndex]}; pl.scores={...pl.scores,[cat]:score}; pl.totalScore=getTotal(pl.scores);
        ps[p.currentPlayerIndex]=pl;
        const filled=Object.keys(pl.scores).length; let np=p.currentPlayerIndex, nr=p.round;
        if(filled>=13){ np++; if(np>=playerCount){np=0;nr++;} }
        return {...p, turn:{...EMPTY_TURN}, currentPlayerIndex:np, round:nr, players:ps, winners:nr>13?[0]:[]};
      });
    }
    setSel([false,false,false,false,false]);
  }, [canScore, myState.scores, turn.dice, playerCount, sessionId, playerIndex]);

  useEffect(() => {
    if (gs.winners.length > 0) setTimeout(() => alert(`Winner: Player ${gs.winners[0]+1}`), 500);
  }, [gs.winners]);

  return (
    <div style={{ width:'100%', height:'100%', position:'relative' }}>
      <DiceOverlay ref={diceRef} onSettle={v => console.log('settled:', v)} />

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

        {/* Dice display — 2D HTML */}
        {(turn.dice.some(v=>v>0) || turn.phase!=='WAITING_FOR_ROLL') && (
          <div style={{ display:'flex', justifyContent:'center', gap:10, padding:'12px 0' }}>
            {turn.dice.map((val,i) => (
              <div key={i} onClick={() => toggleSel(i)} style={dieBoxStyle(val, turn.kept[i], sel[i], turn.phase==='WAITING_FOR_KEEP' && !rolling)}>
                {val || '?'}
              </div>
            ))}
          </div>
        )}

        {/* Kept dice row */}
        {turn.kept.some(k=>k) && (
          <div style={{ display:'flex', justifyContent:'center', gap:10, padding:'0 0 8px 0' }}>
            {turn.kept.map((k,i) => k ? (
              <div key={i} style={dieBoxStyle(turn.dice[i], true, false, false)}>{turn.dice[i]}</div>
            ) : null)}
          </div>
        )}

        <div style={{ flex:1, minHeight:0 }} />

        <div style={bottomBarStyle}>
          {canRoll && <Button size="lg" onClick={handleRoll}>🎲 Roll ({turn.rollPhase}/3)</Button>}
          {canKeep && <Button variant="secondary" size="lg" onClick={handleKeep}>✅ Keep Selected ({sel.filter(Boolean).length})</Button>}
          {!canRoll && !canKeep && turn.phase==='WAITING_FOR_CATEGORY' && !gs.isMyTurn && sessionId && <span style={{color:'#999',fontSize:14}}>Waiting...</span>}

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
