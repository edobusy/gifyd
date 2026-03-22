# GIFYD

**Turn any video into a GIF, right in your browser.**

GIFYD is a client-side web app that lets you trim, filter, caption, and export GIFs from video files. All processing happens locally using WebAssembly: no uploads, no server, no waiting.

[**Try the live demo**](https://gifyd.vercel.app)

![Example GIF created with GIFYD](https://media4.giphy.com/media/WpGTp9M9LQFAYR8VQe/giphy.gif)

## Features

- **Trim.** Pick a start time and duration (up to 4 seconds) for your GIF.
- **Framerate control.** Adjust the output framerate for size vs. smoothness.
- **Pixel filters.** Colour modification, RGB channel splitting, and green screen replacement.
- **Captions.** Add text with configurable font, size, colour, background, and position.
- **Instant preview.** See filters and captions applied in real time on a canvas overlay.
- **Download.** Name your file and download the finished GIF in one click.

## Tech Stack

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-3-646CFF?logo=vite&logoColor=white)
![ffmpeg.wasm](https://img.shields.io/badge/ffmpeg.wasm-0.11-007808?logo=ffmpeg&logoColor=white)

| Layer            | Technology                                                                         |
| ---------------- | ---------------------------------------------------------------------------------- |
| UI               | React 18, CSS (neubrutalism design)                                                |
| Language         | TypeScript                                                                         |
| Video processing | [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) (client-side WebAssembly) |
| Frame rendering  | Canvas API with `requestVideoFrameCallback`                                        |
| Build            | Vite                                                                               |
| Testing          | Jest, React Testing Library                                                        |
| Containerisation | Docker, Docker Compose                                                             |

## How It Works

GIFYD runs FFmpeg entirely in the browser via WebAssembly. When you hit "GIF it!", the app:

1. Seeks the video to your chosen start time
2. Records canvas frames (with filters and captions baked in) using `MediaRecorder`
3. Passes the recorded WebM to ffmpeg.wasm for transcoding to GIF
4. Serves the result as a downloadable blob. Nothing ever leaves your machine.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

### Run locally

```bash
git clone https://github.com/edobusy/gifyd.git
cd gifyd
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Run with Docker

```bash
docker compose up
```

### Build for production

```bash
npm run build
npm run preview
```

### Run tests

```bash
npm test
```

## App Walkthrough

Upload a video to get started.

![GIFYD upload view](https://yourimageshare.com/ib/H6a6cJN2yu.webp)

**Edit:** Set the starting point, framerate, and GIF duration.

![GIFYD edit options](https://yourimageshare.com/ib/IYgbbROn7F.webp)

**Filter:** Apply pixel-level visual effects to your video.

![GIFYD filter options](https://yourimageshare.com/ib/MLhyYhygef.webp)

**Caption:** Add and customise text with a live preview.

![GIFYD caption options](https://yourimageshare.com/ib/yj0fryxMeB.webp)

**Export:** Hit "GIF it!", name your file, and download.

![GIFYD export and download](https://yourimageshare.com/ib/My95CBs2nj.webp)

## License

[MIT](LICENSE)
