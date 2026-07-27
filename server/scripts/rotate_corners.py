#!/usr/bin/env python3
"""Rotate existing corner tile images to point toward board center."""

from pathlib import Path
from PIL import Image

OUTPUT_DIR = Path(__file__).parent.parent.parent / "client" / "public" / "art" / "monopoly"

corner_rotations = {
    "chalo_tile": 315,      # GO at bottom-right → points top-left toward center
    "jail_tile": 45,        # Jail at bottom-left → points top-right toward center
    "free_parking_tile": 135,  # Free Parking at top-left → points bottom-right toward center
    "chalo_jail_tile": 225,    # Go To Jail at top-right → points bottom-left toward center
}

def rotate_image(path: Path, angle: int):
    img = Image.open(path).convert("RGBA")
    rotated = img.rotate(angle, expand=True, fillcolor=(0, 0, 0, 0))
    # Re-save as webp with transparency preserved
    rotated.save(path, "WEBP", lossless=True)
    print(f"  Rotated {path.name} by {angle}°")

def main():
    for name, angle in corner_rotations.items():
        path = OUTPUT_DIR / f"{name}_001.webp"
        if not path.exists():
            print(f"  SKIP {name}_001.webp — not found")
            continue
        rotate_image(path, angle)
    print("Done")

if __name__ == "__main__":
    main()
