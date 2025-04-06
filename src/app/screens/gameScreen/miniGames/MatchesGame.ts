import { AnimationState, Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container, Point } from 'pixi.js';

const START_POSE: Point = new Point(0, -150); // Начальная позиция костяшки спички

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
  private readonly MIN_SPEED = 200;
  private readonly MAX_SPEED = 6000;
  private readonly FOLLOW_SPEED = 10.5;
  private readonly SUCCESS_TIME = 0.5;

  // Счетчик успешного чиркания
  private successTimer: number = 0;

  // Область для чиркания
  private strikingArea: Point[];
  private isInStrikingArea: boolean = false;

  private ready = false;
  private gameActive = false;
  private inCallBack: () => void;

  constructor(inCallBack: () => void) {
    super();

    this.inCallBack = inCallBack;

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
          this.state.setAnimation(1, 'normal');
          this.dropBonePosition();
          console.log('Спичка сломалась. Попробуйте снова!');
        } else if (entry.animation?.name === 'win') {
          this.state.setAnimation(0, 'out');
          console.log('Спичка успешно зажжена!');
        } else if (entry.animation?.name === 'out') {
          console.log('Игра завершена!');
        }
      },
    });
  }

  public onDown(x: number, y: number) {
    if (!this.ready) return;

    this.mouseHold = true;
    this.gameActive = true;
    this.successTimer = 0;
    this.currentSpeed = 0;
    this.moveDistance = 0;

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
    }
  }

  public onUp() {
    if (!this.ready || !this.gameActive) return;
    this.mouseHold = false;
    this.currentSpeed = 0;
  }

  private endMatchesMove(success = false) {
    this.mouseHold = false;
    this.gameActive = false;
    this.isInStrikingArea = false;

    // Запускаем соответствующую анимацию
    if (success) {
      this.ready = false;
      this.state.setAnimation(1, 'win', false);
    } else {
      this.ready = false;
      this.state.setAnimation(1, 'fail', false);
    }
  }

  public onMove(x: number, y: number) {
    if (!this.ready || !this.mouseHold) return;

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
        console.log('Вышли из области чиркания. Счетчик сброшен.');
      }
    }
  }

  public update(dt: number) {
    // Обновляем Spine анимацию
    this.spine.update(dt);

    if (!this.ready && !this.gameActive) {
      return;
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

      // Устанавливаем целевую позицию как начальная позиция спички + смещение курсора
      this.targetPos.x = this.spineDownPos.x + cursorOffsetX;
      this.targetPos.y = this.spineDownPos.y + cursorOffsetY;

      // Применяем небольшой случайный оффсет для реалистичности
      /* const randomOffsetX = (Math.random() - 0.5) * 2;
      const randomOffsetY = (Math.random() - 0.5) * 2;
      this.targetPos.x += randomOffsetX;
      this.targetPos.y += randomOffsetY; */

      // 3. Плавно перемещаем текущую позицию к целевой
      this.currentPos.x += (this.targetPos.x - this.currentPos.x) * this.FOLLOW_SPEED * dt;
      this.currentPos.y += (this.targetPos.y - this.currentPos.y) * this.FOLLOW_SPEED * dt;

      // 4. Обновляем позицию кости
      const bone = this.spine.skeleton.findBone('match_move');
      if (bone) {
        bone.x = this.currentPos.x;
        bone.y = this.currentPos.y;
      }

      // 5. Проверяем скорость и нахождение в области
      this.checkIfInStrikingArea();

      // Выводим информацию о скорости для отладки
      if (this.currentSpeed > 0) {
        console.log(`Скорость: ${this.currentSpeed.toFixed(0)} п/с, Мин: ${this.MIN_SPEED}, Макс: ${this.MAX_SPEED}`);
      }

      // Проверка скорости (слишком медленно)
      if (this.currentSpeed < this.MIN_SPEED && this.isInStrikingArea && this.successTimer > 0) {
        console.log('Слишком медленно! Счетчик сброшен.');
        this.successTimer = 0;
      }

      // Проверка скорости (слишком быстро)
      if (this.currentSpeed > this.MAX_SPEED && this.isInStrikingArea) {
        console.log('Слишком быстро! Спичка сломалась.');
        this.endMatchesMove(false);
        return;
      }

      // Если соблюдены все условия для успешного чиркания
      if (this.isInStrikingArea && this.currentSpeed >= this.MIN_SPEED && this.currentSpeed <= this.MAX_SPEED) {
        this.successTimer += dt;
        console.log(`Время чиркания: ${this.successTimer.toFixed(2)}/${this.SUCCESS_TIME.toFixed(2)}`);

        if (this.successTimer >= this.SUCCESS_TIME) {
          console.log('Достаточно чиркания! Спичка зажигается.');
          this.endMatchesMove(true);
        }
      }

      // Сохраняем текущие координаты для следующего кадра
      this.lastPos.set(this.prevX, this.prevY);
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
}
