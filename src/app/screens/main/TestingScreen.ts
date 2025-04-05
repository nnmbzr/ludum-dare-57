import { FancyButton } from '@pixi/ui';
// import type { Ticker } from 'pixi.js';
import { Container, FederatedPointerEvent, Ticker } from 'pixi.js';

import { engine } from '../../getEngine';
import { PausePopup } from '../../popups/PausePopup';
import { SettingsPopup } from '../../popups/SettingsPopup';
import { Button } from '../../ui/Button';

import { Bouncer } from './Bouncer';
import { AppScreen } from '../../../engine/navigation/navigation';
import gsap from 'gsap';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../../main';
import { ParallaxOwl } from './ParallaxOwl';

/** The screen that holds the app */
export class TestingScreen extends Container implements AppScreen {
  /** Assets bundles required by this screen */
  public static assetBundles = ['main'];

  public mainContainer: Container;
  private pauseButton: FancyButton;
  private settingsButton: FancyButton;
  private addButton: FancyButton;
  private removeButton: FancyButton;
  private bouncer: Bouncer;
  private paused = false;

  private parallaxOwl: ParallaxOwl;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    this.bouncer = new Bouncer();

    const buttonAnimations = {
      hover: {
        props: {
          scale: { x: 1.1, y: 1.1 },
        },
        duration: 100,
      },
      pressed: {
        props: {
          scale: { x: 0.9, y: 0.9 },
        },
        duration: 100,
      },
    };
    this.pauseButton = new FancyButton({
      defaultView: 'icon-pause',
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() => engine().navigation.presentPopup(PausePopup));
    this.addChild(this.pauseButton);

    this.settingsButton = new FancyButton({
      defaultView: 'icon-settings',
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() => engine().navigation.presentPopup(SettingsPopup));
    this.addChild(this.settingsButton);

    this.addButton = new Button({
      text: 'Add',
      width: 175,
      height: 110,
    });
    this.addButton.onPress.connect(() => this.bouncer.add());
    this.addChild(this.addButton);

    this.removeButton = new Button({
      text: 'Remove',
      width: 175,
      height: 110,
    });
    this.removeButton.onPress.connect(() => this.bouncer.remove());
    this.addChild(this.removeButton);

    this.parallaxOwl = new ParallaxOwl('owl-pro');
    this.parallaxOwl.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    this.parallaxOwl.scale.set(0.5, 0.5);
    this.addChild(this.parallaxOwl);

    this.onglobalmousemove = this.onMouseMove.bind(this);
    this.eventMode = 'static';

    /* this.spine.on('pointerdown', (e) => {
      // TODO: пример приведения координат клика к виртуальной позиции
      console.log(engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y));
    });
    this.spine.eventMode = 'static'; */

    // down
    // left
    // right
    // up

    // + idle
    // + blink
  }

  private onMouseMove(e: FederatedPointerEvent) {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    this.parallaxOwl.onMouseMove(x, y);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */

  public update(_time: Ticker) {
    if (this.paused) return;
    this.bouncer.update();

    const delta = _time.deltaTime / 1000;

    this.parallaxOwl.update(delta);
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

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.removeButton.x = width / 2 - 100;
    this.removeButton.y = height - 75;
    this.addButton.x = width / 2 + 100;
    this.addButton.y = height - 75;

    this.bouncer.resize(width, height);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play('main/sounds/bgm-main.mp3', { volume: 0.5 });

    const elementsToAnimate = [this.pauseButton, this.settingsButton, this.addButton, this.removeButton];

    let finalPromise!: gsap.core.Tween;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = gsap.to(element, {
        alpha: 1,
        duration: 0.3,
        ease: 'back.out',
      });
    }

    await finalPromise;
    this.bouncer.show(this);
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
