import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container, Point } from 'pixi.js';
import gsap from 'gsap';

// Константы для игровой механики
const SUCCESS_HEIGHT = 250; // Высота для успешного завершения
const GRAVITY_STRENGTH = 4000; // Сила гравитации (пикселей в секунду в квадрате)
const MIN_SWIPE_SPEED = 50; // Минимальная скорость свайпа для эффекта
const MAX_SWIPE_SPEED = 4000; // Максимальная скорость свайпа для расчетов
const SWIPE_POWER_FACTOR = 0.5; // Коэффициент влияния скорости свайпа на силу броска

export class BackpackGame extends Container {
  private spine: Spine;
  private state: AnimationState;

  // Последовательность объектов
  private readonly objectSequence = ['compass', 'paper', 'spray', 'binocle', 'camera', 'matches'];
  private currentObjectIndex = 0;

  // Стартовые позиции для каждого объекта
  private objectStartPositions: Map<string, Point> = new Map();

  // Состояние взаимодействия
  private isMouseDown = false;
  private isAnimating = false;
  private isFlying = false;

  // Параметры для свайпа
  private lastMouseY = 0;
  private lastUpdateTime = 0;
  private swipeVelocityY = 0;

  // Физика объекта
  private objectVelocityY = 0;

  private ready = false;
  private endGame = false;

  // Коллбеки
  private inCallBack: () => void;
  private endGameCallBack: () => void;

  constructor(inCallBack: () => void, endGameCallBack: () => void) {
    super();

    this.inCallBack = inCallBack;
    this.endGameCallBack = endGameCallBack;

    // Инициализация Spine
    this.spine = Spine.from({ skeleton: 'bagpack.json', atlas: 'bagpack.atlas' });
    this.state = this.spine.state;

    // Запоминаем начальные позиции всех объектов
    this.saveInitialPositions();

    // Устанавливаем начальные анимации
    this.state.setAnimation(0, 'in');

    // Настраиваем слушатель для отслеживания завершения анимаций
    this.setupListeners();

    this.addChild(this.spine);
    this.lastUpdateTime = Date.now();
  }

  private saveInitialPositions() {
    // Сохраняем начальные позиции всех объектов
    for (const boneName of this.objectSequence) {
      const bone = this.spine.skeleton.findBone(boneName);
      if (bone) {
        this.objectStartPositions.set(boneName, new Point(bone.x, bone.y));
      }
    }
  }

  private setupListeners() {
    this.state.addListener({
      complete: (entry) => {
        if (entry.animation?.name === 'in') {
          // Анимация появления завершена, можно начинать игру
          this.inCallBack();
          this.ready = true;
          this.state.setAnimation(0, 'idle', true);
          this.prepareCurrentObject();
        } else if (entry.animation?.name === 'out') {
          // Анимация завершения игры
          console.log('Игра завершена!');
          this.endGameCallBack();
          this.endGame = true;
        }
      },
    });
  }

  private prepareCurrentObject() {
    // Подготавливаем текущий объект к взаимодействию
    const currentBone = this.objectSequence[this.currentObjectIndex];
    console.log(`Подготовка объекта: ${currentBone}`);

    // Возвращаем объект на его начальную позицию
    this.resetObjectPosition(currentBone);

    // Сбрасываем состояние физики
    this.objectVelocityY = 0;
    this.isFlying = false;
  }

  private resetObjectPosition(boneName: string) {
    const bone = this.spine.skeleton.findBone(boneName);
    const startPos = this.objectStartPositions.get(boneName);

    if (bone && startPos) {
      bone.x = startPos.x;
      bone.y = startPos.y;
    }
  }

  public onDown(_x: number, y: number) {
    if (!this.ready || this.endGame || this.isAnimating || this.isFlying) return;

    this.isMouseDown = true;

    // Запоминаем начальные координаты для свайпа
    this.lastMouseY = y;
    this.lastUpdateTime = Date.now();
    this.swipeVelocityY = 0;

    // Если объект был в анимации падения, отменяем её
    const currentBone = this.objectSequence[this.currentObjectIndex];
    const bone = this.spine.skeleton.findBone(currentBone);

    if (bone && gsap.isTweening(bone)) {
      gsap.killTweensOf(bone);
    }
  }

  public onUp() {
    if (!this.ready || this.endGame) return;

    // Если мышь была нажата и мы сделали свайп
    if (this.isMouseDown) {
      this.isMouseDown = false;

      console.log(this.swipeVelocityY.toFixed(2), MIN_SWIPE_SPEED, this.swipeVelocityY.toFixed(2));

      // Если скорость свайпа достаточна, запускаем объект вверх
      if (Math.abs(this.swipeVelocityY) > MIN_SWIPE_SPEED && this.swipeVelocityY < 0) {
        // Отрицательная скорость - движение вверх
        this.launchObject();
      } else {
        console.log('Недостаточная скорость свайпа, возвращаем объект на место');
        // Возвращаем объект на место, если свайп был недостаточно быстрым
        const currentBone = this.objectSequence[this.currentObjectIndex];
        const bone = this.spine.skeleton.findBone(currentBone);
        if (bone) {
          bone.y += 10; // Поднимаем объект немного вверх для эффекта
        }
        this.returnObjectToStart();
      }
    }
  }

  private launchObject() {
    // Ограничиваем максимальную скорость свайпа для предсказуемости
    const cappedVelocity = Math.max(-MAX_SWIPE_SPEED, this.swipeVelocityY);

    // Установка начальной скорости объекта (противоположной свайпу, так как свайп вверх дает отрицательную скорость)
    this.objectVelocityY = -cappedVelocity * SWIPE_POWER_FACTOR;

    // Активируем режим полета
    this.isFlying = true;
    // console.log(`Запускаем объект ${currentBone} со скоростью ${this.objectVelocityY}px/s`);
  }

