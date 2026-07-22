import React from 'react'

function Scoreboard({ player1, player2, score1, score2 }) {
  return (
    <div style={{
      position: 'absolute',
      top: '15px',      // Slightly closer to the top edge
      left: '15px',     // Slightly closer to the left edge
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      border: '1.5px solid #38bdf8',
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '180px', // <-- Reduced from 240px!
      maxWidth: '220px',
      pointerEvents: 'none',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: 10
    }}>
      {/* Header Bar */}
      <div style={{ backgroundColor: '#0284c7', padding: '3px 10px', fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#fff' }}>
        🏸 Singles Match
      </div>

      {/* Player 1 Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc', marginRight: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player1 || 'Player 1'}
        </span>
        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#38bdf8', backgroundColor: 'rgba(0,0,0,0.4)', padding: '1px 8px', borderRadius: '4px', minWidth: '20px', textAlign: 'center' }}>
          {score1}
        </span>
      </div>

      {/* Player 2 Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px' }}>
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#f8fafc', marginRight: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player2 || 'Player 2'}
        </span>
        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#38bdf8', backgroundColor: 'rgba(0,0,0,0.4)', padding: '1px 8px', borderRadius: '4px', minWidth: '20px', textAlign: 'center' }}>
          {score2}
        </span>
      </div>
    </div>
  )
}

export default Scoreboard