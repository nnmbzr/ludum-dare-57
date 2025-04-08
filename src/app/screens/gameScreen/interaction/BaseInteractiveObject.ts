// src/app/screens/game/interaction/BaseInteractiveObject.ts

import { Container, FederatedPointerEvent, Graphics, Rectangle, Sprite } from 'pixi.js';
import { IInteractiveObject, InteractionResult } from './IInteractiveObject';

export abstract class BaseInteractiveObject implements IInteractiveObject {
  public id: string;
  public displayObject: Container;

  protected acceptedItems: Map<string, string> = new Map();
  protected highlightSprite?: Sprite | Graphics;
  protected isHighlighted: boolean = false;

  protected onClick?: (e: FederatedPointerEvent) => void;

  constructor(id: string, displayObject: Container) {
    this.id = id;
    this.displayObject = displayObject;

    // Настраиваем интерактивность
    this.displayObject.eventMode = 'static';
    this.displayObject.cursor = 'pointer';
    this.displayObject.on('pointerdown', this.onPointerDown.bind(this));
    this.displayObject.on('pointerover', this.onPointerOver.bind(this));
    this.displayObject.on('pointerout', this.onPointerOut.bind(this));
  }

  // Метод для добавления принимаемых предметов
  public acceptItem(itemId: string, actionType: string): void {
    this.acceptedItems.set(itemId, actionType);
  }

  // Установка обработчика клика
  public setClickHandler(handler: (e: FederatedPointerEvent) => void): void {
    this.onClick = handler;
  }

  // Получение глобальных границ
  public getGlobalBounds(): Rectangle {
    return this.displayObject.getBounds(true).rectangle;
  }

  // Проверка пересечения с другими границами
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public checkIntersection(_bounds: Rectangle): boolean {
    // Переопределяется в наследниках
    console.warn('handleClick not implemented');

    return false;
  }

  // Обработка взаимодействия
  public interact(itemId: string, bounds: Rectangle): InteractionResult {
    if (!this.checkIntersection(bounds)) {
      return { success: false };
    }

    const actionType = this.acceptedItems.get(itemId);
    if (!actionType) {
      return { success: false };
    }

    // По умолчанию предметы потребляются
    return {
      success: true,
      actionType,
      consumeItem: true,
    };
  }

  // Обработка клика
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleClick(_x: number, _y: number): boolean {
    // Переопределяется в наследниках
    console.warn('handleClick not implemented');
    return false;
  }

  // Показать подсветку
  public showHighlight(): void {
    if (this.highlightSprite && !this.isHighlighted) {
      this.highlightSprite.visible = true;
      this.isHighlighted = true;
    }
  }

  // Скрыть подсветку
  public hideHighlight(): void {
    if (this.highlightSprite && this.isHighlighted) {
      this.highlightSprite.visible = false;
      this.isHighlighted = false;
    }
  }

  // Обновление объекта
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_delta: number): void {
    // Базовая реализация пустая, переопределяется в наследниках при необходимости
  }

  // Внутренние обработчики событий
  protected onPointerDown(e: FederatedPointerEvent): void {
    if (this.onClick) {
      this.onClick(e);
    }
  }

  protected onPointerOver(): void {
    this.showHighlight();
  }

  protected onPointerOut(): void {
    this.hideHighlight();
  }

  protected onClickInternal(): void {
    // Переопределяется в наследниках
  }

  // Создание подсветки (может быть переопределено)
  protected createHighlight(): void {
    const bounds = this.displayObject.getLocalBounds();

    this.highlightSprite = Sprite.from('highlight'); // или создать графику
    this.highlightSprite.anchor.set(0.5);
    this.highlightSprite.width = bounds.width * 1.1;
    this.highlightSprite.height = bounds.height * 1.1;
    this.highlightSprite.alpha = 0.5;
    this.highlightSprite.visible = false;

    this.displayObject.addChild(this.highlightSprite);
    this.highlightSprite.zIndex = -1;
  }

  public disable(): void {
    this.displayObject.eventMode = 'none';
  }
}
