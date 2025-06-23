# 3D Hand Drawing App

This is a web application that uses your webcam to draw in a 3D space with your hands. It utilizes MediaPipe for real-time hand tracking and three.js for 3D rendering.

## Demo

![Demo GIF of the 3D drawing app](./demo.gif)

> Replace the above line with a new GIF to showcase the drawing functionality.

## Features

- Real-time 3D drawing using hand gestures.
- Two-handed drawing support.
- Modern UI with a clean, dark theme.
- Built with Vite, TypeScript, MediaPipe, and three.js.

## How to Draw

1.  Click the **Start** button.
2.  Show one or both hands to the camera.
3.  **Raise your index finger** to start drawing a line.
4.  **Lower your index finger** to stop drawing.

## Getting Started

1.  **Install dependencies:**

```bash
npm install
```

2.  **Run the development server:**

```bash
npm run dev
```

3.  **Open your browser:**
    Visit `http://localhost:5173/` and click the Start button to begin.


## Project Structure

- `src/` — Main source code
- `public/models/` — MediaPipe model file
- `index.html` — Main HTML file
- `src/style.css` — App styling

## License

This project is for educational/demo purposes. MediaPipe models are subject to their own license.
