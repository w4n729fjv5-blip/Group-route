import { useEffect, useRef } from "react";
import { GameEngine } from "./engine/GameEngine";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./engine/constants";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engine.start();

    return () => engine.stop();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ imageRendering: "pixelated", border: "4px solid #17331a" }}
    />
  );
}
