// src/app/screens/game/interaction/InteractionManager.ts

import { Rectangle } from 'pixi.js';
import { IInteractiveObject, InteractionResult } from './IInteractiveObject';

export class InteractionManager {
  private objects: Map<string, IInteractiveObject> = new Map();

  constructor() {}

  // Регистрация нового интерактивного объекта
  public register(object: IInteractiveObject): void {
    this.objects.set(object.id, object);
  }

  // Удаление интерактивного объекта
  public unregister(id: string): void {
    const object = this.objects.get(id);
    if (object) {
      this.objects.delete(id);
    }
  }

  // Получение объекта по ID
  public getObject(id: string): IInteractiveObject | undefined {
    return this.objects.get(id);
  }

  // Проверка взаимодействия предмета со всеми объектами
  public checkInteraction(itemId: string, bounds: Rectangle): InteractionResult & { objectId?: string } {
    for (const [id, object] of this.objects.entries()) {
      const result = object.interact(itemId, bounds);
      if (result.success) {
        return {
          ...result,
          objectId: id,
        };
      }
    }

    return { success: false };
  }

  // Проверка клика по всем объектам
  public handleClick(x: number, y: number): string | null {
    for (const [id, object] of this.objects.entries()) {
      if (object.handleClick(x, y)) {
        return id;
      }
    }

    return null;
  }

  // Обновление всех объектов
  public update(delta: number): void {
    for (const object of this.objects.values()) {
      object.update(delta);
    }
  }
}
