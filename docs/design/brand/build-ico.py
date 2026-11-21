"""打包 favicon.ico 并给满幅图标去 alpha; 先跑 build-icons.js 生成中间文件。

用法: python docs/design/brand/build-ico.py   (依赖 Pillow)
"""
import os
import tempfile

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TMP = os.path.join(tempfile.gettempdir(), "czlnav-brand")
PUB = os.path.join(ROOT, "frontend", "public")

# favicon: 16 / 32 / 48 三档, 每档用各自渲染的位图, 不让 Pillow 从大图缩
frames = [Image.open(os.path.join(TMP, f"ico-{s}.png")).convert("RGBA") for s in (16, 32, 48)]
ico = os.path.join(ROOT, "frontend", "src", "app", "favicon.ico")
frames[-1].save(ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=frames[:-1])
print("wrote", os.path.relpath(ico, ROOT))

# 满幅直角图标去 alpha (iOS / maskable 由系统裁形)
for rel in (os.path.join("images", "apple-touch-icon.png"), os.path.join("images", "icon-maskable-512.png")):
    p = os.path.join(PUB, rel)
    Image.open(p).convert("RGB").save(p, optimize=True)
    print("flattened", os.path.relpath(p, ROOT))
