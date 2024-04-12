import streamlit as st
from base_model.base_model import predict
import sys

sys.path.append('data')


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
