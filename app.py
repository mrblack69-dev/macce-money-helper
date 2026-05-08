import re
import pandas as pd
from openai import OpenAI
import streamlit as st
import matplotlib.pyplot as plt
import pdfplumber
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from dotenv import load_dotenv
import os
load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY") or st.secrets["OPENAI_API_KEY"]
)
st.set_page_config(
    page_title="MACCE the Money Helper",
    page_icon="💸",
    layout="wide"
)

st.markdown("""
<style>
.stApp { background-color: #f1f5f9; }
html, body, [class*="css"] { color: black !important; }
h1, h2, h3, h4, h5, h6, p, label, div, span { color: black !important; }

[data-testid="stSidebar"] { background-color: #dbeafe; }

[data-testid="stMetric"] {
    background-color: white;
    padding: 20px;
    border-radius: 16px;
    border: 1px solid #cbd5e1;
    box-shadow: 0px 2px 6px rgba(0,0,0,0.08);
}

.stFileUploader {
    background-color: white;
    padding: 15px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
}

section[data-testid="stFileUploaderDropzone"] {
    background-color: white;
    border: 2px dashed #94a3b8;
}

section[data-testid="stFileUploaderDropzone"] * {
    color: black !important;
}

.stTextInput input {
    background-color: white;
    color: black !important;
    border-radius: 10px;
}
</style>
""", unsafe_allow_html=True)


def auto_category(description):
    desc = str(description).lower()

    if any(word in desc for word in ["shell", "exxon", "bp", "gas", "fuel"]):
        return "gas"
    if any(word in desc for word in ["mcdonald", "chick", "pizza", "restaurant", "food"]):
        return "food"
    if any(word in desc for word in ["target", "diapers", "kids", "baby", "toy"]):
        return "kids"
    if any(word in desc for word in ["home depot", "lowes", "tool", "lumber"]):
        return "tools"
    if any(word in desc for word in ["netflix", "spotify", "hulu", "subscription"]):
        return "subscriptions"

    return "other"


def extract_pdf_transactions(pdf_file):
    rows = []

    with pdfplumber.open(pdf_file) as pdf:
        text = ""

        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    for line in text.split("\n"):
        amount_match = re.search(r"(-?\$?\d+\.\d{2})", line)

        if amount_match:
            amount = amount_match.group().replace("$", "")

            try:
                amount = float(amount)
                rows.append({
                    "description": line,
                    "amount": amount
                })
            except ValueError:
                pass

    return pd.DataFrame(rows)


def generate_pdf_report(total, average, highest, category_totals, ai_response):
    file_name = "macce_report.pdf"
    doc = SimpleDocTemplate(file_name)
    styles = getSampleStyleSheet()
    content = []

    content.append(Paragraph("MACCE Financial Report", styles["Title"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph(f"Total Spending: ${total:.2f}", styles["BodyText"]))
    content.append(Paragraph(f"Average Transaction: ${average:.2f}", styles["BodyText"]))
    content.append(Paragraph(f"Highest Transaction: ${highest:.2f}", styles["BodyText"]))
    content.append(Spacer(1, 12))

    content.append(Paragraph("Spending by Category:", styles["Heading2"]))

    for category, amount in category_totals.items():
        content.append(Paragraph(f"{category}: ${amount:.2f}", styles["BodyText"]))

    content.append(Spacer(1, 12))
    content.append(Paragraph("MACCE Insight:", styles["Heading2"]))
    content.append(Paragraph(ai_response.replace("\n", "<br/>"), styles["BodyText"]))

    doc.build(content)
    return file_name


st.title("💸 MACCE the Money Helper")
st.caption("Your broke-ass budgeting buddy with AI brains")

uploaded_file = st.file_uploader(
    "Upload your bank statement",
    type=["csv", "pdf"]
)

if uploaded_file is not None:
    if uploaded_file.name.lower().endswith(".csv"):
        df = pd.read_csv(uploaded_file)
    elif uploaded_file.name.lower().endswith(".pdf"):
        df = extract_pdf_transactions(uploaded_file)
    else:
        df = pd.read_csv("expenses.csv")
else:
    df = pd.read_csv("expenses.csv")

if df.empty:
    st.error("MACCE could not find any transactions in that file.")
    st.stop()

df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
df = df.dropna(subset=["amount"])

if "description" not in df.columns:
    df["description"] = "Unknown"

if "category" not in df.columns:
    df["category"] = df["description"].apply(auto_category)
else:
    df["category"] = df["category"].fillna("")
    df.loc[df["category"].str.strip() == "", "category"] = df["description"].apply(auto_category)

total = df["amount"].sum()
average = df["amount"].mean()
highest = df["amount"].max()

category_totals = (
    df.groupby("category")["amount"]
    .sum()
    .sort_values(ascending=False)
)

st.sidebar.title("💸 MACCE")
st.sidebar.write("Your local AI money helper")
st.sidebar.divider()

st.sidebar.subheader("Features")
st.sidebar.write("✅ CSV uploads")
st.sidebar.write("✅ PDF bank statements")
st.sidebar.write("✅ AI spending analysis")
st.sidebar.write("✅ Auto categorization")
st.sidebar.write("✅ Spending charts")
st.sidebar.write("✅ Financial report PDFs")

st.sidebar.divider()
st.sidebar.subheader("MACCE Tip")

if total < 300:
    st.sidebar.success("MACCE says your spending looks under control.")
elif total < 800:
    st.sidebar.warning("MACCE says keep an eye on your spending.")
else:
    st.sidebar.error("MACCE says your wallet is fighting for its life.")

col1, col2, col3 = st.columns(3)

col1.metric("Total Spending", f"${total:.2f}")
col2.metric("Average Transaction", f"${average:.2f}")
col3.metric("Highest Transaction", f"${highest:.2f}")

st.subheader("Spending by Category")

fig, ax = plt.subplots()
category_totals.plot(kind="bar", ax=ax)
ax.set_title("Spending by Category")
ax.set_xlabel("Category")
ax.set_ylabel("Amount")
st.pyplot(fig)

st.subheader("Bank Statement Data")
st.dataframe(df, use_container_width=True)

question = st.text_input(
    "What can I help you with?"
)

ai_response = ""

if question:
    expenses_text = df.to_string(index=False)

    response = client.responses.create(
        model="gpt-5-mini",
        input=f"""
You are MAY-chee, an intelligent AI financial and life assistant.

Personality:
- funny
- slightly sarcastic
- supportive
- personal
- conversational

Analyze this bank statement data.
Be direct, helpful, slightly funny, personal, and conversational.
Talk like a real assistant, not a robot.

Question:
{question}

Data:
{expenses_text}
"""
    )

    ai_response = response.output_text

    st.subheader("MAY-chee Response")
    st.write(ai_response)

st.divider()

if st.button("Generate Financial Report PDF"):
    if not ai_response:
        ai_response = "Ask MACCE a question first to include an AI insight in the report."

    report_file = generate_pdf_report(
        total,
        average,
        highest,
        category_totals,
        ai_response
    )

    with open(report_file, "rb") as file:
        st.download_button(
            label="Download MACCE Report",
            data=file,
            file_name="macce_report.pdf",
            mime="application/pdf"
        )