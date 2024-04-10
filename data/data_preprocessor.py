import nltk
import pandas as pd
from nltk.corpus import stopwords
import pymorphy2
import re


class DataPreprocessor:
    def __init__(self):
        nltk.download("stopwords")

        # Получить список стоп-слов на русском языке
        self.my_stopwords = stopwords.words("russian")
        self.my_stopwords.extend(['что', 'это', 'так', 'вот', 'быть', 'как', 'в', 'к', 'на'])

        # Инициализировать морфологический анализатор pymorphy2
        self.morph = pymorphy2.MorphAnalyzer()

    # Токенизировать текст
    def stemming(self, content):
        stemmed_content = re.sub('[^а-яА-Я]', ' ', content)  # Заменить всё, что не является буквой на ' '
        stemmed_content = stemmed_content.lower()  # привести всё к нижнему регистру
        stemmed_content = stemmed_content.split()  # засплитить по пробелам
        return ' '.join([self.morph.parse(token)[0].normal_form for token in stemmed_content if
                         token not in self.my_stopwords and token])

    def fit_transform(self, X: pd.Series) -> pd.Series:
        return X.apply(self.stemming)
