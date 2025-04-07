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
import { MatchesGame } from './miniGames/MatchesGame';

/** The screen that holds the app */
export class GameScreen extends Container implements AppScreen {
  /** Assets bundles required by this screen */
  public static assetBundles = ['main'];

  public mainContainer: Container;
  public inventoryContainer: Container;
  public minigameContainer: Container;
  public overlayContainer: Container;

  private settingsButton: FancyButton;

  private paused = false;
  private blockScreenMove = false;
  private minigameStarted = false;

  private parallaxBack: ParallaxBack;

  private cameraHorizontalMove: CameraHorizontalMove;
  private inventory: Inventory;
  private itemsDragging: ItemsDragging;

  private currentMouseX: number = 0;
  private currentMouseY: number = 0;

  private matchesGame: MatchesGame | null = null;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.inventoryContainer = new Container();
    this.minigameContainer = new Container();
    this.minigameContainer.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    this.overlayContainer = new Container();

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

    this.parallaxBack = new ParallaxBack('background');
    this.parallaxBack.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);

    // TODO: временный x2 скейл! УБРАТЬ!
    this.cameraHorizontalMove = new CameraHorizontalMove(this.mainContainer, this.parallaxBack.width);

    this.on('mousemove', this.onMove.bind(this));
    this.on('mousedown', this.onDown.bind(this));
    this.on('mouseup', this.onUp.bind(this));
    this.on('mouseupoutside', this.onUp.bind(this));
    this.eventMode = 'static';

    this.inventory = new Inventory(this.inventoryItemCallback.bind(this));

    this.itemsDragging = new ItemsDragging(this.draggingDropCallback.bind(this));

    if (SHOW_MENU) {
      this.playInitAnimation();
    }

    // dude
    // idle
    // idle_fire (когда костёр зажжён)
    // out
    // out_idle

    this.testFuillInventory();

    /// /////////// TEST MINIGAME ////////////////
    // TODO: тестово выпилилить
    // как будто бы игрок кликнул по костру спичками.
    // и нужно сразу скрывать интерфейс
    this.minigameStarted = true;
    this.inventoryContainer.visible = false;
    this.matchesGame = new MatchesGame(
      () => {
        console.log('matches game start!');
      },
      () => {
        console.log('matches game end!');
        this.minigameStarted = false;
        this.inventoryContainer.y = -300;
        gsap.to(this.inventoryContainer, {
          duration: 0.3,
          y: 0,
          ease: 'power1.out',
          onStart: () => {
            this.inventoryContainer.visible = true;
            // TODO: ВАЖНО! Нужно удалять только на следующий тик,
            // так как событие может придти асинхронно
            if (this.matchesGame) {
              this.matchesGame.destroy({ children: true });
              this.matchesGame = null;
            }
          },
        });
      },
    );
    /// /////////////////////////////////////////

    /// /////////// DISPLAY ORDER //////////////

    // TODO: ТЕСТОВО! ВЫПИЛИТЬ!
    this.minigameContainer.addChild(this.matchesGame);
    /// /

    this.mainContainer.addChild(this.parallaxBack);
    this.inventoryContainer.addChild(this.inventory);

    this.addChild(this.mainContainer);
    this.addChild(this.inventoryContainer);
    this.addChild(this.itemsDragging);

    this.addChild(this.minigameContainer);
    this.addChild(this.settingsButton);
    this.addChild(this.overlayContainer);
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
    // console.log('Кликаем по объекту в инвентаре', item);
    this.startDragging(this.currentMouseX, this.currentMouseY, item, true);
  };

  private playInitAnimation() {
    const blackOver = new Sprite(Texture.WHITE);
    blackOver.width = SCREEN_WIDTH;
    blackOver.height = SCREEN_HEIGHT;
    blackOver.anchor.set(0.5);
    blackOver.position.set(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    blackOver.tint = 0x000000;
    this.overlayContainer.addChild(blackOver);

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

  private onUp(e: FederatedPointerEvent) {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    if (this.minigameStarted && this.matchesGame) {
      this.matchesGame.onUp();
    }

    if (this.paused || this.minigameStarted) return;

    this.itemsDragging.onUp(x, y);
  }

  private onDown(e: FederatedPointerEvent) {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    if (this.minigameStarted && this.matchesGame) {
      this.matchesGame.onDown(x, y);
    }

    if (this.paused || this.minigameStarted) return;

    // Грубо отсекаем клики по инвентарю
    if (y < 110) return;
  }

  private onMove(e: FederatedPointerEvent) {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    if (this.minigameStarted && this.matchesGame) {
      this.matchesGame.onMove(x, y);
    }

    if (this.paused || this.minigameStarted) return;

    this.currentMouseX = x;
    this.currentMouseY = y;

    this.parallaxBack.onMove(x, y);

    this.itemsDragging.onMove(x, y);

    if (this.blockScreenMove) return;

    this.cameraHorizontalMove.onMove(x);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */

  public update(_time: Ticker) {
    const delta = _time.elapsedMS / 1000;

    if (this.minigameStarted && this.matchesGame) {
      // TODO: нужно будет как-то по-другому обновлять мини-игры
      console.log(this.minigameStarted);
      this.matchesGame.update(delta);
    }

    if (this.paused || this.minigameStarted) return;

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
