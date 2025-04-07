// src/app/screens/game/interaction/SpineInteractiveObject.ts

import { Spine } from '@esotericsoftware/spine-pixi-v8';
import { Container, Graphics, Rectangle } from 'pixi.js';
import { BaseInteractiveObject } from './BaseInteractiveObject';
import { engine } from '../../../getEngine';

export class SpineInteractiveObject extends BaseInteractiveObject {
  public readonly spine: Spine;
  private readonly slotName?: string;
  private readonly boneName?: string;

  private readonly container: Container;

  constructor(
    id: string,
    spine: Spine,
    options?: {
      slotName?: string;
      boneName?: string;
      highlightColor?: number;
    },
  ) {
    const container = new Container();
    container.addChild(spine);

    super(id, container);

    this.container = container;

    this.container.hitArea = new Rectangle(-spine.width / 2, -spine.height / 2, spine.width, spine.height);

    this.spine = spine;
    this.slotName = options?.slotName;
    this.boneName = options?.boneName;

    // Создаем подсветку только если указан слот или кость
    if (this.slotName || this.boneName) {
      this.createHighlight(options?.highlightColor || 0xffff00);
    }
  }

  // Переопределяем получение глобальных границ для работы со слотами/костями
  public override getGlobalBounds(): Rectangle {
    if (this.slotName) {
      return this.getSlotBounds(this.slotName);
    } else if (this.boneName) {
      return this.getBoneBounds(this.boneName);
    }

    return super.getGlobalBounds();
  }

  // Получение границ слота
  private getSlotBounds(slotName: string): Rectangle {
    const slot = this.spine.skeleton.findSlot(slotName);
    if (!slot || !slot.attachment) {
      return this.spine.getBounds(true).rectangle;
    }

    // Получаем объект, привязанный к слоту
    const slotObject = this.spine.getSlotObject(slotName);
    if (slotObject) {
      return slotObject.getBounds(true).rectangle;
    }

    // Если нет привязанного объекта, используем размер всего spine
    // или можно переопределить для использования конкретных размеров
    return this.spine.getBounds(true).rectangle;
  }

  // Получение границ кости
  private getBoneBounds(boneName: string): Rectangle {
    const bone = this.spine.skeleton.findBone(boneName);
    if (!bone) {
      return this.spine.getBounds(true).rectangle;
    }

    // Здесь нужно определить размер на основе кости
    // Обычно это делается на основе данных из вашего дизайна
    // Например, можно использовать пользовательские данные из Spine

    // Простой пример: создаем прямоугольник вокруг точки кости
    const worldX = bone.worldX + this.spine.x;
    const worldY = bone.worldY + this.spine.y;

    // Предполагаемый размер (можно настроить)
    const size = 50;

    return new Rectangle(worldX - size / 2, worldY - size / 2, size, size);
  }

  // Создание подсветки для Spine объекта
  protected override createHighlight(color: number = 0xffff00): void {
    const bounds = this.getGlobalBounds();
    const localBounds = new Rectangle(
      bounds.x - this.displayObject.x,
      bounds.y - this.displayObject.y,
      bounds.width,
      bounds.height,
    );

    const highlight = new Graphics();
    highlight.fill({ color, alpha: 0.3 });
    highlight.roundRect(localBounds.x, localBounds.y, localBounds.width, localBounds.height, 10);
    highlight.fill();
    highlight.visible = false;

    this.displayObject.addChildAt(highlight, 0);
    this.highlightSprite = highlight as any;
  }

  // Обновление позиции подсветки, если спайн анимируется
  public override update(delta: number): void {
    super.update(delta);

    // Обновляем позицию подсветки, если нужно
    if (this.highlightSprite && (this.slotName || this.boneName)) {
      const bounds = this.slotName ? this.getSlotBounds(this.slotName) : this.getBoneBounds(this.boneName!);

      const localBounds = new Rectangle(
        bounds.x - this.displayObject.x,
        bounds.y - this.displayObject.y,
        bounds.width,
        bounds.height,
      );

      // Обновляем графику подсветки
      if (this.isHighlighted) {
        const highlight = this.highlightSprite as Graphics;
        highlight.clear();
        highlight.fill({ color: 0xffff00, alpha: 0.3 });
        highlight.roundRect(localBounds.x, localBounds.y, localBounds.width, localBounds.height, 10);
        highlight.fill();
      }
    }
  }

  public override handleClick(x: number, y: number): boolean {
    const bounds = this.getGlobalBounds();
    const globalPose = engine().virtualScreen.toVirtualCoordinates(bounds.x, bounds.y);

    if (
      x >= globalPose.x &&
      x <= globalPose.x + this.spine.width &&
      y >= globalPose.y &&
      y <= globalPose.y + this.spine.height
    ) {
      this.onClickInternal();
      return true;
    }

    return false;
  }

  public override checkIntersection(bounds: Rectangle): boolean {
    const myBounds = this.getGlobalBounds();
    const globalPose = engine().virtualScreen.toVirtualCoordinates(myBounds.x, myBounds.y);
    const realBounds = new Rectangle(globalPose.x, globalPose.y, this.spine.width, this.spine.height);

    return (
      bounds.left < realBounds.right &&
      bounds.right > realBounds.left &&
      bounds.top < realBounds.bottom &&
      bounds.bottom > realBounds.top
    );
  }
}
