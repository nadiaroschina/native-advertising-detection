import json
import requests


config = {}
with open('config.json') as f:
    config = json.load(f)


URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
FOLDER_ID = config['FOLDER_ID']
API_KEY = config['API_KEY']


def get_advertised_text(text: str):

    query = '''В ответе верни только текст новости с рекламой'''

    user_text = '''Тебе нужно вставить в текст этой новости нативную рекламу какого-нибудь релевантного продукта.
        Придумай название бренда и продукт, который ты будешь рекламировать.
        Напиши текст с вставленной рекламой.'''

    prompt = {
        'modelUri': f'gpt://{FOLDER_ID}/yandexgpt-lite',
        'completionOptions': {
            'stream': False,
            'temperature': 0.5,
            'maxTokens': '2000'
        },
        'messages': [
            {
                'role': 'system',
                'text': query
            },
            {
                'role': 'user',
                'text': user_text + '\n' + text
            }
        ]
    }


    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Api-Key {API_KEY}'
    }

  
    response = requests.post(URL, headers=headers, json=prompt)
    result = json.loads(response.text)['result']['alternatives'][0]['message']['text']

    cleared_lines = []
    for line in result.split('\n'):
        if not (
            'обратите внимание' in line
            or 'пример' in line
        ): 
            cleared_lines.append(line)

    return '\n'.join(cleared_lines)
