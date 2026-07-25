#!/usr/bin/env python3
"""
Monopoly Card Art Batch Generator
===================================
Generates Kismat + Jugaad card art using Flux workflow via ComfyUI.
Outputs .webp to client/public/art/monopoly/

Usage:
  python monopoly_batch_gen.py              # Generate all 32 cards
  python monopoly_batch_gen.py --preview    # Generate first 4 as sample
  python monopoly_batch_gen.py --card kismat_advance_go  # Single card
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"
SCRIPT_DIR = Path(__file__).parent
PROMPTS_FILE = SCRIPT_DIR / "monopoly-card-prompts.json"
OUTPUT_DIR = SCRIPT_DIR.parent.parent / "client" / "public" / "art" / "monopoly"
MANIFEST_FILE = SCRIPT_DIR.parent.parent / "client" / "public" / "art" / "monopoly_manifest.json"

FLUX_WORKFLOW = {
    "checkpoint": "flux1-dev.safetensors",
    "vae": "ae.safetensors",
    "clip1": "clip_l.safetensors",
    "clip2": "t5xxl_fp8_e4m3fn.safetensors",
    "base": {
        "sampler_name": "euler",
        "scheduler": "normal",
        "steps": 28,
        "cfg": 1.0,
        "denoise": 1.0,
    },
}


def load_prompts():
    with open(PROMPTS_FILE, encoding='utf-8') as f:
        return json.load(f)


def build_flux_workflow(positive, negative, size, seed, cfg):
    nodes = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": cfg["checkpoint"]}},
        "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {
            "clip_name1": cfg["clip1"], "clip_name2": cfg["clip2"], "type": "flux"
        }},
        "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": cfg["vae"]}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["dual_clip", 0]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
        "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": size[0], "height": size[1], "batch_size": 1}},
        "ksampler": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": cfg["base"]["steps"], "cfg": cfg["base"]["cfg"],
            "sampler_name": cfg["base"]["sampler_name"], "scheduler": cfg["base"]["scheduler"],
            "denoise": cfg["base"]["denoise"],
            "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0],
            "latent_image": ["empty", 0]
        }},
        "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "mono_art", "images": ["vae_decode", 0]}},
    }
    return nodes


def generate_image(positive, negative, size, seed, output_path, card_id):
    workflow = build_flux_workflow(positive, negative, size, seed, FLUX_WORKFLOW)
    timeout = 900

    try:
        response = __import__('requests').post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
        response.raise_for_status()
        result = response.json()
        prompt_id = result.get("prompt_id")
        if not prompt_id:
            print(f" ERROR: {result}")
            return False

        print(f"  Queued (prompt={prompt_id[:8]}...)", end="", flush=True)
        for _ in range(timeout):
            time.sleep(1)
            status_resp = __import__('requests').get(f"{COMFYUI_URL}/history/{prompt_id}")
            if status_resp.status_code == 200:
                history = status_resp.json()
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_id, node_output in outputs.items():
                        images = node_output.get("images", [])
                        if images:
                            img_data = images[0]
                            img_url = f"{COMFYUI_URL}/view?filename={img_data['filename']}&subfolder={img_data.get('subfolder', '')}&type=output"
                            img_resp = __import__('requests').get(img_url)
                            img_resp.raise_for_status()
                            os.makedirs(os.path.dirname(output_path), exist_ok=True)
                            with open(output_path, "wb") as f:
                                f.write(img_resp.content)
                            print(f" -> {os.path.basename(output_path)}")
                            return True
            print(".", end="", flush=True)

        print(" TIMEOUT")
        return False
    except __import__('requests').exceptions.ConnectionError:
        print(f"\n  ERROR: Cannot connect to ComfyUI at {COMFYUI_URL}")
        print("  Make sure ComfyUI is running and Flux models are installed.")
        return False
    except Exception as e:
        print(f"\n  ERROR: {e}")
        return False


def generate_card(prompts, card_id, force=False):
    card = next((c for c in prompts["cards"] if c["id"] == card_id), None)
    if not card:
        print(f"Card '{card_id}' not found in prompts")
        return False

    style = prompts["master_style"]["base"]
    prompt = f"{style['positive']}, {card['base']['prompt']}"
    negative = style["negative"]
    seed = card["seed_base"]
    size = tuple(card["size"]) if "size" in card else (768, 1024)

    output_path = OUTPUT_DIR / f"{card_id}_001.webp"

    if output_path.exists() and not force:
        print(f"  {card_id}_001.webp exists (use --force to regenerate)")
        return True

    print(f"\n[{card_id}] {card.get('name', card_id)}")
    return generate_image(prompt, negative, size, seed, output_path, card_id)


def update_manifest(prompts, generated_ids):
    manifest = {"version": "2.0", "art_instances": {}}
    for card in prompts["cards"]:
        if card["id"] in generated_ids:
            instance_key = f"{card['id']}_001"
            manifest["art_instances"][instance_key] = {
                "card_id": card["id"],
                "expansion": "monopoly",
                "copy": 1,
                "seed": card["seed_base"],
                "workflow": "flux",
                "prompt": card["base"]["prompt"],
                "file": f"/art/monopoly/{card['id']}_001.webp",
            }
    os.makedirs(os.path.dirname(MANIFEST_FILE), exist_ok=True)
    with open(MANIFEST_FILE, "w", encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest: {MANIFEST_FILE}")


def main():
    parser = argparse.ArgumentParser(description='Generate Monopoly card art via Flux/ComfyUI')
    parser.add_argument('--card', help='Generate a single card by ID')
    parser.add_argument('--preview', action='store_true', help='Generate first 4 cards as sample')
    parser.add_argument('--force', action='store_true', help='Regenerate existing files')
    args = parser.parse_args()

    try:
        import requests
    except ImportError:
        print("ERROR: requests not installed. Run: pip install requests")
        sys.exit(1)

    prompts = load_prompts()
    cards = prompts["cards"]

    if args.card:
        cards = [c for c in cards if c["id"] == args.card]
    elif args.preview:
        cards = cards[:4]

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generating {len(cards)} Monopoly card art images -> {OUTPUT_DIR}")

    success = []
    failed = []

    for card in cards:
        ok = generate_card(prompts, card["id"], force=args.force)
        if ok:
            success.append(card["id"])
        else:
            failed.append(card["id"])

    if success:
        update_manifest(prompts, success)

    print(f"\n{'='*40}")
    print(f"Done: {len(success)} generated, {len(failed)} failed")
    if failed:
        print(f"Failed: {', '.join(failed)}")
        print("Retry with: python monopoly_batch_gen.py --card <id>")


if __name__ == "__main__":
    main()
