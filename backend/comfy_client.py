import json
import uuid
import aiohttp
import asyncio
import os
import io
import base64
from dotenv import load_dotenv

load_dotenv()

# Hugging Face Inference API details
HF_API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
HF_TOKEN = os.getenv("HF_TOKEN")

async def generate_image(prompt: str):
          """
              Generates an image using Hugging Face Inference API.
                  Returns the filename of the saved image.
                      """
          headers = {"Authorization": f"Bearer {HF_TOKEN}"}
          payload = {
              "inputs": prompt,
              "parameters": {
                  "seed": uuid.uuid4().int % (2**32),
              }
          }

    # Ensure output directory exists
          OUTPUT_DIR = "static/outputs"
          os.makedirs(OUTPUT_DIR, exist_ok=True)

    async with aiohttp.ClientSession() as session:
                  async with session.post(HF_API_URL, headers=headers, json=payload) as response:
                                    if response.status != 200:
                                                          error_body = await response.text()
                                                          # Handle model loading or other errors
                                                          if "loading" in error_body.lower():
                                                                                    # Retry logic or wait can be added here
                                                                                    raise Exception(f"Model is currently loading on Hugging Face. Please try again in 30 seconds.")
                                                                                raise Exception(f"Hugging Face API error: {response.status} - {error_body}")

                                    image_bytes = await response.read()

            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(OUTPUT_DIR, filename)

            with open(filepath, "wb") as f:
                                  f.write(image_bytes)

            return filename
