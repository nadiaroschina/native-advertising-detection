import streamlit as st
import numpy as np

placeholder = st.empty()

with placeholder.form("Формочка"):
    st.title("Поиск нативной рекламы")
    ta = st.text_area("Введите текст:", height=240)
    button = st.form_submit_button(label="Отправить", help=None, on_click=None)
    if button:
        st.info(f"Boom! Ваш текст: {ta}")
        res = np.random.randint(2)
        if res == 1:
            st.warning('Скорее всего, это реклама', icon="⚠️")
        else:
            st.success('Не является рекламой', icon="✅")
    
