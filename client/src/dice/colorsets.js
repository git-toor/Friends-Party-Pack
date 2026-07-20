const RAW_COLORSETS = {
	'coin_default': {
		name: 'Gold Coin',
		description: 'Gold Dragonhead Coin',
		category: 'Other',
		foreground: '#f6c928',
		background: '#f6c928',
		outline: 'none',
		texture: 'metal'
	},
	'coin_silver': {
		name: 'Silver Coin',
		description: 'Gold Dragonhead Coin',
		category: 'Other',
		foreground: '#f6c928',
		background: '#f6c928',
		outline: 'none',
		texture: 'metal'
	},
    'radiant': {
		name: 'Radiant',
		category: 'Damage Types',
		foreground: '#F9B333',
		background: '#FFFFFF',
		outline: '',
		texture: 'paper',
		description: 'Radiant'
	},
	'fire': {
		name: 'Fire',
		category: 'Damage Types',
		foreground: '#f8d84f',
		background: ['#f8d84f','#f9b02d','#f43c04','#910200','#4c1009'],
		outline: 'black',
		texture: 'fire',
		description: 'Fire'
	},
	'ice': {
		name: 'Ice',
		category: 'Damage Types',
		foreground: '#60E9FF',
		background: ['#214fa3','#3c6ac1','#253f70','#0b56e2','#09317a'],
		outline: 'black',
		texture: 'ice',
		description: 'Ice'
	},
	'poison': {
		name: 'Poison',
		category: 'Damage Types',
		foreground: '#D6A8FF',
		background: ['#313866','#504099','#66409e','#934fc3','#c949fc'],
		outline: 'black',
		texture: 'cloudy',
		description: 'Poison'
	},
	'acid': {
		name: 'Acid',
		category: 'Damage Types',
		foreground: '#A9FF70',
		background: ['#a6ff00', '#83b625','#5ace04','#69f006','#b0f006','#93bc25'],
		outline: 'black',
		texture: 'marble',
		description: 'Acid'
	},
	'thunder': {
		name: 'Thunder',
		category: 'Damage Types',
		foreground: '#FFC500',
		background: '#7D7D7D',
		outline: 'black',
		texture: 'cloudy',
		description: 'Thunder'
	},
	'lightning': {
		name: 'Lightning',
		category: 'Damage Types',
		foreground: '#FFC500',
		background: ['#f17105', '#f3ca40','#eddea4','#df9a57','#dea54b'],
		outline: '#7D7D7D',
		texture: 'ice',
		description: 'Lightning'
	},
	'air': {
		name: 'Air',
		category: 'Damage Types',
		foreground: '#ffffff',
		background: ['#d0e5ea', '#c3dee5','#a4ccd6','#8dafb7','#80a4ad'],
		outline: 'black',
		texture: 'cloudy',
		description: 'Air'
	},
	'water': {
		name: 'Water',
		category: 'Damage Types',
		foreground: '#60E9FF',
		background: ['#87b8c4', '#77a6b2','#6b98a3','#5b8691','#4b757f'],
		outline: 'black',
		texture: 'water',
		description: 'Water'
	},
	'earth': {
		name: 'Earth',
		category: 'Damage Types',
		foreground: '#6C9943',
		background: ['#346804', '#184200','#527f22', '#3a1d04', '#56341a','#331c17','#5a352a','#302210'],
		outline: 'black',
		texture: 'speckles',
		description: 'Earth'
	},
	'force': {
		name: 'Force',
		category: 'Damage Types',
		foreground: 'white',
		background: ['#FF97FF', '#FF68FF','#C651C6'],
		outline: '#570000',
		texture: 'stars',
		description: 'Force'
	},
	'psychic': {
		name: 'Psychic',
		category: 'Damage Types',
		foreground: '#D6A8FF',
		background: ['#313866','#504099','#66409E','#934FC3','#C949FC','#313866'],
		outline: 'black',
		texture: 'speckles',
		description: 'Psychic'
	},
	'necrotic': {
		name: 'Necrotic',
		category: 'Damage Types',
		foreground: '#ffffff',
		background: '#6F0000',
		outline: 'black',
		texture: 'skulls',
		description: 'Necrotic'
	},
    'ocean_depths': {
        name: 'Ocean Depths',
        category: 'Nature',
        foreground: '#B2DFDB',
        background: ['#004D40', '#00695C', '#00796B', '#00897B'],
        outline: '#E0F2F1',
        texture: 'water',
        description: 'Deep and mysterious ocean colors.'
    },
    'forest_canopy': {
        name: 'Forest Canopy',
        category: 'Nature',
        foreground: '#C8E6C9',
        background: ['#1B5E20', '#2E7D32', '#388E3C', '#4CAF50'],
        outline: '#E8F5E9',
        texture: 'wood',
        description: 'Lush greens of a dense forest.'
    },
    'volcanic_fury': {
        name: 'Volcanic Fury',
        category: 'Nature',
        foreground: '#FFCDD2',
        background: ['#BF360C', '#D84315', '#E64A19', '#F4511E'],
        outline: '#FFEBEE',
        texture: 'fire',
        description: 'The raw power of an erupting volcano.'
    },
    'royal_velvet': {
        name: 'Royal Velvet',
        category: 'Themes',
        foreground: '#E1BEE7',
        background: ['#4A148C', '#6A1B9A', '#7B1FA2', '#8E24AA'],
        outline: '#F3E5F5',
        texture: 'marble',
        description: 'Rich purples fit for royalty.'
    },
    'cyberpunk_neon': {
        name: 'Cyberpunk Neon',
        category: 'Themes',
        foreground: '#00E5FF',
        background: ['#D500F9', '#651FFF', '#3D5AFE', '#00B0FF'],
        outline: '#1A237E',
        texture: 'glitter',
        description: 'Vibrant neon lights of a futuristic city.'
    },
	'breebaby': {
		name: 'Pastel Sunset',
		category: 'Custom Sets',
		foreground: ['#5E175E', '#564A5E','#45455E','#3D5A5E','#1E595E','#5E3F3D','#5E1E29','#283C5E','#25295E'],
		background: ['#FE89CF', '#DFD4F2','#C2C2E8','#CCE7FA','#A1D9FC','#F3C3C2','#EB8993','#8EA1D2','#7477AD'],
		outline: 'white',
		texture: 'marble',
		description: 'Pastel Sunset, for Breyanna'
	},
	'pinkdreams': {
		name: 'Pink Dreams',
		category: 'Custom Sets',
		foreground: 'white',
		background: ['#ff007c', '#df73ff','#f400a1','#df00ff','#ff33cc'],
		outline: '#570000',
		texture: 'skulls',
		description: 'Pink Dreams, for Ethan'
	},
	'inspired': {
		name: 'Inspired',
		category: 'Custom Sets',
		foreground: '#FFD800',
		background: '#C4C4B6',
		outline: '#8E8E86',
		texture: 'none',
		description: 'Inspired, for Austin'
	},
	'bloodmoon': {
		name: 'Blood Moon',
		category: 'Custom Sets',
		foreground: '#CDB800',
		background: '#6F0000',
		outline: 'black',
		texture: 'marble',
		description: 'Blood Moon, for Jared'
	},
	'starynight': {
		name: 'Stary Night',
		category: 'Custom Sets',
		foreground: '#4F708F',
		background: ['#091636','#233660','#4F708F','#8597AD','#E2E2E2'],
		outline: 'white',
		texture: 'speckles',
		description: 'Stary Night, for Mai'
	},
	'glitterparty': {
		name: 'Glitter Party',
		category: 'Custom Sets',
		foreground: 'white',
		background: ['#FFB5F5','#7FC9FF','#A17FFF'],
		outline: 'none',
		texture: 'glitter',
		description: 'Glitter Party, for Austin'
	},
	'astralsea': {
		name: 'Astral Sea',
		category: 'Custom Sets',
		foreground: '#565656',
		background: 'white',
		outline: 'none',
		texture: 'astral',
		description: 'The Astral Sea, for Austin'
	},
	'bronze': {
		name: 'Thylean Bronze',
		description: 'Thylean Bronze by @SpencerThayer',
		category: 'Custom Sets',
		foreground: ['#FF9159','#FFB066','#FFBF59','#FFD059'],
		background: ['#705206','#7A4E06','#643100','#7A2D06'],
		outline: ['#3D2D03','#472D04','#301700','#471A04'],
		edge: ['#FF5D0D','#FF7B00','#FFA20D','#FFBA0D'],
		texture: ['bronze01','bronze02','bronze03','bronze03a','bronze03b','bronze04']
	},
	'dragons': {
		name: 'Here be Dragons',
		category: 'Custom Sets',
		foreground: '#FFFFFF',
		// 			[ red,       black,     blue,      green      white      gold,      silver,    bronze,    copper     brass
		background: ['#B80000', '#4D5A5A', '#5BB8FF', '#7E934E', '#FFFFFF', '#F6ED7C', '#7797A3', '#A78437', '#862C1A', '#FFDF8A'],
		outline: 'black',
		texture: ['dragon', 'lizard'],
		description: 'Here be Dragons'
	},
	'birdup': {
		name: 'Bird Up',
		category: 'Custom Sets',
		foreground: '#FFFFFF',
		background: ['#F11602', '#FFC000', '#6EC832', '#0094BC', '#05608D', '#FEABB3', '#F75680', '#F3F0DF', '#C7A57F'],
		outline: 'black',
		texture: 'bird',
		description: 'Bird Up!'
	},
	'tigerking': {
		name: 'Tiger King',
		category: 'Other',
		foreground: '#ffffff',
		background: '#FFCC40',
		outline: 'black',
		texture: ['leopard', 'tiger', 'cheetah'],
		description: 'Leopard Print'
	},
	'covid': {
		name: 'COViD',
		category: 'Other',
		foreground: '#A9FF70',
		background: ['#a6ff00', '#83b625','#5ace04','#69f006','#b0f006','#93bc25'],
		outline: 'black',
		texture: 'fire',
		description: 'Covid-19'
	},
	'acleaf': {
		name: 'Animal Crossing',
		category: 'Other',
		foreground: '#00FF00',
		background: '#07540A',
		outline: 'black',
		texture: 'acleaf',
		description: 'Animal Crossing Leaf'
	},
	'isabelle': {
		name: 'Isabelle',
		category: 'Other',
		foreground: 'white',
		background: '#FEE5CC',
		outline: 'black',
		texture: 'isabelle',
		description: 'Isabelle'
	},
	'thecage': {
		name: 'Nicholas Cage',
		category: 'Other',
		foreground: '#ffffff',
		background: '#ffffff',
		outline: 'black',
		texture: 'thecage',
		description: 'Nicholas Cage'
	},
	'test': {
		name: 'Test',
		category: 'Colors',
		foreground: ['#00FF00','#0000FF','#FF0000'],
		background: ['#FF0000','#00FF00','#0000FF'],
		outline: 'black',
		texture: 'none',
		description: 'Test'
	},
	'rainbow': {
		name: 'Rainblow',
		category: 'Colors',
		foreground: ['#FF5959','#FFA74F','#FFFF56','#59FF59','#2374FF','#00FFFF','#FF59FF'],
		background: ['#900000','#CE3900','#BCBC00','#00B500','#00008E','#008282','#A500A5'],
		outline: 'black',
		texture: 'none',
		description: 'Rainblow'
	},
	'black': {
		name: 'Black',
		category: 'Colors',
		foreground: '#ffffff',
		background: '#000000',
		outline: 'black',
		texture: 'none',
		description: 'Black',
	},
	'white': {
		name: 'White',
		category: 'Colors',
		foreground: '#000000',
		background: '#FFFFFF',
		outline: '#FFFFFF',
		texture: 'none',
		description: 'White'
	},


	'scifi_ability': {
		name: 'Sci-Fi - Ability',
		category: 'Sci-Fi Sets',
		foreground: '#00FF00',
		background: ['#3D9238','#52B848','#5EAC56','#9ECB9A'],
		outline: '#000000',
		texture: 'cloudy_2',
		description: 'Sci-Fi Ability Dice'
	},
	'scifi_proficiency': {
		name: 'Sci-Fi - Proficiency',
		category: 'Sci-Fi Sets',
		foreground: '#FFFF00',
		background: ['#CABB1C','#F9E33B','#FFE900','#F0E49D'],
		outline: '#000000',
		texture: 'paper',
		description: 'Sci-Fi Proficiency Dice'
	},
	'scifi_difficulty': {
		name: 'Sci-Fi - Difficulty',
		category: 'Sci-Fi Sets',
		foreground: '#8000FC',
		background: ['#39165F','#664B84','#50247E','#745F88'],
		outline: '#000000',
		texture: 'cloudy_2',
		description: 'Sci-Fi Difficulty Dice'
	},
	'scifi_challenge': {
		name: 'Sci-Fi - Challenge',
		category: 'Sci-Fi Sets',
		foreground: '#FF0000',
		background: ['#A91F32','#EB4254','#E51836','#BA3645'],
		outline: '#000000',
		texture: 'paper',
		description: 'Sci-Fi Challenge Dice'
	},
	'scifi_boost': {
		name: 'Sci-Fi - Boost',
		category: 'Sci-Fi Sets',
		foreground: '#00FFFF',
		background: ['#4B9DC6','#689FC4','#85CFF2','#8FC0D8'],
		outline: '#000000',
		texture: 'glitter',
		description: 'Sci-Fi Boost Dice'
	},
	'scifi_setback': {
		name: 'Sci-Fi - Setback',
		category: 'Sci-Fi Sets',
		foreground: '#111111',
		background: ['#252223','#241F21','#282828','#111111'],
		outline: '#ffffff',
		texture: 'glitter',
		description: 'Sci-Fi Setback Dice'
	},
	'scifi_force': {
		name: 'Sci-Fi - Force',
		category: 'Sci-Fi Sets',
		foreground: '#000000',
		background: ['#F3F3F3','#D3D3D3','#BABABA','#FFFFFF'],
		outline: '#FFFFFF',
		texture: 'stars',
		description: 'Sci-Fi Force Dice'
	},


	'fleet_red': {
		name: 'Fleet Attack - Red',
		category: 'Fleet Sets',
		foreground: '#ffffff',
		background: ['#440D19','#8A1425','#C72336','#C04551'],
		outline: 'none',
		texture: 'stainedglass',
		description: 'Fleet Red Attack Dice'
	},
	'fleet_blue': {
		name: 'Fleet Attack - Blue',
		category: 'Fleet Sets',
		foreground: '#ffffff',
		background: ['#212642','#28286E','#2B348C','#3D4BB5','#5D64AB'],
		outline: 'none',
		texture: 'stainedglass',
		description: 'Fleet Blue Attack Dice'
	},
	'fleet_black': {
		name: 'Fleet Attack - Black',
		category: 'Fleet Sets',
		foreground: '#ffffff',
		background: ['#252223','#241F21','#282828','#111111'],
		outline: 'none',
		texture: 'stainedglass',
		description: 'Fleet Black Attack Dice'
	},


	'fighter_red': {
		name: 'Fighter Attack - Red',
		category: 'Fighter Sets',
		foreground: '#ffffff',
		background: ['#440D19','#8A1425','#C72336','#C04551'],
		outline: 'none',
		texture: 'stars',
		description: 'Fighter Red Attack Dice'
	},
	'fighter_green': {
		name: 'Fighter Attack - Green',
		category: 'Fighter Sets',
		foreground: '#ffffff',
		background: ['#3D9238','#52B848','#5EAC56','#9ECB9A'],
		outline: 'none',
		texture: 'stars',
		description: 'Fighter Green Attack Dice'
	},


	'legion_atkred': {
		name: 'Legion Attack - Red',
		category: 'Legion Sets',
		foreground: '#ffffff',
		background: ['#440D19','#8A1425','#C72336','#C04551'],
		outline: 'none',
		texture: 'fire',
		description: 'Legion Red Attack Dice'
	},
	'legion_atkblack': {
		name: 'Legion Attack - Black',
		category: 'Legion Sets',
		foreground: '#ffffff',
		background: ['#252223','#241F21','#282828','#111111'],
		outline: 'none',
		texture: 'fire',
		description: 'Legion Black Attack Dice'
	},
	'legion_atkwhite': {
		name: 'Legion Attack - White',
		category: 'Legion Sets',
		foreground: '#000000',
		background: ['#ffffff','#DFF4FA','#BCBCBC','#F1EDE2','#F2ECE0'],
		outline: 'none',
		texture: 'fire',
		description: 'Legion White Attack Dice'
	},
	'legion_defred': {
		name: 'Legion Defense - Red',
		category: 'Legion Sets',
		foreground: '#ffffff',
		background: ['#440D19','#8A1425','#C72336','#C04551'],
		outline: 'none',
		texture: 'fire',
		description: 'Legion Red Defense Dice'
	},
	'legion_defwhite': {
		name: 'Legion Defense - White',
		category: 'Legion Sets',
		foreground: '#000000',
		background: ['#ffffff','#DFF4FA','#BCBCBC','#F1EDE2','#F2ECE0'],
		outline: 'none',
		texture: 'fire',
		description: 'Legion White Defense Dice'
	}
};

