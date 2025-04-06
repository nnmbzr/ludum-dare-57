import { FancyButton } from '@pixi/ui';
import { Container, FederatedPointerEvent, Sprite, Texture, Ticker } from 'pixi.js';

import { engine } from '../../getEngine';
import { PausePopup } from '../../popups/PausePopup';
import { SettingsPopup } from '../../popups/SettingsPopup';

import { AppScreen } from '../../../engine/navigation/navigation';
import gsap from 'gsap';
import { SCREEN_HEIGHT, SCREEN_WIDTH, SHOW_MENU } from '../../../main';
import { ParallaxBack } from './ParallaxBack';
import { CameraHorizontalMove } from './CameraHorizontalMove';
import { Inventory } from './Inventory';
import { ItemsDragging } from './ItemsDragging';

/** The screen that holds the app */
export class GameScreen extends Container implements AppScreen {
  /** Assets bundles required by this screen */
  public static assetBundles = ['main'];

  public mainContainer: Container;
  private settingsButton: FancyButton;

  private paused = false;
  private blockScreenMove = false;

  private parallaxBack: ParallaxBack;

  private cameraHorizontalMove: CameraHorizontalMove;
  private inventory: Inventory;
  private itemsDragging: ItemsDragging;

  private currentMouseX: number = 0;
  private currentMouseY: number = 0;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

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

    this.settingsButton = new FancyButton({
      defaultView: 'icon-settings',
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() => engine().navigation.presentPopup(SettingsPopup));
    this.settingsButton.position.set(SCREEN_WIDTH - 30, 30);
    this.addChild(this.settingsButton);

    this.parallaxBack = new ParallaxBack('bg_test');
    this.parallaxBack.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    // TODO: временный x2 скейл! УБРАТЬ!
    this.parallaxBack.scale.set(0.5);
    this.mainContainer.addChild(this.parallaxBack);

    // TODO: временный x2 скейл! УБРАТЬ!
    this.cameraHorizontalMove = new CameraHorizontalMove(this.mainContainer, this.parallaxBack.width);

    this.onglobalmousemove = this.onMouseMove.bind(this);
    this.on('mousedown', this.onMouseDown.bind(this));
    this.on('mouseup', this.onMouseUp.bind(this));
    this.eventMode = 'static';

    this.inventory = new Inventory(this.inventoryItemCallback.bind(this));
    this.addChild(this.inventory);

    this.itemsDragging = new ItemsDragging(this.draggingDropCallback.bind(this));
    this.addChild(this.itemsDragging);

    if (SHOW_MENU) {
      this.playInitAnimation();
    }

    this.testFuillInventory();
  }

  private draggingDropCallback(
    bounds: { x: number; y: number; width: number; height: number },
    id: string,
    itemType: 'inventory' | 'game',
  ) {
    // Код обработки "дропа" объекта
    console.log(`Item ${id} dropped at:`, bounds, itemType);

    // Тут мы должны обрабатывать пересечение одних объектов с другими
    // но пока просто возвращаем отсутствие пересечения
    // this.checkIntersections(bounds, id);

    const result = false;

    if (!result) {
      // Возвращаем объекты на место
      if (itemType === 'inventory') {
        // Предмет был в инвентаре. Вернем его обратно.
        this.inventory.cancelInteraction(id);
      }
    }
  }

  private startDragging(x: number, y: number, id: string, fromInventory: boolean): void {
    const type = fromInventory ? 'inventory' : 'game';
    this.itemsDragging.addItem(x, y, id, type);
  }

  private testFuillInventory() {
    const objects: string[] = ['button', 'icon-pause', 'icon-settings', 'rounded-rectangle', 'white_flash'];

    objects.forEach((object) => {
      this.inventory.addItem(object);
    });
  }

  private inventoryItemCallback = (item: string) => {
    console.log('Кликаем по объекту в инвентаре', item);
    this.startDragging(this.currentMouseX, this.currentMouseY, item, true);
  };

  private onMouseUp(e: FederatedPointerEvent) {
    if (this.paused) return;

    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);
    this.itemsDragging.onUp(x, y);
  }

  private onMouseDown(e: FederatedPointerEvent) {
    const { y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    // Грубо отсекаем клики по инвентарю
    if (y < 110) return;
  }

  private playInitAnimation() {
    const blackOver = new Sprite(Texture.WHITE);
    blackOver.width = SCREEN_WIDTH;
    blackOver.height = SCREEN_HEIGHT;
    blackOver.anchor.set(0.5);
    blackOver.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    blackOver.tint = 0x000000;
    this.addChild(blackOver);

    gsap.to(blackOver, {
      duration: 3,
      alpha: 0,
      ease: 'power1.out',
      onStart: () => {},
      onComplete: () => {
        blackOver.destroy();
      },
    });
  }

  private onMouseMove(e: FederatedPointerEvent) {
    if (this.paused) return;

    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    this.currentMouseX = x;
    this.currentMouseY = y;

    this.parallaxBack.onMouseMove(x, y);

    this.itemsDragging.onMouseMove(x, y);

    if (this.blockScreenMove) return;

    this.cameraHorizontalMove.onMouseMove(x);

    // console.log('camera offset', cameraOffset);

    // console.log('pure width', pureWidth);
    // console.log('base offset', baseOffset);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */

  public update(_time: Ticker) {
    if (this.paused) return;

    const delta = _time.elapsedMS / 1000;

    const cameraOffset = this.cameraHorizontalMove.getCameraOffset();
    this.parallaxBack.update(delta, cameraOffset);

    this.itemsDragging.update(delta);
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

    const elementsToAnimate = [this.settingsButton, this.inventory];

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
