import { Container, FederatedPointerEvent, Sprite, Ticker } from 'pixi.js';

import { engine } from '../../getEngine';
import { PausePopup } from '../../popups/PausePopup';

import { AppScreen } from '../../../engine/navigation/navigation';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../../main';
import { ParallaxStartScreen } from './ParallaxStartScreen';
import { GameScreen } from '../gameScreen/GameScreen';
import gsap from 'gsap';

/** The screen that holds the app */
export class MainScreen extends Container implements AppScreen {
  /** Assets bundles required by this screen */
  public static assetBundles = ['main'];

  private parallaxStartScreen: ParallaxStartScreen;

  public mainContainer: Container;
  private paused = false;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.mainContainer.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    this.addChild(this.mainContainer);

    this.on('mousemove', this.onMouseMove.bind(this));
    this.on('mousedown', this.onMouseDown.bind(this));
    this.eventMode = 'static';

    this.parallaxStartScreen = new ParallaxStartScreen('startscreen');
    this.mainContainer.addChild(this.parallaxStartScreen);
  }

  private onMouseDown() {
    if (this.parallaxStartScreen.readyToGo) {
      this.playOutAnimation();
    }
  }

  private playOutAnimation() {
    this.parallaxStartScreen.playOutAnimation();
    const whiteCircle = Sprite.from('white_flash');
    whiteCircle.scale.set(16);
    whiteCircle.anchor.set(0.5);
    whiteCircle.visible = false;
    whiteCircle.alpha = 0.25;

    const delay = 0.25;

    gsap.to(whiteCircle, {
      duration: 0.1,
      delay: delay,
      alpha: 1,
      ease: 'power1.out',
      onStart: () => {
        whiteCircle.visible = true;
      },
    });

    gsap.to(whiteCircle.scale, {
      duration: 0.15,
      delay: delay,
      x: 120,
      y: 120,
      ease: 'power1.out',
      onStart: () => {
        whiteCircle.visible = true;
      },
      onComplete: () => {
        this.parallaxStartScreen.visible = false;
        gsap.to(whiteCircle, {
          duration: 0.25,
          delay: 0.1,
          pixi: { tint: 0x000000 },
          ease: 'sine.out',
          onComplete: () => {
            engine().navigation.showScreen(GameScreen);
          },
        });
      },
    });
    this.mainContainer.addChild(whiteCircle);
  }

  private onMouseMove(e: FederatedPointerEvent) {
    const { x } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    this.parallaxStartScreen.onMouseMove(x);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */

  public update(_time: Ticker) {
    if (this.paused) return;

    const delta = _time.elapsedMS / 1000;

    this.parallaxStartScreen.update(delta);
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play('main/sounds/bgm-main.mp3', { volume: 0.5 });
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }
}
