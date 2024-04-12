import pickle
import pandas as pd
from catboost import CatBoostClassifier
from data.data_preprocessor import DataPreprocessor

vectorizer = pickle.load(open("base_model/vectorizer.pickle", "rb"))
scaler = pickle.load(open("base_model/scaler.pickle", "rb"))
model = CatBoostClassifier()
model.load_model("base_model/catboost")
preprocessor = DataPreprocessor()


def vectorize(X):
    X = preprocessor.fit_transform(X)
    bow = vectorizer.transform(X)
    return scaler.transform(bow)


def predict(message_text: str) -> bool:
    new_data = vectorize(pd.Series([message_text]))
    return model.predict(new_data)[0] == 1
