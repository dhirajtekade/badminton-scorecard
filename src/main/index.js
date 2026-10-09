import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { pathToFileURL } from 'url'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

// --- 100% FOOLPROOF FFMPEG BINARY FINDER ---
// --- 100% FOOLPROOF FFMPEG BINARY FINDER (ASAR-AWARE) ---
function getFFmpegPath() {
  const rawPath = ffmpegStatic.default || ffmpegStatic
  let ffmpegPath = rawPath

  // 1. Production Fix: Force the path out of the compressed 'app.asar' archive
  if (ffmpegPath && ffmpegPath.includes('app.asar')) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
  }

  // 2. Dev Mode Fallback
  if (!fs.existsSync(ffmpegPath)) {
    const exeName = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    ffmpegPath = join(process.cwd(), 'node_modules', 'ffmpeg-static', exeName)
  }

  console.log('✅ Resolved FFmpeg path:', ffmpegPath)
  return ffmpegPath
}

const resolvedFFmpegPath = getFFmpegPath()
ffmpeg.setFfmpegPath(resolvedFFmpegPath)
// --------------------------------------------------------

// Helper: Convert seconds to ASS subtitle timestamp format (0:01:05.40)
function formatASSTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100)
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

// --- BROADCAST-GRADE VECTOR SCOREBOARD GENERATOR ---
function createASSFile(timeline, player1, player2, outputPath) {
  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Broadcast,Arial,26,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i]
    const startTime = formatASSTime(item.startTime)
    const endTime = timeline[i + 1] ? formatASSTime(timeline[i + 1].startTime) : '99:59:59.99'

    const p1Name = player1 || 'Player 1'
    const p2Name = player2 || 'Player 2'

    // Layer 0: Drop Shadow (offset at X=44, Y=44)
    assContent += `Dialogue: 0,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(44,44)\\an7\\bord0\\shad0\\c&H000000&\\1a&H80&\\p1}m 0 0 l 320 0 l 320 145 l 0 145{\\p0}\n`
    // Layer 1: Main Dark Slate Background Card (X=40, Y=40, BGR Hex: #2A170F)
    assContent += `Dialogue: 1,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(40,40)\\an7\\bord0\\shad0\\c&H2A170F&\\1a&H26&\\p1}m 0 0 l 320 0 l 320 145 l 0 145{\\p0}\n`
    // Layer 2: Sky-Blue Header Banner Strip
    assContent += `Dialogue: 2,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(40,40)\\an7\\bord0\\shad0\\c&HC78402&\\1a&H00&\\p1}m 0 0 l 320 0 l 320 36 l 0 36{\\p0}\n`
    // Layer 3: Header Text "🏸 SINGLES MATCH"
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(55,47)\\an7\\bord0\\shad0\\fnArial\\fs20\\b1\\c&HFFFFFF&}🏸 SINGLES MATCH\n`
    // Layer 4: Player 1 Name
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(55,86)\\an7\\bord0\\shad0\\fnArial\\fs26\\b1\\c&HFCFAF8&}${p1Name}\n`
    // Layer 5: Player 1 Score (Right-Aligned \an9 to X=345)
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(345,84)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p1Score}\n`
    // Layer 6: Player 2 Name
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(55,130)\\an7\\bord0\\shad0\\fnArial\\fs26\\b1\\c&HFCFAF8&}${p2Name}\n`
    // Layer 7: Player 2 Score (Right-Aligned \an9 to X=345)
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(345,128)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p2Score}\n`
  }

  fs.writeFileSync(outputPath, assContent, 'utf8')
}
// -----------------------------------------------------

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'avi'] }]
    })
    if (canceled) return null
    return {
      absolutePath: filePaths[0],
      videoUrl: pathToFileURL(filePaths[0]).href
    }
  })
  ipcMain.handle('dialog:openAudio', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'aac', 'm4a'] }]
    })
    if (canceled) return null
    return filePaths[0]
  })

  // Phase 3: HD Video Export with ASS Burn-In
  // Phase 4: HD Video Export with ASS Burn-In & Audio Mixing
  // Phase 4: HD Video Export with ASS Burn-In, Audio Mixing, and Denoise!
  ipcMain.handle(
    'video:export',
    async (
      event,
      { videoPath, timeline, player1, player2, bgmPath, videoVolume, bgmVolume, denoiseVideo }
    ) => {
      const { canceled, filePath: savePath } = await dialog.showSaveDialog({
        title: 'Export HD Video with Scorecard',
        defaultPath: 'badminton_match_export.mp4',
        filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
      })

      if (canceled || !savePath) return { success: false, canceled: true }
      if (videoPath === savePath)
        return { success: false, error: 'Cannot overwrite the input video file directly!' }

      const tempAssPath = join(savePath, '..', `temp_scoreboard_${Date.now()}.ass`)
      createASSFile(timeline, player1, player2, tempAssPath)
      const escapedAssPath = tempAssPath.replace(/\\/g, '/').replace(/:/g, '\\:')

      const vVol = videoVolume !== undefined ? videoVolume / 100 : 1
      const bVol = bgmVolume !== undefined ? bgmVolume / 100 : 0.5

      // Set up the video audio filter chain (Apply Denoise BEFORE Volume if requested)
      // nf=-25 drops the noise floor by 25dB (perfect for exhaust fans) without making voices sound like robots
      const originalAudioFilter = denoiseVideo ? `afftdn=nf=-25,volume=${vVol}` : `volume=${vVol}`

      return new Promise((resolve) => {
        let command = ffmpeg(videoPath)

        if (bgmPath) {
          command = command.input(bgmPath)
          command = command
            .complexFilter([
              `[0:v]ass='${escapedAssPath}'[v]`,
              `[0:a]${originalAudioFilter}[a1]`,
              `[1:a]volume=${bVol}[a2]`,
              `[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]`
            ])
            .outputOptions([
              '-map [v]',
              '-map [a]',
              '-c:v libx264',
              '-preset fast',
              '-crf 20',
              '-c:a aac',
              '-b:a 192k',
              '-pix_fmt yuv420p',
              '-y'
            ])
        } else {
          command = command
            .videoFilters(`ass='${escapedAssPath}'`)
            .audioFilters(originalAudioFilter)
            .outputOptions([
              '-c:v libx264',
              '-preset fast',
              '-crf 20',
              '-c:a aac',
              '-b:a 192k',
              '-pix_fmt yuv420p',
              '-y'
            ])
        }

        command
          .save(savePath)
          .on('start', (commandLine) => console.log('🚀 Running FFmpeg command:', commandLine))
          .on('progress', (progress) => {
            event.sender.send('export:progress', {
              percent:
                progress.percent && !isNaN(progress.percent) ? Math.round(progress.percent) : 0,
              timemark: progress.timemark || '00:00:00',
              fps: progress.currentFps ? Math.round(progress.currentFps) : 0
            })
          })
          .on('end', () => {
            if (fs.existsSync(tempAssPath)) fs.unlinkSync(tempAssPath)
            resolve({ success: true, savePath })
          })
          .on('error', (err, stdout, stderr) => {
            console.error('❌ FFmpeg Error:', err.message)
            console.error('🔍 FFmpeg Stderr Output:', stderr)
            if (fs.existsSync(tempAssPath)) fs.unlinkSync(tempAssPath)
            resolve({
              success: false,
              error: `${err.message}\nCheck terminal for full FFmpeg log.`
            })
          })
      })
    }
  )

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
