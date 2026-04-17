import "./style.css";
import { createGameApp } from "./app/createGameApp";

const canvas = document.getElementById("renderCanvas");
const overlay = document.getElementById("overlay");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("#renderCanvas is missing or not a <canvas>");
}
if (!(overlay instanceof HTMLElement)) {
  throw new Error("#overlay is missing");
}

const app = createGameApp({ canvas, overlay });
app.start();

if (import.meta.hot) {
  import.meta.hot.dispose(() => app.dispose());
}
