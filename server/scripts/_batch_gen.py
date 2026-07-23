import requests, time, json, sys, os
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"

script_dir = Path(__file__).parent
with open(script_dir / "card-prompts.json", encoding="utf-8") as f:
    prompts_data = json.load(f)

style = prompts_data["master_style"]["base"]["positive"]
negative = prompts_data["master_style"]["base"]["negative"]

# (card_id, copy, seed, expansion, prompt)
queue = [

    # === Already done: reverse 1-4, exploding_kitten 1-4, defuse 1-6, attack_001 ===
    # Remaining cards below:

    # === BASE DECK ===
    # Attack (4 total, 1 done)
    ("attack", 2, 3002, "base", "a cat general commanding a tiny army of toy cats to charge at another cat, dramatic battle pose"),
    ("attack", 3, 3003, "base", "a cat using a giant slingshot to launch cards at another cat, mischievous grin"),
    ("attack", 4, 3004, "base", "a ninja cat sneaking up behind another cat and tapping its shoulder with a turn card, tactical ambush"),

    # Skip (4)
    ("skip", 1, 3101, "base", "a cat lounging in a hammock with a skip sign, relaxed not-interested expression"),
    ("skip", 2, 3102, "base", "a cat fast-forwarding a remote control at another cat who disappears in a blur"),
    ("skip", 3, 3103, "base", "a cat hitting a giant NOPE IM OUT button and sliding away on a escape rope"),
    ("skip", 4, 3104, "base", "a cat hiding under a cardboard box with not my turn written on it"),

    # Favor (4)
    ("favor", 1, 3201, "base", "a cat holding out an open palm to another cat expecting a card, smug smile"),
    ("favor", 2, 3202, "base", "a cat wearing a tiny thief mask stealthily taking a card from another cat's stack"),
    ("favor", 3, 3203, "base", "a cat trading a fish for a card with another cat, marketplace style"),
    ("favor", 4, 3204, "base", "a cat pointing a tiny gimme finger gun at another cat, playful demand"),

    # Shuffle (4)
    ("shuffle", 1, 3301, "base", "a cat DJ mixing decks of cards like turntables, cool headphone look"),
    ("shuffle", 2, 3302, "base", "a cat magician shuffling cards with a flourish, cards flying everywhere"),
    ("shuffle", 3, 3303, "base", "a cat putting cards into a giant washing machine on shuffle mode"),
    ("shuffle", 4, 3304, "base", "a cat spinning a giant wheel with card symbols, random chaotic energy"),

    # Nope (5)
    ("nope", 1, 3401, "base", "a cat holding up a giant red NOPE stop sign, serious unimpressed expression"),
    ("nope", 2, 3402, "base", "a cat covering another cat's mouth with a paw, shushing them firmly"),
    ("nope", 3, 3403, "base", "a cat grabbing a card mid-air that another cat just played, nah expression"),
    ("nope", 4, 3404, "base", "a cat with a giant X stamp stamping out a card being played"),
    ("nope", 5, 3405, "base", "a cat crossing its arms in front of its face making an X blocking pose"),

    # See the Future 3x (5)
    ("see_future_3x", 1, 3501, "base", "a cat looking through a telescope at 3 visible cards in the distance"),
    ("see_future_3x", 2, 3502, "base", "a cat with a glowing magic crystal ball showing 3 cards inside"),
    ("see_future_3x", 3, 3503, "base", "a cat wearing a fortune teller turban peeking at 3 cards under a cup"),
    ("see_future_3x", 4, 3504, "base", "a cat using binoculars to spy on the top of the deck"),
    ("see_future_3x", 5, 3505, "base", "a cat reading 3 cards like a comic strip, dramatic lighting"),

    # Tacocat (4)
    ("tacocat", 1, 3601, "base", "a cute cat taco hybrid dancing with maracas, lively fiesta energy"),
    ("tacocat", 2, 3602, "base", "a taco shell with cat ears peeking out, funny surprised expression"),
    ("tacocat", 3, 3603, "base", "a cat wrapped in a giant tortilla like a burrito, spicy energy"),
    ("tacocat", 4, 3604, "base", "a taco cat superhero flying with a cape made of lettuce"),

    # Cattermelon (4)
    ("cattermelon", 1, 3701, "base", "a watermelon slice with cat face features and cute ears"),
    ("cattermelon", 2, 3702, "base", "a cat sitting inside a giant watermelon like a boat, happy expression"),
    ("cattermelon", 3, 3703, "base", "a cat juggling watermelon slices, silly circus energy"),
    ("cattermelon", 4, 3704, "base", "a cat that is half-watermelon getting carried away by birds"),

    # Hairy Potato Cat (4)
    ("hairy_potato_cat", 1, 3801, "base", "a hairy potato with cat ears and whiskers, grumpy expression"),
    ("hairy_potato_cat", 2, 3802, "base", "a cat made of potato with hair sprouting everywhere, surprised look"),
    ("hairy_potato_cat", 3, 3803, "base", "a potato body with cat head, trying to be elegant and failing"),
    ("hairy_potato_cat", 4, 3804, "base", "a hairy potato cat rolling downhill, panicked expression"),

    # Beard Cat (4)
    ("beard_cat", 1, 3901, "base", "a cat with a huge magnificent beard, looking proud and distinguished"),
    ("beard_cat", 2, 3902, "base", "a wizard cat with a long flowing beard, casting a spell"),
    ("beard_cat", 3, 3903, "base", "a hipster cat with a perfectly groomed beard and tiny glasses"),
    ("beard_cat", 4, 3904, "base", "a bearded cat doing a rockstar guitar pose, cool sunglasses"),

    # Rainbow-Ralphing Cat (4)
    ("rainbow_ralphing_cat", 1, 4001, "base", "a cat vomiting a colorful rainbow, disgusted but funny expression"),
    ("rainbow_ralphing_cat", 2, 4002, "base", "a cat with rainbow vomit spraying everywhere, chaotic colorful scene"),
    ("rainbow_ralphing_cat", 3, 4003, "base", "a cat vomiting rainbows while riding a tiny unicorn"),
    ("rainbow_ralphing_cat", 4, 4004, "base", "cats catching the rainbow vomit in buckets, funny chaotic scene"),

    # === IMPLODING KITTENS ===
    # Imploding Kitten (1)
    ("imploding_kitten", 1, 5001, "imploding", "a kitten being sucked into a swirling black hole vortex, dramatic funny expression"),

    # Alter the Future 3x (4) - imploding
    ("alter_future_3x", 1, 5101, "imploding", "a cat rearranging 3 cards on a table with a magic wand, mischievous smile"),
    ("alter_future_3x", 2, 5102, "imploding", "a cat editing 3 cards like a movie director cutting scenes"),
    ("alter_future_3x", 3, 5103, "imploding", "a cat swapping 3 cards using puppeteer strings, dramatic pose"),
    ("alter_future_3x", 4, 5104, "imploding", "a cat shuffling 3 cards with a sneaky plan, evil grin"),

    # Draw from the Bottom (4)
    ("draw_from_bottom", 1, 5201, "imploding", "a cat pulling a card from the bottom of a huge towering deck"),
    ("draw_from_bottom", 2, 5202, "imploding", "a cat hanging upside down to draw from the bottom, confused expression"),
    ("draw_from_bottom", 3, 5203, "imploding", "a cat using a fishing rod to pull a card from the decks bottom"),
    ("draw_from_bottom", 4, 5204, "imploding", "a cat digging under the deck like a miner, hard hat on"),

    # Targeted Attack (3)
    ("targeted_attack", 1, 5301, "imploding", "a cat aiming a slingshot at a specific cat with a target on them"),
    ("targeted_attack", 2, 5302, "imploding", "a cat sniper with a dart gun targeting another cat, focused expression"),
    ("targeted_attack", 3, 5303, "imploding", "a cat putting a dartboard on another cat's back, aiming pose"),

    # Feral Cat (4)
    ("feral_cat", 1, 5401, "imploding", "a wild messy cat with crazy eyes and sharp claws out, hissing"),
    ("feral_cat", 2, 5402, "imploding", "a cat wearing a trash can lid like armor, feral battle stance"),
    ("feral_cat", 3, 5403, "imploding", "a cat swinging from a chandelier, wild jungle energy"),
    ("feral_cat", 4, 5404, "imploding", "a cat with leaves and twigs stuck in its fur, freshly wild"),

    # === STREAKING KITTENS ===
    ("streaking_kitten", 1, 6001, "streaking", "a blur of cat fur running super fast, naked embarrassed expression, motion lines"),
    ("exploding_kitten_extra", 1, 6002, "streaking", "a kitten sweating nervously while holding a ticking bomb, oh no moment"),
    ("super_skip", 1, 6003, "streaking", "a cat with a superhero cape zooms past multiple turn signs"),
    ("see_future_5x", 1, 6004, "streaking", "a cat looking through a giant telescope at 5 cards in the distance"),
    ("alter_future_5x", 1, 6005, "streaking", "a cat juggling 5 cards in the air, rearranging them magically"),
    ("swap_top_bottom", 1, 6006, "streaking", "a cat swapping the top and bottom cards of a tower, cheeky grin"),
    ("swap_top_bottom", 2, 6007, "streaking", "a cat with one hand on top card and one on bottom, switching them"),
    ("swap_top_bottom", 3, 6008, "streaking", "a magician cat performing a top to bottom swap trick, audience watching"),
    ("garbage_collection", 1, 6009, "streaking", "a cat taking out a trash bag full of unwanted cards"),
    ("catomic_bomb", 1, 6010, "streaking", "a cat wearing a bomb suit with a lit fuse on its tail, panicked run"),
    ("mark", 1, 6011, "streaking", "a cat marking territory beside a card tower, proud silly expression"),
    ("mark", 2, 6012, "streaking", "a cat putting a stamp on a card, claiming ownership smugly"),
    ("mark", 3, 6013, "streaking", "a cat drawing attention to a specific card with a giant marker"),
    ("curse_cat_butt", 1, 6014, "streaking", "a cartoon cat butt with a cursed spooky aura, green magical smoke"),
    ("curse_cat_butt", 2, 6015, "streaking", "a cat butt with a comedic angry face, cursed energy swirling"),

    # === BARKING KITTENS ===
    ("barking_kitten", 1, 7001, "barking", "a cute kitten trying to bark like a dog, confused expression"),
    ("barking_kitten", 2, 7002, "barking", "a kitten wearing a puppy mask barking at another cat"),
    ("tower_of_power", 1, 7003, "barking", "a cat wearing a tall tower of cards on its head like a crown"),
    ("personal_attack", 1, 7004, "barking", "a cat attacking its own reflection in a mirror, confused"),
    ("personal_attack", 2, 7005, "barking", "a cat with multiple arms holding weapons all aimed at itself"),
    ("personal_attack", 3, 7006, "barking", "a cat painting a target on its own chest, silly kamikaze pose"),
    ("personal_attack", 4, 7007, "barking", "a cat hitting itself with a hammer labeled 3 turns, painful comedy"),
    ("potluck", 1, 7008, "barking", "multiple cats each throwing a card into a giant cooking pot"),
    ("potluck", 2, 7009, "barking", "cats stirring a cauldron full of cards, potluck chaos"),
    ("bury", 1, 7010, "barking", "a cat burying a card in a sand pile with a tiny shovel"),
    ("bury", 2, 7011, "barking", "a cat hiding a card under a pile of other cards, sneaky look"),
    ("share_future_3x", 1, 7012, "barking", "two cats looking at 3 cards together, sharing a secret"),
    ("share_future_3x", 2, 7013, "barking", "a cat showing 3 cards to another cat over their shoulder"),
    ("ill_take_that", 1, 7014, "barking", "a cat snatching a card from another cat's hand, greedy grin"),
    ("ill_take_that", 2, 7015, "barking", "a cat using a magnet on a string to steal a card"),
    ("ill_take_that", 3, 7016, "barking", "a cat swapping its card for another cats card while they arent looking"),
    ("ill_take_that", 4, 7017, "barking", "a cat flexing its muscles and taking a card by force"),
    ("super_skip_barking", 1, 7018, "barking", "a cat wearing a turbo boost backpack zooming past a turn"),
    ("super_skip_barking", 2, 7019, "barking", "a cat using rocket boots to launch over the turn, cool pose"),
    ("alter_future_3x_barking", 1, 7020, "barking", "a cat editing 3 cards with scissors and tape, crafty expression"),

    # === ZOMBIE KITTENS ===
    ("zombie_kitten", 1, 8001, "zombie", "a cute zombie kitten with stitched patches and glowing green eyes, goofy smile"),
    ("zombie_kitten", 2, 8002, "zombie", "a zombie kitten dragging its torn stuffed toy, shambling forward"),
    ("zombie_kitten", 3, 8003, "zombie", "a zombie kitten with its brain visible through a crack, still cute"),
    ("zombie_kitten", 4, 8004, "zombie", "a zombie kitten wearing a tiny party hat, undead celebration"),
    ("zombie_kitten", 5, 8005, "zombie", "a zombie kitten clawing out of a tiny grave, playful undead energy"),
    ("exploding_kitten_z", 1, 8006, "zombie", "a zombie kitten sitting on a ticking bomb, drooling, unaware"),
    ("exploding_kitten_z", 2, 8007, "zombie", "a zombie kitten trying to eat a bomb, bad idea expression"),
    ("exploding_kitten_z", 3, 8008, "zombie", "a zombie kitten using a bomb as a pillow, sleeping peacefully"),
    ("exploding_kitten_z", 4, 8009, "zombie", "a zombie kitten juggling multiple bombs, dangerous comedy"),
    ("defuse_z", 1, 8010, "zombie", "a zombie cat in a bomb disposal suit, clumsily trying to help"),
    ("defuse_z", 2, 8011, "zombie", "a zombie cat chewing on the wrong wire, panicked expression"),
    ("attack_z", 1, 8012, "zombie", "a zombie cat leading a horde of zombie toys to attack"),
    ("attack_z", 2, 8013, "zombie", "a zombie cat throwing its own arm like a boomerang at another cat"),
    ("attack_z", 3, 8014, "zombie", "a zombie cat commanding ghost cats to attack, spooky army"),
    ("attack_z", 4, 8015, "zombie", "a zombie cat using a catapult to launch itself at the enemy"),
    ("skip_z", 1, 8016, "zombie", "a zombie cat slowly shuffling away from its turn, dragging foot"),
    ("skip_z", 2, 8017, "zombie", "a zombie cat pretending to be dead to skip its turn, one eye open"),
    ("skip_z", 3, 8018, "zombie", "a zombie cat hiding in a coffin instead of taking its turn"),
    ("shuffle_z", 1, 8019, "zombie", "a zombie cat shuffling cards with rotting paws, cards go flying"),
    ("shuffle_z", 2, 8020, "zombie", "a zombie cat shuffling cards inside a tomb, spooky atmosphere"),
    ("see_future_3x_z", 1, 8021, "zombie", "a zombie cat looking into a cracked crystal ball at 3 cards"),
    ("see_future_3x_z", 2, 8022, "zombie", "a zombie cat reading the future from scattered bones, 3 cards shown"),
    ("see_future_3x_z", 3, 8023, "zombie", "a zombie cat using a ouija board to reveal 3 cards"),
    ("see_future_3x_z", 4, 8024, "zombie", "a zombie cat peeking through a grave crack at 3 cards"),
    ("nope_z", 1, 8025, "zombie", "a zombie cat grabbing a card with bony hands, nope expression"),
    ("nope_z", 2, 8026, "zombie", "a zombie cat using its stitched mouth to muffle a card play"),
    ("nope_z", 3, 8027, "zombie", "a zombie cat rising from a grave to block a card MID AIR"),
    ("nope_z", 4, 8028, "zombie", "a zombie cat holding a gravestone with NOPE carved on it"),
    ("nope_z", 5, 8029, "zombie", "a zombie cat spitting out a card that was just played, gross but effective"),
    ("clairvoyance", 1, 8030, "zombie", "a cat with a glowing third eye on its forehead, psychic swirls"),
    ("clairvoyance", 2, 8031, "zombie", "a cat floating in meditation, surrounded by psychic energy"),
    ("clone", 1, 8032, "zombie", "two identical cats in a cloning machine, sci-fi lab sparkles"),
    ("clone", 2, 8033, "zombie", "a cat looking at its exact copy in confusion, which is real"),
    ("dig_deeper", 1, 8034, "zombie", "a cat digging through a massive pile of cards with determination"),
    ("dig_deeper", 2, 8035, "zombie", "a cat using a tiny excavator to dig through cards"),
    ("dig_deeper", 3, 8036, "zombie", "a cat drilling through a card tower, hard hat and goggles"),
    ("dig_deeper", 4, 8037, "zombie", "a cat unearthing a glowing card from deep in the deck"),
    ("feed_the_dead", 1, 8038, "zombie", "living cats throwing food to a zombie cat behind a fence"),
    ("feed_the_dead", 2, 8039, "zombie", "a zombie cat being fed cards through a slot, hungry undead"),
    ("feed_the_dead", 3, 8040, "zombie", "cats offering cards to a zombie cat chained up, careful poses"),
    ("feed_the_dead", 4, 8041, "zombie", "a zombie cat eating cards like snacks, crumbs everywhere"),
    ("grave_robber", 1, 8042, "zombie", "a cat digging up a card from a tiny grave with a shovel"),
    ("grave_robber", 2, 8043, "zombie", "a cat wearing a burglary mask stealing cards from a tomb"),
    ("attack_of_the_dead", 1, 8044, "zombie", "zombie cats rising from graves and attacking, arms reaching"),
    ("attack_of_the_dead", 2, 8045, "zombie", "zombie cats swarming a living cat, undead horde attack"),
    ("attack_of_the_dead", 3, 8046, "zombie", "a living cat running from zombie cats, chaotic chase scene"),
    ("shuffle_now", 1, 8047, "zombie", "a zombie cat frantically shuffling cards with rotting urgency"),
    ("shuffle_now", 2, 8048, "zombie", "a zombie cat shuffling cards inside a casket, spooky speed"),
    ("favor_z", 1, 8049, "zombie", "a zombie cat extending a rotting paw, asking for a card favor"),
    ("favor_z", 2, 8050, "zombie", "a zombie cat using mind control to make another cat give a card"),
]

