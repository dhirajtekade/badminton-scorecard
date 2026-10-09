import React from 'react'

function Scoreboard({ player1, player2, score1, score2, currentSet = 1, prevScores }) {
  // Helper to render individual score boxes
  const ScoreColumn = ({ score, isActive }) => (
    <span
      style={{
        fontWeight: isActive ? '800' : '600',
        fontSize: isActive ? '1.1rem' : '1rem',
        color: isActive ? '#38bdf8' : '#94a3b8',
        backgroundColor: isActive ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
        padding: '2px 8px',
        borderRadius: '4px',
        minWidth: '22px',
        textAlign: 'center',
        marginLeft: '6px'
      }}
    >
      {score}
    </span>
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        border: '1.5px solid #38bdf8',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        display: 'inline-flex',
        flexDirection: 'column',
        minWidth: '220px',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 10
      }}
    >
      <div
        style={{
          backgroundColor: '#0284c7',
          padding: '4px 12px',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: '#fff'
        }}
      >
        🏸 Singles Match
      </div>

      {/* Player 1 Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <span
          style={{
            fontWeight: '600',
            fontSize: '0.9rem',
            color: '#f8fafc',
            marginRight: '15px',
            flex: 1
          }}
        >
          {player1 || 'Player 1'}
        </span>
        <div style={{ display: 'flex' }}>
          {currentSet >= 2 && <ScoreColumn score={prevScores.s1p1} isActive={false} />}
          {currentSet === 3 && <ScoreColumn score={prevScores.s2p1} isActive={false} />}
          <ScoreColumn score={score1} isActive={true} />
        </div>
      </div>

      {/* Player 2 Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px'
        }}
      >
        <span
          style={{
            fontWeight: '600',
            fontSize: '0.9rem',
            color: '#f8fafc',
            marginRight: '15px',
            flex: 1
          }}
        >
          {player2 || 'Player 2'}
        </span>
        <div style={{ display: 'flex' }}>
          {currentSet >= 2 && <ScoreColumn score={prevScores.s1p2} isActive={false} />}
          {currentSet === 3 && <ScoreColumn score={prevScores.s2p2} isActive={false} />}
          <ScoreColumn score={score2} isActive={true} />
        </div>
      </div>
    </div>
  )
}

export default Scoreboard
