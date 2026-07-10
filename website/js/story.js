// Story: os painéis das features orbitam o charuto central. Cada painel é
// ativado por uma sub-faixa do progresso local da seção pinned; a ativação
// dispara um flare de brasa + queda de cinza, e uma hairline dourada liga o
// painel ativo à linha de queima.

import { clamp01 } from './scroll.js';

const CENTERS = [0.15, 0.37, 0.59, 0.81];
const FULL = 0.07; // meia-largura totalmente visível
const FADE = 0.05; // rampa de fade além da faixa cheia

export class Story {
  constructor(cigar) {
    this.cigar = cigar;
    this.stage = null; // CigarStage — injetado depois (hairline precisa da pose)
    this.section = document.getElementById('story');
    this.pin = this.section.querySelector('.story-pin');
    this.head = this.section.querySelector('.story-head');
    this.panels = [...this.section.querySelectorAll('.story-panel')];
    this.hairline = this.section.querySelector('.story-hairline');
    this._lastA = new Array(this.panels.length).fill(-1);
    this._wasOn = new Array(this.panels.length).fill(false);
    this._anchor = null;
    this._anchorIdx = -1;
    this._lastHeadA = -1;
    this._hairOn = false;
    this.enabled = false;
    this.applyMode();
  }

  // Cena pinned no desktop; fluxo normal abaixo de 720px
  applyMode() {
    const want = window.innerWidth >= 720;
    if (want !== this.enabled) {
      this.enabled = want;
      this.section.classList.toggle('is-anim', want);
      if (want) {
        // Em modo anim o JS dirige a opacidade — neutraliza os reveals
        this.head.classList.add('is-visible');
        for (const p of this.panels) p.classList.add('is-visible');
      } else {
        for (const p of this.panels) p.style.cssText = '';
        this.head.style.cssText = '';
        this.hairline.style.opacity = '0';
      }
    }
    this._measure();
  }

  _measure() {
    this.top = this.section.offsetTop;
    this.height = this.section.offsetHeight;
    this._anchor = null;
    this._anchorIdx = -1;
  }

  tick(state) {
    if (!this.enabled) return;
    const sp = clamp01((state.scrollY - this.top) / (this.height - state.vh));

    // Head visível na chegada, sai antes do primeiro painel
    const headA = Math.round((1 - clamp01((sp - 0.02) / 0.05)) * 100) / 100;
    if (headA !== this._lastHeadA) {
      this._lastHeadA = headA;
      this.head.style.opacity = String(headA);
    }

    let active = -1;
    let activeA = 0;
    for (let i = 0; i < this.panels.length; i++) {
      const a = 1 - clamp01((Math.abs(sp - CENTERS[i]) - FULL) / FADE);
      const q = Math.round(a * 100) / 100;
      if (q !== this._lastA[i]) {
        this._lastA[i] = q;
        const side = this.panels[i].dataset.side === 'left' ? -1 : 1;
        this.panels[i].style.opacity = String(q);
        this.panels[i].style.transform = `translate(${(side * (1 - q) * 40).toFixed(1)}px, ${((1 - q) * 16).toFixed(1)}px)`;
      }
      // Borda de subida: o texto "toca" o charuto — flare + cinza cai
      const on = a > 0.5;
      if (on && !this._wasOn[i]) {
        this.cigar.flare(0.8);
        this.cigar.forceAshDrop();
      }
      this._wasOn[i] = on;
      if (a > activeA) {
        activeA = a;
        active = i;
      }
    }

    this._drawHairline(active, activeA);
  }

  _drawHairline(idx, a) {
    // Só aparece com o painel quase assentado (âncora estável)
    const hairA = idx >= 0 ? clamp01((a - 0.85) / 0.15) * 0.6 : 0;
    if (hairA <= 0.01 || !this.stage || !this.stage.pose) {
      if (this._hairOn) {
        this.hairline.style.opacity = '0';
        this._hairOn = false;
      }
      return;
    }
    if (idx !== this._anchorIdx || !this._anchor) {
      this._anchorIdx = idx;
      const r = this.panels[idx].getBoundingClientRect();
      const pinR = this.pin.getBoundingClientRect();
      const side = this.panels[idx].dataset.side;
      this._anchor = {
        x: (side === 'left' ? r.right + 14 : r.left - 14) - pinR.left,
        y: r.top + r.height * 0.5 - pinR.top,
        pinX: pinR.left,
        pinY: pinR.top,
      };
    }
    const pt = this.stage.getBurnPointViewport();
    if (!pt) return;
    const ax = this._anchor.x;
    const ay = this._anchor.y;
    const dx = pt[0] - this._anchor.pinX - ax;
    const dy = pt[1] - this._anchor.pinY - ay;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    this.hairline.style.transform = `translate(${ax.toFixed(1)}px, ${ay.toFixed(1)}px) rotate(${ang.toFixed(4)}rad) scaleX(${(len / 100).toFixed(3)})`;
    this.hairline.style.opacity = hairA.toFixed(2);
    this._hairOn = true;
  }
}
