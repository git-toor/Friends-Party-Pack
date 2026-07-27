#!/usr/bin/env python3
"""
Monopoly Board Property Art Generator
=======================================
Generates icon-style art for 28 property tiles using Flux via ComfyUI.
Outputs 512x512 .webp to client/public/art/monopoly/

Usage:
  python monopoly_board_gen.py
  python monopoly_board_gen.py --preview
"""

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from monopoly_batch_gen import generate_image, FLUX_WORKFLOW, OUTPUT_DIR, MANIFEST_FILE

HAS_PIL = False
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    pass

PROMPTS_FILE = Path(__file__).parent / "monopoly-board-prompts.json"


def main():
    try:
        import requests
    except ImportError:
        print("ERROR: requests not installed. pip install requests")
        sys.exit(1)

    with open(PROMPTS_FILE) as f:
        data = json.load(f)

    style = data["master_style"]["base"]
    tiles = data["tiles"]
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"Generating {len(tiles)} board property art -> {OUTPUT_DIR}")
    success = []

    try:
        from PIL import Image as PILImage
        HAS_PIL = True
    except ImportError:
        HAS_PIL = False

    for tile in tiles:
        prompt = f"{style['positive']}, {tile['prompt']}"
        neg = style["negative"]
        seed = tile["seed_base"]
        out = OUTPUT_DIR / f"{tile['id']}_001.webp"
        rotate_svg = tile.get("rotate")

        if out.exists() and (rotate_svg is None or rotate_svg == 0):
            print(f"[{tile['id']}] {tile['name']} — exists, skipping")
            success.append(tile["id"])
            continue

        size = tuple(tile["size"]) if "size" in tile else (512, 512)
        print(f"[{tile['id']}] {tile['name']} ({size[0]}x{size[1]})", end="")
        if rotate_svg:
            print(f" + rotate {rotate_svg}° SVG CW")
        else:
            print()

        ok = generate_image(prompt, neg, size, seed, out, tile["id"])
        if ok:
            if rotate_svg and HAS_PIL:
                pil_angle = (360 - rotate_svg) % 360  # SVG CW → PIL CCW
                from PIL import Image as _Img; img = _Img.open(out).convert("RGBA")
                rotated = img.rotate(pil_angle, expand=True, fillcolor=(0,0,0,0))
                rotated.save(out, "WEBP", lossless=True)
                print(f"  Rotated by {pil_angle}° PIL CCW (={rotate_svg}° SVG CW)")
            success.append(tile["id"])
        else:
            print(f"  FAILED")

    # Update manifest
    manifest = {"version": "2.0", "art_instances": {}}
    if MANIFEST_FILE.exists():
        with open(MANIFEST_FILE) as f:
            manifest = json.load(f)

    for tile in tiles:
        if tile["id"] in success:
            k = f"{tile['id']}_001"
            manifest["art_instances"][k] = {
                "card_id": tile["id"],
                "expansion": "monopoly_board",
                "copy": 1,
                "seed": tile["seed_base"],
                "workflow": "flux",
                "prompt": tile["prompt"],
                "file": f"/art/monopoly/{tile['id']}_001.webp",
            }

    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nDone: {len(success)} tiles generated. Manifest updated.")


if __name__ == "__main__":
    main()
