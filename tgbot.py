#!/usr/bin/env python
# pylint: disable=unused-argument
# This program is dedicated to the public domain under the CC0 license.

"""
Simple Bot to reply to Telegram messages.

First, a few handler functions are defined. Then, those functions are passed to
the Application and registered at their respective places.
Then, the bot is started and runs until we press Ctrl-C on the command line.

Usage:
Basic Echobot example, repeats messages.
Press Ctrl-C on the command line or send a signal to the process to stop the
bot.
"""

import logging

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MaxAbsScaler
from catboost import CatBoostClassifier
from data.data_preprocessor import DataPreprocessor
from telegram import ForceReply, Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
import pickle

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
# set higher logging level for httpx to avoid all GET and POST requests being logged
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

vectorizer = pickle.load(open(("vectorizer.pickle"), "rb"))
scaler = pickle.load(open(("scaler.pickle"), "rb"))
model = CatBoostClassifier()
model.load_model("catboost")
preprocessor = DataPreprocessor()


# Define a few command handlers. These usually take the two arguments update and
# context.
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    user = update.effective_user
    await update.message.reply_html(
        rf"""Привет {user.mention_html()}!
        Я бот, который на каждую отправленную текстом статью умеет говорить, есть ли там реклама""",
        reply_markup=ForceReply(selective=True),
    )


def vectorize(X):
    X = preprocessor.fit_transform(X)
    bow = vectorizer.transform(X)
    return scaler.transform(bow)


def predict(message_text: str) -> bool:
    new_data = vectorize(pd.Series([message_text]))
    return model.predict(new_data)[0] == 1


async def process_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Echo the user message."""
    found = predict(update.message.text)

    found_reply = "Видимо здесь есть реклама."
    not_found_reply = "Всё чисто! Рекламы нет!"

    await update.message.reply_text(found_reply if found else not_found_reply)


def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token.
    application = Application.builder().token("6771475969:AAFzfpT6E2QMfh5ZKv9h9xnKKOL5QmdnzZA").build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))

    # on non command i.e message - echo the message on Telegram
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, process_text))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
