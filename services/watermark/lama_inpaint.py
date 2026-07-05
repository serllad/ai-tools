#!/usr/bin/env python3
"""LaMa (ONNX) 图像修复 - 深度学习方案,效果远优于 OpenCV TELEA/NS

模型固定输入 512x512。为保留原图质量,仅将掩码区域的 LaMa 结果
合成回原分辨率图像,非掩码区域保持原样。
"""
import os
import cv2
import numpy as np

_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'lama_fp32.onnx')
_SIZE = 512
_session = None
_load_error = None


def is_available() -> bool:
    """LaMa 模型与 onnxruntime 是否就绪"""
    return _get_session() is not None


def _get_session():
    """懒加载 onnxruntime 会话,只初始化一次"""
    global _session, _load_error
    if _session is not None or _load_error is not None:
        return _session
    try:
        import onnxruntime as ort
        if not os.path.exists(_MODEL_PATH):
            _load_error = f'model not found: {_MODEL_PATH}'
            return None
        _session = ort.InferenceSession(
            _MODEL_PATH, providers=['CPUExecutionProvider']
        )
        return _session
    except Exception as e:  # noqa: BLE001
        _load_error = str(e)
        return None


def inpaint(img_bgr: np.ndarray, mask_gray: np.ndarray) -> np.ndarray:
    """用 LaMa 修复 mask 标记区域。

    img_bgr:   OpenCV BGR 图 (H, W, 3) uint8
    mask_gray: 灰度掩码 (H, W) uint8,白(255)=待修复区域
    返回:      修复后的 BGR 图 (H, W, 3) uint8
    """
    session = _get_session()
    if session is None:
        raise RuntimeError(f'LaMa unavailable: {_load_error}')

    h, w = img_bgr.shape[:2]

    # 二值化掩码
    _, mask_bin = cv2.threshold(mask_gray, 127, 255, cv2.THRESH_BINARY)

    # 缩放到模型输入尺寸
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    img_small = cv2.resize(img_rgb, (_SIZE, _SIZE), interpolation=cv2.INTER_AREA)
    mask_small = cv2.resize(mask_bin, (_SIZE, _SIZE), interpolation=cv2.INTER_NEAREST)
    # 轻微膨胀,确保覆盖水印边缘
    mask_small = cv2.dilate(mask_small, np.ones((3, 3), np.uint8), iterations=1)

    img_in = np.transpose(img_small.astype(np.float32) / 255.0, (2, 0, 1))[None]
    mask_in = (mask_small > 0).astype(np.float32)[None, None]

    out = session.run(None, {'image': img_in, 'mask': mask_in})[0]
    out = np.clip(out[0].transpose(1, 2, 0), 0, 255).astype(np.uint8)  # RGB
    out_bgr = cv2.cvtColor(out, cv2.COLOR_RGB2BGR)

    # 放回原分辨率
    out_full = cv2.resize(out_bgr, (w, h), interpolation=cv2.INTER_LINEAR)

    # 仅在掩码区域用修复结果,边缘做羽化平滑过渡
    alpha_mask = cv2.dilate(mask_bin, np.ones((3, 3), np.uint8), iterations=2)
    alpha = cv2.GaussianBlur(alpha_mask, (9, 9), 0).astype(np.float32) / 255.0
    alpha = alpha[:, :, None]

    result = img_bgr.astype(np.float32) * (1 - alpha) + out_full.astype(np.float32) * alpha
    return np.clip(result, 0, 255).astype(np.uint8)
