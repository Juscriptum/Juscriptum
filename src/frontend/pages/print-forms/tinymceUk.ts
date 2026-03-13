import tinymce from "tinymce";

const ukTranslations: Record<string, string> = {
  Undo: "Скасувати",
  Redo: "Повторити",
  "Rich Text Area": "Текстовий редактор",
  Paragraph: "Абзац",
  Blocks: "Блоки",
  Headings: "Заголовки",
  "Heading 1": "Заголовок 1",
  "Heading 2": "Заголовок 2",
  "Heading 3": "Заголовок 3",
  "Heading 4": "Заголовок 4",
  Bold: "Напівжирний",
  Italic: "Курсив",
  Underline: "Підкреслення",
  Strikethrough: "Закреслення",
  "Text color": "Колір тексту",
  "Background color": "Колір тла",
  "Align left": "Вирівняти ліворуч",
  "Align center": "Вирівняти по центру",
  "Align right": "Вирівняти праворуч",
  Justify: "Вирівняти по ширині",
  "Bullet list": "Маркований список",
  "Numbered list": "Нумерований список",
  "Decrease indent": "Зменшити відступ",
  "Increase indent": "Збільшити відступ",
  Table: "Таблиця",
  "Insert/edit link": "Вставити або редагувати посилання",
  "Special character": "Спеціальний символ",
  "Insert date/time": "Вставити дату або час",
  "Page break": "Розрив сторінки",
  "Search and replace": "Пошук і заміна",
  "Show blocks": "Показати блоки",
  "Show invisible characters": "Показати невидимі символи",
  Preview: "Попередній перегляд",
  Fullscreen: "На весь екран",
  "Remove formatting": "Очистити форматування",
  "Source code": "Вихідний код",
  "Font family": "Шрифт",
  "Font sizes": "Розмір шрифту",
  Link: "Посилання",
  "Insert link": "Вставити посилання",
  "Table properties": "Властивості таблиці",
  "Cell properties": "Властивості комірки",
  "Row properties": "Властивості рядка",
  "Column properties": "Властивості стовпця",
  "Insert row before": "Додати рядок перед",
  "Insert row after": "Додати рядок після",
  "Delete row": "Видалити рядок",
  "Insert column before": "Додати стовпець перед",
  "Insert column after": "Додати стовпець після",
  "Delete column": "Видалити стовпець",
  "Delete table": "Видалити таблицю",
  Save: "Зберегти",
  Cancel: "Скасувати",
  Close: "Закрити",
};

let isRegistered = false;

export const registerTinyMceUk = () => {
  if (isRegistered) {
    return;
  }

  tinymce.addI18n("uk", ukTranslations);
  isRegistered = true;
};
