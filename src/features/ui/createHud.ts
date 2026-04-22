import type { Disposable } from "@/shared/contracts/Disposable";

export interface HudElements {
  hpBar: HTMLElement;
  hpLabel: HTMLElement;
  killLabel: HTMLElement;
  stageLabel: HTMLElement;
  crosshair: HTMLElement;
  damageOverlay: HTMLElement;
  endOverlay: HTMLElement;
  endTitle: HTMLElement;
  endSubtitle: HTMLElement;
  endHint: HTMLElement;
}

export type EndVariant = "win" | "lose";

export interface Hud extends Disposable {
  setHp(current: number, max: number): void;
  setKillProgress(eliminated: number, total: number): void;
  setStage(current: number, total: number, name: string): void;
  flashHitMarker(): void;
  flashDamage(): void;
  showEnd(variant: EndVariant, title: string, subtitle: string, hint: string): void;
  hideEnd(): void;
  onEndClick(cb: (() => void) | null): void;
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
    stageLabel: byId("stage-panel"),
    crosshair: byId("crosshair"),
    damageOverlay: byId("damage-overlay"),
    endOverlay: byId("end-overlay"),
    endTitle: byId("end-title"),
    endSubtitle: byId("end-subtitle"),
    endHint: byId("end-hint"),
  };
}

export function createHud(elements: HudElements): Hud {
  let hitTimer: number | undefined;
  let damageTimer: number | undefined;
  let endClickCb: (() => void) | null = null;

  const handleEndClick = () => {
    endClickCb?.();
  };
  elements.endOverlay.addEventListener("click", handleEndClick);

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
    setStage(current, total, name) {
      elements.stageLabel.textContent = `STAGE ${current} / ${total} — ${name}`;
    },
    flashHitMarker() {
      elements.crosshair.classList.add("hit");
      if (hitTimer !== undefined) window.clearTimeout(hitTimer);
      hitTimer = window.setTimeout(() => {
        elements.crosshair.classList.remove("hit");
        hitTimer = undefined;
      }, 120);
    },
    flashDamage() {
      elements.damageOverlay.classList.add("active");
      if (damageTimer !== undefined) window.clearTimeout(damageTimer);
      damageTimer = window.setTimeout(() => {
        elements.damageOverlay.classList.remove("active");
        damageTimer = undefined;
      }, 240);
    },
    showEnd(variant, title, subtitle, hint) {
      elements.endOverlay.classList.remove("hidden");
      elements.endTitle.textContent = title;
      elements.endTitle.dataset["variant"] = variant;
      elements.endSubtitle.textContent = subtitle;
      elements.endHint.textContent = hint;
    },
    hideEnd() {
      elements.endOverlay.classList.add("hidden");
    },
    onEndClick(cb) {
      endClickCb = cb;
    },
    dispose() {
      elements.endOverlay.removeEventListener("click", handleEndClick);
      if (hitTimer !== undefined) window.clearTimeout(hitTimer);
      if (damageTimer !== undefined) window.clearTimeout(damageTimer);
      endClickCb = null;
    },
  };
}
