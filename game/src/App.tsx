import { GameCanvas } from "./GameCanvas";

export function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "#0f1f10",
        color: "#e8e8e8",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: 0 }}>Top-Down Prototype</h1>
      <p style={{ margin: 0, opacity: 0.8 }}>Move with WASD or Arrow Keys</p>
      <GameCanvas />
    </div>
  );
}
