import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import MiniSearch from 'minisearch';
import rawData from './data/Baza-znanii_Лист1';

function normalizeText(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isEmptyRow(item) {
  return !(
    item?.['Заявитель'] ||
    item?.['Тематика'] ||
    item?.['Подтематика'] ||
    item?.['Вопрос'] ||
    item?.['Отвечает'] ||
    item?.['Ответ для первой линии поддержки'] ||
    item?.['Комментарий']
  );
}

function prepareDocuments(list) {
  return list
    .filter((item) => !isEmptyRow(item))
    .map((item, index) => {
      const applicant = item?.['Заявитель'] ?? '';
      const topic = item?.['Тематика'] ?? '';
      const subtopic = item?.['Подтематика'] ?? '';
      const question = item?.['Вопрос'] ?? '';
      const responder = item?.['Отвечает'] ?? '';
      const answer = item?.['Ответ для первой линии поддержки'] ?? '';
      const comment = item?.['Комментарий'] ?? '';

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
          ].join(' ')
        ),
      };
    });
}

export default function App() {
  const [query, setQuery] = useState('');

  const documents = useMemo(() => prepareDocuments(rawData), []);

  const miniSearch = useMemo(() => {
    const ms = new MiniSearch({
      fields: [
        'applicantNormalized',
        'topicNormalized',
        'subtopicNormalized',
        'questionNormalized',
        'responderNormalized',
        'answerNormalized',
        'commentNormalized',
        'searchText',
      ],
      storeFields: [
        'id',
        'applicant',
        'topic',
        'subtopic',
        'question',
        'responder',
        'answer',
        'comment',
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
        combineWith: 'AND',
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
      combineWith: 'AND',
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
        typeof result.score === 'number' ? result.score.toFixed(2) : null,
    }));
  }, [normalizedQuery, miniSearch, documents]);

  const renderSuggestion = ({ item }) => (
    <Pressable
      style={styles.suggestionItem}
      onPress={() => setQuery(item.suggestion)}
    >
      <Text style={styles.suggestionText}>{item.suggestion}</Text>
    </Pressable>
  );

  const renderResult = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        {!!item.topic && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.topic}</Text>
          </View>
        )}

        {!!item.subtopic && (
          <View style={styles.badgeSecondary}>
            <Text style={styles.badgeSecondaryText}>{item.subtopic}</Text>
          </View>
        )}
      </View>

      {!!item.question && (
        <>
          <Text style={styles.blockTitle}>Вопрос</Text>
          <Text style={styles.questionText}>{item.question}</Text>
        </>
      )}

      {!!item.answer && (
        <>
          <Text style={styles.blockTitle}>Ответ</Text>
          <Text style={styles.answerText}>{item.answer}</Text>
        </>
      )}

      <View style={styles.infoBox}>
        {!!item.applicant && (
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Заявитель: </Text>
            {item.applicant}
          </Text>
        )}

        {!!item.responder && (
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Отвечает: </Text>
            {item.responder}
          </Text>
        )}

        {!!item.comment && (
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Комментарий: </Text>
            {item.comment}
          </Text>
        )}

        {!!item.scoreLabel && (
          <Text style={styles.score}>Score: {item.scoreLabel}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Поиск по базе BZ</Text>
        <Text style={styles.subtitle}>
          Поиск по вопросам, ответам, тематикам и подтематикам с учетом опечаток
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Например: api, магистратура, сервис приема, индексаця"
          placeholderTextColor="#8a8f98"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!!normalizedQuery && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestionsTitle}>Подсказки</Text>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.suggestion}-${index}`}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
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
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Ничего не найдено</Text>
              <Text style={styles.emptyText}>
                Попробуйте более короткий запрос, другое слово или выберите
                подсказку выше
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#a9b1bd',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#171a21',
    borderColor: '#2b3240',
    borderWidth: 1,
    color: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  suggestionsBox: {
    backgroundColor: '#151922',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#263041',
    marginBottom: 14,
    overflow: 'hidden',
  },
  suggestionsTitle: {
    color: '#7dd3fc',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#202838',
  },
  suggestionText: {
    color: '#e8edf5',
    fontSize: 14,
  },
  resultsHeader: {
    marginBottom: 10,
  },
  resultsTitle: {
    color: '#c7d0dc',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#151922',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263041',
    padding: 14,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#123246',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeSecondary: {
    backgroundColor: '#202738',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeSecondaryText: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '600',
  },
  blockTitle: {
    color: '#8fb7ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  answerText: {
    color: '#cfd8e3',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  infoBox: {
    borderTopWidth: 1,
    borderTopColor: '#202838',
    paddingTop: 10,
  },
  infoText: {
    color: '#9eacbd',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  infoLabel: {
    color: '#d9e2ec',
    fontWeight: '700',
  },
  score: {
    color: '#7f8ea3',
    fontSize: 12,
    marginTop: 8,
  },
  emptyBox: {
    backgroundColor: '#151922',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#263041',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: '#a9b1bd',
    fontSize: 14,
    lineHeight: 20,
  },
});