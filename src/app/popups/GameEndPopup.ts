import { BlurFilter, Container, Sprite, Texture } from 'pixi.js';

import { engine } from '../getEngine';
import gsap from 'gsap';

/** Popup that shows up when gameplay is paused */
export class GameEndPopup extends Container {
  /** The dark semi-transparent background covering current screen */
  private bg: Sprite;
  /** Container for the popup UI components */
  private panel: Container;
  /** The popup title label */

  constructor() {
    super();

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x0;
    this.bg.interactive = true;
    this.addChild(this.bg);

    this.panel = new Container();
    this.addChild(this.panel);
  }

  /** Resize the popup, fired whenever window size changes */
  public resize(width: number, height: number) {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
  }

  /** Present the popup, animated */
  public async show() {
    const currentEngine = engine();
    if (currentEngine.navigation.currentScreen) {
      currentEngine.navigation.currentScreen.filters = [new BlurFilter({ strength: 5 })];
    }

    engine().audio.bgm.play('main/sounds/jamtrack-end.wav', { volume: 0.35 });

    this.bg.alpha = 0;
    this.panel.pivot.y = -400;
    gsap.to(this.bg, { alpha: 0.8, duration: 0.2, ease: 'none' });
    await gsap.to(this.panel.pivot, { y: 0, duration: 0.3, ease: 'back.out' });

    gsap.to(this.bg, { alpha: 1, duration: 10, ease: 'none' });
  }

  /** Dismiss the popup, animated */
  public async hide() {
    const currentEngine = engine();
    if (currentEngine.navigation.currentScreen) {
      currentEngine.navigation.currentScreen.filters = [];
    }
    gsap.to(this.bg, { alpha: 0, duration: 0.2, ease: 'none' });
    await gsap.to(this.panel.pivot, {
      y: -500,
      duration: 0.3,
      ease: 'back.in',
    });
  }
}
