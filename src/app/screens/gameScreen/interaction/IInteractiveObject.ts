// src/app/screens/game/interaction/IInteractiveObject.ts

import { Container, Rectangle } from 'pixi.js';

export interface InteractionResult {
  success: boolean;
  actionType?: string;
  consumeItem?: boolean;
}

export interface IInteractiveObject {
  id: string;
  displayObject: Container;

  // Проверка пересечения с другим объектом
  checkIntersection(bounds: Rectangle): boolean;

  // Проверка взаимодействия с предметом
  interact(itemId: string, bounds: Rectangle): InteractionResult;

  // Получение глобальных границ объекта
  getGlobalBounds(): Rectangle;

  // Обработка клика по объекту
  handleClick(x: number, y: number): boolean;

  // Показать/скрыть подсветку при наведении
  showHighlight(): void;
  hideHighlight(): void;

  // Обновление объекта
  update(delta: number): void;
}