function wrap(v) {
  return Array.isArray(v) ? v : [v];
}

function expandColorsets(sets) {
  const result = {};
  for (const [key, cs] of Object.entries(sets)) {
    const bg = cs.background;
    const fg = cs.foreground;
    const ol = cs.outline;
    const ed = cs.edge;
    const tx = cs.texture;

    const bgArr = wrap(bg);
    const fgArr = wrap(fg);
    const olArr = wrap(ol);
    const edArr = wrap(ed);
    const txArr = wrap(tx);

    const bgIsArr = Array.isArray(bg);
    const fgIsArr = Array.isArray(fg);
    const olIsArr = Array.isArray(ol);
    const edIsArr = Array.isArray(ed);
    const txIsArr = Array.isArray(tx);

    if (!bgIsArr && !fgIsArr && !olIsArr && !edIsArr && !txIsArr) {
      result[key] = cs;
      continue;
    }

    let counter = 1;

    if (bgIsArr) {
      const bgLen = bgArr.length;
      for (let i = 0; i < bgLen; i++) {
        const fgP = fgIsArr && fgArr.length === bgLen;
        const olP = olIsArr && olArr.length === bgLen;
        const edP = edIsArr && edArr.length === bgLen;
        const txP = txIsArr && txArr.length === bgLen;

        const texItems = txP ? [txArr[i]] : txArr;
        for (const t of texItems) {
          const nk = `${key}_${counter}`;
          result[nk] = {
            ...cs,
            background: bgArr[i],
            foreground: fgP ? fgArr[i] : fg,
            outline: olP ? olArr[i] : ol,
            edge: edP ? edArr[i] : ed,
            texture: txIsArr ? t : tx,
            name: `${cs.name} ${counter}`,
          };
          counter++;
        }
      }
    } else if (txIsArr) {
      for (const t of txArr) {
        const nk = `${key}_${counter}`;
        result[nk] = {
          ...cs,
          texture: t,
          name: `${cs.name} ${counter}`,
        };
        counter++;
      }
    }

  }
  return result;
}

export const COLORSETS = expandColorsets(RAW_COLORSETS);