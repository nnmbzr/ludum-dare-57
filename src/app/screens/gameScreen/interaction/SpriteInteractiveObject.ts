// src/app/screens/game/interaction/SpriteInteractiveObject.ts

import { Container, Rectangle, Sprite } from 'pixi.js';
import { BaseInteractiveObject } from './BaseInteractiveObject';
import { engine } from '../../../getEngine';

export class SpriteInteractiveObject extends BaseInteractiveObject {
  public readonly sprite: Sprite;

  constructor(id: string, textureOrSprite: string | Sprite) {
    // Создаем контейнер для наших объектов
    const container = new Container();

    // Создаем или используем существующий спрайт
    const sprite = typeof textureOrSprite === 'string' ? Sprite.from(textureOrSprite) : textureOrSprite;

    sprite.anchor.set(0.5);
    container.addChild(sprite);

    super(id, container);

    this.sprite = sprite;
    this.createHighlight();
  }

  // Переопределяем метод создания подсветки для лучшего соответствия спрайту
  protected override createHighlight(): void {
    const bounds = this.sprite.getLocalBounds();

    this.highlightSprite = new Sprite(this.sprite.texture);
    this.highlightSprite.anchor.set(0.5);
    this.highlightSprite.width = bounds.width * 1.1;
    this.highlightSprite.height = bounds.height * 1.1;
    this.highlightSprite.alpha = 0.5;
    this.highlightSprite.tint = 0xffff00; // Желтая подсветка
    this.highlightSprite.visible = false;

    // Добавляем подсветку перед спрайтом, чтобы она была позади
    this.displayObject.addChildAt(this.highlightSprite, 0);
  }

  public override handleClick(x: number, y: number): boolean {
    const bounds = this.getGlobalBounds();
    const globalPose = engine().virtualScreen.toVirtualCoordinates(bounds.x, bounds.y);

    if (
      x >= globalPose.x &&
      x <= globalPose.x + this.sprite.width &&
      y >= globalPose.y &&
      y <= globalPose.y + this.sprite.height
    ) {
      this.onClickInternal();
      return true;
    }

    return false;
  }

  public override checkIntersection(bounds: Rectangle): boolean {
    const myBounds = this.getGlobalBounds();
    const globalPose = engine().virtualScreen.toVirtualCoordinates(myBounds.x, myBounds.y);
    const realBounds = new Rectangle(globalPose.x, globalPose.y, this.sprite.width, this.sprite.height);

    return (
      bounds.left < realBounds.right &&
      bounds.right > realBounds.left &&
      bounds.top < realBounds.bottom &&
      bounds.bottom > realBounds.top
    );
  }
}
