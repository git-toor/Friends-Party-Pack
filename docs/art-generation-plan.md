# Card Art Generation Plan

## 1. Deck Composition Reference

Full counts for every card type across all expansions:

| id | name | expansion | copies |
|---|---|---|---|
| exploding_kitten | Exploding Kitten | base | players - 1 (max 4) |
| defuse | Defuse | base | 6 |
| attack | Attack | base | 4 |
| skip | Skip | base | 4 |
| favor | Favor | base | 4 |
| shuffle | Shuffle | base | 4 |
| nope | Nope | base | 5 |
| see_future_3x | See the Future | base | 5 |
| tacocat | Tacocat | base | 4 |
| cattermelon | Cattermelon | base | 4 |
| hairy_potato_cat | Hairy Potato Cat | base | 4 |
| beard_cat | Beard Cat | base | 4 |
| rainbow_ralphing_cat | Rainbow-Ralphing Cat | base | 4 |
| imploding_kitten | Imploding Kitten | imploding | 1 |
| reverse | Reverse | imploding | 4 |
| alter_future_3x | Alter the Future (3) | imploding | 4 |
| draw_from_bottom | Draw from the Bottom | imploding | 4 |
| targeted_attack | Targeted Attack | imploding | 3 |
| feral_cat | Feral Cat | imploding | 4 |
| streaking_kitten | Streaking Kitten | streaking | 1 |
| exploding_kitten_extra | Exploding Kitten (extra) | streaking | 1 |
| super_skip | Super Skip | streaking | 1 |
| see_future_5x | See the Future (5) | streaking | 1 |
| alter_future_5x | Alter the Future (5) | streaking | 1 |
| swap_top_bottom | Swap Top and Bottom | streaking | 3 |
| garbage_collection | Garbage Collection | streaking | 1 |
| catomic_bomb | Catomic Bomb | streaking | 1 |
| mark | Mark | streaking | 3 |
| curse_cat_butt | Curse of the Cat Butt | streaking | 2 |
| barking_kitten | Barking Kitten | barking | 2 |
| tower_of_power | Tower of Power | barking | 1 |
| personal_attack | Personal Attack (3×) | barking | 4 |
| potluck | Potluck | barking | 2 |
| bury | Bury | barking | 2 |
| share_future_3x | Share the Future | barking | 2 |
| ill_take_that | I'll Take That | barking | 4 |
| super_skip_extra | Super Skip | barking | 2 |
| alter_future_3x_extra | Alter the Future (3) | barking | 1 |
| zombie_kitten | Zombie Kitten | zombie | 5 |
| exploding_kitten_z | Exploding Kitten | zombie | 4 |
| defuse_z | Defuse | zombie | 2 |
| attack_z | Attack | zombie | 4 |
| skip_z | Skip | zombie | 3 |
| shuffle_z | Shuffle | zombie | 2 |
| see_future_3x_z | See the Future | zombie | 4 |
| nope_z | Nope | zombie | 5 |
| clairvoyance | Clairvoyance | zombie | 2 |
| clone | Clone | zombie | 2 |
| dig_deeper | Dig Deeper | zombie | 4 |
| feed_the_dead | Feed the Dead | zombie | 4 |
| grave_robber | Grave Robber | zombie | 2 |
| attack_of_the_dead | Attack of the Dead | zombie | 3 |
| shuffle_now | Shuffle Now | zombie | 2 |
| favor_z | Favor | zombie | 2 |

## 2. Card Definition Structure

Each card type is defined with its identity, mechanics, and art references.

```json
{
  "id": "reverse",
  "name": "Reverse",
  "subtitle": "Reverse turn order.",
  "expansion": "imploding",
  "frame_color": "cyan",
  "icon": "🔁",
  "rarity": "common",
  "playable": {},
  "effect": { "type": "REVERSE_DIRECTION" },
  "category": "action",
  "copies": 4,
  "art_count": 4
}
```

For variable-count cards:
```json
{
  "id": "exploding_kitten",
  "expansion": "base",
  "copies": "(players) => players - 1",
  "art_count": 4
}
```

## 3. Art Instance Structure

Every copy of a card gets a unique art instance. Art files are organized by expansion directory.

```
client/public/art/
├── base/
│   ├── defuse_001.webp
│   ├── defuse_002.webp
│   ├── defuse_003.webp
│   ├── defuse_004.webp
│   ├── defuse_005.webp
│   ├── defuse_006.webp
│   ├── attack_001.webp
│   ├── attack_002.webp
│   ├── attack_003.webp
│   ├── attack_004.webp
│   ├── nope_001.webp
│   ├── nope_002.webp
│   ├── nope_003.webp
│   ├── nope_004.webp
│   ├── nope_005.webp
│   └── ...
├── imploding/
│   ├── reverse_001.webp
│   ├── reverse_002.webp
│   ├── reverse_003.webp
│   ├── reverse_004.webp
│   └── ...
├── streaking/
│   └── ...
├── barking/
│   └── ...
└── zombie/
    └── ...
```

