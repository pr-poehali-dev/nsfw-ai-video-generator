import json
import os
import time
import base64
import hashlib
import hmac
import requests


def _make_jwt(access_key: str, secret_key: str) -> str:
    """Генерирует JWT токен для Kling AI API."""
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    now = int(time.time())
    payload = base64.urlsafe_b64encode(json.dumps({
        "iss": access_key,
        "exp": now + 1800,
        "nbf": now - 5
    }).encode()).rstrip(b"=").decode()
    sig_input = f"{header}.{payload}".encode()
    sig = base64.urlsafe_b64encode(
        hmac.new(secret_key.encode(), sig_input, hashlib.sha256).digest()
    ).rstrip(b"=").decode()
    return f"{header}.{payload}.{sig}"


def handler(event: dict, context) -> dict:
    """Запускает генерацию видео из фото через Kling AI API."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")
    image_b64 = body.get("image_base64")
    prompt = body.get("prompt", "")
    duration = body.get("duration", "5")
    style = body.get("style", "cinematic")
    ratio = body.get("ratio", "16:9")

    if not image_b64:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "image_base64 is required"}),
        }

    access_key = os.environ.get("KLING_ACCESS_KEY", "")
    secret_key = os.environ.get("KLING_SECRET_KEY", "")

    if not access_key or not secret_key:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Kling API keys not configured"}),
        }

    token = _make_jwt(access_key, secret_key)

    ratio_map = {"16:9": "16:9", "9:16": "9:16", "1:1": "1:1", "4:3": "4:3"}
    aspect_ratio = ratio_map.get(ratio, "16:9")

    dur_seconds = int(str(duration).replace("s", ""))
    if dur_seconds > 10:
        dur_seconds = 10
    elif dur_seconds < 5:
        dur_seconds = 5

    style_prompt_map = {
        "cinematic": "cinematic camera movement, film look",
        "anime": "anime style, smooth animation",
        "realistic": "photorealistic, natural motion",
        "timelapse": "timelapse effect, fast motion",
        "slowmo": "slow motion, smooth slow-motion",
        "retro": "retro film grain, vintage look",
    }
    full_prompt = f"{prompt}, {style_prompt_map[style]}" if style in style_prompt_map else prompt

    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    payload = {
        "model_name": "kling-v1",
        "image": image_b64,
        "prompt": full_prompt,
        "duration": str(dur_seconds),
        "aspect_ratio": aspect_ratio,
        "cfg_scale": 0.5,
    }

    resp = requests.post(
        "https://api.klingai.com/v1/videos/image2video",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )

    if resp.status_code != 200:
        return {
            "statusCode": resp.status_code,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": resp.text}),
        }

    data = resp.json()
    task_id = data.get("data", {}).get("task_id")

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"task_id": task_id, "status": "processing"}),
    }
