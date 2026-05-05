import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    ScrollView,
    Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useTheme } from "../components/ThemeContext";
import rawDates from "../data/date.json";
import { getAppTheme } from "../components/appTheme";

function pad(value) {
    return String(value).padStart(2, "0");
}

function toDateKey(day, month, year) {
    return `${year}-${pad(month)}-${pad(day)}`;
}

function formatHumanDate(dateKey) {
    const [year, month, day] = dateKey.split("-");
    return `${day}.${month}.${year}`;
}

function formatMonthLabel(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric",
    });
}

function normalizeEvents(data) {
    if (!Array.isArray(data)) return [];

    return data
        .filter((item) => item?.day && item?.month && item?.year && item?.event)
        .map((item, index) => ({
            id: `${item.year}-${item.month}-${item.day}-${index}`,
            day: Number(item.day),
            month: Number(item.month),
            year: Number(item.year),
            event: String(item.event),
            tag: String(item.tag || "Событие"),
            dateKey: toDateKey(item.day, item.month, item.year),
        }));
}

function getTagColor(tag, palette) {
    const normalized = String(tag).toLowerCase();

    if (normalized.includes("лк")) return palette.primary;
    if (normalized.includes("пр")) return palette.success;
    if (normalized.includes("лаб")) return palette.purple;
    if (normalized.includes("встреч")) return palette.warning;

    return palette.primary;
}

