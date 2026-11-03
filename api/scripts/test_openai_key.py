import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

response = client.chat.completions.create(
    model="gpt-5-nano",
    max_completion_tokens=50,
    messages=[{"role": "user", "content": "Say hello in one short sentence."}],
)

print("Response:", response.choices[0].message.content)
print(
    f"Tokens used — input: {response.usage.prompt_tokens}, "
    f"output: {response.usage.completion_tokens}"
)
