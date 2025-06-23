import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import { ThreeScene } from "./threeScene";

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
  private instructionsContainer: HTMLDivElement;
  private handLandmarker?: HandLandmarker;
  private lastVideoTime = -1;
  private threeScene: ThreeScene;

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
    this.instructionsContainer = document.querySelector(
      ".instructions-container"
    ) as HTMLDivElement;
    const threeContainer = document.getElementById(
      "three-container"
    ) as HTMLDivElement;
    this.threeScene = new ThreeScene(threeContainer);

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

    if (result.landmarks && result.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(this.canvasCtx);
      for (const landmarks of result.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          {
            color: "#FFFFFF",
            lineWidth: 1,
          }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: "#00FFFF",
          radius: 2,
        });
      }

      // Process first hand
      const landmarks1 = result.landmarks[0];
      if (landmarks1) {
        const isIndexFingerUp =
          landmarks1[8].y < landmarks1[5].y &&
          landmarks1[12].y > landmarks1[9].y &&
          landmarks1[16].y > landmarks1[13].y &&
          landmarks1[20].y > landmarks1[17].y;
        if (isIndexFingerUp) {
          this.threeScene.addPoint1(
            landmarks1[8].x,
            landmarks1[8].y,
            landmarks1[8].z
          );
        } else {
          this.threeScene.finalizeLine1();
        }
      }

      // Process second hand
      const landmarks2 = result.landmarks[1];
      if (landmarks2) {
        const isIndexFingerUp =
          landmarks2[8].y < landmarks2[5].y &&
          landmarks2[12].y > landmarks2[9].y &&
          landmarks2[16].y > landmarks2[13].y &&
          landmarks2[20].y > landmarks2[17].y;
        if (isIndexFingerUp) {
          this.threeScene.addPoint2(
            landmarks2[8].x,
            landmarks2[8].y,
            landmarks2[8].z
          );
        } else {
          this.threeScene.finalizeLine2();
        }
      } else {
        // If second hand is not detected, finalize its line
        this.threeScene.finalizeLine2();
      }
    } else {
      // If no hands are detected, finalize both lines
      this.threeScene.finalizeLine1();
      this.threeScene.finalizeLine2();
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
    this.canvas.style.display = "block";

    // Show instructions and then hide them after a delay
    this.instructionsContainer.style.display = "block";
    setTimeout(() => {
      this.instructionsContainer.style.transition = "opacity 1s";
      this.instructionsContainer.style.opacity = "0";
    }, 4000); // Start fading after 4 seconds

    try {
      await this.initHandLandmarker();
      await this.initCamera();
      this.predict();
    } catch (error) {
      console.error("Failed to initialize app:", error);
      this.controls.style.display = "flex";
      this.headerContainer.style.display = "block";
      this.instructionsContainer.style.display = "none";
    }
  }
}