export default function CalendarScreen() {
    const { theme } = useTheme();
    const palette = getAppTheme(theme);

    const initialEvents = useMemo(() => normalizeEvents(rawDates), []);
    const [customEvents, setCustomEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(
        initialEvents[0]?.dateKey ||
            toDateKey(
                new Date().getDate(),
                new Date().getMonth() + 1,
                new Date().getFullYear(),
            ),
    );

    const [visibleMonth, setVisibleMonth] = useState(selectedDate);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [formDay, setFormDay] = useState("");
    const [formMonth, setFormMonth] = useState("");
    const [formYear, setFormYear] = useState("");
    const [formEvent, setFormEvent] = useState("");
    const [formTag, setFormTag] = useState("");

    const allEvents = useMemo(
        () => [...initialEvents, ...customEvents],
        [initialEvents, customEvents],
    );

    const groupedEvents = useMemo(() => {
        return allEvents.reduce((acc, item) => {
            if (!acc[item.dateKey]) acc[item.dateKey] = [];
            acc[item.dateKey].push(item);
            return acc;
        }, {});
    }, [allEvents]);

    const selectedEvents = groupedEvents[selectedDate] || [];

    const markedDates = useMemo(() => {
        const result = {};

        Object.keys(groupedEvents).forEach((dateKey) => {
            result[dateKey] = {
                marked: true,
                dotColor: palette.primary,
            };
        });

        result[selectedDate] = {
            ...(result[selectedDate] || {}),
            selected: true,
            marked: true,
            selectedColor: palette.primary,
            selectedTextColor: "#ffffff",
            dotColor: "#bfdbfe",
        };

        return result;
    }, [groupedEvents, selectedDate, palette.primary]);

    const handleAddEvent = () => {
        const day = Number(formDay);
        const month = Number(formMonth);
        const year = Number(formYear);

        if (!day || !month || !year || !formEvent.trim()) return;

        const dateKey = toDateKey(day, month, year);

        const newItem = {
            id: `${dateKey}-${Date.now()}`,
            day,
            month,
            year,
            event: formEvent.trim(),
            tag: formTag.trim() || "Событие",
            dateKey,
        };

        setCustomEvents((prev) => [...prev, newItem]);
        setSelectedDate(dateKey);
        setVisibleMonth(dateKey);

        setFormDay("");
        setFormMonth("");
        setFormYear("");
        setFormEvent("");
        setFormTag("");
        setIsModalVisible(false);
    };

    const calendarTheme = {
        backgroundColor: palette.surfaceSecondary,
        calendarBackground: palette.surfaceSecondary,
        textSectionTitleColor: palette.textMuted,
        selectedDayBackgroundColor: palette.primary,
        selectedDayTextColor: "#ffffff",
        todayTextColor: palette.primary,
        dayTextColor: palette.text,
        textDisabledColor: theme === "light" ? "#cbd5e1" : "#475569",
        dotColor: palette.primary,
        selectedDotColor: "#ffffff",
        arrowColor: palette.text,
        monthTextColor: palette.text,
        indicatorColor: palette.primary,
        textDayFontSize: 14,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 12,
        textDayFontWeight: "500",
        textMonthFontWeight: "700",
        textDayHeaderFontWeight: "600",
        "stylesheet.calendar.header": {
            header: {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingTop: 6,
                marginBottom: 10,
            },
            week: {
                marginTop: 6,
                flexDirection: "row",
                justifyContent: "space-around",
                borderTopWidth: 1,
                borderTopColor: palette.border,
                paddingTop: 12,
            },
            dayHeader: {
                width: 32,
                textAlign: "center",
                color: palette.textMuted,
                fontSize: 12,
                fontWeight: "600",
            },
        },
    };

    return (
        <>
            <ScrollView
                style={[styles.screen, { backgroundColor: palette.background }]}
                contentContainerStyle={styles.screenContent}
            >
                <Text
                    style={[styles.pageCaption, { color: palette.textMuted }]}
                >
                    Журнал студента
                </Text>

                <View
                    style={[
                        styles.wrapper,
                        {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                        },
                    ]}
                >
                    <Text style={[styles.title, { color: palette.text }]}>
                        Календарь мероприятий
                    </Text>

                    <View style={styles.contentRow}>
                        <View style={styles.leftColumn}>
                            <Text
                                style={[
                                    styles.metaLabel,
                                    { color: palette.textMuted },
                                ]}
                            >
                                Календарь
                            </Text>

                            <View
                                style={[
                                    styles.calendarShell,
                                    {
                                        backgroundColor:
                                            palette.surfaceSecondary,
                                        borderColor: palette.border,
                                    },
                                ]}
                            >
                                <Calendar
                                    current={visibleMonth}
                                    markedDates={markedDates}
                                    onDayPress={(day) =>
                                        setSelectedDate(day.dateString)
                                    }
                                    onMonthChange={(month) =>
                                        setVisibleMonth(
                                            `${month.year}-${pad(month.month)}-01`,
                                        )
                                    }
                                    theme={calendarTheme}
                                    hideExtraDays={false}
                                    enableSwipeMonths
                                    firstDay={1}
                                    hideArrows={false}
                                    renderHeader={(date) => (
                                        <View
                                            style={styles.calendarHeaderCustom}
                                        >
                                            <Text
                                                style={[
                                                    styles.calendarHeaderTitle,
                                                    { color: palette.text },
                                                ]}
                                            >
                                                {formatMonthLabel(date)}
                                            </Text>
                                        </View>
                                    )}
                                    style={styles.calendar}
                                />
                            </View>
                        </View>

                        <View style={styles.rightColumn}>
                            <View style={styles.eventsHero}>
                                <View>
                                    <Text
                                        style={[
                                            styles.eventsLabel,
                                            { color: palette.textMuted },
                                        ]}
                                    >
                                        Мероприятия на дату
                                    </Text>
                                    <Text
                                        style={[
                                            styles.selectedDateTitle,
                                            { color: palette.text },
                                        ]}
                                    >
                                        {formatHumanDate(selectedDate)}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.counterBadge,
                                        {
                                            backgroundColor:
                                                palette.primarySoft,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.counterBadgeText,
                                            { color: palette.primary },
                                        ]}
                                    >
                                        {selectedEvents.length}
                                    </Text>
                                </View>
                            </View>

                            {selectedEvents.length === 0 ? (
                                <View
                                    style={[
                                        styles.emptyBox,
                                        {
                                            backgroundColor:
                                                palette.surfaceSecondary,
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
                                        Пусто
                                    </Text>
                                    <Text
                                        style={[
                                            styles.emptyText,
                                            { color: palette.textMuted },
                                        ]}
                                    >
                                        Для этой даты пока нет мероприятий.
                                        Добавь новое через кнопку "+"
                                    </Text>
                                </View>
                            ) : (
                                selectedEvents.map((item) => (
                                    <View
                                        key={item.id}
                                        style={[
                                            styles.eventCard,
                                            {
                                                backgroundColor: palette.card,
                                                borderColor: palette.border,
                                            },
                                        ]}
                                    >
                                        <View style={styles.eventTopRow}>
                                            <Text
                                                style={[
                                                    styles.eventDate,
                                                    {
                                                        color: palette.textMuted,
                                                    },
                                                ]}
                                            >
                                                {formatHumanDate(item.dateKey)}
                                            </Text>

                                            <View
                                                style={[
                                                    styles.tagBadge,
                                                    {
                                                        backgroundColor:
                                                            getTagColor(
                                                                item.tag,
                                                                palette,
                                                            ),
                                                    },
                                                ]}
                                            >
                                                <Text style={styles.tagText}>
                                                    {item.tag}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text
                                            style={[
                                                styles.eventTitle,
                                                { color: palette.text },
                                            ]}
                                        >
                                            {item.event}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            <Pressable
                onPress={() => {
                    const [year, month, day] = selectedDate.split("-");
                    setFormDay(day);
                    setFormMonth(month);
                    setFormYear(year);
                    setIsModalVisible(true);
                }}
                style={({ pressed }) => [
                    styles.fab,
                    {
                        backgroundColor: pressed ? "#1d4ed8" : palette.primary,
                    },
                ]}
            >
                <Text style={styles.fabText}>+</Text>
            </Pressable>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View
                    style={[
                        styles.modalOverlay,
                        { backgroundColor: palette.modalOverlay },
                    ]}
                >
                    <View
                        style={[
                            styles.modalCard,
                            {
                                backgroundColor: palette.surface,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text
                                style={[
                                    styles.modalTitle,
                                    { color: palette.text },
                                ]}
                            >
                                Добавить мероприятие
                            </Text>

                            <Pressable onPress={() => setIsModalVisible(false)}>
                                <Text
                                    style={[
                                        styles.closeText,
                                        { color: palette.textMuted },
                                    ]}
                                >
                                    Закрыть
                                </Text>
                            </Pressable>
                        </View>

                        <View style={styles.dateInputsRow}>
                            <TextInput
                                value={formDay}
                                onChangeText={setFormDay}
                                placeholder="День"
                                placeholderTextColor={palette.textMuted}
                                keyboardType="numeric"
                                style={[
                                    styles.smallInput,
                                    {
                                        backgroundColor:
                                            palette.inputBackground,
                                        borderColor: palette.inputBorder,
                                        color: palette.text,
                                    },
                                ]}
                            />
                            <TextInput
                                value={formMonth}
                                onChangeText={setFormMonth}
                                placeholder="Месяц"
                                placeholderTextColor={palette.textMuted}
                                keyboardType="numeric"
                                style={[
                                    styles.smallInput,
                                    {
                                        backgroundColor:
                                            palette.inputBackground,
                                        borderColor: palette.inputBorder,
                                        color: palette.text,
                                    },
                                ]}
                            />
                            <TextInput
                                value={formYear}
                                onChangeText={setFormYear}
                                placeholder="Год"
                                placeholderTextColor={palette.textMuted}
                                keyboardType="numeric"
                                style={[
                                    styles.smallInput,
                                    {
                                        backgroundColor:
                                            palette.inputBackground,
                                        borderColor: palette.inputBorder,
                                        color: palette.text,
                                    },
                                ]}
                            />
                        </View>

                        <TextInput
                            value={formEvent}
                            onChangeText={setFormEvent}
                            placeholder="Название мероприятия"
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

                        <TextInput
                            value={formTag}
                            onChangeText={setFormTag}
                            placeholder="Тег / тематика"
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

                        <Pressable
                            onPress={handleAddEvent}
                            style={({ pressed }) => [
                                styles.addButton,
                                {
                                    backgroundColor: pressed
                                        ? "#1d4ed8"
                                        : palette.primary,
                                },
                            ]}
                        >
                            <Text style={styles.addButtonText}>Сохранить</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1 },
    screenContent: { padding: 20, paddingBottom: 110 },
    pageCaption: { fontSize: 16, marginBottom: 14, marginLeft: 4 },
    wrapper: { borderRadius: 22, padding: 20, borderWidth: 1 },
    title: { fontSize: 24, fontWeight: "700", marginBottom: 18 },

    contentRow: {
        flexDirection: "row",
        gap: 18,
        alignItems: "flex-start",
    },

    leftColumn: {
        width: "33%",
    },

    rightColumn: {
        width: "65%",
    },

    metaLabel: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 10,
    },

    calendarShell: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 10,
    },

    calendar: {},

    calendarHeaderCustom: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 4,
    },

    calendarHeaderTitle: {
        fontSize: 20,
        fontWeight: "700",
        textTransform: "capitalize",
    },

    eventsHero: {
        minHeight: 88,
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "transparent",
    },

    eventsLabel: {
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },

    selectedDateTitle: {
        fontSize: 30,
        fontWeight: "800",
    },

    counterBadge: {
        minWidth: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
    },

    counterBadgeText: {
        fontWeight: "800",
        fontSize: 16,
    },

    emptyBox: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 18,
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

    eventCard: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 18,
        marginBottom: 12,
    },

    eventTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    eventDate: {
        fontSize: 14,
        fontWeight: "500",
    },

    tagBadge: {
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },

    tagText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
    },

    eventTitle: {
        fontSize: 20,
        fontWeight: "600",
        lineHeight: 28,
    },

    fab: {
        position: "absolute",
        right: 24,
        bottom: 28,
        width: 62,
        height: 62,
        borderRadius: 31,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },

    fabText: {
        color: "#fff",
        fontSize: 34,
        lineHeight: 34,
        fontWeight: "500",
        marginTop: -2,
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },

    modalCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 18,
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
    },

    closeText: {
        fontSize: 15,
        fontWeight: "600",
    },

    dateInputsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },

    smallInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
    },

    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 15,
        marginBottom: 10,
    },

    addButton: {
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 4,
    },

    addButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
});
