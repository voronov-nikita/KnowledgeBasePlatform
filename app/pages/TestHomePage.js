import React from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";

import data from "../data/questions.json";

export default function TestHomeScreen({ navigation }) {

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>

                <Text style={styles.title}>
                    Выберите категорию
                </Text>

                <Text style={styles.subtitle}>
                    Нажмите на категорию для начала тестирования
                </Text>

                {data.categories.map((category) => (

                    <TouchableOpacity
                        key={category.id}
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() =>
                            navigation.navigate("Test", {
                                categoryId: category.id,
                                categoryTitle: category.title,
                            })
                        }
                    >
                        <Text style={styles.cardTitle}>
                            {category.title}
                        </Text>

                        <Text style={styles.cardSubtitle}>
                            Вопросов: {category.questions.length}
                        </Text>

                    </TouchableOpacity>

                ))}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    safe: {
        flex: 1,
        backgroundColor: "#fff",
    },

    container: {
        padding: 16,
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 6,
    },

    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        color: "#666",
    },

    card: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
    },

    cardTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 6,
    },

    cardSubtitle: {
        fontSize: 14,
        color: "#666",
    },

});