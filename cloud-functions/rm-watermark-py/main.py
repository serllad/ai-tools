# -*- coding: utf-8 -*-
"""
图像去水印 - HTTP Cloud Function
使用 OpenCV TELEA 算法
"""
import cv2
import numpy as np
import base64
import json
import os

def main_handler(event, context):
    """腾讯云SCF HTTP函数入口"""
    try:
        # 解析请求体
        body_str = None
        if isinstance(event, str):
            body_str = event
        elif isinstance(event, dict):
            body_str = event.get('body') or event.get('body', '')
            if isinstance(body_str, dict):
                body_str = json.dumps(body_str)
            elif event.get('headers', {}).get('content-type', '').startswith('application/json'):
                body_str = event.get('body', '')

        body = json.loads(body_str) if body_str else {}

        image_data = body.get('image', '')
        if not image_data:
            return _res(400, {'error': '缺少 image 参数'})

        # 解码 base64
        if 'base64,' in image_data:
            image_data = image_data.split('base64,')[1]
        img_bytes = base64.b64decode(image_data)
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if img is None:
            return _res(400, {'error': '图片解码失败'})

        h, w = img.shape[:2]

        # 自动检测水印区域
        regions = []
        bh = max(40, int(h * 0.12))
        bw = max(80, int(w * 0.5))
        regions.append((int((w - bw) / 2), h - bh, bw, bh))

        cs = max(50, int(min(w, h) * 0.1))
        for rx, ry in [(w - cs, h - cs), (w - cs, 0), (0, 0), (0, h - cs)]:
            regions.append((rx, ry, cs, cs))

        # 创建蒙版
        mask = np.zeros((h, w), dtype=np.uint8)
        for rx, ry, rw, rh in regions:
            cv2.rectangle(mask, (rx, ry), (rx + rw, ry + rh), 255, -1)

        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.dilate(mask, kernel, iterations=2)

        # OpenCV TELEA 修复
        result = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)

        # 编码返回
        _, buffer = cv2.imencode('.png', result)
        result_b64 = base64.b64encode(buffer).decode('utf-8')
        result_data_url = f'data:image/png;base64,{result_b64}'

        return _res(200, {'image': result_data_url})

    except Exception as e:
        return _res(500, {'error': str(e)})


def _res(status, data):
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
