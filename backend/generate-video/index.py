import json
import os
import uuid
import base64
import requests
import boto3


def _upload_image_to_s3(image_b64: str) -> str:
    """Загружает base64-изображение в S3 и возвращает публичный CDN URL."""
    if "," in image_b64:
        header, image_b64 = image_b64.split(",", 1)
        ext = "jpg"
        if "png" in header:
            ext = "png"
        elif "webp" in header:
            ext = "webp"
    else:
        ext = "jpg"

    image_data = base64.b64decode(image_b64)
    key = f"vidai-uploads/{uuid.uuid4()}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    content_type = f"image/{ext}"
    s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType=content_type)

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/files/{key}"
    return cdn_url


def handler(event: dict, context) -> dict:
    """Запускает генерацию видео из фото через PiAPI (Kling AI)."""
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

    api_key = os.environ.get("PIAPI_KEY", "")
    if not api_key:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "PIAPI_KEY not configured"}),
        }

    # Upload image to S3 to get a public URL
    image_url = _upload_image_to_s3(image_b64)

    # Duration: PiAPI Kling accepts 5 or 10
    dur_seconds = int(str(duration).replace("s", ""))
    dur_seconds = 10 if dur_seconds > 10 else (5 if dur_seconds < 5 else dur_seconds)

    # Style → prompt enrichment
    style_prompt_map = {
        "cinematic": "cinematic camera movement, film look",
        "anime": "anime style, smooth animation",
        "realistic": "photorealistic, natural motion",
        "timelapse": "timelapse effect, fast motion",
        "slowmo": "slow motion, smooth slow-motion",
        "retro": "retro film grain, vintage look",
    }
    full_prompt = f"{prompt}, {style_prompt_map[style]}" if style in style_prompt_map else prompt

    payload = {
        "model": "kling",
        "task_type": "video_generation",
        "input": {
            "image_url": image_url,
            "prompt": full_prompt,
            "negative_prompt": "blurry, distorted, low quality",
            "duration": dur_seconds,
            "aspect_ratio": ratio,
            "version": "1.6",
            "mode": "std",
        },
    }

    resp = requests.post(
        "https://api.piapi.ai/api/v1/task",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    if resp.status_code not in (200, 201):
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
