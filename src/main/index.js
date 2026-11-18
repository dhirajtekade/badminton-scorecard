import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { pathToFileURL } from 'url'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

// --- 100% FOOLPROOF FFMPEG BINARY FINDER (ASAR-AWARE) ---
function getFFmpegPath() {
  const rawPath = ffmpegStatic.default || ffmpegStatic
  let ffmpegPath = rawPath

  if (ffmpegPath && ffmpegPath.includes('app.asar')) {
    ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
  }

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

function timeStringToSeconds(timemark) {
  if (!timemark || typeof timemark !== 'string') return 0
  const parts = timemark.split(':')
  if (parts.length < 3) return 0
  const hours = parseFloat(parts[0]) || 0
  const minutes = parseFloat(parts[1]) || 0
  const seconds = parseFloat(parts[2]) || 0
  return hours * 3600 + minutes * 60 + seconds
}

function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata || !metadata.format || !metadata.format.duration) {
        resolve(0)
      } else {
        resolve(parseFloat(metadata.format.duration))
      }
    })
  })
}

function formatASSTime(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const cs = Math.floor((seconds % 1) * 100)
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

// --- BROADCAST-GRADE DYNAMIC SCOREBOARD GENERATOR ---

// --- BROADCAST-GRADE DYNAMIC SCOREBOARD GENERATOR ---
function createASSFile(timeline, matchType, player1, player2, uiCurrentSet, prevScores, outputPath) {
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

  // If the timeline contains Set reset markers, start at Set 1 and grow automatically.
  // If it's a single-set video with no markers, use whatever the UI dropdown says.
  const hasMarkers = timeline.some((t) => t.id && t.id.startsWith('set_'))
  let activeSet = hasMarkers ? 1 : uiCurrentSet

  const baseWidth = 260
  const columnWidth = 60

  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i]
    const startTime = formatASSTime(item.startTime)
    const endTime = timeline[i + 1] ? formatASSTime(timeline[i + 1].startTime) : '99:59:59.99'

    // If we cross a new set marker in the timeline, expand the scoreboard!
    if (item.id && item.id.startsWith('set_')) {
      const match = item.id.match(/set_(\d)_start/)
      if (match) activeSet = parseInt(match[1])
    }

    // Dynamic dimensions for THIS specific time interval
    const totalWidth = baseWidth + activeSet * columnWidth
    const col1X = 295
    const col2X = col1X + columnWidth
    const col3X = col2X + columnWidth

    // Draw the expandable background cards
    assContent += `Dialogue: 0,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(44,44)\\an7\\bord0\\shad0\\c&H000000&\\1a&H80&\\p1}m 0 0 l ${totalWidth} 0 l ${totalWidth} 145 l 0 145{\\p0}\n`
    assContent += `Dialogue: 1,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(40,40)\\an7\\bord0\\shad0\\c&H2A170F&\\1a&H26&\\p1}m 0 0 l ${totalWidth} 0 l ${totalWidth} 145 l 0 145{\\p0}\n`
    assContent += `Dialogue: 2,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(40,40)\\an7\\bord0\\shad0\\c&HC78402&\\1a&H00&\\p1}m 0 0 l ${totalWidth} 0 l ${totalWidth} 36 l 0 36{\\p0}\n`
    
    const displayMatchType = matchType ? matchType.toUpperCase() : 'SINGLES'
    
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(55,47)\\an7\\bord0\\shad0\\fnArial\\fs20\\b1\\c&HFFFFFF&}🏸 ${displayMatchType} MATCH\n`

    // Draw Player Names
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(55,86)\\an7\\bord0\\shad0\\fnArial\\fs26\\b1\\c&HFCFAF8&}${player1}\n`
    assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(55,130)\\an7\\bord0\\shad0\\fnArial\\fs26\\b1\\c&HFCFAF8&}${player2}\n`

    // --- COLUMN 1 RENDER ---
    if (activeSet >= 2) {
      assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col1X},86)\\an9\\bord0\\shad0\\fnArial\\fs24\\b1\\c&HB8A394&}${prevScores.s1p1}\n`
      assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col1X},130)\\an9\\bord0\\shad0\\fnArial\\fs24\\b1\\c&HB8A394&}${prevScores.s1p2}\n`
    } else {
      assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col1X},84)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p1Score}\n`
      assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col1X},128)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p2Score}\n`
    }

    // --- COLUMN 2 RENDER ---
    if (activeSet >= 2) {
      if (activeSet === 3) {
        assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col2X},86)\\an9\\bord0\\shad0\\fnArial\\fs24\\b1\\c&HB8A394&}${prevScores.s2p1}\n`
        assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col2X},130)\\an9\\bord0\\shad0\\fnArial\\fs24\\b1\\c&HB8A394&}${prevScores.s2p2}\n`
      } else {
        assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col2X},84)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p1Score}\n`
        assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col2X},128)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p2Score}\n`
      }
    }

    // --- COLUMN 3 RENDER ---
    if (activeSet === 3) {
      assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col3X},84)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p1Score}\n`
      assContent += `Dialogue: 3,${startTime},${endTime},Broadcast,,0,0,0,,{\\pos(${col3X},128)\\an9\\bord0\\shad0\\fnArial\\fs30\\b1\\c&HF8BD38&}${item.p2Score}\n`
    }
  }

  fs.writeFileSync(outputPath, assContent, 'utf8')
}

