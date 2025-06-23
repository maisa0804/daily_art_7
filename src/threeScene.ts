import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";

export class ThreeScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private currentLine1: Line2 | null = null;
  private points1: number[] = [];
  private isDrawing1 = false;
  private currentLine2: Line2 | null = null;
  private points2: number[] = [];
  private isDrawing2 = false;
  private material1: LineMaterial;
  private material2: LineMaterial;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    container.appendChild(this.renderer.domElement);

    this.material1 = new LineMaterial({
      color: 0xff00ff,
      linewidth: 1,
      vertexColors: false,
    });
    this.material2 = new LineMaterial({
      color: 0xff00ff,
      linewidth: 1,
      vertexColors: false,
    });

    this.material1.resolution.set(
      container.clientWidth,
      container.clientHeight
    );
    this.material2.resolution.set(
      container.clientWidth,
      container.clientHeight
    );

    this.camera.position.z = 5;
    this.animate();
    window.addEventListener("resize", this.onWindowResize);
    this.onWindowResize();
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  public addPoint1(x: number, y: number, z: number) {
    if (!this.isDrawing1) {
      this.isDrawing1 = true;
      this.points1 = [];
    }
    const worldPos = new THREE.Vector3(
      (x - 0.5) * 10,
      -(y - 0.5) * 10,
      (z - 0.5) * 10
    );
    this.points1.push(worldPos.x, worldPos.y, worldPos.z);
    this.updateLine(1);
  }

  public finalizeLine1() {
    this.isDrawing1 = false;
  }

  public addPoint2(x: number, y: number, z: number) {
    if (!this.isDrawing2) {
      this.isDrawing2 = true;
      this.points2 = [];
    }
    const worldPos = new THREE.Vector3(
      (x - 0.5) * 10,
      -(y - 0.5) * 10,
      (z - 0.5) * 10
    );
    this.points2.push(worldPos.x, worldPos.y, worldPos.z);
    this.updateLine(2);
  }

  public finalizeLine2() {
    this.isDrawing2 = false;
  }

  private updateLine(handIndex: 1 | 2) {
    let line = handIndex === 1 ? this.currentLine1 : this.currentLine2;
    const points = handIndex === 1 ? this.points1 : this.points2;
    const material = handIndex === 1 ? this.material1 : this.material2;

    if (points.length < 6) {
      // Need at least 2 points (6 numbers)
      if (line) {
        line.geometry.dispose();
        this.scene.remove(line);
        if (handIndex === 1) this.currentLine1 = null;
        else this.currentLine2 = null;
      }
      return;
    }

    const geometry = new LineGeometry();
    geometry.setPositions(points);

    if (line) {
      line.geometry.dispose();
      line.geometry = geometry;
    } else {
      const newLine = new Line2(geometry, material);
      this.scene.add(newLine);
      if (handIndex === 1) this.currentLine1 = newLine;
      else this.currentLine2 = newLine;
    }
  }

  private onWindowResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) return; // Avoid setting 0 size

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.material1.resolution.set(width, height);
    this.material2.resolution.set(width, height);
  };
}
