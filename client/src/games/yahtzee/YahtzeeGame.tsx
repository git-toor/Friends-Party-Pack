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

const bottomBarStyle: React.CSSProperties = { padding:'12px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:'auto' };

export default function YahtzeeGame({ playerCount=2, playerIndex=0, sessionId, players, playerName='You' }: YahtzeeGameProps) {
  const diceRef = useRef<DiceOverlayHandle>(null);
  const [gs, setGs] = useState<YahtzeeGameState>(() => createInitialState(playerCount));
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
  const isMe = gs.isMyTurn || !sessionId;
  const canRoll = turn.phase === 'WAITING_FOR_ROLL' && !rolling && isMe;
  const canScore = turn.phase === 'WAITING_FOR_CATEGORY' && isMe;

  const handleRoll = useCallback(async () => {
    if (!canRoll) return;
    setRolling(true);
    if (sessionId) {
      const res = await fetch('/api/games/yahtzee/action', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sessionId,playerIndex,action:{type:'ROLL'}}) });
      const data = await res.json();
      if (!res.ok || data.error) { console.error('Roll:', data.error); setRolling(false); return; }
      if (data.state) setGs(data.state);
      await diceRef.current?.roll();
    } else {
      await diceRef.current?.roll();
      setGs(p => ({...p, turn:{...p.turn, phase:'WAITING_FOR_KEEP', rollPhase: (p.turn.rollPhase+1) as 1|2|3}}));
    }
    setRolling(false);
  }, [canRoll, sessionId, playerIndex]);

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
        <div style={{ flex:1, minHeight:0 }} />
        <div style={bottomBarStyle}>
          {canRoll && <Button size="lg" onClick={handleRoll}>🎲 Roll ({turn.rollPhase}/3)</Button>}
          {!canRoll && turn.phase==='WAITING_FOR_CATEGORY' && !gs.isMyTurn && sessionId && <span style={{color:'#999',fontSize:14}}>Waiting...</span>}
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
