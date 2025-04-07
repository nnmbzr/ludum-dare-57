// MatchTrail.ts
import { Container, MeshRope, Point, Texture } from 'pixi.js';

export class MatchTrail extends Container {
  private readonly minAlpha: number = 0.3;
  private readonly minColor: number = 0x7a2204;
  private readonly maxColor: number = 0xffff00;

  private historyX: number[] = [];
  private historyY: number[] = [];
  private points: Point[] = [];
  private rope: MeshRope;

  private readonly historySize: number;
  private readonly ropeSize: number;

  private enabled: boolean = false;

  constructor(trailTexture: Texture, historySize: number = 20, ropeSize: number = 100) {
    super();

    this.historySize = historySize;
    this.ropeSize = ropeSize;

    // Инициализация массивов истории
    for (let i = 0; i < this.historySize; i++) {
      this.historyX.push(0);
      this.historyY.push(0);
    }

    // Создание точек для верёвки
    for (let i = 0; i < this.ropeSize; i++) {
      this.points.push(new Point(0, 0));
    }

    // Создание верёвки
    this.rope = new MeshRope({ texture: trailTexture, points: this.points });
    this.rope.blendMode = 'add'; // Режим смешивания для эффекта свечения
    this.rope.alpha = 0; // Изначально невидимый
    this.rope.scale.set(2);

    this.addChild(this.rope);
  }

  /**
   * Обновляет позицию и состояние трейла
   */
  public update(isActive: boolean, dt: number, percent: number): void {
    // Управление видимостью трейла
    if (isActive && !this.enabled) {
      this.enabled = true;
    } else if (!isActive && this.enabled) {
      this.enabled = false;
    }

    // Плавное появление/исчезновение
    if (this.enabled) {
      // Ограничиваем alpha между minAlpha и 1, с плавным увеличением
      const targetAlpha = this.minAlpha + percent * (1 - this.minAlpha);
      this.rope.alpha = Math.min(1, this.rope.alpha + dt * 5);
      this.rope.alpha = Math.max(targetAlpha, Math.min(1, this.rope.alpha));
    } else {
      this.rope.alpha = Math.max(0, this.rope.alpha - dt * 7);
    }

    const baseColor = this.minColor;
    const optimalColor = this.maxColor;
    this.rope.tint = this.interpolateColors(baseColor, optimalColor, percent);

    // Обновление точек с интерполяцией
    for (let i = 0; i < this.ropeSize; i++) {
      const p = this.points[i];
      const ix = this.cubicInterpolation(this.historyX, (i / this.ropeSize) * this.historySize);
      const iy = this.cubicInterpolation(this.historyY, (i / this.ropeSize) * this.historySize);
      p.x = ix;
      p.y = iy;
    }
  }

  public addXY(x: number, y: number): void {
    // Обновление истории позиций
    this.historyX.pop();
    this.historyX.unshift(x / 2 + 15);
    this.historyY.pop();
    this.historyY.unshift(-y / 2 + 5);
  }

  private interpolateColors(color1: number, color2: number, factor: number): number {
    // Ограничиваем factor в диапазоне [0, 1]
    factor = Math.max(0, Math.min(1, factor));

    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    // Вычисляем интерполированные значения и ограничиваем их в диапазоне [0, 255]
    const r = Math.max(0, Math.min(255, Math.round(r1 + (r2 - r1) * factor)));
    const g = Math.max(0, Math.min(255, Math.round(g1 + (g2 - g1) * factor)));
    const b = Math.max(0, Math.min(255, Math.round(b1 + (b2 - b1) * factor)));

    // Формируем цветовое значение в формате RGB
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Сбрасывает трейл
   */
  public reset(x: number = 0, y: number = 0): void {
    this.enabled = false;
    this.rope.alpha = 0;

    // Сброс истории позиций
    for (let i = 0; i < this.historySize; i++) {
      this.historyX[i] = x;
      this.historyY[i] = y;
    }

    // Сброс точек
    for (let i = 0; i < this.ropeSize; i++) {
      this.points[i].x = x;
      this.points[i].y = y;
    }
  }

  /**
   * Кубическая интерполяция (для плавной кривой)
   */
  private clipInput(k: number, arr: number[]): number {
    if (k < 0) k = 0;
    if (k > arr.length - 1) k = arr.length - 1;
    return arr[k];
  }

  private getTangent(k: number, factor: number, array: number[]): number {
    return (factor * (this.clipInput(k + 1, array) - this.clipInput(k - 1, array))) / 2;
  }

  private cubicInterpolation(array: number[], t: number, tangentFactor: number = 1): number {
    const k = Math.floor(t);
    const m = [this.getTangent(k, tangentFactor, array), this.getTangent(k + 1, tangentFactor, array)];
    const p = [this.clipInput(k, array), this.clipInput(k + 1, array)];
    t -= k;
    const t2 = t * t;
    const t3 = t * t2;
    return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
  }
}
