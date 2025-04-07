import { BlurFilter, Container, FederatedPointerEvent, Sprite, Texture } from 'pixi.js';

import { engine } from '../getEngine';
import gsap from 'gsap';
import { MatchesGame } from '../screens/gameScreen/miniGames/MatchesGame';

/** Popup that shows up when gameplay is paused */
export class PhotoPopup extends Container {
  /** The dark semi-transparent background covering current screen */
  private bg: Sprite;
  /** Container for the popup UI components */
  private panel: Container;
  /** The panel background */
  private photoSprite: Sprite;
  private photoOverlay: Sprite;
  private minigame: MatchesGame;

  constructor(photo: string, minigame: MatchesGame) {
    super();

    this.minigame = minigame;

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x0;
    this.bg.eventMode = 'static';
    this.addChild(this.bg);

    // TODO: возможно придётся включить для миниигры с рюкзаком.
    this.panel = new Container();
    this.panel.eventMode = 'none';
    this.addChild(this.panel);

    this.photoSprite = Sprite.from(photo);
    this.photoSprite.anchor.set(0.5);
    this.panel.addChild(this.photoSprite);

    this.photoOverlay = Sprite.from('popup');
    this.photoOverlay.anchor.set(0.5);
    this.panel.addChild(this.photoOverlay);

    this.minigame.position.set(-250, 0);
    this.panel.addChild(this.minigame);

    //  this.eventMode = 'static';
    this.bg.on('pointerdown', this.handlePointerDown.bind(this));
    this.bg.on('pointermove', this.handlePointerMove.bind(this));
    this.bg.on('pointerup', this.handlePointerUp.bind(this));
    this.bg.on('pointerupoutside', this.handlePointerUp.bind(this));

    // this.doneButton.onPress.connect(() => engine().navigation.dismissPopup());
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
    this.bg.alpha = 0;
    this.panel.pivot.y = -400;
    gsap.to(this.bg, { alpha: 0.6, duration: 0.2, ease: 'none' });
    await gsap.to(this.panel.pivot, { y: 0, duration: 0.3, ease: 'back.out' });
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

  // Методы обработки событий
  private handlePointerDown(e: FederatedPointerEvent): void {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);
    this.minigame.onDown(x, y);
  }

  private handlePointerMove(e: FederatedPointerEvent): void {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);
    this.minigame.onMove(x, y);
  }

  private handlePointerUp(): void {
    this.minigame.onUp();
  }
}
