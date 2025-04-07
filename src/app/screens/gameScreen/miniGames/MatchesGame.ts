import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container, Point, Texture } from 'pixi.js';
import { MatchTrail } from './MatchTrail';

const START_POSE: Point = new Point(0, -150); // Начальная позиция костяшки спички
const BREAK_DELAY = 0.05; // Задержка перед сломом спички

export class MatchesGame extends Container {
  private spine: Spine;
  private state: AnimationState;

  private prevX: number = 0;
  private prevY: number = 0;
  private mouseHold: boolean = false;

  // Позиции
  private currentPos: Point = new Point(START_POSE.x, START_POSE.y);
  private targetPos: Point = new Point(START_POSE.x, START_POSE.y);
  private onDownPos: Point = new Point(0, 0); // Позиция мыши при нажатии
  private spineDownPos: Point = new Point(0, 0); // Позиция спички при нажатии

  // Переменные для расчета скорости в update
  private lastPos: Point = new Point(0, 0);
  private moveDistance: number = 0;
  private currentSpeed: number = 0;

  // Константы
  private readonly MIN_SPEED = 700;
  private readonly MAX_SPEED = 4000;
  private readonly FOLLOW_SPEED = 10.5;
  private readonly SUCCESS_TIME = 0.32;

  // Параметры тряски для имитации шершавой поверхности
  private readonly SHAKE_AMPLITUDE_X = 30.5; // Амплитуда тряски по X
  private readonly SHAKE_AMPLITUDE_Y = 20.5; // Амплитуда тряски по Y
  private readonly SHAKE_FREQUENCY = 1; // Частота тряски
  private shakeTimer: number = 0; // Таймер для эффекта тряски
  private shakeOffsetX: number = 0; // Текущий офсет тряски по X
  private shakeOffsetY: number = 0; // Текущий офсет тряски по Y

  // Счетчик успешного чиркания
  private successTimer: number = 0;

  // Область для чиркания
  private strikingArea: Point[];
  private isInStrikingArea: boolean = false;

  private ready = false;
  private matchMustBeBroken = false;
  private breakTimer = BREAK_DELAY;
  private gameActive = false;
  private inCallBack: () => void;
  private endGameCallBack: () => void;

  private matchTrail: MatchTrail;

  private endGame: boolean = false;

  constructor(inCallBack: () => void, endGameCallBack: () => void) {
    super();

    this.inCallBack = inCallBack;
    this.endGameCallBack = endGameCallBack;

    // Определяем область для чиркания как массив точек
    this.strikingArea = [new Point(-91, -104), new Point(-50, -265), new Point(245, 63), new Point(195, 176)];

    this.spine = Spine.from({ skeleton: 'matches.json', atlas: 'matches.atlas' });
    this.state = this.spine.state;

    const bone = this.spine.skeleton.findBone('match_move');
    if (bone) {
      bone.x = START_POSE.x;
      bone.y = START_POSE.y;
    }

    this.listenerSetup();

    this.state.setAnimation(0, 'in');
    this.state.setAnimation(1, 'normal');
    this.state.setAnimation(2, 'fx_tail', true);

    this.matchTrail = new MatchTrail(Texture.from('trail'), 6, 30);
    this.spine.addSlotObject('matches', this.matchTrail);

    this.addChild(this.spine);
  }

  private listenerSetup() {
    this.state.addListener({
      complete: (entry) => {
        if (entry.animation?.name === 'in') {
          this.inCallBack();
          this.ready = true;
          this.state.setAnimation(0, 'idle', true);
        } else if (entry.animation?.name === 'fail') {
          this.ready = true;
          this.matchMustBeBroken = false;
          this.state.setAnimation(1, 'normal');
          this.dropBonePosition();
          console.log('Спичка сломалась. Попробуйте снова!');
        } else if (entry.animation?.name === 'win') {
          this.state.setAnimation(0, 'out');
          console.log('Спичка успешно зажжена!');
        } else if (entry.animation?.name === 'out') {
          console.log('Игра завершена!');
          this.endGameCallBack();
          this.endGame = true;
        }
      },
    });
  }

  public onDown(x: number, y: number) {
    if (!this.ready || this.endGame) return;

    this.mouseHold = true;
    this.gameActive = true;
    this.successTimer = 0;
    this.currentSpeed = 0;
    this.moveDistance = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Сохраняем текущие позиции
    this.prevX = x;
    this.prevY = y;
    this.lastPos.set(x, y);
    this.onDownPos.set(x, y);

    // Важно! Сохраняем текущую позицию спички при нажатии
    const bone = this.spine.skeleton.findBone('match_move');
    if (bone) {
      this.spineDownPos.set(bone.x, bone.y);
    }

    // Начальная проверка на нахождение в области
    this.checkIfInStrikingArea();
  }

