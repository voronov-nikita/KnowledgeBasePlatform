import json
import re
from typing import List, Dict

def parse_table_to_json(table_text: str) -> List[Dict]:
    """
    Преобразует текст таблицы с разделителями табуляции в JSON.
    """
    lines = table_text.strip().split('\n')
    if not lines:
        return []
    
    # Первая строка - заголовки
    headers_raw = lines[0]
    # Разделяем заголовки по табуляции и очищаем от лишних пробелов
    headers = [h.strip() for h in headers_raw.split('\t')]
    
    # Обрабатываем остальные строки
    result = []
    for line_num, line in enumerate(lines[1:], start=2):
        # Пропускаем пустые строки
        if not line.strip():
            continue
        
        # Разделяем строку по табуляции
        values = line.split('\t')
        
        # Если количество значений не совпадает с заголовками, выравниваем
        if len(values) != len(headers):
            # Добавляем пустые строки для недостающих колонок
            if len(values) < len(headers):
                values.extend([''] * (len(headers) - len(values)))
            # Если значений больше, обрезаем
            else:
                values = values[:len(headers)]
        
        # Создаем словарь для текущей записи
        record = {}
        for i, header in enumerate(headers):
            # Очищаем значение от лишних пробелов и символов перевода строки
            value = values[i].strip() if i < len(values) else ''
            # Заменяем пустые строки на None (или можно оставить '')
            record[header] = value if value else None
        
        result.append(record)
    
    return result

def save_json(data: List[Dict], filename: str = 'organizations.json'):
    """
    Сохраняет данные в JSON-файл с правильной кодировкой.
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Данные сохранены в файл: {filename}")
    print(f"Всего записей: {len(data)}")

def read_from_clipboard():
    """
    Читает текст из буфера обмена (Windows, macOS, Linux).
    Требует установки дополнительных библиотек.
    """
    try:
        import pyperclip
        return pyperclip.paste()
    except ImportError:
        print("Для чтения из буфера обмена установите библиотеку: pip install pyperclip")
        return None

def main():
    """
    Основная функция: читает данные из буфера обмена или файла и конвертирует в JSON.
    """
    print("=" * 60)
    print("Конвертер табличных данных в JSON")
    print("=" * 60)
    
    print("\nВариант 2: Чтение из файла")
    filename = input("Введите имя файла (например, table.txt): ").strip()
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            table_text = f.read()
        print(f"✓ Данные прочитаны из файла: {filename}")
    except FileNotFoundError:
        print(f"✗ Файл {filename} не найден")
        return
    except Exception as e:
        print(f"✗ Ошибка при чтении файла: {e}")
        return
    
    # Парсим таблицу
    print("\nОбработка данных...")
    try:
        organizations = parse_table_to_json(table_text)
        
        if not organizations:
            print("✗ Не удалось распарсить данные. Проверьте формат таблицы.")
            return
        
        print(f"✓ Успешно обработано {len(organizations)} записей")
        
        # Сохраняем результат
        output_filename = input("\nВведите имя выходного JSON файла (по умолчанию organizations.json): ").strip()
        if not output_filename:
            output_filename = 'organizations.json'
        
        save_json(organizations, output_filename)
        
        # Показываем пример первой записи
        print("\n" + "=" * 60)
        print("Пример первой записи в JSON:")
        print("=" * 60)
        print(json.dumps(organizations[0], ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(f"✗ Ошибка при обработке данных: {e}")

def parse_from_file(input_file: str, output_file: str = 'organizations.json'):
    """
    Упрощенная функция для прямого преобразования файла в JSON.
    
    Args:
        input_file: путь к входному файлу с таблицей
        output_file: путь к выходному JSON файлу
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            table_text = f.read()
        
        organizations = parse_table_to_json(table_text)
        save_json(organizations, output_file)
        return organizations
    except Exception as e:
        print(f"Ошибка: {e}")
        return None

if __name__ == "__main__":
    main()