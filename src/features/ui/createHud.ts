import type { Disposable } from "@/shared/contracts/Disposable";

export interface HudElements {
  hpBar: HTMLElement;
  hpLabel: HTMLElement;
  killLabel: HTMLElement;
  // crosshair: HTMLElement;
  damageOverlay: HTMLElement;
  endOverlay: HTMLElement;
  endTitle: HTMLElement;
  endHint: HTMLElement;
}

export interface Hud extends Disposable {
  setHp(current: number, max: number): void;
  setKillProgress(eliminated: number, total: number): void;
  flashHitMarker(): void;
  flashDamage(): void;
  showEnd(kind: "victory" | "defeat", restartHint: string): void;
}

export function resolveHudElements(): HudElements {
  const byId = (id: string): HTMLElement => {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) {
      throw new Error(`HUD element missing: #${id}`);
    }
    return el;
  };
  return {
    hpBar: byId("hp-bar"),
    hpLabel: byId("hp-label"),
    killLabel: byId("kill-panel"),
    // crosshair: byId("crosshair"),
    damageOverlay: byId("damage-overlay"),
    endOverlay: byId("end-overlay"),
    endTitle: byId("end-title"),
    endHint: byId("end-hint"),
  };
}

export function createHud(elements: HudElements): Hud {
  let hitTimer: number | undefined;
  let damageTimer: number | undefined;

  return {
    setHp(current, max) {
      const pct = max === 0 ? 0 : Math.max(0, Math.min(1, current / max));
      elements.hpBar.style.width = `${pct * 100}%`;
      const hue = Math.round(120 * pct);
      elements.hpBar.style.background = `hsl(${hue}, 72%, 52%)`;
      elements.hpLabel.textContent = `HP ${Math.round(current)} / ${max}`;
    },
    setKillProgress(eliminated, total) {
      elements.killLabel.textContent = `撃破 ${eliminated} / ${total}`;
    },
    flashHitMarker() {
      // elements.crosshair.classList.add("hit");
      // if (hitTimer !== undefined) window.clearTimeout(hitTimer);
      // hitTimer = window.setTimeout(() => {
      //   elements.crosshair.classList.remove("hit");
      //   hitTimer = undefined;
      // }, 120);
    },
    flashDamage() {
      elements.damageOverlay.classList.add("active");
      if (damageTimer !== undefined) window.clearTimeout(damageTimer);
      damageTimer = window.setTimeout(() => {
        elements.damageOverlay.classList.remove("active");
        damageTimer = undefined;
      }, 240);
    },
    showEnd(kind, restartHint) {
      elements.endOverlay.classList.remove("hidden");
      if (kind === "victory") {
        elements.endTitle.textContent = "VICTORY";
        elements.endTitle.dataset["variant"] = "win";
      } else {
        elements.endTitle.textContent = "DEFEAT";
        elements.endTitle.dataset["variant"] = "lose";
      }
      elements.endHint.textContent = restartHint;
    },
    dispose() {
      if (hitTimer !== undefined) window.clearTimeout(hitTimer);
      if (damageTimer !== undefined) window.clearTimeout(damageTimer);
    },
  };
}