### Art Manifest JSON

```json
{
  "version": "2.0",
  "art_instances": {
    "reverse_001": {
      "card_id": "reverse",
      "variant": "base",
      "prompt": "funny cartoon cat pressing a giant red rewind button...",
      "seed": 8888,
      "workflow": "flux",
      "file": "/art/imploding/reverse_001.webp"
    },
    "reverse_002": {
      "card_id": "reverse",
      "variant": "base",
      "prompt": "a goofy zombie cat with one empty eye socket...",
      "seed": 8889,
      "workflow": "flux",
      "file": "/art/imploding/reverse_002.webp"
    },
    "reverse_003": {
      "card_id": "reverse",
      "variant": "base",
      "prompt": "...",
      "seed": 8890,
      "workflow": "flux",
      "file": "/art/imploding/reverse_003.webp"
    },
    "reverse_004": {
      "card_id": "reverse",
      "variant": "base",
      "prompt": "...",
      "seed": 8891,
      "workflow": "flux",
      "file": "/art/imploding/reverse_004.webp"
    }
  }
}
```

## 4. AI Art Workflow

### Current Workflows Supported

| Name | Model | Sampler | Steps | CFG | Notes |
|---|---|---|---|---|---|
| flux | Flux Dev | euler / normal | 28 | 1.0 | Best quality, slowest |
| scribble | SDXL Base + ControlNet | dpmpp_2m / karras | 25+25 | 7.0 | Two-stage with edge control |
| dreamshaper | DreamShaper XL alpha2 | dpmpp_2m / karras | 35+15 | 6.0 | Backup |
| wildcard | WildCardX-XL V4 | dpmpp_2m / karras | 35+15 | 6.0 | Backup |
| animagine | Animagine XL 4.0 Opt | dpmpp_2m / karras | 30+15 | 5.0 | Anime style |
| sdxl_base | SDXL Base 1.0 | euler / normal | 25 | 7.0 | Plain baseline |

### Generation Process

```
User provides prompt
        ↓
Save prompt → update manifest
        ↓
Generate with ComfyUI (flux workflow currently best)
        ↓
Save art file → art/{expansion}/{card_id}_{NNN}.webp
        ↓
User reviews → approve / modify prompt → regenerate
        ↓
Next copy or next card
```

### New Reference Prompt Overlay

Current master style prefix (prepended to every card prompt):

```
cute mascot character illustration, western cartoon style,
clean line art, flat colors, simple shapes,
game character design, sticker illustration,
professional children's card game artwork
```

Current negative prompt:
```
sketch, rough drawing, unfinished, messy lines, pencil, scribble,
hand drawn, doodle, text, letters, words, numbers, logos, watermark,
signature, photorealistic, 3d render, bad anatomy, extra limbs,
blurry, low quality, duplicate character, dark horror
```

## 5. Game Engine Integration

The `buildDeck` function in `GameEngine.ts` constructs the deck from card definitions. For each card copy, it will:

1. Look up the card definition (copies, effect, etc.)
2. Assign a unique art instance from `art_instances`
3. Store the art reference in the `Card` object

```typescript
interface Card {
  type: CardType;
  // ... game logic fields ...
  artId: string; // e.g. "reverse_002"
}
```

The client renders: `<CardImage artId={card.artId} />` looking up the file path from `art_instances[artId].file`.

## 6. Future: American Sitcom Themed Cards

Add a new "sitcom" expansion with cards featuring cats as characters from popular American sitcoms:

- **The Office** — Dwight cat, Jim cat, Pam cat, Michael cat, etc.
- **Friends** — Ross cat, Rachel cat, Chandler cat, etc.
- **How I Met Your Mother** — Ted cat, Barney cat, etc.
- **Parks and Recreation** — Leslie cat, Ron cat, etc.
- **The Big Bang Theory** — Sheldon cat, Leonard cat, etc.

Style direction: cat face on human body wearing character's signature outfit, with character's hairstyle and accessories. Currently unresolved — Flux strongly defaults to generic orange cartoon cat regardless of prompt specificity. May need:

- Fine-tuned model or LoRA for sitcom character recognition
- IPAdapter with reference images
- Alternative model better at specific character prompt following

## 7. Current Generation State

All 161 art instances generated via batch script (`_batch_gen.py`) using Flux Dev workflow.
Manifest at `client/public/art/manifest.json`.

Artwork can be replaced one by one — user provides new prompt, same seed regenerates, manifest is updated.
