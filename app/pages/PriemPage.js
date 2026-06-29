import React, { useEffect, useMemo, useState } from "react";
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
    Platform,
    ScrollView,
} from "react-native";
import MiniSearch from "minisearch";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../components/ThemeContext";
import { getAppTheme } from "../components/appTheme";
import fallbackJsonData from "../data/organizations.json";


async function copyToClipboard(value, label = "Скопировано") {
    if (!value) return;

    try {
        await Clipboard.setStringAsync(String(value));
        Alert.alert("Скопировано", label);
    } catch (err) {
        console.error("Clipboard error:", err);
    }
}

const GOOGLE_SHEET_CSV_URL =
    "https://docs.google.com/spreadsheets/d/16IkNcwN_ppdaoOAMkoJyiNaqgHpXeNYX6NQvHYmNLuU/export?format=csv&gid=543314256";

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
        item?.["Наименование организации"] ||
        item?.["ОГРН"] ||
        item?.["Регион"] ||
        item?.["Город"] ||
        item?.["Адрес"]
    );
}

function prepareDocuments(list) {
    return list
        .filter((item) => !isEmptyRow(item))
        .map((item, index) => {
            const founder = item?.["Учредитель"] ?? "";
            const iasId = item?.["ID ИАС"] ?? "";
            const organization = item?.["Наименование организации"] ?? "";
            const ogrn = item?.["ОГРН"] ?? "";
            const orgType = item?.["Тип организации"] ?? "";
            const district = item?.["Федеральный округ"] ?? "";
            const region = item?.["Регион"] ?? "";
            const city = item?.["Город"] ?? "";
            const address = item?.["Адрес"] ?? "";
            const workSchedule =
                item?.["График работы прямого номера телефона"] ?? "";
            const phone =
                item?.[
                    "Прямой номер телефона приемной комиссии для переадресации звонков, полученных от поступающих на номер Единого контактного центра"
                ] ?? "";
            const email =
                item?.[
                    "Адрес электронной почты приемной комиссии для принятия тикетов от Единого контактного центра"
                ] ?? "";
            const timezone = item?.["часовой пояс"] ?? "";

            return {
                id: String(index + 1),
                founder,
                iasId,
                organization,
                ogrn,
                orgType,
                district,
                region,
                city,
                address,
                workSchedule,
                phone,
                email,
                timezone,
                searchText: normalizeText(
                    [
                        founder,
                        iasId,
                        organization,
                        ogrn,
                        orgType,
                        district,
                        region,
                        city,
                        address,
                        workSchedule,
                        phone,
                        email,
                        timezone,
                    ].join(" ")
                ),
            };
        });
}

