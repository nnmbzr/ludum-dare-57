import { FancyButton } from '@pixi/ui';
import { Container, FederatedPointerEvent, Rectangle, Sprite, Texture, Ticker } from 'pixi.js';

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
import { PhotoPopup } from '../../popups/PhotoPopup';
import { InteractionManager } from './interaction/InteractionManager';
import { SpineInteractiveObject } from './interaction/SpineInteractiveObject';
import { BonfireController } from './controllers/BonfireController';
import { SpineObjectController } from './controllers/SpineObjectController';
import { BoyController } from './controllers/BoyController';
import { DudeController } from './controllers/DudeController';
import { GirlController } from './controllers/GirlController';
import { DogController } from './controllers/DogController';
import { BackpackGame } from './miniGames/BackpackGame';
import { DudeMushroom } from './miniGames/DudeMushroom';
import { CarGame } from './miniGames/CarGame';
import { MarshmeloGame } from './miniGames/MarshmeloGame';

export type MiniGame = MatchesGame | BackpackGame | DudeMushroom | CarGame | MarshmeloGame | null;

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

  private currentMinigame: MiniGame = null;

  private interactionManager: InteractionManager;

  private spineObjectControllers: SpineObjectController[] = [];

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
    this.parallaxBack.playIdle();

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

    this.testFuillInventory();

    /// /////////// DISPLAY ORDER //////////////

    this.mainContainer.addChild(this.parallaxBack);
    this.inventoryContainer.addChild(this.inventory);

    this.addChild(this.mainContainer);
    this.addChild(this.inventoryContainer);
    this.addChild(this.itemsDragging);

    this.addChild(this.minigameContainer);
    this.addChild(this.settingsButton);
    this.addChild(this.overlayContainer);

    this.interactionManager = new InteractionManager();
    this.setupLevelInteraction();

    setTimeout(() => {
      this.startDudeMinigame();
    }, 200);
  }

  private setupLevelInteraction() {
    /* const fire = Sprite.from('campfire');
    fire.anchor.set(0.5);

    const fireInteractive = new SpriteInteractiveObject('campfire', fire);
    this.parallaxBack.spine.addSlotObject('fireContainer', fireInteractive.displayObject);

    fireInteractive.acceptItem('icon-settings', 'light_fire');

    fireInteractive.setClickHandler(() => {
      console.log('Clicked on campfire!');
      // Здесь можно добавить анимацию или звук
    });

    this.interactionManager.register(fireInteractive); */
    // fire_idle
    // fire_on
    // idle
    /* const bonfire = Spine.from({ atlas: 'bonfire.atlas', skeleton: 'bonfire.json' });
    bonfire.state.setAnimation(0, 'fire_idle');
    this.parallaxBack.spine.addSlotObject('fireContainer', bonfire); */

    /// ////// Костер ///////////

    const bonfireInteractive = this.createAnimationObject(BonfireController, 'fireContainer');

    bonfireInteractive.acceptItem('white_flash', 'light_fire');
    bonfireInteractive.setClickHandler(async () => {
      (this.getControllerByType(BoyController) as BoyController).setFireState(true);
      (this.getControllerByType(DudeController) as DudeController).setFireState(true);
      (this.getControllerByType(GirlController) as GirlController).setFireState(true);
      await (this.getControllerByType(BonfireController) as BonfireController).lightFire();
    });
    this.interactionManager.register(bonfireInteractive);

    /// /////// Мальчик //////////
    const boyInteractive = this.createAnimationObject(BoyController, 'boyContainer');
    boyInteractive.setClickHandler(async () => {
      console.log('Кликнули по мальчику!');

      // Зажигаем костер и ждем завершения анимации
      await (this.getControllerByType(BoyController) as BoyController).giveGuitar();

      console.log('Персонаж получил гитару!');
      // ...
    });
    this.interactionManager.register(boyInteractive);

    /// /////// Дружок хуев //////////
    const dudeInteractive = this.createAnimationObject(DudeController, 'dudeContainer');
    dudeInteractive.setClickHandler(async () => {
      console.log('Кликнули по дружку!');
      // Здесь можно добавить анимацию или звук

      await (this.getControllerByType(DudeController) as DudeController).driveAway();
    });
    this.interactionManager.register(dudeInteractive);

    /// /////// Еотка //////////
    const girlInteractive = this.createAnimationObject(GirlController, 'girlContainer');
    girlInteractive.setClickHandler(async () => {
      console.log('Кликнули по зазнобе!');
      // Здесь можно добавить анимацию или звук

      await (this.getControllerByType(GirlController) as GirlController).giveStick();
    });
    this.interactionManager.register(girlInteractive);

    /// /////// Пёсик //////////
    const dogInteractive = this.createAnimationObject(DogController, 'dogContainer');
    dogInteractive.setClickHandler(async () => {
      console.log('Кликнули по зазнобе!');
      // Здесь можно добавить анимацию или звук

      await (this.getControllerByType(DogController) as DogController).giveBall();
    });
    this.interactionManager.register(dogInteractive);
  }

  private startDudeMinigame() {
    this.currentMinigame = new DudeMushroom(
      () => {}, // Коллбек при инициализации
      () => {
        this.minigameStarted = false;
        this.inventoryContainer.y = -300;
        gsap.to(this.inventoryContainer, {
          duration: 0.3,
          y: 0,
          ease: 'power1.out',
          onStart: () => {
            this.inventoryContainer.visible = true;
            const onComplete = async () => {
              await engine().navigation.dismissPopup();
              // Удаляем только на следующий тик
              if (this.currentMinigame) {
                this.currentMinigame.destroy({ children: true });
                this.currentMinigame = null;
              }
              this.resume();
            };

            onComplete();
          },
        });
      },
    );

    this.playMinigame();
  }

  /* private startBackpackMinigame() {
    this.currentMinigame = new BackpackGame(
      () => {}, // Коллбек при инициализации
      () => {
        this.minigameStarted = false;
        this.inventoryContainer.y = -300;
        gsap.to(this.inventoryContainer, {
          duration: 0.3,
          y: 0,
          ease: 'power1.out',
          onStart: () => {
            this.inventoryContainer.visible = true;
            const onComplete = async () => {
              await engine().navigation.dismissPopup();
              // Удаляем только на следующий тик
              if (this.currentMinigame) {
                this.currentMinigame.destroy({ children: true });
                this.currentMinigame = null;
              }
              this.resume();
            };

            onComplete();
          },
        });
      },
    );

    this.playMinigame();
  } */

  private startMatchesGame() {
    /// /////////// TEST MINIGAME ////////////////

    this.currentMinigame = new MatchesGame(
      () => {},
      () => {
        this.minigameStarted = false;
        this.inventoryContainer.y = -300;
        gsap.to(this.inventoryContainer, {
          duration: 0.3,
          y: 0,
          ease: 'power1.out',
          onStart: () => {
            this.inventoryContainer.visible = true;
            const onComplete = async () => {
              await engine().navigation.dismissPopup();
              // TODO: ВАЖНО! Нужно удалять только на следующий тик,
              // так как событие может придти асинхронно
              if (this.currentMinigame) {
                this.currentMinigame.destroy({ children: true });
                this.currentMinigame = null;
              }
              this.resume();
            };

            onComplete();
          },
        });
      },
    );

    this.playMinigame(-250);
  }

  private playMinigame(yOffset: number = 0) {
    if (!this.currentMinigame) {
      console.warn('Minigame is null');
      return;
    }

    this.minigameStarted = true;
    this.inventoryContainer.visible = false;
    /// /////////////////////////////////////////

    engine().navigation.presentPopup(PhotoPopup, this.currentMinigame.getPhoto(), this.currentMinigame, yOffset);
  }

  private draggingDropCallback(rect: Rectangle, id: string, itemType: 'inventory' | 'game') {
    // Код обработки "дропа" объекта
    // console.log(`Item ${id} dropped at:`, rect, itemType);

    // Тут мы должны обрабатывать пересечение одних объектов с другими
    // но пока просто возвращаем отсутствие пересечения
    // this.checkIntersections(bounds, id);

    const result = this.interactionManager.checkInteraction(id, rect);

    console.log('draggingDropCallback', result);

    if (result.success) {
      // Обрабатываем успешное взаимодействие
      if (result.actionType === 'light_fire') {
        // Зажигаем костер
        this.startMatchesGame();
      }

      // Удаляем предмет из инвентаря, если он был потреблен
      if (result.consumeItem && itemType === 'inventory') {
        this.inventory.removeItem(id);
      }

      return true;
    }

    if (itemType === 'inventory') {
      // Предмет был в инвентаре. Вернем его обратно.
      this.inventory.cancelInteraction(id);
    }

    return false;
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

    if (this.minigameStarted && this.currentMinigame) {
      this.currentMinigame.onUp();
    }

    if (this.paused || this.minigameStarted) return;

    this.itemsDragging.onUp(x, y);
  }

  private onDown(e: FederatedPointerEvent) {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    if (this.minigameStarted && this.currentMinigame) {
      this.currentMinigame.onDown(x, y);
    }

    if (this.paused || this.minigameStarted) return;

    const clickedObjectId = this.interactionManager.handleClick(x, y);
    if (clickedObjectId) {
      // TODO: обработка клика по интерактивному объекту
      // по идее клик и так переопределяется в setClickHandler
      // console.log(`Clicked on interactive object: ${clickedObjectId}`);
    }

    this.currentMouseX = x;
    this.currentMouseY = y;

    this.parallaxBack.onMove(x, y);

    this.itemsDragging.onMove(x, y);

    if (this.blockScreenMove) return;

    this.cameraHorizontalMove.onMove(x);
  }

  private onMove(e: FederatedPointerEvent) {
    const { x, y } = engine().virtualScreen.toVirtualCoordinates(e.global.x, e.global.y);

    if (this.minigameStarted && this.currentMinigame) {
      this.currentMinigame.onMove(x, y);
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

    if (this.minigameStarted && this.currentMinigame) {
      // TODO: нужно будет как-то по-другому обновлять мини-игры
      this.currentMinigame.update(delta);
    }

    if (this.paused || this.minigameStarted) return;

    this.interactionManager.update(delta);

    const cameraOffset = this.cameraHorizontalMove.getCameraOffset();
    this.parallaxBack.update(delta, cameraOffset);

    this.spineObjectControllers.forEach((controller) => {
      controller.update(delta);
    });

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

  /**
   * Создает и регистрирует анимационный объект
   * @param controllerClass Класс контроллера (например, BonfireController)
   * @param slotName Имя слота, в который будет помещен объект
   * @returns Интерактивный объект, готовый к добавлению в систему взаимодействия
   */
  public createAnimationObject<T extends SpineObjectController>(
    controllerClass: new () => T,
    slotName: string,
  ): SpineInteractiveObject {
    // Создаем контроллер
    const controller = new controllerClass();

    // Добавляем его в массив для обновления
    this.spineObjectControllers.push(controller);

    // Получаем спайн объект
    const spine = controller.getSpine();

    // Создаем интерактивный объект
    // TODO: если нужно создавать подсветку, то нужно передавать в опциях кость или слот
    const interactiveObject = new SpineInteractiveObject(controller.name, spine);

    // Добавляем в сцену
    this.parallaxBack.spine.addSlotObject(slotName, interactiveObject.displayObject);

    // Возвращаем созданный интерактивный объект
    return interactiveObject;
  }

  /**
   * Получает контроллер по его типу
   * @param controllerClass Класс контроллера
   * @returns Найденный контроллер или undefined, если не найден
   */
  public getControllerByType<T extends SpineObjectController>(
    controllerClass: new (...args: any[]) => T,
  ): T | undefined {
    return this.spineObjectControllers.find((controller) => controller instanceof controllerClass) as T | undefined;
  }
}
