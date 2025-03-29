declare module 'heatmap.js' {
    interface HeatmapDataPoint {
      x: number;
      y: number;
      value: number;
    }
  
    interface HeatmapConfig {
      container: HTMLElement;
      radius?: number;
      maxOpacity?: number;
      minOpacity?: number;
      blur?: number;
      gradient?: { [key: string]: string };
    }
  
    interface Heatmap {
      addData(point: HeatmapDataPoint): void;
      setData(data: { max: number; data: HeatmapDataPoint[] }): void;
      repaint(): void;
    }
  
    const h337: {
      create(config: HeatmapConfig): Heatmap;
    };
  
    export default h337;
  }
  