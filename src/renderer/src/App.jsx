import { useState, useRef, useEffect } from 'react'
import Scoreboard from './Scoreboard'

function App() {
  const [videoData, setVideoData] = useState(null)
  const videoRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)

  // Match Setup State
  const [player1, setPlayer1] = useState('Viktor')
  const [player2, setPlayer2] = useState('Lakshya')

  // Timeline Ledger: Always starts at 0.0s with score 0 - 0
  const [timeline, setTimeline] = useState([{ id: 'init', startTime: 0.0, p1Score: 0, p2Score: 0 }])

  // Export State
  const [isExporting, setIsExporting] = useState(false)
  const [exportStats, setExportStats] = useState({ percent: 0, timemark: '00:00:00', fps: 0 })

  useEffect(() => {
    if (!window.api || !window.api.onExportProgress) return
    const unsubscribe = window.api.onExportProgress((data) => {
      if (typeof data === 'number') {
        setExportStats((prev) => ({ ...prev, percent: data }))
      } else if (data && typeof data === 'object') {
        setExportStats({
          percent: data.percent || 0,
          timemark: data.timemark || '00:00:00',
          fps: data.fps || 0
        })
      }
    })
    return () => unsubscribe()
  }, [])

  const handleOpenVideo = async () => {
    if (isExporting) return
    const result = await window.api.selectVideo()
    if (result) {
      setVideoData(result)
      setTimeline([{ id: 'init', startTime: 0.0, p1Score: 0, p2Score: 0 }])
    }
  }

  const handleExport = async () => {
    if (!videoData || isExporting) return

    setIsExporting(true)
    setExportStats({ percent: 0, timemark: '00:00:00', fps: 0 })

    try {
      const result = await window.api.exportVideo({
        videoPath: videoData.absolutePath,
        timeline: timeline,
        player1: player1,
        player2: player2
      })

      if (result && result.success) {
        alert(`🎉 Video exported successfully!\nSaved to: ${result.savePath}`)
      } else if (result && !result.canceled) {
        alert(`❌ Export failed: ${result.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert('An error occurred during export.')
      console.error(err)
    } finally {
      setIsExporting(false)
      setExportStats({ percent: 0, timemark: '00:00:00', fps: 0 })
    }
  }

  const getActiveScore = () => {
    const validIntervals = timeline.filter((item) => item.startTime <= currentTime)
    return validIntervals[validIntervals.length - 1] || { p1Score: 0, p2Score: 0 }
  }

  const activeScore = getActiveScore()

  const handleAddPoint = (playerIndex) => {
    if (!videoRef.current || isExporting) return

    const time = Math.round(videoRef.current.currentTime * 10) / 10
    const currentP1 = activeScore.p1Score
    const currentP2 = activeScore.p2Score

    const newEntry = {
      id: Date.now().toString(),
      startTime: time,
      p1Score: playerIndex === 1 ? currentP1 + 1 : currentP1,
      p2Score: playerIndex === 2 ? currentP2 + 1 : currentP2
    }

    setTimeline((prev) => [...prev, newEntry].sort((a, b) => a.startTime - b.startTime))
  }

  const handleDeletePoint = (id) => {
    if (id === 'init' || isExporting) return
    setTimeline((prev) => prev.filter((item) => item.id !== id))
  }

  const handleTimeChange = (id, newTime) => {
    if (isNaN(newTime) || newTime < 0) return
    setTimeline((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, startTime: newTime } : item))
        .sort((a, b) => a.startTime - b.startTime)
    )
  }

  // Keyboard Shortcuts Engine
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || isExporting || !videoRef.current) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (videoRef.current.paused) {
          videoRef.current.play()
        } else {
          videoRef.current.pause()
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 5)
      } else if (e.code === 'Digit1' || e.code === 'KeyQ') {
        e.preventDefault()
        handleAddPoint(1)
      } else if (e.code === 'Digit2' || e.code === 'KeyW') {
        e.preventDefault()
        handleAddPoint(2)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExporting, activeScore, timeline, currentTime])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(1)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#1e1e1e', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* Top Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🏸 Badminton Video Scorecard Editor</h1>

        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={handleOpenVideo}
            disabled={isExporting}
            style={{ padding: '10px 20px', fontSize: '1rem', cursor: isExporting ? 'not-allowed' : 'pointer', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            {videoData ? 'Change Video' : 'Import Video'}
          </button>

          {videoData && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{ padding: '10px 20px', fontSize: '1rem', cursor: isExporting ? 'not-allowed' : 'pointer', backgroundColor: isExporting ? '#d97706' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)' }}
            >
              {isExporting ? `Rendering (${exportStats.percent}%)...` : '🚀 Export HD Video'}
            </button>
          )}
        </div>
      </header>

      {/* Live Progress Bar Modal with Real-Time Stats */}
      {isExporting && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#374151', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold', color: '#fcd34d' }}>
            <span>🔥 Baking Scorecard into HD Video via FFmpeg...</span>
            <span>{exportStats.percent}%</span>
          </div>
          
          <div style={{ width: '100%', backgroundColor: '#1f2937', borderRadius: '4px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${Math.max(2, exportStats.percent)}%`, backgroundColor: '#f59e0b', height: '100%', transition: 'width 0.3s ease' }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600', backgroundColor: '#1f2937', padding: '6px 10px', borderRadius: '4px' }}>
            <span>⏱️ Rendered Video Time: {exportStats.timemark}</span>
            <span>⚡ Speed: {exportStats.fps > 0 ? `${exportStats.fps} FPS` : 'Analyzing frames...'}</span>
          </div>

          <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#d1d5db' }}>Please do not close the app. Audio and original video quality are being preserved.</p>
        </div>
      )}

      {/* MAIN CONTENT: 2-Column Split Screen Studio Layout */}
      <main>
        {videoData ? (
          <div style={{ display: 'flex', gap: '25px', width: '100%', maxWidth: '1600px', margin: '0 auto', alignItems: 'flex-start' }}>
            
            {/* ================= LEFT COLUMN: Video & Scoring Controls (60% Width) ================= */}
            <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: '15px', minWidth: '0' }}>
              
              <div style={{ display: 'flex', gap: '20px', backgroundColor: '#2d2d2d', padding: '12px 20px', borderRadius: '8px', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: '#aaa', marginRight: '8px' }}>Player 1:</label>
                  <input
                    type="text"
                    disabled={isExporting}
                    value={player1}
                    onChange={(e) => setPlayer1(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: '#fff', fontWeight: 'bold', width: '60%' }}
                  />
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <label style={{ fontSize: '0.85rem', color: '#aaa', marginRight: '8px' }}>Player 2:</label>
                  <input
                    type="text"
                    disabled={isExporting}
                    value={player2}
                    onChange={(e) => setPlayer2(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: '#fff', fontWeight: 'bold', width: '60%' }}
                  />
                </div>
              </div>

              <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                <video
                  ref={videoRef}
                  src={videoData.videoUrl}
                  controls
                  onTimeUpdate={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
                  }}
                  style={{ width: '100%', display: 'block', maxHeight: '520px' }}
                />

                <Scoreboard
                  player1={player1}
                  player2={player2}
                  score1={activeScore.p1Score}
                  score2={activeScore.p2Score}
                />
              </div>
              
              <div style={{ padding: '8px 15px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', textAlign: 'center', fontSize: '0.85rem', color: '#38bdf8' }}>
                ⌨️ <strong>Speed Shortcuts:</strong> [Space] Play/Pause &nbsp;|&nbsp; [← / →] Skip 5s &nbsp;|&nbsp; [1] or [Q] +1 {player1 || 'Player 1'} &nbsp;|&nbsp; [2] or [W] +1 {player2 || 'Player 2'}
              </div>

              <div style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: '#2d2d2d', borderRadius: '8px', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => handleAddPoint(1)}
                  disabled={isExporting}
                  style={{ padding: '12px 20px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isExporting ? 'not-allowed' : 'pointer', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', flex: 1 }}
                >
                  +1 {player1 || 'Player 1'} (Key: 1)
                </button>
                <span style={{ color: '#aaa', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>At {formatTime(currentTime)}</span>
                <button
                  onClick={() => handleAddPoint(2)}
                  disabled={isExporting}
                  style={{ padding: '12px 20px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isExporting ? 'not-allowed' : 'pointer', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', flex: 1 }}
                >
                  +1 {player2 || 'Player 2'} (Key: 2)
                </button>
              </div>

            </div>

            {/* ================= RIGHT COLUMN: Scrollable Timeline Ledger (40% Width) ================= */}
            <div style={{ flex: '1 1 40%', backgroundColor: '#2d2d2d', borderRadius: '8px', padding: '15px', border: '1px solid #444', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', boxSizing: 'border-box' }}>
              
              <div style={{ position: 'sticky', top: '-15px', backgroundColor: '#2d2d2d', paddingBottom: '10px', paddingTop: '5px', zIndex: 5, borderBottom: '1px solid #444' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8' }}>📊 Score Timeline Ledger</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>Directly edit seconds to adjust overlay timing.</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', marginTop: '10px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #555', color: '#aaa' }}>
                    <th style={{ padding: '8px 4px' }}>Time (Sec)</th>
                    <th style={{ padding: '8px 4px' }}>{player1}</th>
                    <th style={{ padding: '8px 4px' }}>{player2}</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #333', backgroundColor: item.id === activeScore.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent', transition: 'background-color 0.2s' }}>
                      
                      <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            disabled={isExporting || item.id === 'init'}
                            value={item.startTime}
                            onChange={(e) => handleTimeChange(item.id, parseFloat(e.target.value))}
                            style={{ width: '65px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#111', color: '#38bdf8', fontWeight: 'bold' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>({formatTime(item.startTime)})</span>
                        </div>
                      </td>

                      <td style={{ padding: '8px 4px', color: '#38bdf8', fontWeight: 'bold', fontSize: '1rem' }}>{item.p1Score}</td>
                      <td style={{ padding: '8px 4px', color: '#38bdf8', fontWeight: 'bold', fontSize: '1rem' }}>{item.p2Score}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                        {item.id !== 'init' && (
                          <button
                            onClick={() => handleDeletePoint(item.id)}
                            disabled={isExporting}
                            style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>

          </div>
        ) : (
          <div style={{ marginTop: '100px', textAlign: 'center', color: '#666' }}>
            <h2>No video loaded</h2>
            <p>Click "Import Video" above to choose an MP4 from your computer.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App