// --- BUMPER / TITLE CARD CLIP GENERATOR ---
function createTitleCardClip(text, outputPath) {
  const tempAss = outputPath.replace('.mp4', '.ass')
  const escapedAss = tempAss.replace(/\\/g, '/').replace(/:/g, '\\:')

  const assData = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial,56,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.50,Title,,0,0,0,,{\\pos(960,540)\\an5\\c&H38BDF8&\\b1}${text}
`
  fs.writeFileSync(tempAss, assData, 'utf8')

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('color=c=0x0f172a:s=1920x1080:d=2.5')
      .inputOption('-f lavfi')
      .input('anullsrc=channel_layout=stereo:sample_rate=48000')
      .inputOption('-f lavfi')
      .videoFilters(`ass='${escapedAss}'`)
      .outputOptions(['-c:v libx264', '-t 2.5', '-pix_fmt yuv420p', '-c:a aac', '-b:a 192k', '-y'])
      .save(outputPath)
      .on('end', () => {
        if (fs.existsSync(tempAss)) fs.unlinkSync(tempAss)
        resolve(outputPath)
      })
      .on('error', (err) => {
        if (fs.existsSync(tempAss)) fs.unlinkSync(tempAss)
        reject(err)
      })
  })
}

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

  ipcMain.handle('dialog:openMultipleFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Select Videos to Merge (Hold Ctrl to select multiple)',
      filters: [{ name: 'Videos', extensions: ['mp4', 'mov', 'mkv', 'avi'] }]
    })
    if (canceled) return null
    return filePaths
  })

  ipcMain.handle('video:mergeWithTransitions', async (event, { filePaths, transitions = {} }) => {
    const { canceled, filePath: savePath } = await dialog.showSaveDialog({
      title: 'Save Merged Video',
      defaultPath: 'merged_match.mp4',
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    })

    if (canceled || !savePath) return { success: false, canceled: true }

    const tempDir = app.getPath('temp')
    const generatedClips = []
    const concatManifestList = []

    try {
      for (let i = 0; i < filePaths.length; i++) {
        if (i > 0) {
          const titleText = transitions[i] || `SET ${i + 1}`
          const clipPath = join(tempDir, `bumper_set_${i + 1}_${Date.now()}.mp4`)
          await createTitleCardClip(titleText, clipPath)
          generatedClips.push(clipPath)
          concatManifestList.push(clipPath)
        }
        concatManifestList.push(filePaths[i])
      }

      const manifestPath = join(tempDir, `concat_manifest_${Date.now()}.txt`)
      const manifestContent = concatManifestList
        .map((p) => `file '${p.replace(/\\/g, '/')}'`)
        .join('\n')
      fs.writeFileSync(manifestPath, manifestContent, 'utf8')

      return await new Promise((resolve) => {
        ffmpeg()
          .input(manifestPath)
          .inputOptions(['-f concat', '-safe 0'])
          .outputOptions(['-c copy', '-y'])
          .save(savePath)
          .on('start', (commandLine) => console.log('🚀 Running Concat:', commandLine))
          .on('progress', (progress) => {
            event.sender.send('export:progress', {
              percent:
                progress.percent && !isNaN(progress.percent) ? Math.round(progress.percent) : 0,
              timemark: progress.timemark || '00:00:00',
              fps: progress.currentFps ? Math.round(progress.currentFps) : 0
            })
          })
          .on('end', () => {
            if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath)
            generatedClips.forEach((c) => {
              if (fs.existsSync(c)) fs.unlinkSync(c)
            })
            resolve({ success: true, savePath })
          })
          .on('error', (err) => {
            if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath)
            generatedClips.forEach((c) => {
              if (fs.existsSync(c)) fs.unlinkSync(c)
            })
            resolve({ success: false, error: err.message })
          })
      })
    } catch (err) {
      return { success: false, error: err.message }
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

  ipcMain.handle(
    'video:export',
    async (
      event,
      {
        videoPath,
        timeline,
        matchType,
        player1,
        player2,
        currentSet,
        prevScores,
        bgmPath,
        videoVolume,
        bgmVolume,
        denoiseVideo,
        brightness
      }
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
      createASSFile(timeline, matchType, player1, player2, currentSet, prevScores, tempAssPath)

      // HARDENED ESCAPING: Replaces backslashes, colons, AND single quotes to prevent breaking the filter
      const escapedAssPath = tempAssPath
        .replace(/\\/g, '/')
        .replace(/:/g, '\\:')
        .replace(/'/g, "\\'")

      const vVol = videoVolume !== undefined ? videoVolume / 100 : 1
      const bVol = bgmVolume !== undefined ? bgmVolume / 100 : 0.5
      const originalAudioFilter = denoiseVideo ? `afftdn=nf=-25,volume=${vVol}` : `volume=${vVol}`

      const totalDuration = await getVideoDuration(videoPath)

      return new Promise((resolve) => {
        let command = ffmpeg(videoPath)

        const boostRatio = brightness && brightness > 100 ? (brightness - 100) / 100 : 0
        const ffmpegBrightness = (boostRatio * 0.5).toFixed(3)
        const ffmpegContrast = (1 + boostRatio * 0.15).toFixed(3)
        const eqFilter =
          boostRatio > 0 ? `eq=brightness=${ffmpegBrightness}:contrast=${ffmpegContrast},` : ''

        if (bgmPath) {
          command = command.input(bgmPath).inputOptions(['-stream_loop', '-1'])
          command = command
            .complexFilter([
              // ONE video input mapping to [v] that contains both brightness AND the scorecard
              `[0:v]${eqFilter}ass='${escapedAssPath}'[v]`,
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
            .videoFilters(`${eqFilter}ass='${escapedAssPath}'`)
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
            const currentSeconds = timeStringToSeconds(progress.timemark)
            let calculatedPercent = 0

            if (totalDuration > 0 && currentSeconds > 0) {
              calculatedPercent = Math.min(99, Math.round((currentSeconds / totalDuration) * 100))
            } else if (progress.percent && !isNaN(progress.percent)) {
              calculatedPercent = Math.round(progress.percent)
            }

            event.sender.send('export:progress', {
              percent: calculatedPercent,
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
