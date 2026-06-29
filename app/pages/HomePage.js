import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
} from "react-native";
import { useTheme } from "../components/ThemeContext";

const TERM_GROUPS = [
    {
        key: "support",
        title: "Поддержка и сервис",
        color: "#FFE082",
        items: [
            ["1ЛТП", "Первая линия технической поддержки"],
            ["2ЛТП", "Вторая линия технической поддержки"],
            ["ЕКЦ", "Единый контакт‑центр"],
            ["CRM", "Система управления взаимоотношениями с клиентами"],
            ["IVR", "Интерактивное голосовое меню"],
            ["БЗ", "База знаний"],
            ["АРМ", "Автоматизированное рабочее место"],
            ["ПО", "Программное обеспечение"],
        ],
    },
    {
        key: "admission",
        title: "Приёмная кампания",
        color: "#FFCCBC",
        items: [
            ["ПК", "Приёмная кампания"],
            ["ВИ", "Вступительные испытания"],
            ["ДВИ", "Дополнительные вступительные испытания"],
            ["КЦП", "Контрольные цифры приёма"],
            ["СП", "Сервис приёма"],
            ["СС", "Суперсервис «Поступление в вуз онлайн»"],
            ["ССПВО", "Суперсервис «Поступление в вуз онлайн»"],
            ["ЕПГУ", "Единый портал государственных и муниципальных услуг"],
            ["РвР", "Работа в России"],
            [
                "ЛК ООВО",
                "Личный кабинет образовательной организации высшего образования",
            ],
        ],
    },
    {
        key: "education",
        title: "Образование и обучение",
        color: "#C8E6C9",
        items: [
            ["ООВО", "Образовательная организация высшего образования"],
            ["ОП", "Образовательная программа"],
            ["СПО", "Среднее профессиональное образование"],
            ["ЗФО", "Заочная форма обучения"],
            ["ОЗФО", "Очно‑заочная форма обучения"],
            ["УГСН", "Укрупнённые группы специальностей и направлений"],
            ["УГНС", "Укрупнённая группа научных специальностей"],
            ["НПС", "Направления профессиональных специальностей"],
            ["ВсОШ", "Всероссийская олимпиада школьников"],
            ["РСОШ", "Российский совет олимпиад школьников"],
        ],
    },
    {
        key: "docs",
        title: "Документы и реестры",
        color: "#B3E5FC",
        items: [
            ["ДОО", "Документ об образовании"],
            [
                "ФИС ФРДО",
                "Федеральная информационная система «Федеральный реестр сведений о документах об образовании и (или) о квалификации, документах об обучении»",
            ],
            [
                "ФИС ГИА",
                "Федеральная информационная система обеспечения проведения государственной итоговой аттестации",
            ],
            [
                "ЕИС ГА (ФИС ГНА)",
                "Единая информационная система государственной аттестации (Федеральная информационная система государственной научной аттестации)",
            ],
            [
                "ЕГИСМ",
                "Единая государственная информационная система мониторинга процессов аттестации научных и научно‑практических кадров высшей квалификации",
            ],
            ["ФЛК", "Форматно-логический контроль"],
            ["ЭЦП", "Электронная цифровая подпись"],
            ["ОКПО", "Общероссийский классификатор предприятий и организаций"],
            ["ФЗ", "Федеральный закон"],
        ],
    },
    {
        key: "security",
        title: "Безопасность и доступ",
        color: "#D1C4E9",
        items: [
            ["ЕСИА", "Единая система идентификации и аутентификации"],
            ["ПДн", "Персональные данные"],
            ["ИСПДн", "Информационная система персональных данных"],
            ["СПЗДн", "Система защиты персональных данных"],
            ["СЗИ", "Средство (−а) защиты информации"],
            [
                "ЗСПД",
                "Виртуальная защищённая сеть передачи данных, построенная на основе технологии виртуальных защищённых сетей ViPNet",
            ],
            ["ЗСПД 13833", "Защищённая сеть передачи данных № 13833"],
            ["ViPNet", "Технология защищённых виртуальных сетей"],
        ],
    },
    {
        key: "systems",
        title: "Системы и интеграции",
        color: "#FFF59D",
        items: [
            ["ИС", "Информационная система"],
            ["ГИС", "Государственная информационная система"],
            ["АТС", "Автоматическая телефонная станция"],
            ["API", "Application Programming Interface"],
            [
                "МФЦ",
                "Многофункциональный центр предоставления государственных и муниципальных услуг",
            ],
            [
                "РЦОИ",
                "Региональные центры обработки информации для общеобразовательных учреждений",
            ],
            [
                "РЦОИ",
                "Региональные центры обработки информации для общеобразовательных учреждений",
            ],
            ["РУМЦ", "Ресурсный учебно-методический центр"],
            [
                "ВСЦМ",
                "Ведомственный ситуационный центр Министерства науки и высшего образования Российской Федерации по мониторингу сферы образования и науки",
            ],
            ["ДЦР", "Департамент цифрового развития"],
            [
                "ФГАНУ «ЦИТИС»",
                "Федеральное государственное автономное научное учреждение «Центр информационных технологий и систем органов исполнительной власти»",
            ],
            ["МОН", "Министерство образования и науки"],
            ["ЕФТТ", "Единые функционально-технические требования"],
        ],
    },
    {
        key: "inclusion",
        title: "Инклюзия и особенности",
        color: "#F8BBD0",
        items: [
            ["ОВЗ", "Ограниченные возможности здоровья"],
            ["МСЭ", "Медико‑социальная экспертиза"],
            ["ИПРА", "Индивидуальная программа реабилитации и абилитации"],
        ],
    },
    {
        key: "planning",
        title: "Планирование и госуслуги",
        color: "#DCEDC8",
        items: [
            [
                "ГЗГУ",
                "Государственное задание на оказание государственных услуг",
            ],
        ],
    },
];

