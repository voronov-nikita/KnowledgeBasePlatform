import React, { useMemo, useState } from "react";
import { View, TextInput, FlatList, Text } from "react-native";
import Fuse from "fuse.js";

const data = [
  {
    id: "1",
    title: "React Native Web",
    tags: ["react", "web"],
    description: "UI для web и mobile",
  },
  {
    id: "2",
    title: "MiniSearch",
    tags: ["search", "index"],
    description: "Локальный полнотекстовый поиск",
  },
];

export default function SearchScreen() {
  const [query, setQuery] = useState("");

  const fuse = useMemo(() => {
    return new Fuse(data, {
      includeScore: true,
      includeMatches: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "title", weight: 0.5 },
        { name: "tags", weight: 0.3 },
        { name: "description", weight: 0.2 },
      ],
    });
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return data;
    return fuse.search(query, { limit: 20 }).map((r) => r.item);
  }, [query, fuse]);

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Поиск"
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 10 }}>
            <Text>{item.title}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}
