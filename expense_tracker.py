import pandas as pd
import ollama
import matplotlib.pyplot as plt

df = pd.read_csv("expenses.csv")
df["amount"] = pd.to_numeric(df["amount"], errors="coerce")


def choose_route(question):
    q = question.lower()

    if "total" in q or "average" in q or "highest" in q or "lowest" in q:
        return "python"

    if "chart" in q or "graph" in q:
        return "chart"

    return "ollama"


def python_answer():
    total = df["amount"].sum()
    average = df["amount"].mean()
    highest = df["amount"].max()
    lowest = df["amount"].min()

    category_totals = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    return f"""
Python math answer:

Total spent: ${total}
Average expense: ${average:.2f}
Highest expense: ${highest}
Lowest expense: ${lowest}

Spending by category:
{category_totals.to_string()}
"""


def show_chart():
    category_totals = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    category_totals.plot(kind="bar")

    plt.title("Spending by Category")
    plt.xlabel("Category")
    plt.ylabel("Amount Spent")
    plt.tight_layout()
    plt.show()


def ollama_answer(question):
    expenses_text = df.to_string(index=False)

    response = ollama.chat(
        model="llama3.2",
        messages=[
            {
                "role": "user",
                "content": f"""
You are an AI expense tracker assistant.

Analyze this expense data and answer the user's question clearly.

User question:
{question}

Expense data:
{expenses_text}
"""
            }
        ]
    )

    return response["message"]["content"]


while True:
    question = input("\nWhat your broke ass need help with now?, type quit to shut me up: ")

    if question.lower() == "quit":
        break

    route = choose_route(question)

    print(f"\nRouter chose: {route.upper()}")

    if route == "python":
        print(python_answer())

    elif route == "chart":
        show_chart()

    else:
        print(ollama_answer(question))