# 🏸 Badminton Video Scorecard Editor

A cross-platform desktop application built to effortlessly track, edit, and burn professional broadcast-style scorecards into local badminton match videos. 

Built with **Electron**, **React**, and **FFmpeg**, this tool provides a split-screen studio layout and speed-editing hotkeys to make tagging points and exporting HD video seamless.

---

## ✨ Features

* **🎥 Local HD Video Playback:** Import local MP4, MOV, MKV, or AVI files directly from your hard drive with zero upload times.
* **🎨 Broadcast-Grade Vector Graphics:** Generates a stunning 5-layer ASS (Advanced SubStation Alpha) vector graphics scoreboard that won't distort or pixelate.
* **⚡ Speed-Editing Hotkeys:** Tag points in real-time without ever touching your mouse.
* **⏱️ Editable Timeline Ledger:** Made a mistake? Edit the exact timestamp (in seconds) or delete points directly in the side-panel ledger. 
* **🚀 Universal HD Export:** Bakes the scoreboard permanently into your footage using an embedded FFmpeg engine. Automatically normalizes audio to AAC and video color space to `yuv420p` to guarantee playback on all devices.
* **📦 Standalone Installer:** Packaged as a single Windows `.exe` file that works entirely offline.

---

## ⌨️ Keyboard Shortcuts (Speed Workflow)

For the fastest editing experience, click on the video player once to focus it, then use your keyboard:

| Action | Shortcut Key |
| :--- | :--- |
| **Play / Pause Video** | `Spacebar` |
| **Skip Backward 5s** | `Left Arrow (←)` |
| **Skip Forward 5s** | `Right Arrow (→)` |
| **+1 Point (Player 1)** | `1` or `Q` |
| **+1 Point (Player 2)** | `2` or `W` |

---

## 🛠️ Tech Stack

* **Frontend:** React 19, Vite
* **Backend:** Electron, Node.js, IPC
* **Video Engine:** fluent-ffmpeg, ffmpeg-static

---

## 💻 Development Setup

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd badminton-scorecard
   npm run dev