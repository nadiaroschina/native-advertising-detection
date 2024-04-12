import streamlit as st
import pandas as pd
from catboost import CatBoostClassifier
import pickle

import sys
sys.path.append('data')
from data_preprocessor import DataPreprocessor

vectorizer = pickle.load(open(("vectorizer.pickle"), "rb"))
scaler = pickle.load(open(("scaler.pickle"), "rb"))
model = CatBoostClassifier()
model.load_model("catboost")
preprocessor = DataPreprocessor()

def vectorize(X):
    X = preprocessor.fit_transform(X)
    bow = vectorizer.transform(X)
    return scaler.transform(bow)


def predict(message_text: str) -> bool:
    new_data = vectorize(pd.Series([message_text]))
    return model.predict(new_data)[0] == 1

def main() -> None:
    placeholder = st.empty()

    with placeholder.form("Формочка"):
        st.title("Поиск нативной рекламы")
        ta = st.text_area("Введите текст:", height=240)
        button = st.form_submit_button(label="Отправить", help=None, on_click=None)
        if button:
            st.info(f"Boom! Ваш текст: {ta}")
            res = predict(ta)
            if res == 1:
                st.warning('Скорее всего, это реклама', icon="⚠️")
            else:
                st.success('Не является рекламой', icon="✅")

if __name__ == "__main__":
    main()