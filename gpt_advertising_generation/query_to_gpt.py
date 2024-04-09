import json
import requests


config = {}
with open('config.json') as f:
    config = json.load(f)

FOLDER_ID = config['FOLDER_ID']
API_KEY = config['API_KEY']

URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'



def query_to_gpt(system_prompt: str, user_prompt: str, temperature:float=0.6):

    prompt = {
        'modelUri': f'gpt://{FOLDER_ID}/yandexgpt-pro',
        'completionOptions': {
            'stream': False,
            'temperature': f'{temperature}',
            'maxTokens': '2000'
        },
        'messages': [
            {
                'role': 'system',
                'text': system_prompt
            },
            {
                'role': 'user',
                'text': user_prompt
            }
        ]
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Api-Key {API_KEY}'
    }

    response = requests.post(URL, headers=headers, json=prompt)
    result = json.loads(response.text)['result']['alternatives'][0]['message']['text']

    return result
