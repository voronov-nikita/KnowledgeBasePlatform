import streamlit as st
import pandas as pd
import fitz  # PyMuPDF
import re
import io
from datetime import datetime

# -------------------------------
# 1. Настройка страницы и темы
# -------------------------------
st.set_page_config(
    page_title="Поиск по PDF (Markdown)",
    page_icon="📄",
    layout="wide"
)

# Переключатель темы в сайдбаре
with st.sidebar:
    st.markdown("## Настройки")
    theme_choice = st.radio(
        "Выберите тему",
        options=["Светлая", "Тёмная"],
        index=0,
        horizontal=True
    )
    if theme_choice == "Тёмная":
        st._config.set_option("theme.base", "dark")
    else:
        st._config.set_option("theme.base", "light")

st.title("📄 Поиск по PDF (в Markdown)")

# -------------------------------
# 2. Загрузка PDF и преобразование
# -------------------------------
def extract_text_from_pdf(pdf_bytes):
    """
    Извлекает текст из PDF и возвращает список страниц.
    Каждая страница – словарь с номером и текстом.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            pages.append({
                "page_num": i + 1,
                "text": text.strip()
            })
    return pages

def pages_to_markdown(pages, filename):
    """
    Преобразует список страниц в Markdown-строку.
    Каждая страница отделяется разделителем.
    """
    md_lines = []
    md_lines.append(f"# Документ: {filename}\n")
    for p in pages:
        md_lines.append(f"## Страница {p['page_num']}\n")
        md_lines.append(p['text'])
        md_lines.append("\n---\n")
    return "\n".join(md_lines)

# Инициализация состояния
if "documents" not in st.session_state:
    st.session_state.documents = []  # список словарей: {filename, markdown, raw_pages, raw_text}

# Загрузка файлов
uploaded_files = st.file_uploader(
    "Загрузите PDF-файлы (можно несколько)",
    type=["pdf"],
    accept_multiple_files=True
)

if uploaded_files:
    # Обрабатываем только новые файлы
    existing_filenames = {doc["filename"] for doc in st.session_state.documents}
    new_files = [f for f in uploaded_files if f.name not in existing_filenames]
    if new_files:
        progress_bar = st.progress(0)
        for i, file in enumerate(new_files):
            try:
                pdf_bytes = file.read()
                pages = extract_text_from_pdf(pdf_bytes)
                markdown_text = pages_to_markdown(pages, file.name)
                raw_text = "\n".join(p["text"] for p in pages)
                st.session_state.documents.append({
                    "filename": file.name,
                    "markdown": markdown_text,
                    "raw_text": raw_text,
                    "pages": pages,
                    "uploaded_at": datetime.now().strftime("%Y-%m-%d %H:%M")
                })
            except Exception as e:
                st.error(f"Ошибка при обработке {file.name}: {e}")
            progress_bar.progress((i + 1) / len(new_files))
        st.success(f"Загружено и обработано {len(new_files)} файлов.")
        st.rerun()

# Если документов нет – показываем сообщение
if not st.session_state.documents:
    st.info("Загрузите хотя бы один PDF-файл, чтобы начать поиск.")
    st.stop()

# -------------------------------
# 3. Поиск
# -------------------------------
# Боковая панель для поиска
with st.sidebar:
    st.markdown("## 🔍 Поиск")
    search_mode = st.radio(
        "Искать по:",
        options=["Названию файла", "Содержимому"],
        index=1
    )
    query = st.text_input("Введите запрос", placeholder="например: отчёт, глава 3, API")
    search_button = st.button("Найти", use_container_width=True)

# Основная область: результаты
if search_button and query:
    query_lower = query.lower().strip()
    results = []

    for doc in st.session_state.documents:
        if search_mode == "Названию файла":
            if query_lower in doc["filename"].lower():
                # Возвращаем весь документ
                results.append({
                    "filename": doc["filename"],
                    "markdown": doc["markdown"],
                    "matches": [{"page": 0, "snippet": doc["markdown"][:500] + "…"}]  # условно
                })
        else:  # Содержимому
            raw_text = doc["raw_text"].lower()
            if query_lower in raw_text:
                # Находим совпадения по страницам
                page_matches = []
                for page in doc["pages"]:
                    text_lower = page["text"].lower()
                    if query_lower in text_lower:
                        # Вырезаем контекст (50 символов вокруг каждого вхождения)
                        snippets = []
                        for match in re.finditer(re.escape(query), page["text"], re.IGNORECASE):
                            start = max(0, match.start() - 50)
                            end = min(len(page["text"]), match.end() + 50)
                            snippet = page["text"][start:end]
                            snippets.append(snippet)
                        page_matches.append({
                            "page": page["page_num"],
                            "snippets": snippets
                        })
                if page_matches:
                    results.append({
                        "filename": doc["filename"],
                        "markdown": doc["markdown"],
                        "matches": page_matches
                    })

    # Отображение результатов
    if results:
        st.subheader(f"Найдено файлов: {len(results)}")
        for res in results:
            with st.expander(f"📁 {res['filename']} (найдено на {len(res['matches'])} страницах)"):
                if search_mode == "Названию файла":
                    # Показываем полный Markdown
                    st.markdown(res["markdown"])
                else:
                    # Показываем только фрагменты с совпадениями
                    for match in res["matches"]:
                        st.markdown(f"**Страница {match['page']}**")
                        for snippet in match["snippets"]:
                            # Подсветка запроса
                            highlighted = re.sub(
                                re.escape(query),
                                lambda m: f"<mark>{m.group(0)}</mark>",
                                snippet,
                                flags=re.IGNORECASE
                            )
                            st.markdown(f"> {highlighted}", unsafe_allow_html=True)
                        st.markdown("---")
    else:
        st.warning("Ничего не найдено. Попробуйте изменить запрос.")

# -------------------------------
# 4. Просмотр всех документов (без поиска)
# -------------------------------
else:
    st.subheader("📚 Загруженные документы")
    for doc in st.session_state.documents:
        with st.expander(f"📁 {doc['filename']} (загружен {doc['uploaded_at']})"):
            st.markdown(doc["markdown"])

# -------------------------------
# 5. Экспорт в CSV
# -------------------------------
if st.sidebar.button("📊 Выгрузить в CSV", use_container_width=True):
    if st.session_state.documents:
        df = pd.DataFrame(st.session_state.documents)
        # Убираем длинные тексты для читаемости, но оставляем их
        csv = df.to_csv(index=False, columns=["filename", "uploaded_at"])
        st.sidebar.download_button(
            label="Скачать CSV",
            data=csv,
            file_name="pdf_markdown_export.csv",
            mime="text/csv"
        )
    else:
        st.sidebar.warning("Нет данных для экспорта.")