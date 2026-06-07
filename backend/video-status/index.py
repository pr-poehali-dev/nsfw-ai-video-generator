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
    """Проверяет статус задачи генерации видео Kling AI и возвращает URL готового видео."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    params = event.get("queryStringParameters") or {}
    task_id = params.get("task_id")

    if not task_id:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "task_id is required"}),
        }

    access_key = os.environ.get("KLING_ACCESS_KEY", "")
    secret_key = os.environ.get("KLING_SECRET_KEY", "")
    token = _make_jwt(access_key, secret_key)

    resp = requests.get(
        f"https://api.klingai.com/v1/videos/image2video/{task_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )

    if resp.status_code != 200:
        return {
            "statusCode": resp.status_code,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": resp.text}),
        }

    data = resp.json().get("data", {})
    task_status = data.get("task_status", "processing")

    video_url = None
    if task_status == "succeed":
        works = data.get("task_result", {}).get("videos", [])
        if works:
            video_url = works[0].get("url")

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "task_id": task_id,
            "status": task_status,
            "video_url": video_url,
        }),
    }
