import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";


import { logo, URL, contact_URL } from "../config";

export const AuthScreen = ({ navigation }) => {
    const { width } = Dimensions.get("window");
    const mainBlockWidth = width < 420 ? "88%" : 400;

    const [message, setMessage] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);

    // Проверка наличия токена (или флага входа) при монтировании
    useEffect(() => {
        const checkAuthToken = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                const expiresAt = await AsyncStorage.getItem("expiresAt");
                if (token && expiresAt && Date.now() < Number(expiresAt)) {
                    // Сброс стека (навсегда убрать логин из истории)
                    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
                }
            } catch (e) {
                console.log("Ошибка", e);
            }
            setLoading(false);
        };
        checkAuthToken();
    }, []);

    // перевод пользователя на страницу с контактами
    const openContactPage = () => {
        Linking.openURL(contact_URL).catch((err) =>
            console.error("Ошибка при открытии URL:", err)
        );
    };

    // Вход пользователя (пример, как возвращается токен)
    const sendDataToServerAuth = async () => {
        if (!login || !password) {
            setMessage("Введите логин и пароль");
            return;
        }
        if (login == "ECC" && password == "ECC"){
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        }
        // ПРИМЕР ЗАПРОСА ДЛЯ ТЕСТИРОВАНИЯ 
        // try {
        //     const response = await fetch(`${URL}/login`, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({ login, password }),
        //         // support_credentials: true,
        //         // credentials: 'include'
        //     });
        //     const data = await response.json();

        //     if (response.ok && data) {
        //         setMessage("");
        //         // Сохраняем флаг авторизации (лучше токен, если есть)
        //         await AsyncStorage.setItem("authToken", login);
        //         await AsyncStorage.setItem(
        //             "expiresAt",
        //             String(Date.now() + 3 * 24 * 3600 * 1000)
        //         );
        //         await AsyncStorage.setItem("access_level", data.access_level);
        //         // Сброс всей истории навигации, чтобы нельзя было вернуться назад
        //         navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        //     } else {
        //         setMessage(data.error || "Ошибка авторизации");
        //     }
        // } catch (e) {
        //     setMessage("Ошибка соединения с сервером");
        // }
    };

    if (loading) return null;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1, width: "100%" }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={[styles.mainBlock, { width: mainBlockWidth }]}>
                    <Image
                        source={logo}
                        resizeMode="contain"
                        style={{
                            width: 110,
                            height: 110,
                            alignSelf: "center",
                            marginBottom: 15,
                        }}
                    />
                    <Text style={styles.title}>Авторизация</Text>
                    <Text style={styles.topText}>{message}</Text>

                    <TextInput
                        style={styles.textInput}
                        placeholder="Логин"
                        keyboardType="login"
                        autoCapitalize="none"
                        value={login}
                        onChangeText={setLogin}
                        returnKeyType="next"
                    />
                    <View style={styles.passBlock}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Пароль"
                            autoCapitalize="none"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="done"
                        />
                        <MaterialCommunityIcons
                            name={showPassword ? "eye-off" : "eye"}
                            size={28}
                            color="#aaa"
                            style={styles.icon}
                            onPress={() => setShowPassword((v) => !v)}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={sendDataToServerAuth}
                    >
                        <MaterialCommunityIcons
                            name="lock"
                            color="#fff"
                            size={20}
                            style={{ marginRight: 8 }}
                        />
                        <Text style={styles.buttonText}>Войти</Text>
                    </TouchableOpacity>

                    <View style={styles.recoverLinks}>
                        <Text style={styles.recoverTitle}>
                            Восстановление пароля:{"\n"}Для восстановления
                            пароля обратитесь к администратору
                        </Text>
                    </View>
                </View>
                <View style={styles.footer}>
                    <TouchableOpacity onPress={openContactPage}>
                        <Text style={styles.footerLink}>
                            <MaterialCommunityIcons
                                name="shield"
                                size={18}
                                color="#1a488e"
                            />{" "}
                            Техническая поддержка
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.copyright}>
                        © 2026 Единый контакт-центр Министерства науки и высшего образования Российской Федерации
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f5f7",
        alignItems: "center",
        justifyContent: "center",
    },
    mainBlock: {
        alignSelf: "center",
        marginTop: "auto",
        marginBottom: "auto",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 22,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 8,
    },
    title: {
        textAlign: "center",
        fontFamily: "Arial",
        fontWeight: "bold",
        fontSize: 26,
        marginVertical: 7,
        color: "#111d2b",
    },
    topText: {
        textAlign: "center",
        color: "#3b5c6e",
        marginTop: 2,
        marginBottom: 15,
        fontSize: 14,
        minHeight: 14,
    },
    textInput: {
        backgroundColor: "#f6f8fb",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#dde0ea",
        padding: 15,
        marginBottom: 16,
        fontSize: 16,
        fontFamily: "Arial",
        color: "#222",
        flex: 1,
    },
    passBlock: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    icon: { position: "absolute", right: 10, top: 14 },
    button: {
        backgroundColor: "#2176ff",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderRadius: 8,
        justifyContent: "center",
        marginTop: 6,
        marginBottom: 3,
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
    recoverLinks: { marginTop: 20, alignItems: "center" },
    recoverTitle: {
        textAlign: "center",
        color: "#6d7f97",
        marginBottom: 6,
        fontSize: 15,
    },
    link: {
        color: "#256adf",
        textDecorationLine: "underline",
        fontSize: 15,
        marginBottom: 2,
    },
    footer: { alignItems: "center", marginTop: 30 },
    footerLink: {
        color: "#1a488e",
        fontWeight: "bold",
        fontSize: 15,
        marginTop: 16,
        textDecorationLine: "underline",
    },
    copyright: {
        textAlign: "center",
        color: "#888",
        fontSize: 13,
        marginTop: 8,
    },
});