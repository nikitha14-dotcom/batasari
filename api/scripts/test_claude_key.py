import os

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

response = client.messages.create(
    model="claude-haiku-4-5-20251001",
    max_tokens=50,
    messages=[{"role": "user", "content": "Say hello in one short sentence."}],
)

print("Response:", response.content[0].text)
print(f"Tokens used — input: {response.usage.input_tokens}, output: {response.usage.output_tokens}")
