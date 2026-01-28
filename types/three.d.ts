// Type definitions for three.js
import * as THREE from 'three';

export * from 'three';

declare global {
  const THREE: typeof import('three');
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      boxGeometry: any;
      meshBasicMaterial: any;
      ambientLight: any;
      pointLight: any;
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      line: any;
      lineBasicMaterial: any;
      group: any;
      sphereGeometry: any;
    }
  }
}
