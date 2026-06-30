# -*- coding: utf-8 -*-
"""
图像去水印 - Python HTTP Cloud Function
使用 OpenCV 的 inpainting 算法处理图片
"""
import cv2
import numpy as np
import base64
import json
import os
import re

def main(event, context):
    """HTTP 函数入口"""
    try:
        # 解析请求
        if isinstance(event, str):
            body = json.loads(event)
        elif isinstance(event, dict) and 'body' in event:
            body = event.get('body', {})
            if isinstance(body, str):
                body = json.loads(body)
        else:
            body = event or {}

        image_data = body.get('image', '')
        if not image_data:
            return _json(400, {'error': '缺少 image 参数'})

        # 解码 base64 图片
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]

        img_bytes = base64.b64decode(image_data)
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return _json(400, {'error': '图片解码失败'})

        h, w = img.shape[:2]

        # ====== 自动检测水印区域 ======
        # 策略1: 底部中间（最常见水印位置）
        regions = []
        bh = max(40, int(h * 0.12))
        bw = max(80, int(w * 0.5))
        regions.append((int((w - bw) / 2), h - bh, bw, bh))

        # 策略2-5: 四个角
        cs = max(50, int(min(w, h) * 0.1))
        regions.append((w - cs, h - cs, cs, cs))  # 右下
        regions.append((w - cs, 0, cs, cs))        # 右上
        regions.append((0, 0, cs, cs))             # 左上
        regions.append((0, h - cs, cs, cs))        # 左下

        # ====== 创建蒙版 ======
        mask = np.zeros((h, w), dtype=np.uint8)
        for rx, ry, rw, rh in regions:
            cv2.rectangle(mask, (rx, ry), (rx + rw, ry + rh), 255, -1)

        # 膨胀蒙版，让修复区域稍微扩大以覆盖边缘
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.dilate(mask, kernel, iterations=2)

        # ====== OpenCV 修复 ======
        result = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)

        # ====== 编码返回 ======
        _, buffer = cv2.imencode('.png', result)
        result_b64 = base64.b64encode(buffer).decode('utf-8')
        result_data_url = f'data:image/png;base64,{result_b64}'

        return _json(200, {'image': result_data_url})

    except Exception as e:
        return _json(500, {'error': str(e)})


def _json(status, data):
    return {
        'isBase64Encoded': False,
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps(data, ensure_ascii=False),
    }
