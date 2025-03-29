// src/types/custom.d.ts
export {};

declare global {
  interface Window {
    h337: any;
    GazeCloudAPI: {
      StartEyeTracking: () => void;
      StopEyeTracking: () => void;
      OnResult: (data: any) => void;
      OnError?: (err: any) => void;
    };
  }
}
