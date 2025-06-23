import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

/**
 * Main application class for hand landmark detection.
 * Encapsulates camera setup, model loading, and rendering logic.
 */
export class App {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;
  private startButton: HTMLButtonElement;
  private controls: HTMLDivElement;
  private headerContainer: HTMLDivElement;
  private handLandmarker?: HandLandmarker;
  private lastVideoTime = -1;

  /**
   * Initializes the App, getting references to DOM elements.
   */
  constructor() {
    this.video = document.getElementById("video") as HTMLVideoElement;
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.canvasCtx = this.canvas.getContext("2d")!;
    this.startButton = document.getElementById(
      "startButton"
    ) as HTMLButtonElement;
    this.controls = document.querySelector(".controls") as HTMLDivElement;
    this.headerContainer = document.querySelector(
      ".header-container"
    ) as HTMLDivElement;

    this.startButton.addEventListener("click", () => this.start());
  }

  /**
   * Loads the MediaPipe HandLandmarker model.
   */
  private async initHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `/models/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }

  /**
   * Initializes the camera and attaches the stream to the video element.
   * @returns A promise that resolves when the camera is ready.
   */
  private async initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported in this browser");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.video.srcObject = stream;

      await new Promise<void>((resolve) => {
        this.video.addEventListener("loadeddata", () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        });
      });
    } catch (err) {
      console.error("Failed to initialize camera:", err);
      throw err;
    }
  }

  /**
   * Draws the detected hand landmarks and connectors on the canvas.
   * @param result - The HandLandmarkerResult from the detection.
   */
  private draw(result: HandLandmarkerResult) {
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (result.landmarks) {
      const drawingUtils = new DrawingUtils(this.canvasCtx);
      for (const landmarks of result.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          {
            color: "#00FF00",
            lineWidth: 5,
          }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      }
    }
    this.canvasCtx.restore();
  }

  /**
   * The main prediction loop.
   * Gets a frame from the video, runs hand landmark detection, and draws the results.
   */
  private predict() {
    if (this.lastVideoTime !== this.video.currentTime) {
      this.lastVideoTime = this.video.currentTime;
      if (this.handLandmarker) {
        const result = this.handLandmarker.detectForVideo(
          this.video,
          Date.now()
        );
        this.draw(result);
      }
    }
    requestAnimationFrame(() => this.predict());
  }

  /**
   * Starts the application by initializing the model, camera, and prediction loop.
   */
  public async start() {
    this.controls.style.display = "none";
    this.headerContainer.style.display = "none";
    this.video.style.display = "block";
    this.canvas.style.display = "block";

    try {
      await this.initHandLandmarker();
      await this.initCamera();
      this.predict();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.controls.style.display = "flex";
      this.headerContainer.style.display = "block";
    }
  }
}