base_dir = Path(__file__).parent.parent.parent / "client" / "public" / "art"

def generate(card_id, copy, seed, expansion, prompt_text):
    art_id = f"{card_id}_{copy:03d}"
    out_path = base_dir / expansion / f"{art_id}.webp"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    positive = f"{style}, {prompt_text}"

    workflow = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev.safetensors"}},
        "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux"}},
        "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["dual_clip", 0]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
        "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "ksampler": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": 28, "cfg": 1.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0], "latent_image": ["empty", 0]}},
        "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "art_gen", "images": ["vae_decode", 0]}},
    }

    resp = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
    pid = resp.json()["prompt_id"]

    for i in range(1200):
        time.sleep(1)
        r = requests.get(f"{COMFYUI_URL}/history/{pid}")
        if r.status_code == 200 and r.json().get(pid):
            for out in r.json()[pid]["outputs"].values():
                for img in out.get("images", []):
                    img_r = requests.get(f"{COMFYUI_URL}/view?filename={img['filename']}&type=output")
                    with open(out_path, "wb") as f:
                        f.write(img_r.content)
                    kb = os.path.getsize(out_path) // 1024
                    print(f"  {art_id} ({kb}KB)")
                    return True
        if i % 30 == 0:
            print(f"  {art_id}...", end="", flush=True)
    print(f"  {art_id} TIMEOUT")
    return False

total = len(queue)
for idx, (card_id, copy, seed, exp, prompt_text) in enumerate(queue):
    print(f"[{idx+1}/{total}] ", end="", flush=True)
    generate(card_id, copy, seed, exp, prompt_text)

# Build manifest
manifest = {"version": "2.0", "art_instances": {}}

# Add existing from current manifest
manifest_path = base_dir / "manifest.json"
if manifest_path.exists():
    with open(manifest_path, encoding="utf-8") as f:
        existing = json.load(f)
    manifest["art_instances"] = existing.get("art_instances", {})

# Add newly generated from the queue
for card_id, copy, seed, exp, prompt_text in queue:
    art_id = f"{card_id}_{copy:03d}"
    manifest["art_instances"][art_id] = {
        "card_id": card_id,
        "expansion": exp,
        "copy": copy,
        "seed": seed,
        "workflow": "flux",
        "prompt": prompt_text,
        "file": f"/art/{exp}/{art_id}.webp"
    }

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"\nManifest updated: {manifest_path}")
