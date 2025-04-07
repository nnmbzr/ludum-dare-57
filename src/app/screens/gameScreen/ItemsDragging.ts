import { Container, Rectangle, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { CELL_SIZE } from './Inventory';

type DragCallback = (bounds: Rectangle, id: string, itemType: 'inventory' | 'game') => void;

const DRAG_SPEED = 8.5; // Скорость следования за мышью

export class ItemsDragging extends Container {
  private currentItem: Sprite | null = null;
  private currentItemType: 'inventory' | 'game' = 'game';
  private currentItemId: string = '';
  private itemBaseScale = 1;
  private currentPos: { x: number; y: number } = { x: 0, y: 0 };
  private targetPos: { x: number; y: number } = { x: 0, y: 0 };
  private velocity: { x: number; y: number } = { x: 0, y: 0 };
  private dragAnimation: gsap.core.Tween | null = null;
  private onDropCallback: DragCallback;

  constructor(onDropCallback: DragCallback) {
    super();

    this.onDropCallback = onDropCallback;
  }

  /**
   * Добавляет объект для перетаскивания
   * @param x Начальная позиция X
   * @param y Начальная позиция Y
   * @param id Идентификатор объекта (соответствует имени текстуры)
   * @param type Тип объекта (из инвентаря или из игры)
   */
  public addItem(x: number, y: number, id: string, type: 'inventory' | 'game'): void {
    // Удалить предыдущий перетаскиваемый объект, если он есть
    this.removeCurrentItem();

    // Создать новый спрайт
    const sprite = Sprite.from(id);
    sprite.anchor.set(0.5);

    this.itemBaseScale = 1;

    // Если объект из инвентаря, подгоняем его размер
    if (type === 'inventory') {
      this.itemBaseScale = this.fitSpriteToCell(sprite);
    }

    // console.log('itemBaseScale', this.itemBaseScale);

    this.currentItem = sprite;
    this.currentItemId = id;
    this.currentItemType = type;

    // Установить начальную позицию
    this.currentPos = { x, y };
    this.targetPos = { x, y };
    sprite.position.set(x, y);

    this.addChild(sprite);

    // Применить начальную анимацию появления
    sprite.scale.set(0.9 * this.itemBaseScale);
    gsap.to(sprite.scale, {
      x: 1 * this.itemBaseScale,
      y: 1 * this.itemBaseScale,
      duration: 0.3,
      ease: 'back.out',
    });
  }

  /**
   * Обновляет целевую позицию объекта при движении мыши
   * @param x Позиция мыши X
   * @param y Позиция мыши Y
   */
  public onMove(x: number, y: number): void {
    if (!this.currentItem) return;

    this.targetPos = { x, y };
  }

  /**
   * Обновляет состояние перетаскиваемого объекта
   * @param dt Дельта времени
   */
  public update(dt: number): void {
    if (!this.currentItem) return;

    // Обновить текущую позицию с эффектом плавного следования
    this.currentPos.x += (this.targetPos.x - this.currentPos.x) * DRAG_SPEED * dt;
    this.currentPos.y += (this.targetPos.y - this.currentPos.y) * DRAG_SPEED * dt;

    // Рассчитать скорость для эффекта желе
    this.velocity.x = this.targetPos.x - this.currentPos.x;
    this.velocity.y = this.targetPos.y - this.currentPos.y;

    // Применить позицию
    this.currentItem.position.set(this.currentPos.x, this.currentPos.y);

    // Применить эффект желе
    this.applyJellyEffect();
  }

  /**
   * Обрабатывает отпускание объекта
   * @param x Позиция мыши X при отпускании
   * @param y Позиция мыши Y при отпускании
   */
  public onUp(x: number, y: number): void {
    if (!this.currentItem || !this.currentItemId) return;

    // Остановить любые анимации
    if (this.dragAnimation) {
      this.dragAnimation.kill();
      this.dragAnimation = null;
    }

    // Получить прямоугольник для проверки пересечений
    const rectangle = new Rectangle(
      x - this.currentItem.width / 2,
      y - this.currentItem.height / 2,
      this.currentItem.width,
      this.currentItem.height,
    );

    // Вызвать колбэк с информацией об объекте
    this.onDropCallback(rectangle, this.currentItemId, this.currentItemType);

    // Удалить объект после отпускания
    this.removeCurrentItem();
  }

  /**
   * Подгоняет спрайт под размер ячейки инвентаря
   * @param sprite Спрайт для масштабирования
   */
  private fitSpriteToCell(sprite: Sprite): number {
    const originalWidth = sprite.width;
    const originalHeight = sprite.height;

    const scaleX = CELL_SIZE / originalWidth;
    const scaleY = CELL_SIZE / originalHeight;

    // Используем меньший масштаб для сохранения пропорций
    const scale = Math.min(scaleX, scaleY) * 0.9; // Оставляем небольшой отступ

    return scale;
  }

  /**
   * Применяет эффект желе к перетаскиваемому объекту
   */
  private applyJellyEffect(): void {
    if (!this.currentItem) return;

    // Получить угол движения и масштаб деформации
    const angle = this.getAngle(this.velocity.x, this.velocity.y);
    const scale = this.getScale(this.velocity.x, this.velocity.y);

    // Применить поворот
    this.currentItem.angle = angle;

    // Применить эффект желе (деформация по осям)
    this.currentItem.scale.x = (1 + scale) * this.itemBaseScale;
    this.currentItem.scale.y = (1 - scale * 0.5) * this.itemBaseScale;
  }

  /**
   * Рассчитывает угол движения в градусах
   * @param diffX Разница по X
   * @param diffY Разница по Y
   * @returns Угол в градусах
   */
  private getAngle(diffX: number, diffY: number): number {
    return (Math.atan2(diffY, diffX) * 180) / Math.PI;
  }

  /**
   * Рассчитывает масштаб деформации в зависимости от скорости движения
   * @param diffX Разница по X
   * @param diffY Разница по Y
   * @returns Коэффициент масштабирования
   */
  private getScale(diffX: number, diffY: number): number {
    const distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    return Math.min(distance / 100, 0.25);
  }

  /**
   * Удаляет текущий перетаскиваемый объект
   */
  private removeCurrentItem(): void {
    if (this.currentItem) {
      // Анимация исчезновения перед удалением
      gsap.to(this.currentItem, {
        alpha: 0,
        duration: 0.2,
        onComplete: () => {
          if (this.currentItem) {
            this.removeChild(this.currentItem);
            this.currentItem.destroy();
            this.currentItem = null;
            this.currentItemId = '';
          }
        },
      });
    }
  }
}
