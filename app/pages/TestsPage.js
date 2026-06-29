import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

import data from "../data/questions.json";

export default function TestsScreen({ route, navigation }) {

    // categoryId передается через навигацию
    const categoryId = route.params.categoryId;
    // const categoryId = "math";

    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [correct, setCorrect] = useState(0);
    const [finished, setFinished] = useState(false);

    useEffect(() => {

        const category = data.categories.find(
            c => c.id === categoryId
        );

        if (!category) return;

        const shuffled = [...category.questions]
            .sort(() => Math.random() - 0.5)
            .slice(0, 10);

        setQuestions(shuffled);

    }, []);

    function answer(index) {

        if (questions[current].correct === index) {
            setCorrect(prev => prev + 1);
        }

        if (current + 1 >= questions.length) {
            setFinished(true);
        } else {
            setCurrent(prev => prev + 1);
        }

    }

    if (questions.length === 0) {
        return (
            <SafeAreaView style={[styles.safe, styles.centered]}>
                <Text>Нет вопросов</Text>
            </SafeAreaView>
        );
    }

    if (finished) {

        const total = questions.length;
        const wrong = total - correct;
        const percent = Math.round(correct / total * 100);

        return (

            <SafeAreaView style={styles.safe}>

                <View style={styles.container}>

                    <Text style={styles.title}>
                        Тест завершен
                    </Text>

                    <View style={styles.card}>

                        <Text style={styles.result}>
                            {percent}%
                        </Text>

                        <Text style={styles.text}>
                            Правильных: {correct}
                        </Text>

                        <Text style={styles.text}>
                            Неправильных: {wrong}
                        </Text>

                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate("TestHome")}
                    >

                        <Text style={styles.buttonText}>
                            Назад
                        </Text>

                    </TouchableOpacity>

                </View>

            </SafeAreaView>

        );

    }

    const question = questions[current];

    return (

        <SafeAreaView style={styles.safe}>

            <View style={styles.container}>

                <Text style={styles.title}>
                    Вопрос {current + 1} из {questions.length}
                </Text>

                <View style={styles.card}>

                    <Text style={styles.question}>
                        {question.question}
                    </Text>

                    {question.answers.map((answerText, index) => (

                        <TouchableOpacity
                            key={index}
                            style={styles.answer}
                            onPress={() => answer(index)}
                        >

                            <Text style={styles.answerText}>
                                {answerText}
                            </Text>

                        </TouchableOpacity>

                    ))}

                </View>

            </View>

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    safe: {
        flex: 1,
        backgroundColor: "#fff"
    },

    container: {
        flex: 1,
        padding: 16,
    },

    centered: {
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 20,
    },

    card: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 16,
        padding: 18,
    },

    question: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 20,
        lineHeight: 30,
    },

    answer: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },

    answerText: {
        fontSize: 16,
    },

    button: {
        backgroundColor: "#16a34a",
        marginTop: 20,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    result: {
        fontSize: 56,
        fontWeight: "700",
        color: "#16a34a",
        textAlign: "center",
        marginBottom: 20,
    },

    text: {
        fontSize: 18,
        marginBottom: 10,
    },

});