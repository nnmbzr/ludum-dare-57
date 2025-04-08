import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { SCREEN_WIDTH } from '../../../main';

// Тип для колбэка при взаимодействии с предметами инвентаря
type InventoryItemCallback = (id: string) => void;

export const CELL_SIZE = 80;

/** Класс управления инвентарём */
export class Inventory extends Container {
  // Размеры инвентаря и ячеек
  private readonly inventoryWidth: number = SCREEN_WIDTH;
  private readonly inventoryHeight: number = 100;
  private readonly cellPadding: number = 40;
  private readonly startX: number = 100;
  private readonly maxCells: number = 8;

  // Контейнеры и спрайты
  private background: Sprite;
  private cells: Container[] = [];
  private items: { id: string; sprite: Sprite }[] = [];

  // Хранилище оригинальных масштабов спрайтов для анимации наведения
  private originalScales = new WeakMap<Sprite, { x: number; y: number }>();

  // Колбэк для взаимодействия с объектами
  private itemCallback: InventoryItemCallback;

  /**
   * Создает новый инвентарь
   * @param itemCallback Функция обратного вызова при клике на предмет
   */
  constructor(itemCallback: InventoryItemCallback) {
    super();

    this.itemCallback = itemCallback;

    // Создаем подложку инвентаря
    this.background = Sprite.from('inventory_bg');
    this.background.width = this.inventoryWidth;
    this.background.height = this.inventoryHeight;
    this.background.alpha = 0.8;
    this.addChild(this.background);

    // Располагаем инвентарь вверху экрана
    this.position.set(0, 0);

    // Создаем ячейки инвентаря
    this.initCells();
  }

  /**
   * Инициализация ячеек инвентаря
   */
  private initCells(): void {
    for (let i = 0; i < this.maxCells; i++) {
      const cell = new Container();
      cell.position.set(this.startX + this.cellPadding + i * (CELL_SIZE + this.cellPadding), this.cellPadding);

      // Добавляем визуальное оформление ячейки
      // TODO: при необходимости. Но я пока хз что там по UI
      /* const cellBg = Sprite.from('cell_background');
      cellBg.width = this.cellWidth;
      cellBg.height = this.cellHeight;
      cell.addChild(cellBg); */

      this.cells.push(cell);
      this.addChild(cell);
    }
  }

  /**
   * Добавляет объект в инвентарь
   * @param id Идентификатор объекта (соответствует названию спрайта)
   * @returns true, если объект успешно добавлен, false в противном случае
   */
  public addItem(id: string): boolean {
    // Проверяем, есть ли свободные ячейки
    if (this.items.length >= this.maxCells) {
      console.warn('Inventory is full!');
      return false;
    }

    try {
      // Создаем спрайт объекта
      const sprite = Sprite.from(id);
      sprite.anchor.set(0.5);

      // Проверяем валидность текстуры
      if (!sprite.texture) {
        console.warn(`Invalid texture for item ID: ${id}`);
        return false;
      }

      // Подгоняем размер спрайта под ячейку с сохранением пропорций
      this.fitSpriteToCell(sprite);

      // Сохраняем исходный масштаб для обработчиков событий
      this.originalScales.set(sprite, { x: sprite.scale.x, y: sprite.scale.y });

      // Делаем спрайт интерактивным
      sprite.eventMode = 'static';
      sprite.cursor = 'pointer';

      // Добавляем обработчики событий
      sprite.on('pointerover', this.onItemHover.bind(this, sprite));
      sprite.on('pointerout', this.onItemOut.bind(this, sprite));
      sprite.on('pointerdown', this.onItemClick.bind(this, id));

      // Добавляем спрайт в первую свободную ячейку
      const index = this.items.length;
      this.cells[index].addChild(sprite);

      // Добавляем информацию о предмете в массив
      this.items.push({ id, sprite });

      return true;
    } catch (error) {
      console.error(`Failed to add item with ID: ${id}`, error);
      return false;
    }
  }

