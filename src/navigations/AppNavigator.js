import React from "react";
import {
    createDrawerNavigator,
    DrawerContentScrollView,
} from "@react-navigation/drawer";
import HomeScreen from "../pages/HomePage";
import SearchScreen from "../pages/SearchPage";
import PriemScreen from "../pages/PriemPage";
import { useTheme } from "../components/ThemeContext";
import { View, Text, StyleSheet, Switch, Pressable, TouchableOpacity } from "react-native";

const Drawer = createDrawerNavigator();

const menuItems = [
    { label: "Главная", route: "Home", icon: "⌂" },
    { label: "Поиск ответов", route: "Search", icon: "⌕" },
    { label: "Поиск контактов", route: "Priem", icon: "☎" },
];

export const CustomDrawerContent = (props) => {
    const { theme, toggleTheme } = useTheme();

    const isLight = theme === "light";
    const colors = {
        bg: isLight ? "#f8fafc" : "#0b1220",
        card: isLight ? "#ffffff" : "#111827",
        cardSoft: isLight ? "#f1f5f9" : "#172133",
        text: isLight ? "#0f172a" : "#f8fafc",
        muted: isLight ? "#64748b" : "#94a3b8",
        border: isLight ? "#e2e8f0" : "#243041",
        activeBg: isLight ? "#eaf2ff" : "#16253a",
        activeText: isLight ? "#1d4ed8" : "#93c5fd",
        accent: "#2563eb",
    };

    const currentRouteName = props.state.routeNames[props.state.index];

    return (
        <DrawerContentScrollView
            {...props}
            contentContainerStyle={[
                styles.scrollContainer,
                { backgroundColor: colors.bg },
            ]}
        >
            <View
                style={[
                    styles.headerCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                <TouchableOpacity>
                    <View
                        style={[
                            styles.logoBox,
                            { backgroundColor: colors.cardSoft },
                        ]}
                    >
                        <Text style={[styles.logoText, { color: colors.accent }]}>
                            ЕКЦ
                        </Text>
                    </View>
                </TouchableOpacity>

                <Text style={[styles.appTitle, { color: colors.text }]}>
                    Контакт-центр
                </Text>

                <Text style={[styles.appSubtitle, { color: colors.muted }]}>
                    Навигация по разделам
                </Text>
            </View>

            <View
                style={[
                    styles.menuCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                {menuItems.map((item) => {
                    const active = currentRouteName === item.route;

                    return (
                        <Pressable
                            key={item.route}
                            onPress={() => {
                                props.navigation.navigate(item.route);
                                props.navigation.closeDrawer();
                            }}
                            style={({ pressed }) => [
                                styles.drawerItem,
                                {
                                    backgroundColor: active
                                        ? colors.activeBg
                                        : pressed
                                        ? colors.cardSoft
                                        : "transparent",
                                    borderColor: active
                                        ? colors.activeBg
                                        : "transparent",
                                },
                            ]}
                        >
                            <View style={styles.drawerItemContent}>
                                <Text
                                    style={[
                                        styles.drawerIcon,
                                        {
                                            color: active
                                                ? colors.activeText
                                                : colors.muted,
                                        },
                                    ]}
                                >
                                    {item.icon}
                                </Text>

                                <View style={styles.drawerTextBox}>
                                    <Text
                                        style={[
                                            styles.drawerItemText,
                                            {
                                                color: active
                                                    ? colors.activeText
                                                    : colors.text,
                                                fontWeight: active
                                                    ? "700"
                                                    : "500",
                                            },
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            <View
                style={[
                    styles.themeCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View style={styles.themeTextBox}>
                    <Text style={[styles.themeTitle, { color: colors.text }]}>
                        Тёмная тема
                    </Text>
                    <Text
                        style={[styles.themeSubtitle, { color: colors.muted }]}
                    >
                        Переключение оформления
                    </Text>
                </View>

                <Switch
                    value={theme === "dark"}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#cbd5e1", true: "#60a5fa" }}
                    thumbColor={theme === "dark" ? "#1e3a8a" : "#ffffff"}
                />
            </View>
        </DrawerContentScrollView>
    );
};

export function AppNavigator() {
    const { theme } = useTheme();
    const isLight = theme === "light";

    return (
        <Drawer.Navigator
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: true,
                headerTitleAlign: "center",
                drawerType: "slide",
                drawerStyle: {
                    width: 296,
                    backgroundColor: isLight ? "#f8fafc" : "#0b1220",
                },
                sceneContainerStyle: {
                    backgroundColor: isLight ? "#ffffff" : "#0f1115",
                },
                headerStyle: {
                    backgroundColor: isLight ? "#ffffff" : "#111827",
                    shadowColor: "transparent",
                    elevation: 0,
                },
                headerTintColor: isLight ? "#0f172a" : "#f8fafc",
                headerTitleStyle: {
                    fontSize: 16,
                    fontWeight: "600",
                },
            }}
        >
            <Drawer.Screen
                name="Search"
                component={SearchScreen}
                options={{ title: "Поиск" }}
            />
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: "Главная" }}
            />
            <Drawer.Screen
                name="Priem"
                component={PriemScreen}
                options={{ title: "Контакты приемный комиссий" }}
            />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        padding: 12,
    },

    headerCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },

    logoBox: {
        width: 44,
        height: 44,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },

    logoText: {
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.4,
    },

    appTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 4,
    },

    appSubtitle: {
        fontSize: 12,
        lineHeight: 16,
    },

    menuCard: {
        borderRadius: 12,
        padding: 8,
        marginBottom: 12,
        borderWidth: 1,
    },

    drawerItem: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 4,
        borderWidth: 1,
    },

    drawerItemContent: {
        flexDirection: "row",
        alignItems: "center",
    },

    drawerIcon: {
        width: 20,
        fontSize: 16,
        marginRight: 10,
        textAlign: "center",
    },

    drawerTextBox: {
        flex: 1,
    },

    drawerItemText: {
        fontSize: 14,
        lineHeight: 18,
    },

    themeCard: {
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        marginTop: 4,
    },

    themeTextBox: {
        flex: 1,
        paddingRight: 12,
    },

    themeTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 2,
    },

    themeSubtitle: {
        fontSize: 11,
        lineHeight: 15,
    },
});
