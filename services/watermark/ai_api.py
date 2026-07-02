#!/usr/bin/env python3
"""AI 图像修复 HTTP API 服务 - 接受前端蒙版 + OpenCV TELEA/NS 算法"""
import sys, os, json, base64
from flask import Flask, request, jsonify
import cv2
import numpy as np

app = Flask(__name__)

@app.after_request
def add_cors(resp):
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS, GET'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return resp

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ai-watermark-remover'})

@app.route('/inpaint', methods=['POST'])
def inpaint():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'empty body'}), 400
        image_b64 = data.get('image', '')
        if not image_b64:
            return jsonify({'error': 'missing image'}), 400
        if 'base64,' in image_b64:
            image_b64 = image_b64.split('base64,')[1]
        img_bytes = base64.b64decode(image_b64)
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({'error': 'image decode failed'}), 400
        h, w = img.shape[:2]

        method_name = data.get('method', 'telea').lower()
        inpaint_method = cv2.INPAINT_TELEA if method_name == 'telea' else cv2.INPAINT_NS
        mask_b64 = data.get('mask', '')
        if mask_b64:
            if 'base64,' in mask_b64:
                mask_b64 = mask_b64.split('base64,')[1]
            mask_bytes = base64.b64decode(mask_b64)
            mask_arr = np.frombuffer(mask_bytes, np.uint8)
            mask = cv2.imdecode(mask_arr, cv2.IMREAD_GRAYSCALE)
            if mask is None:
                return jsonify({'error': 'mask decode failed'}), 400
            if mask.shape[0] != h or mask.shape[1] != w:
                mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
            _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
            kernel = np.ones((3, 3), np.uint8)
            mask = cv2.dilate(mask, kernel, iterations=1)
        else:
            mask = np.zeros((h, w), dtype=np.uint8)

        radius = data.get('radius', 3)
        result = cv2.inpaint(img, mask, radius, inpaint_method)

        _, buffer = cv2.imencode('.png', result)
        result_b64 = base64.b64encode(buffer).decode('utf-8')
        return jsonify({'image': f'data:image/png;base64,{result_b64}'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8901))
    print(f'[ai] service on 127.0.0.1:{port}')
    app.run(host='127.0.0.1', port=port, debug=False)
