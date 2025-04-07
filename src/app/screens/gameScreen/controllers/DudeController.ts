// src/app/screens/game/controllers/DudeController.ts

import { SpineObjectController } from './SpineObjectController';

/**
 * Перечисление анимаций персонажа dude
 */
export enum DudeAnimation {
  IDLE = 'idle',
  IDLE_FIRE = 'idle_fire',
  OUT = 'out',
  OUT_IDLE = 'out_idle',
}

export class DudeController extends SpineObjectController {
  /**
   * Статическое имя для создания и идентификации
   */
  public static readonly NAME: string = 'dude';

  // Состояние персонажа
  private isDrivenAway: boolean = false;
  private fireLit: boolean = false;

  /**
   * Создает контроллер для персонажа dude
   */
  constructor() {
    super(DudeController.NAME);

    this.state.data.defaultMix = 0.2;

    // Устанавливаем начальную анимацию
    this.state.setAnimation(0, DudeAnimation.IDLE, true);
    this.spine.scale.set(0.5);
  }

  /**
   * Обрабатывает завершение анимации персонажа
   */
  protected override onAnimationComplete(animName: string, entry: any): void {
    // После анимации прогона переходим к out_idle
    if (animName === DudeAnimation.OUT) {
      this.state.setAnimation(entry.trackIndex, DudeAnimation.OUT_IDLE, true);
    }
  }

  /**
   * Обновляет idle-анимацию в зависимости от текущего состояния
   * @param trackIndex Индекс трека анимации
   */
  private updateIdleAnimation(trackIndex: number = 0): void {
    // Если персонаж уже прогнан, ничего не меняем
    if (this.isDrivenAway) {
      return;
    }

    // Выбираем анимацию на основе состояния костра
    const animation = this.fireLit ? DudeAnimation.IDLE_FIRE : DudeAnimation.IDLE;

    // Устанавливаем соответствующую idle-анимацию
    this.state.setAnimation(trackIndex, animation, true);
  }

  /**
   * Устанавливает состояние костра и обновляет анимацию,
   * если персонаж еще не прогнан
   * @param isLit Горит ли костер
   */
  public setFireState(isLit: boolean): void {
    // Если персонаж уже прогнан, игнорируем изменение состояния костра
    if (this.isDrivenAway) {
      return;
    }

    // Если состояние не изменилось, ничего не делаем
    if (this.fireLit === isLit) {
      return;
    }

    this.fireLit = isLit;
    this.updateIdleAnimation();
  }

  /**
   * Прогоняет персонажа (запускает анимацию ухода)
   * @returns Promise, который разрешается, когда анимация ухода завершится
   */
  public driveAway(): Promise<void> {
    // Если персонаж уже прогнан, ничего не делаем
    if (this.isDrivenAway) {
      return Promise.resolve();
    }

    this.isDrivenAway = true;

    // Запускаем анимацию ухода
    return this.play(DudeAnimation.OUT);
  }

  /**
   * Проверяет, был ли персонаж прогнан
   * @returns true, если персонаж был прогнан
   */
  public isDrivenOut(): boolean {
    return this.isDrivenAway;
  }

  /**
   * Воспроизводит конкретную анимацию персонажа
   * @param animation Анимация из перечисления DudeAnimation
   * @param loop Должна ли анимация зацикливаться
   * @param trackIndex Индекс трека для анимации
   * @returns Promise, который разрешается по завершении анимации (если не зацикленная)
   */
  public playDudeAnimation(animation: DudeAnimation, loop: boolean = false, trackIndex: number = 0): Promise<void> {
    return this.play(animation, loop, trackIndex);
  }

  /**
   * Сбрасывает состояние персонажа к начальному
   */
  public reset(): void {
    this.isDrivenAway = false;
    this.fireLit = false;
    this.state.setAnimation(0, DudeAnimation.IDLE, true);
  }
}