function TermCard({ title, color, items, dark }) {
    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: color,
                    shadowColor: dark ? "#000" : "#6b5f4a",
                },
            ]}
        >
            <View style={styles.pin} />
            <Text style={[styles.cardTitle, { color: "#2A241B" }]}>
                {title}
            </Text>

            {items.map(([abbr, text]) => (
                <View key={`${title}-${abbr}`} style={styles.termRow}>
                    <Text style={styles.abbr}>{abbr}</Text>
                    <Text style={styles.termText}>— {text}</Text>
                </View>
            ))}
        </View>
    );
}

export default function HomeScreen() {
    const { theme } = useTheme();
    const dark = theme === "dark";
    const { width } = useWindowDimensions();

    const columnsCount = width >= 1200 ? 3 : width >= 760 ? 2 : 1;

    const columns = useMemo(() => {
        const result = Array.from({ length: columnsCount }, () => []);

        TERM_GROUPS.forEach((group, index) => {
            result[index % columnsCount].push(group);
        });

        return result;
    }, [columnsCount]);

    return (
        <ScrollView
            style={[
                styles.screen,
                { backgroundColor: dark ? "#0f1115" : "#f4efe6" },
            ]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <Text
                style={[styles.badge, { color: dark ? "#d8c9a7" : "#7a5c2e" }]}
            >
                Шпаргалка по терминам
            </Text>

            <View style={styles.board}>
                {columns.map((column, columnIndex) => (
                    <View key={`column-${columnIndex}`} style={styles.column}>
                        {column.map((group) => (
                            <TermCard
                                key={group.key}
                                title={group.title}
                                color={group.color}
                                items={group.items}
                                dark={dark}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    content: {
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 16,
    },
    badge: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    board: {
        flexDirection: "row",
        gap: 14,
        alignItems: "flex-start",
    },
    column: {
        flex: 1,
        gap: 14,
    },
    card: {
        borderRadius: 18,
        paddingTop: 18,
        paddingHorizontal: 14,
        paddingBottom: 14,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 4,
        transform: [{ rotate: "-0.6deg" }],
        borderWidth: 1,
        borderColor: "rgba(60,40,20,0.08)",
    },
    pin: {
        position: "absolute",
        top: 10,
        right: 12,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#8D6E63",
        opacity: 0.9,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 12,
        paddingRight: 18,
    },
    termRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(40,30,20,0.12)",
    },
    abbr: {
        width: 88,
        fontSize: 13,
        fontWeight: "800",
        color: "#1f1a14",
    },
    termText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: "#2f2a24",
    },
});