  private dropBonePosition() {
    const bone = this.spine.skeleton.findBone('match_move');
    if (bone) {
      bone.x = START_POSE.x;
      bone.y = START_POSE.y;
      this.currentPos.set(START_POSE.x, START_POSE.y);
      this.targetPos.set(START_POSE.x, START_POSE.y);

      this.matchTrail.reset(START_POSE.x, START_POSE.y);
    }
  }

  public onUp() {
    if (!this.ready || !this.gameActive || this.endGame) return;
    this.mouseHold = false;
    this.currentSpeed = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  private endMatchesMove(success = false) {
    // Запускаем соответствующую анимацию
    if (success) {
      this.mouseHold = false;
      this.gameActive = false;
      this.isInStrikingArea = false;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;

      this.ready = false;
      this.state.setAnimation(1, 'win', false);
    } else {
      this.matchMustBeBroken = true;
      this.breakTimer = BREAK_DELAY;
      this.state.setAnimation(1, 'fail', false);
    }

    const bone = this.spine.skeleton.findBone('match_move');
    if (bone) {
      this.matchTrail.reset(bone.x, bone.y);
    }
  }

  public onMove(x: number, y: number) {
    if (!this.ready || !this.mouseHold || this.endGame) return;

    // Теперь просто обновляем текущие позиции мыши
    this.prevX = x;
    this.prevY = y;
  }

  private checkIfInStrikingArea() {
    const inArea = this.isPointInPolygon(this.currentPos.x, this.currentPos.y, this.strikingArea);

    if (inArea !== this.isInStrikingArea) {
      this.isInStrikingArea = inArea;

      if (!inArea) {
        this.successTimer = 0;
      }
    }
  }

  /**
   * Обновляет эффект тряски для имитации шершавой поверхности
   * @param dt Дельта времени
   * @returns Объект с офсетами тряски по осям X и Y
   */
  private updateShakeEffect(dt: number): { x: number; y: number } {
    // Обновляем таймер тряски
    this.shakeTimer += dt;

    // Если мы не в зоне чиркания или скорость не подходящая - нет тряски
    if (this.successTimer === 0 || this.matchMustBeBroken) {
      // Постепенно уменьшаем тряску, если она была
      this.shakeOffsetX *= 0.1;
      this.shakeOffsetY *= 0.1;
      return { x: this.shakeOffsetX, y: this.shakeOffsetY };
    }

    // Создаем эффект тряски, зависящий от времени и скорости движения
    // Используем разные частоты для X и Y для более реалистичного эффекта
    const intensityFactor = Math.min((this.currentSpeed - this.MIN_SPEED) / 1000, 1);

    // Чем ближе скорость к оптимальной, тем сильнее тряска
    const optimalSpeed = (this.MIN_SPEED + this.MAX_SPEED) / 2;
    const optimalFactor = 1 - Math.abs(this.currentSpeed - optimalSpeed) / (this.MAX_SPEED - this.MIN_SPEED);

    // Шум Перлина был бы идеален, но используем комбинацию синусов для упрощения
    this.shakeOffsetX =
      Math.sin(this.shakeTimer * 15) *
      Math.cos(this.shakeTimer * 7) *
      this.SHAKE_AMPLITUDE_X *
      intensityFactor *
      optimalFactor;

    this.shakeOffsetY =
      Math.sin(this.shakeTimer * 10) *
      Math.cos(this.shakeTimer * 12) *
      this.SHAKE_AMPLITUDE_Y *
      intensityFactor *
      optimalFactor;

    // Добавляем случайность для более естественного эффекта
    if (Math.random() < this.SHAKE_FREQUENCY) {
      this.shakeOffsetX += (Math.random() * 2 - 1) * this.SHAKE_AMPLITUDE_X * 0.5;
      this.shakeOffsetY += (Math.random() * 2 - 1) * this.SHAKE_AMPLITUDE_Y * 0.5;
    }

    return { x: this.shakeOffsetX, y: this.shakeOffsetY };
  }

  public update(dt: number) {
    if (this.endGame) return;

    // Обновляем Spine анимацию
    this.spine.update(dt);

    if (!this.ready && !this.gameActive) {
      const bone = this.spine.skeleton.findBone('match_move');
      if (bone) {
        this.matchTrail.update(false, dt, this.matchPercent);
      }
      return;
    }

    if (this.matchMustBeBroken) {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        this.mouseHold = false;
        this.gameActive = false;
        this.isInStrikingArea = false;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.ready = false;
      }
    }

    if (this.mouseHold) {
      // 1. Рассчитываем скорость на основе dt и разницы координат
      const deltaX = this.prevX - this.lastPos.x;
      const deltaY = -(this.prevY - this.lastPos.y); // Инвертируем Y для правильной ориентации
      const moveDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Обновляем пройденное расстояние
      this.moveDistance += moveDist;

      // Рассчитываем скорость (пиксели в секунду)
      if (dt > 0) {
        this.currentSpeed = moveDist / dt;
      }

      // 2. Обновляем целевую позицию c учетом начальной позиции при нажатии
      // Расчет относительного смещения курсора от позиции в момент нажатия
      const cursorOffsetX = this.prevX - this.onDownPos.x;
      const cursorOffsetY = -(this.prevY - this.onDownPos.y); // Инвертируем Y для правильной ориентации

      const correctFactor = this.successTimer > 0 ? 0.8 : 1;

      // Устанавливаем целевую позицию как начальная позиция спички + смещение курсора
      this.targetPos.x = this.spineDownPos.x + cursorOffsetX;
      this.targetPos.y = this.spineDownPos.y + cursorOffsetY;

      // console.log(this.targetPos.x, this.targetPos.y);

      // Минимальная позиция по X -380, максимальная 740
      // Минимальная позиция по Y -426, максимальная 300

      /* this.targetPos.x = Math.min(Math.max(-380, this.spineDownPos.x + cursorOffsetX), 740);
      this.targetPos.y = Math.min(Math.max(-426, this.spineDownPos.y + cursorOffsetY), 300); */

      // 3. Плавно перемещаем текущую позицию к целевой
      this.currentPos.x += (this.targetPos.x - this.currentPos.x) * this.FOLLOW_SPEED * dt * correctFactor;
      this.currentPos.y += (this.targetPos.y - this.currentPos.y) * this.FOLLOW_SPEED * dt * correctFactor;

      // 4. Обновляем эффект тряски для имитации шершавой поверхности
      const shakeOffset = this.updateShakeEffect(dt);

      // 5. Обновляем позицию кости с учетом тряски
      const bone = this.spine.skeleton.findBone('match_move');
      if (bone) {
        bone.x = this.currentPos.x + shakeOffset.x;
        bone.y = this.currentPos.y + shakeOffset.y;

        const isTrailActive =
          this.isInStrikingArea && this.currentSpeed >= this.MIN_SPEED && this.currentSpeed <= this.MAX_SPEED;

        this.matchTrail.addXY(bone.x, bone.y);
        this.matchTrail.update(isTrailActive, dt, this.matchPercent);
      }

      // 6. Проверяем скорость и нахождение в области
      this.checkIfInStrikingArea();

      // Проверка скорости (слишком медленно)
      if (this.currentSpeed < this.MIN_SPEED && this.isInStrikingArea && this.successTimer > 0) {
        this.successTimer = 0;
      }

      // Проверка скорости (слишком быстро)
      if (this.currentSpeed > this.MAX_SPEED && this.isInStrikingArea && !this.matchMustBeBroken) {
        this.endMatchesMove(false);
        return;
      }

      // Если соблюдены все условия для успешного чиркания
      if (this.isInStrikingArea && this.currentSpeed >= this.MIN_SPEED && this.currentSpeed <= this.MAX_SPEED) {
        this.successTimer += dt;

        if (this.successTimer >= this.SUCCESS_TIME) {
          this.endMatchesMove(true);
        }
      }

      // Сохраняем текущие координаты для следующего кадра
      this.lastPos.set(this.prevX, this.prevY);
    } else {
      // Если мышь не удерживается, обновляем трейл с неактивным состоянием
      const bone = this.spine.skeleton.findBone('match_move');
      if (bone) {
        this.matchTrail.update(false, dt, this.matchPercent);
      }
    }
  }

  /**
   * Проверяет, находится ли точка внутри полигона
   */
  private isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  private get matchPercent(): number {
    // Возвращаем процент успешного чиркания
    return this.successTimer / this.SUCCESS_TIME;
  }
}