export default function OrganizationsSearchPage() {
    const { theme } = useTheme();
    const palette = getAppTheme(theme);

    const [query, setQuery] = useState("");
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [fallbackWarning, setFallbackWarning] = useState("");

    const [selectedRegion, setSelectedRegion] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                setLoading(true);
                setError("");
                setFallbackWarning("");

                try {
                    const response = await fetch(GOOGLE_SHEET_CSV_URL);

                    if (!response.ok) {
                        throw new Error(`HTTP error: ${response.status}`);
                    }

                    const csvText = await response.text();

                    const parsed = Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                    });

                    const rows = Array.isArray(parsed.data)
                        ? parsed.data
                        : [];

                    if (!rows.length) {
                        throw new Error("Google Sheets returned empty data");
                    }

                    if (isMounted) setRawData(rows);
                } catch (googleError) {
                    console.warn("Google Sheets load failed:", googleError);

                    const jsonData = Array.isArray(fallbackJsonData)
                        ? fallbackJsonData
                        : [];

                    if (!jsonData.length) {
                        throw new Error("Fallback JSON is empty");
                    }

                    if (isMounted) {
                        setRawData(jsonData);
                        setFallbackWarning(
                            "Не удалось загрузить актуальные данные из Google Sheets. Показана локальная версия JSON."
                        );
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError(
                        "Не удалось загрузить данные ни из Google Sheets, ни из локального JSON"
                    );
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    const documents = useMemo(() => prepareDocuments(rawData), [rawData]);

    const miniSearch = useMemo(() => {
        const ms = new MiniSearch({
            fields: ["searchText"],
            storeFields: [
                "id",
                "founder",
                "iasId",
                "organization",
                "ogrn",
                "orgType",
                "district",
                "region",
                "city",
                "address",
                "workSchedule",
                "phone",
                "email",
                "timezone",
            ],
            processTerm: (term) => normalizeText(term),
        });

        ms.addAll(documents);
        return ms;
    }, [documents]);

    const normalizedQuery = useMemo(
        () => normalizeText(query),
        [query]
    );

    const regions = useMemo(() => {
        return [...new Set(documents.map((x) => x.region).filter(Boolean))].sort();
    }, [documents]);

    const cities = useMemo(() => {
        return [...new Set(documents.map((x) => x.city).filter(Boolean))].sort();
    }, [documents]);

    const results = useMemo(() => {
        let filtered = documents;

        if (selectedRegion) {
            filtered = filtered.filter(
                (item) => item.region === selectedRegion
            );
        }

        if (selectedCity) {
            filtered = filtered.filter(
                (item) => item.city === selectedCity
            );
        }

        if (!normalizedQuery) return filtered;

        const searchResults = miniSearch.search(normalizedQuery, {
            prefix: true,
            fuzzy: 0.2,
            combineWith: "AND",
        });

        return searchResults.filter((result) => {
            const regionMatch = selectedRegion
                ? result.region === selectedRegion
                : true;

            const cityMatch = selectedCity
                ? result.city === selectedCity
                : true;

            return regionMatch && cityMatch;
        });
    }, [
        normalizedQuery,
        miniSearch,
        documents,
        selectedRegion,
        selectedCity,
    ]);

    const handleExportExcel = () => {
        try {
            const exportData = documents.map((item) => ({
                Учредитель: item.founder,
                // "ID ИАС": item.iasId,
                "Наименование организации": item.organization,
                // ОГРН: item.ogrn,
                "Тип организации": item.orgType,
                // "Федеральный округ": item.district,
                Регион: item.region,
                Город: item.city,
                Адрес: item.address,
                "График работы": item.workSchedule,
                Телефон: item.phone,
                Email: item.email,
                "Часовой пояс": item.timezone,
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(workbook, worksheet, "Организации");
            XLSX.writeFile(workbook, "organizations.xlsx");

            if (Platform.OS !== "web") {
                Alert.alert("Экспорт", "Excel-файл успешно подготовлен");
            }
        } catch (err) {
            Alert.alert("Ошибка", "Не удалось выгрузить Excel");
        }
    };

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
            <Text style={[styles.orgTitle, { color: palette.text }]}>
                {item.organization}
            </Text>

            <View style={styles.badges}>
                {!!item.orgType && (
                    <View style={[styles.badge, { backgroundColor: palette.primarySoft }]}>
                        <Text style={[styles.badgeText, { color: palette.primary }]}>
                            {item.orgType}
                        </Text>
                    </View>
                )}

                {!!item.region && (
                    <View
                        style={[
                            styles.badgeSecondary,
                            {
                                backgroundColor:
                                    theme === "light" ? "#f1f5f9" : "#1e293b",
                            },
                        ]}
                    >
                        <Text style={[styles.badgeSecondaryText, { color: palette.textSecondary }]}>
                            {item.region}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.infoBox}>
                <InfoRow label="Учредитель" value={item.founder} palette={palette} />
                {/* <InfoRow label="ID ИАС" value={item.iasId} palette={palette} /> */}
                {/* <InfoRow label="ОГРН" value={item.ogrn} palette={palette} /> */}
                <InfoRow label="Федеральный округ" value={item.district} palette={palette} />
                <InfoRow label="Город" value={item.city} palette={palette} />
                <InfoRow label="Адрес" value={item.address} palette={palette} />

                {/* CLICKABLE FIELDS */}
                {!!item.workSchedule && (
                    <Pressable
                        onPress={() =>
                            copyToClipboard(item.workSchedule, "График работы скопирован")
                        }
                    >
                        <Text style={[styles.copyField, { color: palette.primary }]}>
                            🕒 {item.workSchedule}
                        </Text>
                    </Pressable>
                )}

                {!!item.phone && (
                    <Pressable
                        onPress={() =>
                            copyToClipboard(item.phone, "Телефон скопирован")
                        }
                    >
                        <Text style={[styles.copyField, { color: palette.primary }]}>
                            📞 {item.phone}
                        </Text>
                    </Pressable>
                )}

                {!!item.email && (
                    <Pressable
                        onPress={() =>
                            copyToClipboard(item.email, "Email скопирован")
                        }
                    >
                        <Text style={[styles.copyField, { color: palette.primary }]}>
                            ✉️ {item.email}
                        </Text>
                    </Pressable>
                )}

                <InfoRow label="Часовой пояс" value={item.timezone} palette={palette} />
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color={palette.primary} />
                    <Text style={[styles.loadingText, { color: palette.textMuted }]}>
                        Загрузка данных...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
                <View style={[styles.container, styles.centered]}>
                    <Text style={[styles.emptyTitle, { color: palette.text }]}>
                        Ошибка загрузки
                    </Text>
                    <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                        {error}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: palette.text }]}>
                        Организации
                    </Text>

                    <Pressable
                        onPress={handleExportExcel}
                        style={styles.exportButton}
                    >
                        <Text style={styles.exportButtonText}>
                            Выгрузка Excel
                        </Text>
                    </Pressable>
                </View>

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Поиск..."
                    placeholderTextColor={palette.textMuted}
                    style={[
                        styles.input,
                        {
                            backgroundColor: palette.inputBackground,
                            borderColor: palette.inputBorder,
                            color: palette.text,
                        },
                    ]}
                />

                {/* FILTER BUTTON */}
                <Pressable
                    onPress={() => setShowFilters(!showFilters)}
                    style={[
                        styles.filterButton,
                        { backgroundColor: palette.primarySoft },
                    ]}
                >
                    <Text style={[styles.filterButtonText, { color: palette.primary }]}>
                        {showFilters ? "Скрыть фильтры" : "Фильтр"}
                    </Text>
                </Pressable>

                {/* FILTERS */}
                {showFilters && (
                    <View style={styles.filtersContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <Pressable
                                onPress={() => setSelectedRegion("")}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: !selectedRegion
                                            ? palette.primary
                                            : palette.surface,
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        color: !selectedRegion ? "#fff" : palette.text,
                                    }}
                                >
                                    Все регионы
                                </Text>
                            </Pressable>

                            {regions.map((region) => (
                                <Pressable
                                    key={region}
                                    onPress={() => setSelectedRegion(region)}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor:
                                                selectedRegion === region
                                                    ? palette.primary
                                                    : palette.surface,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color:
                                                selectedRegion === region
                                                    ? "#fff"
                                                    : palette.text,
                                        }}
                                    >
                                        {region}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <Pressable
                                onPress={() => setSelectedCity("")}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: !selectedCity
                                            ? palette.primary
                                            : palette.surface,
                                    },
                                ]}
                            >
                                <Text style={{ color: !selectedCity ? "#fff" : palette.text }}>
                                    Все города
                                </Text>
                            </Pressable>

                            {cities.map((city) => (
                                <Pressable
                                    key={city}
                                    onPress={() => setSelectedCity(city)}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor:
                                                selectedCity === city
                                                    ? palette.primary
                                                    : palette.surface,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color:
                                                selectedCity === city
                                                    ? "#fff"
                                                    : palette.text,
                                        }}
                                    >
                                        {city}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {!!fallbackWarning && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>{fallbackWarning}</Text>
                    </View>
                )}

                <Text style={[styles.resultsCount, { color: palette.textSecondary }]}>
                    {normalizedQuery
                        ? `Найдено: ${results.length}`
                        : `Всего организаций: ${documents.length}`}
                </Text>

                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderResult}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        </SafeAreaView>
    );
}

