import React, { useMemo, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    StyleSheet,
} from "react-native";
import MiniSearch from "minisearch";
import rawData from "../data/Baza-znanii_Лист1.json";
import { useTheme } from "../components/ThemeContext";
import { getAppTheme } from "../components/appTheme";

function normalizeText(text = "") {
    return String(text || "")
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function isEmptyRow(item) {
    return !(
        item?.["Заявитель"] ||
        item?.["Тематика"] ||
        item?.["Подтематика"] ||
        item?.["Вопрос"] ||
        item?.["Отвечает"] ||
        item?.["Ответ для первой линии поддержки"] ||
        item?.["Комментарий"]
    );
}

function prepareDocuments(list) {
    return list
        .filter((item) => !isEmptyRow(item))
        .map((item, index) => {
            const applicant = item?.["Заявитель"] ?? "";
            const topic = item?.["Тематика"] ?? "";
            const subtopic = item?.["Подтематика"] ?? "";
            const question = item?.["Вопрос"] ?? "";
            const responder = item?.["Отвечает"] ?? "";
            const answer = item?.["Ответ для первой линии поддержки"] ?? "";
            const comment = item?.["Комментарий"] ?? "";

            return {
                id: String(index + 1),
                applicant,
                topic,
                subtopic,
                question,
                responder,
                answer,
                comment,
                applicantNormalized: normalizeText(applicant),
                topicNormalized: normalizeText(topic),
                subtopicNormalized: normalizeText(subtopic),
                questionNormalized: normalizeText(question),
                responderNormalized: normalizeText(responder),
                answerNormalized: normalizeText(answer),
                commentNormalized: normalizeText(comment),
                searchText: normalizeText(
                    [
                        applicant,
                        topic,
                        subtopic,
                        question,
                        responder,
                        answer,
                        comment,
                    ].join(" "),
                ),
            };
        });
}

export default function SearchScreen() {
    const { theme } = useTheme();
    const palette = getAppTheme(theme);
    const [query, setQuery] = useState("");

    const documents = useMemo(() => prepareDocuments(rawData), []);

    const miniSearch = useMemo(() => {
        const ms = new MiniSearch({
            fields: [
                "applicantNormalized",
                "topicNormalized",
                "subtopicNormalized",
                "questionNormalized",
                "responderNormalized",
                "answerNormalized",
                "commentNormalized",
                "searchText",
            ],
            storeFields: [
                "id",
                "applicant",
                "topic",
                "subtopic",
                "question",
                "responder",
                "answer",
                "comment",
            ],
            searchOptions: {
                boost: {
                    questionNormalized: 5,
                    topicNormalized: 4,
                    subtopicNormalized: 3,
                    answerNormalized: 3,
                    applicantNormalized: 2,
                    responderNormalized: 1,
                    commentNormalized: 1,
                    searchText: 1,
                },
                prefix: true,
                fuzzy: 0.2,
                combineWith: "AND",
            },
            autoSuggestOptions: {
                prefix: true,
                fuzzy: 0.2,
            },
            processTerm: (term) => normalizeText(term),
        });

        ms.addAll(documents);
        return ms;
    }, [documents]);

    const normalizedQuery = useMemo(() => normalizeText(query), [query]);

    const suggestions = useMemo(() => {
        if (!normalizedQuery) return [];
        return miniSearch
            .autoSuggest(normalizedQuery, {
                prefix: true,
                fuzzy: 0.2,
            })
            .slice(0, 5);
    }, [normalizedQuery, miniSearch]);

    const results = useMemo(() => {
        if (!normalizedQuery) return documents;

        const searchResults = miniSearch.search(normalizedQuery, {
            prefix: (term) => term.length > 2,
            fuzzy: (term) => (term.length >= 4 ? 0.2 : null),
            combineWith: "AND",
            boost: {
                questionNormalized: 5,
                topicNormalized: 4,
                subtopicNormalized: 3,
                answerNormalized: 3,
                applicantNormalized: 2,
                responderNormalized: 1,
                commentNormalized: 1,
                searchText: 1,
            },
        });

        return searchResults.map((result) => ({
            ...result,
            scoreLabel:
                typeof result.score === "number"
                    ? result.score.toFixed(2)
                    : null,
        }));
    }, [normalizedQuery, miniSearch, documents]);

    const renderSuggestion = ({ item }) => (
        <Pressable
            style={[styles.suggestionItem, { borderTopColor: palette.border }]}
            onPress={() => setQuery(item.suggestion)}
        >
            <Text style={[styles.suggestionText, { color: palette.text }]}>
                {item.suggestion}
            </Text>
        </Pressable>
    );

    const renderResult = ({ item }) => (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                },
            ]}
        >
            <View style={styles.metaRow}>
                {!!item.topic && (
                    <View
                        style={[
                            styles.badge,
                            { backgroundColor: palette.primarySoft },
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeText,
                                { color: palette.primary },
                            ]}
                        >
                            {item.topic}
                        </Text>
                    </View>
                )}

                {!!item.subtopic && (
                    <View
                        style={[
                            styles.badgeSecondary,
                            {
                                backgroundColor:
                                    theme === "light" ? "#f1f5f9" : "#1e293b",
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.badgeSecondaryText,
                                { color: palette.textSecondary },
                            ]}
                        >
                            {item.subtopic}
                        </Text>
                    </View>
                )}
            </View>

            {!!item.question && (
                <>
                    <Text
                        style={[styles.blockTitle, { color: palette.primary }]}
                    >
                        Вопрос
                    </Text>
                    <Text
                        style={[styles.questionText, { color: palette.text }]}
                    >
                        {item.question}
                    </Text>
                </>
            )}

            {!!item.answer && (
                <>
                    <Text
                        style={[styles.blockTitle, { color: palette.primary }]}
                    >
                        Ответ
                    </Text>
                    <Text
                        style={[
                            styles.answerText,
                            { color: palette.textSecondary },
                        ]}
                    >
                        {item.answer}
                    </Text>
                </>
            )}

            <View style={[styles.infoBox, { borderTopColor: palette.border }]}>
                {!!item.applicant && (
                    <Text
                        style={[styles.infoText, { color: palette.textMuted }]}
                    >
                        <Text
                            style={[styles.infoLabel, { color: palette.text }]}
                        >
                            Заявитель:
                        </Text>{" "}
                        {item.applicant}
                    </Text>
                )}

                {!!item.responder && (
                    <Text
                        style={[styles.infoText, { color: palette.textMuted }]}
                    >
                        <Text
                            style={[styles.infoLabel, { color: palette.text }]}
                        >
                            Отвечает:
                        </Text>{" "}
                        {item.responder}
                    </Text>
                )}

                {!!item.comment && (
                    <Text
                        style={[styles.infoText, { color: palette.textMuted }]}
                    >
                        <Text
                            style={[styles.infoLabel, { color: palette.text }]}
                        >
                            Комментарий:
                        </Text>{" "}
                        {item.comment}
                    </Text>
                )}

                {!!item.scoreLabel && (
                    <Text style={[styles.score, { color: palette.textMuted }]}>
                        Score: {item.scoreLabel}
                    </Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView
            style={[styles.safe, { backgroundColor: palette.background }]}
        >
            <View style={styles.container}>
                <Text style={[styles.title, { color: palette.text }]}>
                    Поиск по базе BZ
                </Text>

                <Text style={[styles.subtitle, { color: palette.textMuted }]}>
                    Поиск по вопросам, ответам, тематикам и подтематикам с
                    учетом опечаток
                </Text>

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Например: api, магистратура, сервис приема, индексация"
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

                {!!normalizedQuery && suggestions.length > 0 && (
                    <View
                        style={[
                            styles.suggestionsBox,
                            {
                                backgroundColor: palette.surface,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.suggestionsTitle,
                                { color: palette.primary },
                            ]}
                        >
                            Подсказки
                        </Text>

                        <FlatList
                            data={suggestions}
                            keyExtractor={(item, index) =>
                                `${item.suggestion}-${index}`
                            }
                            renderItem={renderSuggestion}
                            keyboardShouldPersistTaps="handled"
                        />
                    </View>
                )}

                <View style={styles.resultsHeader}>
                    <Text
                        style={[
                            styles.resultsTitle,
                            { color: palette.textSecondary },
                        ]}
                    >
                        {normalizedQuery
                            ? `Найдено: ${results.length}`
                            : `Всего записей: ${documents.length}`}
                    </Text>
                </View>

                <FlatList
                    data={results}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderResult}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View
                            style={[
                                styles.emptyBox,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.emptyTitle,
                                    { color: palette.text },
                                ]}
                            >
                                Ничего не найдено
                            </Text>
                            <Text
                                style={[
                                    styles.emptyText,
                                    { color: palette.textMuted },
                                ]}
                            >
                                Попробуйте другой запрос или выберите подсказку
                                выше
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
    subtitle: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 12,
    },
    suggestionsBox: {
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 14,
        overflow: "hidden",
    },
    suggestionsTitle: {
        fontSize: 13,
        fontWeight: "600",
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
    },
    suggestionItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
    },
    suggestionText: {
        fontSize: 14,
    },
    resultsHeader: { marginBottom: 10 },
    resultsTitle: {
        fontSize: 14,
        fontWeight: "600",
    },
    listContent: { paddingBottom: 24 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    badgeSecondary: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    badgeSecondaryText: {
        fontSize: 12,
        fontWeight: "600",
    },
    blockTitle: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        marginBottom: 6,
        marginTop: 4,
    },
    questionText: {
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 22,
        marginBottom: 12,
    },
    answerText: {
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 12,
    },
    infoBox: {
        borderTopWidth: 1,
        paddingTop: 10,
    },
    infoText: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 4,
    },
    infoLabel: {
        fontWeight: "700",
    },
    score: {
        fontSize: 12,
        marginTop: 8,
    },
    emptyBox: {
        borderRadius: 14,
        padding: 20,
        borderWidth: 1,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        lineHeight: 20,
    },
});