  /**
   * Подгоняет размер спрайта под ячейку с сохранением пропорций
   * @param sprite Спрайт для масштабирования
   */
  private fitSpriteToCell(sprite: Sprite): void {
    const originalWidth = sprite.width;
    const originalHeight = sprite.height;

    const scaleX = CELL_SIZE / originalWidth;
    const scaleY = CELL_SIZE / originalHeight;

    // Используем меньший масштаб для сохранения пропорций
    const scale = Math.min(scaleX, scaleY) * 0.9; // Оставляем небольшой отступ

    sprite.scale.set(scale);
  }

  /**
   * Обработчик наведения курсора на предмет
   * @param sprite Спрайт, на который наведен курсор
   */
  private onItemHover(sprite: Sprite): void {
    gsap.to(sprite.scale, {
      x: sprite.scale.x * 1.1,
      y: sprite.scale.y * 1.1,
      duration: 0.2,
    });
  }

  /**
   * Обработчик ухода курсора с предмета
   * @param sprite Спрайт, с которого ушел курсор
   */
  private onItemOut(sprite: Sprite): void {
    const originalScale = this.originalScales.get(sprite);
    if (originalScale) {
      gsap.to(sprite.scale, {
        x: originalScale.x,
        y: originalScale.y,
        duration: 0.2,
      });
    }
  }

  /**
   * Обработчик клика по предмету
   * @param id Идентификатор предмета
   */
  private onItemClick(id: string): void {
    // Вызываем колбэк с id предмета
    this.itemCallback(id);

    // Удаляем предмет из инвентаря
    // this.removeItem(id);
    this.hideItem(id);
  }

  private hideItem(id: string): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      const { sprite } = this.items[index];
      sprite.visible = false;
    }
  }

  private showItem(id: string): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      const { sprite } = this.items[index];
      sprite.visible = true;
    }
  }

  public cancelInteraction(id: string): void {
    this.showItem(id);
  }

  /**
   * Удаляет объект из инвентаря
   * @param id Идентификатор объекта
   * @returns true, если объект успешно удален, false в противном случае
   */
  public removeItem(id: string): boolean {
    // Находим индекс предмета в массиве
    const index = this.items.findIndex((item) => item.id === id);

    if (index === -1) return false;

    // Удаляем спрайт из ячейки
    const { sprite } = this.items[index];
    this.cells[index].removeChild(sprite);
    sprite.destroy();

    // Удаляем информацию о предмете из массива
    this.items.splice(index, 1);

    // Перемещаем остальные предметы
    this.rearrangeItems(true);

    return true;
  }

  /**
   * Перемещает предметы после удаления
   * @param animated Использовать ли анимацию при перемещении
   */
  private rearrangeItems(animated: boolean = false): void {
    // Для каждого предмета после удаленного
    for (let i = 0; i < this.items.length; i++) {
      const { sprite } = this.items[i];

      // Если предмет уже в нужной ячейке, пропускаем
      if (this.cells[i].children.includes(sprite)) continue;

      // Находим ячейку, в которой сейчас находится спрайт
      const currentCellIndex = this.cells.findIndex((cell) => cell.children.includes(sprite));

      if (currentCellIndex !== -1) {
        // Удаляем спрайт из текущей ячейки
        this.cells[currentCellIndex].removeChild(sprite);

        // Добавляем спрайт в новую ячейку
        this.cells[i].addChild(sprite);

        // Если нужна анимация, используем gsap
        if (animated) {
          // Сохраняем начальную позицию (относительно текущей ячейки)
          const startX = sprite.position.x + (currentCellIndex - i) * (CELL_SIZE + this.cellPadding);
          const startY = sprite.position.y;

          // Устанавливаем начальную позицию и анимируем к центру ячейки
          sprite.position.set(startX, startY);

          gsap.to(sprite.position, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power1.out',
          });
        }
      }
    }
  }

  /**
   * Получает список всех ID предметов в инвентаре
   * @returns Массив ID предметов
   */
  public getItems(): string[] {
    return this.items.map((item) => item.id);
  }

  /**
   * Проверяет наличие предмета в инвентаре
   * @param id Идентификатор предмета
   * @returns true, если предмет есть в инвентаре
   */
  public hasItem(id: string): boolean {
    return this.items.some((item) => item.id === id);
  }

  /**
   * Получает количество предметов в инвентаре
   * @returns Количество предметов
   */
  public getItemCount(): number {
    return this.items.length;
  }
}
