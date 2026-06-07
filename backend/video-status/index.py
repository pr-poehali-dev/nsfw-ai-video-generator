import json
import os
import requests


def handler(event: dict, context) -> dict:
    """Проверяет статус задачи генерации видео через PiAPI (Kling AI) и возвращает URL готового видео."""
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

    api_key = os.environ.get("PIAPI_KEY", "")

    resp = requests.get(
        f"https://api.piapi.ai/api/v1/task/{task_id}",
        headers={"x-api-key": api_key},
        timeout=15,
    )

    if resp.status_code != 200:
        return {
            "statusCode": resp.status_code,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": resp.text}),
        }

    data = resp.json().get("data", {})
    task_status = data.get("status", "processing")  # pending / processing / completed / failed

    video_url = None
    if task_status == "completed":
        works = data.get("output", {}).get("works", [])
        if works:
            video = works[0].get("video", {})
            video_url = video.get("resource_without_watermark") or video.get("resource")

    # Normalize status for frontend: completed → succeed, failed → failed, else → processing
    normalized = "succeed" if task_status == "completed" else ("failed" if task_status == "failed" else "processing")

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "task_id": task_id,
            "status": normalized,
            "video_url": video_url,
        }),
    }