function InfoRow({ label, value, palette }) {
    if (!value) return null;

    return (
        <Text style={[styles.infoText, { color: palette.textMuted }]}>
            <Text style={[styles.infoLabel, { color: palette.text }]}>
                {label}:
            </Text>{" "}
            {value}
        </Text>
    );
}

/* =========================
   STYLES (ADDED PARTS INCLUDED)
========================= */
const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    title: { fontSize: 28, fontWeight: "700" },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 10,
    },

    /* FILTERS */
    filterButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 12,
        alignSelf: "flex-start",
    },
    filterButtonText: {
        fontWeight: "700",
        fontSize: 14,
    },
    filtersContainer: {
        marginBottom: 14,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
    },

    /* COPY FIELD */
    copyField: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 8,
        fontWeight: "600",
    },

    exportButton: {
        backgroundColor: "#16a34a",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    exportButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },

    loadingText: { marginTop: 12 },
    warningBox: {
        backgroundColor: "#fff7ed",
        borderWidth: 1,
        borderColor: "#f59e0b",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    warningText: { fontSize: 13, color: "#92400e" },
    resultsCount: { marginBottom: 12, fontSize: 14, fontWeight: "600" },
    listContent: { paddingBottom: 40 },

    card: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    orgTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
    badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeText: { fontSize: 12, fontWeight: "700" },
    badgeSecondary: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeSecondaryText: { fontSize: 12, fontWeight: "600" },

    infoBox: { gap: 6 },
    infoText: { fontSize: 14, lineHeight: 20 },
    infoLabel: { fontWeight: "700" },

    emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: "center" },
});