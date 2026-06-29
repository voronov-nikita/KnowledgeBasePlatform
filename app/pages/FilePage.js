import React, { useState, useMemo, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import MiniSearch from 'minisearch';
import { useTheme } from '../components/ThemeContext';
import { getAppTheme } from '../components/appTheme';

// ------------------------------
// Нормализация
// ------------------------------
function normalizeText(text = '') {
    return String(text || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ------------------------------
// Основной компонент
// ------------------------------
export default function FileScreen() {
    const { theme } = useTheme();
    const palette = getAppTheme(theme);

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState('content'); // 'content' | 'filename'

    // Загружаем список файлов с сервера при старте
    useEffect(() => {
        fetchFilesFromServer();
    }, []);

    // Заглушка: получить файлы с сервера
    const fetchFilesFromServer = async () => {
        try {
            // const response = await fetch('https://your-server.com/api/files');
            // const data = await response.json();
            // setFiles(data);
        } catch (error) {
            console.warn('Не удалось загрузить файлы с сервера', error);
        }
    };

    // Загрузка PDF на сервер
    const uploadPDF = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.pdf],
            });
            const file = result[0];
            if (!file) return;

            setLoading(true);

            // Формируем FormData для отправки
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                type: file.type,
                name: file.name,
            });

            // Отправляем на сервер
            // const response = await fetch('https://your-server.com/api/upload', {
            //   method: 'POST',
            //   body: formData,
            //   headers: { 'Content-Type': 'multipart/form-data' },
            // });
            // const newFile = await response.json();
            // setFiles(prev => [...prev, newFile]);

            // ---------------- Имитация ответа (удалить при интеграции) ----------------
            // В реальности сервер вернёт объект с полями:
            // { id, filename, rawText, markdown, pages: [{pageNum, text}], serverUrl }
            const fakePages = [
                { pageNum: 1, text: 'Пример текста из PDF. Здесь может быть важная информация.' },
                { pageNum: 2, text: 'Вторая страница: продолжение документа.' },
            ];
            const rawText = fakePages.map(p => p.text).join('\n\n');
            let markdown = `# Документ: ${file.name}\n\n`;
            fakePages.forEach(p => {
                markdown += `## Страница ${p.pageNum}\n\n${p.text}\n\n---\n\n`;
            });
            const newDoc = {
                id: Date.now().toString(),
                filename: file.name,
                rawText,
                markdown,
                pages: fakePages,
                serverUrl: 'https://your-server.com/files/' + file.name, // ссылка для скачивания
            };
            setFiles(prev => [...prev, newDoc]);
            // -------------------------------------------------------------------------

            Alert.alert('Успех', `Файл "${file.name}" загружен на сервер и проиндексирован`);
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // отмена
            } else {
                Alert.alert('Ошибка', `Не удалось загрузить PDF: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Удаление файла (с сервера и из списка)
    const removeFile = (id) => {
        Alert.alert(
            'Удалить файл?',
            'Файл будет удалён с сервера.',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // await fetch(`https://your-server.com/api/files/${id}`, { method: 'DELETE' });
                            setFiles(prev => prev.filter(f => f.id !== id));
                        } catch (error) {
                            Alert.alert('Ошибка', 'Не удалось удалить файл');
                        }
                    },
                },
            ]
        );
    };

    // Индексация через MiniSearch
    const miniSearch = useMemo(() => {
        const ms = new MiniSearch({
            fields: ['filenameNormalized', 'rawTextNormalized', 'markdownNormalized'],
            storeFields: ['id', 'filename', 'rawText', 'markdown', 'pages', 'serverUrl'],
            searchOptions: { fuzzy: 0.2, prefix: true },
            processTerm: (term) => normalizeText(term),
        });

        const indexed = files.map(doc => ({
            id: doc.id,
            filenameNormalized: normalizeText(doc.filename),
            rawTextNormalized: normalizeText(doc.rawText),
            markdownNormalized: normalizeText(doc.markdown),
            filename: doc.filename,
            rawText: doc.rawText,
            markdown: doc.markdown,
            pages: doc.pages,
            serverUrl: doc.serverUrl,
        }));

        ms.addAll(indexed);
        return ms;
    }, [files]);

    // Поиск
    const results = useMemo(() => {
        if (!query.trim()) return files;

        const normalizedQuery = normalizeText(query);
        let searchResults;
        if (searchMode === 'filename') {
            searchResults = miniSearch.search(normalizedQuery, {
                fields: ['filenameNormalized'],
                prefix: true,
                fuzzy: 0.2,
            });
        } else {
            searchResults = miniSearch.search(normalizedQuery, {
                fields: ['rawTextNormalized', 'markdownNormalized'],
                prefix: true,
                fuzzy: 0.2,
                boost: { rawTextNormalized: 2, markdownNormalized: 1 },
            });
        }

        return searchResults.map(result => {
            const doc = files.find(f => f.id === result.id);
            if (!doc) return null;

            let matchedPages = [];
            if (searchMode === 'content') {
                const qLow = normalizedQuery;
                doc.pages.forEach(page => {
                    const textLow = normalizeText(page.text);
                    if (textLow.includes(qLow)) {
                        const snippets = [];
                        const regex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                        let match;
                        while ((match = regex.exec(page.text)) !== null) {
                            const start = Math.max(0, match.index - 40);
                            const end = Math.min(page.text.length, match.index + match[0].length + 40);
                            snippets.push(page.text.substring(start, end));
                        }
                        matchedPages.push({ pageNum: page.pageNum, snippets });
                    }
                });
            }

            return {
                ...doc,
                matchedPages,
                score: result.score,
            };
        }).filter(Boolean);
    }, [query, searchMode, miniSearch, files]);

    // Подсказки (автодополнение)
    const suggestions = useMemo(() => {
        const norm = normalizeText(query);
        if (!norm) return [];
        return miniSearch.autoSuggest(norm, { prefix: true, fuzzy: 0.2 }).slice(0, 3);
    }, [query, miniSearch]);

    // Скачивание файла с сервера
    const downloadFile = (serverUrl, filename) => {
        // В RN можно использовать Linking.openURL(serverUrl)
        Alert.alert('Скачивание', `Ссылка: ${serverUrl}\nФайл: ${filename}`);
        // реально: Linking.openURL(serverUrl);
    };

    // ----- Рендеры -----
    const renderSuggestion = ({ item }) => (
        <Pressable
            style={[styles.suggestionItem, { borderTopColor: palette.border }]}
            onPress={() => setQuery(item.suggestion)}
        >
            <Text style={[styles.suggestionText, { color: palette.text }]} numberOfLines={1}>
                {item.suggestion}
            </Text>
        </Pressable>
    );

    const renderResult = ({ item }) => {
        const isContentSearch = searchMode === 'content';
        const hasMatches = isContentSearch && item.matchedPages && item.matchedPages.length > 0;

        return (
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: palette.primarySoft }]}>
                        <Text style={[styles.badgeText, { color: palette.primary }]}>{item.filename}</Text>
                    </View>
                    {!!item.pages && (
                        <View style={[styles.badgeSecondary, { backgroundColor: theme === 'light' ? '#f1f5f9' : '#1e293b' }]}>
                            <Text style={[styles.badgeSecondaryText, { color: palette.textSecondary }]}>
                                {item.pages.length} стр.
                            </Text>
                        </View>
                    )}
                </View>

                {isContentSearch ? (
                    hasMatches ? (
                        item.matchedPages.map((page, idx) => (
                            <View key={idx} style={{ marginBottom: 6 }}>
                                <Text style={[styles.blockTitle, { color: palette.primary }]}>Страница {page.pageNum}</Text>
                                {page.snippets.map((snippet, si) => (
                                    <Text key={si} style={[styles.answerText, { color: palette.textSecondary }]}>
                                        {snippet} {/* Для подсветки используйте вложенные <Text> или сторонние библиотеки */}
                                    </Text>
                                ))}
                            </View>
                        ))
                    ) : (
                        <Text style={[styles.noMatch, { color: palette.textMuted }]}>
                            (Совпадения только в других полях)
                        </Text>
                    )
                ) : (
                    <ScrollView style={{ maxHeight: 120 }}>
                        <Text style={[styles.answerText, { color: palette.textSecondary }]} numberOfLines={4}>
                            {item.rawText.substring(0, 200)}...
                        </Text>
                    </ScrollView>
                )}

                <View style={[styles.infoBox, { borderTopColor: palette.border }]}>
                    {!!item.serverUrl && (
                        <Pressable onPress={() => downloadFile(item.serverUrl, item.filename)}>
                            <Text style={[styles.infoText, { color: palette.primary }]}>⬇ Скачать файл</Text>
                        </Pressable>
                    )}
                    {!!item.score && (
                        <Text style={[styles.score, { color: palette.textMuted }]}>Score: {item.score.toFixed(2)}</Text>
                    )}
                    <Pressable onPress={() => removeFile(item.id)}>
                        <Text style={[styles.infoText, { color: '#ef4444' }]}>Удалить</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    // ----- Основной рендер -----
    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
            <View style={styles.container}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.title, { color: palette.text }]}>Поиск по PDF</Text>
                    <Pressable
                        onPress={uploadPDF}
                        style={({ pressed }) => [
                            styles.exportButtonSmall,
                            {
                                borderColor: palette.primary,
                                backgroundColor: pressed ? palette.primarySoft : 'transparent',
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                        disabled={loading}
                    >
                        <Text style={[styles.exportButtonSmallText, { color: palette.primary }]}>
                            {loading ? 'Загрузка...' : '+ Загрузить PDF'}
                        </Text>
                    </Pressable>
                </View>

                {/* Переключатели режима поиска */}
                <View style={styles.searchModes}>
                    <Pressable
                        style={[styles.modeButton, searchMode === 'content' && { backgroundColor: palette.primary }]}
                        onPress={() => setSearchMode('content')}
                    >
                        <Text style={[styles.modeText, { color: searchMode === 'content' ? '#fff' : palette.text }]}>
                            По содержимому
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.modeButton, searchMode === 'filename' && { backgroundColor: palette.primary }]}
                        onPress={() => setSearchMode('filename')}
                    >
                        <Text style={[styles.modeText, { color: searchMode === 'filename' ? '#fff' : palette.text }]}>
                            По названию
                        </Text>
                    </Pressable>
                </View>

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchMode === 'content' ? 'Поиск по тексту PDF' : 'Поиск по имени файла'}
                    placeholderTextColor={palette.textMuted}
                    style={[
                        styles.input,
                        {
                            backgroundColor: palette.inputBackground,
                            borderColor: palette.inputBorder,
                            color: palette.text,
                        },
                    ]}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                {!!normalizeText(query) && suggestions.length > 0 && (
                    <View style={[styles.suggestionsBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                        <Text style={[styles.suggestionsTitle, { color: palette.primary }]}>Подсказки</Text>
                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) => `${item.suggestion}-${index}`}
                            renderItem={renderSuggestion}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled
                            style={styles.suggestionsList}
                        />
                    </View>
                )}

                <View style={styles.resultsHeader}>
                    <Text style={[styles.resultsTitle, { color: palette.textSecondary }]}>
                        {query.trim() ? `Найдено: ${results.length}` : `Всего файлов: ${files.length}`}
                    </Text>
                </View>

                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderResult}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={[styles.emptyBox, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                            <Text style={[styles.emptyTitle, { color: palette.text }]}>
                                {files.length === 0 ? 'Нет загруженных PDF' : 'Ничего не найдено'}
                            </Text>
                            <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                                {files.length === 0
                                    ? 'Нажмите "+ Загрузить PDF" и выберите файл'
                                    : 'Попробуйте другой запрос или режим поиска'}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

// ------------------------------
// Стили (скопированы из SearchPage и дополнены)
// ------------------------------
const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
    exportButtonSmall: {
        minWidth: 92,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exportButtonSmallText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
    searchModes: {
        flexDirection: 'row',
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    modeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    modeText: { fontWeight: '600', fontSize: 14 },
    input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
    suggestionsBox: { borderRadius: 14, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
    suggestionsTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
    suggestionsList: { maxHeight: 132 },
    suggestionItem: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
    suggestionText: { fontSize: 14 },
    resultsHeader: { marginBottom: 10 },
    resultsTitle: { fontSize: 14, fontWeight: '600' },
    listContent: { paddingBottom: 24 },
    card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeText: { fontSize: 12, fontWeight: '700' },
    badgeSecondary: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeSecondaryText: { fontSize: 12, fontWeight: '600' },
    blockTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
    questionText: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginBottom: 12 },
    answerText: { fontSize: 14, lineHeight: 21, marginBottom: 12 },
    noMatch: { fontSize: 13, fontStyle: 'italic', marginBottom: 6 },
    infoBox: { borderTopWidth: 1, paddingTop: 10 },
    infoText: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
    score: { fontSize: 12, marginTop: 8, textAlign: 'right' },
    emptyBox: { borderRadius: 14, padding: 20, borderWidth: 1 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
    emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});