  private returnObjectToStart() {
    // Возвращаем объект на его начальную позицию
    const currentBone = this.objectSequence[this.currentObjectIndex];
    const bone = this.spine.skeleton.findBone(currentBone);
    const startPos = this.objectStartPositions.get(currentBone);

    if (bone && startPos) {
      this.isAnimating = true;

      gsap.to(bone, {
        x: startPos.x,
        y: startPos.y,
        duration: 0.4,
        ease: 'back.out',
        onComplete: () => {
          this.isAnimating = false;
        },
      });
    }
  }

  public onMove(_x: number, y: number) {
    if (!this.ready || !this.isMouseDown || this.endGame || this.isAnimating || this.isFlying) return;

    // Рассчитываем время с последнего обновления
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // в секундах

    if (deltaTime > 0) {
      // Рассчитываем скорость свайпа
      const deltaY = y - this.lastMouseY;

      // Расчет скорости в пикселях в секунду
      const velocityY = deltaY / deltaTime;

      // Обновляем скорость свайпа (со сглаживанием)
      this.swipeVelocityY = velocityY * 0.8 + this.swipeVelocityY * 0.2;

      // Обновляем позицию для следующего расчета
      this.lastMouseY = y;
      this.lastUpdateTime = currentTime;
    }
  }

  private throwObjectToSide() {
    const currentBone = this.objectSequence[this.currentObjectIndex];
    const bone = this.spine.skeleton.findBone(currentBone);

    if (bone) {
      this.isAnimating = true;
      this.isFlying = false;

      // Определяем случайное направление (влево или вправо)
      const direction = Math.random() > 0.5 ? 1 : -1;
      const targetX = bone.x + direction * 2800; // Улетает на 800 пикселей в сторону

      gsap.to(bone, {
        x: targetX,
        y: bone.y - 400, // Слегка вверх во время полета для красоты
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          this.isAnimating = false;
          this.moveToNextObject();
        },
      });
    }
  }

  private throwLastObjectUp() {
    const currentBone = this.objectSequence[this.currentObjectIndex];
    const bone = this.spine.skeleton.findBone(currentBone);

    if (bone) {
      this.isAnimating = true;
      this.isFlying = false;

      // bone.scaleX = bone.scaleY = 1.15; // Увеличиваем объект перед броском

      let startY = this.objectStartPositions.get(currentBone)?.y;

      if (!startY) startY = 0;

      const topY = SUCCESS_HEIGHT - startY; // Высота, на которую поднимаем объект

      gsap.to(bone, {
        y: topY + 50,
        ease: 'sin.out',
        duration: 0.25,
        onComplete: () => {
          gsap.to(bone, {
            y: topY - 20, // Улетает высоко вверх
            x: bone.x + 20, // Улетает вбок
            duration: 0.15,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: 4,
            onComplete: () => {
              gsap.to(bone, {
                y: 1000, // Улетает высоко вверх
                duration: 0.5,
                delay: 0.1,
                ease: 'back.out',
                onComplete: () => {
                  this.isAnimating = false;
                  this.finishGame();
                },
              });
            },
          });
        },
      });

      /*  */

      /*  */
    }
  }

  private moveToNextObject() {
    // Переходим к следующему объекту в последовательности
    this.currentObjectIndex++;

    if (this.currentObjectIndex < this.objectSequence.length) {
      // Если остались объекты, подготавливаем следующий
      this.prepareCurrentObject();
    }
  }

  private finishGame() {
    // Завершаем игру
    this.ready = false;
    this.state.setAnimation(0, 'out', false);
  }

  public update(dt: number) {
    if (this.endGame) return;

    // Обновляем Spine анимацию
    this.spine.update(dt);

    if (!this.ready) return;

    // Если объект в полете (после свайпа)
    if (this.isFlying) {
      const currentBone = this.objectSequence[this.currentObjectIndex];
      const bone = this.spine.skeleton.findBone(currentBone);

      if (bone) {
        // Применяем гравитацию к скорости
        this.objectVelocityY -= GRAVITY_STRENGTH * dt;

        // console.log(`Объект ${currentBone} летит со скоростью ${this.objectVelocityY}px/s`);

        // Обновляем позицию объекта
        bone.y += this.objectVelocityY * dt;

        // Проверяем, достиг ли объект целевой высоты
        const startPos = this.objectStartPositions.get(currentBone);

        if (startPos && bone.y >= -(startPos.y - SUCCESS_HEIGHT)) {
          // Успех! Объект поднялся достаточно высоко
          if (this.currentObjectIndex === this.objectSequence.length - 1) {
            // Если это последний объект, отправляем его вверх
            this.throwLastObjectUp();
          } else {
            // Иначе отправляем в случайную сторону
            this.throwObjectToSide();
          }
        }

        console.log(`Bone position: ${bone.y} start: ${startPos?.y}`, startPos && bone.y >= startPos.y + 50);

        // Если объект упал ниже начальной позиции, возвращаем его на место
        if (startPos && bone.y <= startPos.y - 50) {
          // bone.y = startPos.y; // Ограничиваем позицию
          this.objectVelocityY = 0; // Сбрасываем скорость
          this.isFlying = false; // Выключаем режим полета

          console.log(`Объект ${currentBone} вернулся на начальную позицию`);

          // Добавляем небольшую анимацию "отскока" для наглядности
          this.returnObjectToStart();
        }
      }
    }
  }

  public getPhoto(): string {
    return 'art_backpack'; // Название изображения для фона в PhotoPopup
  }
}
