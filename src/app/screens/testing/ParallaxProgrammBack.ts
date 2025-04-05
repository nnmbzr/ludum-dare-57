import { Container, Sprite } from 'pixi.js';

export class ParallaxProgrammBack extends Container {
  private sprite!: Sprite;
  private currentPosition = { x: 0, y: 0 };
  private targetPosition = { x: 0, y: 0 };
  private parallaxStrength = { x: 0.05, y: 0.03 }; // Коэффициент силы параллакса
  private easing = 0.08; // Коэффициент плавности движения
  private screenWidth!: number;
  private screenHeight!: number;

  constructor() {
    super();
  }

  /**
   * Инициализирует паралакс-фон с указанной текстурой
   */
  public init(texture: string, screenWidth: number, screenHeight: number): this {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    // Создаем спрайт фона
    this.sprite = Sprite.from(texture);

    // Центрируем спрайт и делаем его немного больше экрана для эффекта параллакса
    this.sprite.anchor.set(0.5);
    this.sprite.x = this.screenWidth / 2;
    this.sprite.y = this.screenHeight / 2;

    // Увеличиваем размер фона, чтобы при движении не было пустых краев
    // this.sprite.width = this.screenWidth * 1.1;
    // this.sprite.height = this.screenHeight * 1.1;

    this.addChild(this.sprite);
    return this;
  }

  /**
   * Настраивает силу параллакс-эффекта
   */
  public setParallaxStrength(x: number, y: number): this {
    this.parallaxStrength = { x, y };
    return this;
  }

  /**
   * Настраивает скорость сглаживания движения (0-1)
   */
  public setEasing(easing: number): this {
    this.easing = Math.max(0, Math.min(1, easing));
    return this;
  }

  public onMouseMove(mouseX: number, mouseY: number): void {
    // Получаем координаты курсора мыши относительно центра экрана (-1 до 1)
    const relativeX = (mouseX - this.screenWidth / 2) / (this.screenWidth / 2);
    const relativeY = (mouseY - this.screenHeight / 2) / (this.screenHeight / 2);

    // Вычисляем целевое смещение (инвертируем, чтобы создать эффект "следования")
    const maxOffsetX = (this.sprite.width - this.screenWidth) / 2;
    const maxOffsetY = (this.sprite.height - this.screenHeight) / 2;

    this.targetPosition.x = -relativeX * this.parallaxStrength.x * maxOffsetX;
    this.targetPosition.y = -relativeY * this.parallaxStrength.y * maxOffsetY;
  }

  public update(delta: number): void {
    if (!this.sprite) return;

    // Интерполируем текущие позиции к целевым для плавности
    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * this.easing * delta;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * this.easing * delta;

    // Обновляем позицию спрайта
    this.sprite.x = this.screenWidth / 2 + this.currentPosition.x;
    this.sprite.y = this.screenHeight / 2 + this.currentPosition.y;
  }
}
