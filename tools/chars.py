# Prompt data for sprite generation (tools/gen_sprites.py).
STYLE = ("cute chibi anime character, One Piece fan art, super deformed proportions with a big head and small body, "
         "thick clean black outlines, flat cel shading, bright vivid colors, full body visible from head to feet, "
         "plain pure white background, no shadow, no ground, no text, no border")

CHARS = {
    'imu': ("Imu", "Imu, the hidden god-king of the World Government, in his demon form: dark brown skin, long wild white hair falling over his left eye, two black curved demon horns, red eyes with black ringed pupils, angry frown, black fur-trimmed cloak over a muscular bare chest, black furry belt with two gold rings, yellow and black striped cloth over baggy black pants, black spiked bracelets, two large black flame-shaped demon wings behind him covered with many red eyes, holding ONE single long black glaive: a straight black pole with a curved zigzag blade only at the top end and a round black cap at the bottom end; no other sword, knife or dagger anywhere", 'staff', 'black Omen flames and red eyes'),
    'luffy': ("Monkey D. Luffy", "straw hat with a red band, messy black hair, small scar under his left eye, open red short-sleeve vest showing an X-shaped chest scar, blue denim shorts with a yellow sash, sandals, huge grin", 'punch', 'rubber stretching'),
    'luffy_g5': ("Monkey D. Luffy in Gear 5", "Gear 5 Sun God form: fluffy wavy white hair, white smoke-like curls around his neck like a scarf, glowing red-ringed eyes, huge joyful toothy grin, white open shirt, white baggy pants with a purple sash, sandals, everything white and bouncy like rubber", 'punch', 'white bouncy rubber clouds'),
    'chopper_mp': ("Tony Tony Chopper in Monster Point form", "gigantic hulking furry monster reindeer, massive shaggy brown fur body with huge broad shoulders, very long powerful arms with big dark hands, short legs with hooves, huge branching antlers, glowing white eyes, tiny pink top hat with a white X on his head, dark red shorts, menacing pose, empty hands holding nothing", 'punch', 'brown fur'),
    'zoro': ("Roronoa Zoro", "messy spiky moss-green hair with pointed tufts sticking out in every direction (not a buzz cut, not smooth), scar over his closed left eye, three gold earrings on his left ear, smirking, green kimono-style robe with a red sash, dark pants, black boots, he holds exactly two katana, one in each hand, mouth closed with nothing in it; his red sash and his hips are completely empty, no scabbards, no sheaths", 'sword', 'blue sword slash'),
    'nami': ("Nami", "long wavy orange hair, blue and white striped top, blue jeans, sandals, holding a blue segmented staff, confident smile, her weapon is the Clima-Tact: one straight, unbroken light-blue staff made of joined segments", 'staff', 'lightning'),
    'usopp': ("Usopp", "white bucket hat with orange goggles on it, very long nose with a rounded tip, big wild curly black hair spilling out under the hat, wide toothy grin, warm light caramel-brown skin exactly the same tone as the reference image (not dark brown), shirtless under an open brown fur-lined vest, baggy pale yellow pants, brown boots, no slingshot on his belt or hip (he only holds his slingshot when he shoots)", 'punch', 'fire'),
    'sanji': ("Sanji", "blond hair covering one eye, curly spiral eyebrow, small goatee, black suit with a blue shirt and dark tie, black dress shoes", 'kick', 'fire'),
    'chopper': ("Tony Tony Chopper", "tiny cute reindeer mascot only half as tall as a person, very round little body, short stubby arms and legs with hooves, huge head, cute animal face with no human features, big blue hat with a pink brim and a white X cross, brown antlers poking out, small blue nose, orange and white vertical striped shirt, orange shorts, big round shiny black eyes with a white highlight dot, the same eyes in every pose", 'punch', 'pink'),
    'robin': ("Nico Robin", "tall woman, long straight black hair with bangs, orange goggles on her head, blue eyes, short blue crop top, long flowing pink skirt with green leaf pattern, calm smile", 'kick', 'pink flower petals'),
    'franky': ("Franky", "cyborg with an inverted triangle body: enormous broad shoulders and chest, gigantic red-and-blue robotic forearms with big metal fists, tiny short skinny legs; exactly two arms and two hands, no extra hands; tall spiky blue pompadour, metal nose, wide grin, open red shirt, red speedo", 'punch', 'blue laser'),
    'brook': ("Brook", "Soul King Brook: tall thin skeleton, big black afro with a golden crown on top, pink heart-shaped sunglasses, wide open grinning skull jaw, huge fluffy orange fur coat over a black suit, blue cravat, pink pants with flower pattern, his cane sword: a perfectly straight, thin, unbent silver blade with a purple curved cane handle", 'sword', 'icy blue souls'),
    'jinbe': ("Jinbe", "massive whale-like fishman with a huge round barrel body, very wide and bulky with a big belly, short thick legs, huge thick arms, light blue skin, two big white tusks, black topknot hair, orange kimono with blue patterns, red haori, purple sash, wooden sandals", 'punch', 'water'),
    'akainu': ("Admiral Akainu", "tall broad-shouldered middle-aged man with a fierce scowling square-jawed face, heavy furrowed brow, short black hair, Marine officer cap with a gold seagull emblem, dark red pinstripe suit with a pink rose on the lapel, white Marine coat draped over his shoulders like a cape, fists glowing with red-hot magma, his Marine cap is white with a dark navy brim and a gold emblem", 'punch', 'red glowing magma'),
    'kizaru': ("Admiral Kizaru", "middle-aged man with a long face, forehead wrinkles and smile lines, short wavy jet black hair with sideburns, thin black mustache and a short black stubble goatee, wide rectangular aviator-style glasses with a thin gold double-bridge frame and light orange-brown tinted see-through lenses, his droopy relaxed half-lidded eyes clearly visible behind the lenses (NOT dark or black sunglasses), a big cheerful open-mouthed grin showing his teeth, yellow pinstripe double-breasted suit with gold buttons over a green shirt and a purple tie, white Marine coat with gold epaulettes draped over his shoulders, white shoes", 'kick', 'golden light'),
    'aokiji': ("Admiral Aokiji", "very tall slim man, curly black afro hair, sleep mask pushed up on his forehead, white vest over a blue shirt, white pants, white marine coat", 'punch', 'ice crystals'),
    'ace': ("Portgas D. Ace", "freckles, wavy black hair, orange cowboy hat with two small blue and red smiley face badges, shirtless with a red bead necklace, black shorts, brown boots, his mouth is always clearly drawn on his face (a confident grin or determined frown)", 'punch', 'fire'),
    'shanks': ("Red-Haired Shanks", "red hair, three scars over his left eye, stubble, open white shirt, brown pants with a sash, long black cape over shoulders, holding a sword", 'sword', 'red and black lightning'),
    'whitebeard': ("Whitebeard Edward Newgate", "towering giant very muscular old man, huge white crescent-moon shaped mustache, white bandana, bare scarred chest, white captain coat with gold epaulettes over shoulders, dark blue sash, he carries exactly ONE weapon in total, his bisento: ONE long straight dark wooden pole gripped in his hand, with ONE large curved steel blade fixed to the top end of that same pole (a naginata polearm); never a second weapon, never a loose blade, never a sword", 'sword', 'white cracked shockwaves'),
    'blackbeard': ("Blackbeard Marshall D. Teach", "very plump fat man with a huge round belly and thick body, thick black beard, huge grin with missing teeth, wild curly black hair, dark brown bandana cap, open shirt showing his belly, black captain coat with gold trim and epaulettes, yellow sash, camo pants, black boots", 'punch', 'black purple darkness'),
    'mihawk': ("Dracule Mihawk", "yellow hawk eyes, thin curled mustache and goatee, wide brimmed black hat with a white feather plume, dark red and black coat with a gold cross necklace, holding a giant black cross-shaped sword, his only weapon is Yoru: a giant black straight sword with a golden cross-shaped hilt and a long handle (never any other sword)", 'sword', 'green sword slash'),
    'crocodile': ("Sir Crocodile", "a big curved golden hook instead of his left hand (clearly visible), slicked back black hair, stitched scar across his face, half-closed bored lazy eyes and an unimpressed lazy expression, dark coat with a thick fur collar, green vest, brown pants, he has NO left hand: his left coat sleeve ends directly in a short gold metal cuff with a long slim curved golden hook coming straight out of it (no fingers, no fist, no bulb, nothing gripping the hook), in every single pose; his right hand is a normal bare hand with no gold cuff on the right wrist", 'punch', 'swirling sand'),
    'doflamingo': ("Donquixote Doflamingo", "tall man, spiky short blond hair, red tinted pointed sunglasses, huge sinister grin, fluffy pink feather coat, open white shirt showing his chest, pink and white striped pants, earrings", 'kick', 'white strings'),
    'kaido': ("Kaido", "giant very muscular man with dark tanned brown skin, two big curved white horns, long wild black hair, black beard and long mustache, angry fangs, dark purple fur-trimmed coat, bare chest with tattoo, white hakama pants with dark sash, black boots, wielding Hassaikai: ONE long black iron kanabo club shaped like a long straight baseball bat, a thin handle at one end gradually widening to a thick octagonal end, short metal studs along its length; SINGLE-ENDED, no ball, no sphere, no chain, no second head (never a mace, never a sword)", 'sword', 'blue lightning and fire'),
    'bigmom': ("Big Mom Charlotte Linlin", "huge round giant woman, big curly pink hair, black pirate hat with a white skull and gold trim, wide grin with red lips, pink dress with big red polka dots, white cape, empty hands, no weapon", 'punch', 'fire'),
    'law': ("Trafalgar Law", "white fuzzy hat with brown spots, black goatee, tired eyes, yellow and black hoodie with a smiley jolly roger, spotted jeans, holding a long nodachi sword, his sword is Kikoku: a very long nodachi, black sheath with a pattern of white crosses, red tassel and white fluffy fur at the guard; his white fluffy spotted hat is solid white with brown spots", 'sword', 'blue glowing dome'),
    'hancock': ("Boa Hancock", "beautiful tall woman, very long straight black hair with bangs, gold snake earrings, elegant purple chinese-style dress with a high side slit and gold trim, purple heels, proud haughty look, solid jet-black hair with no white streaks or white highlights", 'kick', 'pink hearts'),
    'garp': ("Monkey D. Garp", "big old muscular marine hero, spiky white hair, white beard, scar over left eye, huge toothy grin, white Marine coat over shoulders, dark suit, his white spiky hair and white coat are solid opaque white", 'punch', 'black and red haki'),
    'buggy': ("Buggy the Clown", "Buggy the Clown: big round shiny red clown nose, long light-blue hair in two long ponytails, white pirate captain tricorn hat with a black crossbones mark, green dotted bandana under the hat, wide grin with a red lip outline, white captain coat over his shoulders with gold epaulettes, white ruffled cravat, green sash, puffy dark red and brown striped pants, brown boots, white gloves holding small throwing knives between his fingers", 'punch', 'flying knives and confetti'),
    'smoker': ("Smoker", "Smoker the Marine: short spiky white hair swept up, stern angry scowl, red eyes, a lit cigar in his mouth, open white jacket with thick green fur trim on the collar, front and cuffs, bare muscular chest, brown leather strap holding spare cigars on his chest, brown gloves, black belt, dark blue jeans, brown boots, holding his jitte: ONE long straight plain silver metal rod with a dark red wrapped handle at one end, a single short side prong just above the handle, and a plain blunt rounded tip at the other end (the tip has no blade, no fork, no spike, no hook, no hammer head, no cross guard; it is not a sword or spear); no wings, no text", 'staff', 'white smoke'),
    'marco': ("Marco the Phoenix", "Marco: blond hair shaped like a pineapple (spiky on top, short on the sides), sleepy half-closed eyes, small blond goatee, open purple long-sleeve shirt showing his chest with a dark blue Whitebeard cross tattoo, light blue sash tied around his waist with a gold-studded belt, dark navy knee-length pants, sandals, blue and yellow phoenix flames burning on his forearms", 'kick', 'blue and yellow phoenix flames'),
    'sabo': ("Sabo", "Sabo: black top hat with blue goggles on the band, wavy shoulder-length blond hair, burn scar around his left eye, confident grin, long black coat with tails, navy blue double-breasted vest, white shirt with a blue cravat, light blue-grey pants, black boots, brown gloves, holding ONE long straight dark grey metal pipe with a short bent tip at one end (his only weapon)", 'staff', 'orange fire and dragon claws'),
    'yamato': ("Yamato", "Yamato: young warrior with a cute face, very long white hair tied in a high ponytail that fades to mint green at the tips, two red curved oni horns, red eyes, fierce fanged grin, thick purple shimenawa rope with white beads worn over the shoulders, white sleeveless kimono top, red hakama pants, wooden geta sandals, holding ONE big black iron kanabo club with round studs along its thick end (single-ended, no chain, no blade)", 'sword', 'icy blue frost and white lightning'),
    'arlong': ("Arlong", "Arlong: sawshark fishman with blue-purple skin, a long jagged saw-shaped nose pointing forward, a huge grin full of sharp triangular shark teeth, long wavy black hair, brown aviator cap with a white fluffy fur trim, gills on his neck, open yellow shirt, grey sash, dark brown pants, brown boots, holding his Kiribachi: ONE giant long black saw sword with six shark-tooth shaped notches along one edge and a plain handle (no guard)", 'sword', 'water'),
    'kuma': ("Bartholomew Kuma", "Bartholomew Kuma: towering huge bulky man with a big round body, white cap with small round bear ears and black spots, small rectangular glasses, curly black hair, calm expressionless face, long black zipped coat with a big white crosshair circle symbol on the chest, grey pants with black spots, brown shoes, a small purple book (bible) held in one hand, pink paw pads on his palms", 'punch', 'paw-shaped air shockwaves'),
    'enel': ("Enel", "Enel: very long stretched earlobes, white cloth headwrap, short blond hair, arrogant bored half-closed eyes, bare muscular chest, a golden ring behind his back with four small golden drums marked with black triple-comma (tomoe) symbols, wide baggy orange pants with black spots, blue sash, barefoot, holding ONE long thin golden staff with a small golden prong at the top", 'staff', 'blue-white lightning'),
}

# Each pose: (name, instruction by attack style)
def poses(style, fx):
    weapon = style in ('sword', 'staff')
    hit = {
        'punch': 'throwing a powerful straight punch forward to the right, front arm fully extended',
        'kick': 'doing a powerful high kick to the right, front leg fully extended',
        'sword': 'swinging the weapon in a wide forward slash to the right',
        'staff': 'swinging the staff forward to the right in a strike',
    }[style]
    return {
        'idle': 'in a ready fighting stance' + (', holding the weapon ready' if weapon else ', fists up'),
        'attack': hit,
        'kick': 'doing a flying side kick to the right' if not weapon else 'thrusting the weapon straight forward to the right, lunging',
        'upper': ('leaping uppercut, whole body stretched upward, fist punching straight up above the head' if not weapon else 'leaping rising slash, weapon swung straight up above the head') + ', both feet off the ground',
        'special': 'unleashing a signature special attack with ' + fx + ' bursting from the front hand toward the right, dynamic pose',
        'super': 'charging an ultimate super attack, arms spread wide, surrounded by intense ' + fx + ' aura, epic heroic pose',
        'hurt': 'flinching from a hit, upper body bent far backward, head thrown back, arms flung out behind, eyes squeezed shut, mouth open in pain',
        'block': ('blocking by holding the weapon horizontally in front of the body by its handle, never touching the blade' if weapon else 'blocking with both forearms crossed in front of the face, braced defensive stance'),
        'jump': 'mid-air jump, both feet high off the ground, knees tucked up to the chest, arms raised',
        'win': 'cheering in a victory pose, one fist raised high, big happy smile',
        'ko': 'knocked out lying flat on the ground on the back, dizzy swirly eyes, side view',
    }

# Per-fighter pose overrides
POSE_OVERRIDES = {
    'buggy': {
        'attack': 'throwing a straight punch to the right with his right fist holding small throwing knives between the fingers, his left arm pulled back, exactly two arms',
        'special': 'Chop-Chop Cannon: flinging his right arm straight forward to the right, small knives fanned between his fingers, his left arm back at his side, exactly two arms',
        'super': 'Chop-Chop Festival: laughing wildly with arms spread wide, colorful confetti and spinning knives around him, exactly two arms',
        'jump': 'mid-air jump, both feet high off the ground, knees tucked up, both arms raised high above his head with a knife in each gloved hand, exactly two arms and two hands (nothing near his face)',
        'block': 'blocking with both forearms crossed in an X in front of his chest, one gloved fist on each side of the X, exactly two arms and two hands',
        'ko': 'knocked out lying flat on his back on the ground, side view, body stretched out horizontally, dizzy swirly eyes, arms limp at his sides',
    },
    'smoker': {
        'idle': 'in a ready stance holding his ONE jitte (a long straight silver rod with a single short side prong) in his right hand, left fist raised',
        'special': 'White Blow: punching his LEFT fist straight forward to the right with a thick cloud of white smoke bursting from the fist, his ONE jitte held back in his right hand',
        'super': 'White Out: both arms spread wide, thick white smoke pouring from his arms and swirling around him, his ONE jitte in his right hand, both feet visible on the ground',
        'block': 'blocking by holding his ONE jitte horizontally in front of his chest with both hands',
        'attack': 'side view, swinging his ONE jitte in a wide horizontal strike to the right: his right arm stretched straight out to the right at shoulder height holding the jitte by the red handle, the whole rod pointing forward far in front of him (NOT held across his chest), his left fist pulled back at his hip',
        'hurt': 'flinching from a hit, upper body bent back, eyes squeezed shut, his right hand still gripping his ONE jitte by the red handle, his left arm flung out',
        'win': 'confident victory pose resting his ONE jitte on his shoulder by the red handle, his other fist raised',
    },
    'marco': {
        'attack': 'doing a powerful straight front kick to the right, blue and yellow phoenix flames on his kicking foot, exactly two arms',
        'special': 'Bluebird: pointing his right index and middle finger forward to the right, a swirling ball of blue and yellow phoenix flame forming in front of his fingers, his left arm at his side; both hands are bare skin-colored hands (no gloves, not grey)',
        'block': 'blocking with both bare forearms crossed in an X in front of his face, small blue flames on the forearms, braced defensive stance, mouth closed, exactly two arms',
        'super': 'Phoenix Brand: leaping with both legs pulled up ready for a two-legged kick, his arms spread wide and burning as big blue and yellow phoenix flame wings, both feet off the ground',
    },
    'sabo': {
        'idle': 'in a ready stance holding his ONE metal pipe in his right hand resting on his shoulder, left hand open like a dragon claw',
        'special': 'Dragon Claw: lunging forward to the right with his LEFT hand shaped like a dragon claw (fingers bent like talons) glowing with dark haki, his ONE metal pipe held back in his right hand',
        'super': 'Flame Dragon King: both hands shaped like dragon claws (fingers bent like talons) wreathed in orange fire, arms spread, flames swirling around him, no pipe anywhere in this picture, exactly two arms',
        'attack': 'side view, swinging his ONE metal pipe in a wide horizontal strike to the right: his right arm stretched straight out to the right at shoulder height, the whole pipe pointing forward far in front of him (NOT resting on his shoulder, NOT behind his neck), his left hand open like a claw at his side',
        'kick': 'side view, deep forward lunge to the right, both arms stretched straight forward thrusting his ONE metal pipe horizontally like a spear, the bent tip of the pipe far out in front of him (NOT resting on his shoulder)',
        'hurt': 'flinching from a hit, upper body bent back, eyes squeezed shut, his right hand still gripping his ONE metal pipe, his left arm flung out',
        'ko': 'knocked out lying flat on his back, side view, dizzy swirly eyes, still wearing his ONE top hat on his head (no other hat anywhere), exactly ONE metal pipe lying on the ground next to his hand',
        'block': 'blocking by holding his ONE metal pipe upright and vertical in front of his chest with both hands wrapped around it, elbows bent, braced stance, exactly two arms and two hands in total, each hand at the end of its own arm',
    },
    'yamato': {
        'idle': 'in a ready stance holding ONE black kanabo club with both hands, resting it on the shoulder',
        'special': 'Namuji Glacier Fang: leaning forward and breathing a blast of icy blue frost from the mouth toward the right, holding ONE black kanabo club low at the side with both hands; nothing else behind the body (no mace ball, no second weapon)',
        'attack': 'swinging ONE black kanabo club in a wide horizontal strike to the right, the club stretched far out in front at chest height, both hands on the handle',
        'super': 'Thunder Bagua: raising ONE black kanabo club high over the shoulder with both hands, the club whole and unbroken, thin zigzag bolts of white lightning arcing around it (outside the club, no cracks on the club), fierce grin',
        'block': 'blocking by holding ONE black kanabo club horizontally in front of the chest with both hands',
        'hurt': 'flinching from a hit, upper body bent back, eyes squeezed shut, BOTH hands gripping ONE black kanabo club close together at its handle, exactly two arms and two hands in total, each hand at the end of its own arm (no open hand)',
        'win': 'victory pose: her right fist wrapped tightly around the thin handle of ONE black kanabo club resting on her right shoulder (the handle clearly passing through the closed fist, the club does not grow out of the hand), left fist raised high, big grin',
    },
    'arlong': {
        'idle': 'in a ready stance holding his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) upright in his right hand, grinning with all his shark teeth',
        'attack': 'swinging his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) in a wide horizontal slash to the right, BOTH hands together gripping the red handle, the blade stretched far out in front of him at chest height; exactly two arms and two hands, both on the handle',
        'kick': 'deep lunge to the right thrusting his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) straight forward with both hands on the red handle, the blade pointing forward',
        'upper': 'leaping with a rising slash, his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) swung straight up above his head with both hands on the red handle, both feet off the ground',
        'special': 'Shark Darts: his whole body flying horizontally to the right like a torpedo, side view, his long saw nose pointing forward, both arms pressed back along his body, empty hands; there is no sword, no blade and no weapon anywhere in this picture (his saw nose is the only pointed thing)',
        'super': 'Shark Tooth Drill: leaning far forward with his mouth wide open showing rows of sharp shark teeth, both hands clawed forward, empty hands, no sword and no blade anywhere in this picture',
        'hurt': 'flinching from a hit, upper body bent back, eyes squeezed shut, BOTH hands together gripping the red handle of his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) held in front of him; exactly two arms and two hands, both on the handle, no open hands',
        'block': 'blocking by holding his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) horizontally in front of his body with both hands',
        'win': 'victory pose: his right fist wrapped tightly around the red handle of his ONE giant saw sword Kiribachi (black blade with white shark-tooth notches along one edge, red wrapped handle) resting on his shoulder (the red handle clearly passing through the closed fist, the blade does not grow out of the hand), his left fist raised, grinning with shark teeth',
        'ko': 'knocked out lying flat on his back on the ground, side view, dizzy swirly eyes, both arms limp on the ground at his sides with open empty hands, his ONE saw sword lying on the ground next to him (not held); exactly two arms and two hands',
    },
    'kuma': {
        'idle': 'standing in a calm upright stance, holding the small purple book in his left hand, right hand lowered with the palm open',
        'attack': 'seen from the side facing right: his far arm stretches straight forward to the right from his far shoulder, open palm showing the pink paw pad; his near arm hangs straight down at his side holding the small purple book; exactly two arms and two hands in total, each hand at the end of its own arm, both attached at the shoulders, nothing in front of his chest',
        'special': 'Pad Cannon: thrusting his open right palm straight forward to the right, a paw-shaped air bubble leaving the pink paw pad, small purple book in his left hand',
        'super': 'Ursa Shock: holding a huge translucent paw-shaped air bubble between his two outstretched open palms in front of his chest, no book',
        'block': 'blocking by raising his open right palm in front of his face showing the pink paw pad, small purple book in his left hand',
    },
    'enel': {
        'idle': 'in an arrogant relaxed stance holding his ONE golden staff upright in his right hand, the four drums on the golden ring behind his back',
        'special': 'Hino: pointing his ONE golden staff forward to the right with a burst of blue-white lightning at its tip, the ONE round golden ring with four small drums still behind his back exactly like in the reference',
        'ko': 'knocked out lying flat on his back on the ground, side view, body stretched out horizontally, dizzy swirly eyes, his golden staff lying beside him, the golden ring with four drums under his back',
        'super': 'Amaru: arms spread wide, his whole body crackling with blue-white lightning, the four drums on the golden ring behind him glowing, his ONE golden staff in his right hand',
    },
    'brook': {
        'windup': 'seen from the side facing right, raising his ONE thin straight silver cane sword high above and behind his head, body coiled and leaning back, about to swing it down; the whole figure and weapon fully inside the frame with a wide empty margin on every side',
        'attack': 'seen from the side facing right, leaning forward right after a powerful downward swing: his ONE thin straight silver cane sword swung down in front of him with its tip low near the floor in front of his feet, never above his head; the whole figure and weapon fully inside the frame with a wide empty margin on every side',
    },
    'shanks': {
        'windup': 'seen from the side facing right, raising his ONE saber Gryphon high above and behind his head, body coiled and leaning back, about to swing it down; the whole figure and weapon fully inside the frame with a wide empty margin on every side',
        'attack': 'seen from the side facing right, right after a downward slash: he holds his ONE saber Gryphon in his right hand at hip height and the whole sword points diagonally down to the lower right; the grip inside his fist, the round guard and the blade all lie on ONE straight diagonal line from upper left to lower right, the blade tip near the floor in front of him; the whole figure and sword fully inside the frame with a wide empty margin on every side',
    },
    'kaido': {
        'windup': 'seen from the side facing right, raising his ONE long black kanabo club Hassaikai high above and behind his head, body coiled and leaning back, about to swing it down; the whole figure and weapon fully inside the frame with a wide empty margin on every side',
        'attack': 'seen from the side facing right, leaning forward right after a powerful downward swing: his ONE long black kanabo club Hassaikai swung down in front of him with its tip low near the floor in front of his feet, never above his head; the whole figure and weapon fully inside the frame with a wide empty margin on every side',
    },
    'imu': {   # canon: glaive halberdier, fast kicks, Omen black flames, Abyss circles, Supreme King Haki black lightning
        'idle': 'standing tall and menacing, holding his ONE long black glaive upright beside him, the curved zigzag blade at the top, eye-covered black wings spread behind him',
        'windup': 'raising his ONE long black glaive high above his head with both hands, about to cleave downward, wings spread',
        'attack': 'seen from the side facing right, cleaving his ONE long black glaive in a downward forward slash: the glaive is held diagonally in front of him with the big curved zigzag blade (the same blade as in the reference) at the lower right in front of his feet, the round cap at the upper left behind his shoulder; the WHOLE glaive from cap to blade tip, his wings and his whole body are fully inside the frame with a wide empty margin on every side, the blade tip far from the image edge',
        'kick': 'doing a lightning fast high kick to the right, front leg fully extended, holding the glaive behind him in one hand',
        'upper': 'leaping rising slash, his ONE long black glaive swung straight up above his head, both feet off the ground, wings raised',
        'special': 'thrusting his open right hand forward to the right and hurling a big black fireball of Omen flame with red eyes in it, glaive held behind him',
        'super': 'unleashing Supreme King Haki: arms spread wide, black and red lightning crackling all around his body, wings fully spread, terrifying glare',
        'block': 'blocking by holding his ONE glaive horizontally in front of his body, wings folded around him like a shield',
        'hurt': 'flinching from a hit, upper body bent backward, head thrown back, arms flung out, wings crumpled',
        'jump': 'flying in mid-air with his eye-covered black wings beating, knees tucked, glaive in one hand',
        'win': 'floating in the air with arms crossed and wings spread, looking down with cold contempt, glaive beside him',
        'ko': 'knocked out lying flat on his back, side view, wings limp on the ground, dizzy swirly eyes, glaive dropped beside him',
    },
    'garp': {
        'special': 'Fist of Love: throwing a giant straight right punch forward, his left arm pulled back at his side, exactly two arms attached at the shoulders',
        'ko': 'knocked out lying flat on his back, side view, one face with dizzy swirly eyes, arms and legs splayed naturally',
    },
    'law': {
        'attack': 'slashing forward with his ONE sword Kikoku drawn: both hands together on a short handle wrapped in purple and white diamond pattern, a small round gold guard, and a very long straight shiny silver blade (much longer than the handle, as long as his body) extended forward to the right; the empty black sheath with white crosses hangs at his hip',
        'upper': 'leaping with a rising slash: holding his ONE long sword Kikoku by its handle and swinging it straight up above his head, both feet off the ground',
    },
    'doflamingo': {
        'super': 'Birdcage: both arms spread wide with glowing white strings shooting from his fingertips, his face and sunglasses fully visible and unobstructed, exactly two arms',
    },
    'whitebeard': {
        'idle': 'standing in a ready stance holding his ONE bisento upright beside him with his right hand, the long pole vertical and the curved blade at the top, left hand in a fist',
        'kick': 'thrusting his ONE bisento forward to the right with both hands on the long pole, the curved blade at the far end pointing forward',
        'upper': 'swinging his ONE bisento upward over his head with both hands on the pole, the curved blade at the top end, both feet off the ground',
        'special': 'Kaishin: punching the air with his right fist, cracks of white shockwave around the fist, his ONE bisento held upright in his left hand',
        'super': 'Gekishin: both fists clenched and thrust forward, wrapped in white cracked quake bubbles, his bisento planted upright in the ground behind him, exactly two arms',
        'block': 'blocking by holding his ONE bisento horizontally in front of his chest with both hands on the pole, the curved blade at one end',
        'jump': 'mid-air jump, knees tucked, holding his ONE bisento upright in his right hand with the curved blade at the top',
    },
    'ace': {
        'special': 'Fire Fist: punching his right fist straight forward to the right with fire bursting from it, his left arm pulled back at his side, exactly two arms attached at the shoulders',
    },
    'kizaru': {
        'upper': 'leaping with a rising kick-uppercut of light, his right arm raised high, his left arm bent at his side, both arms clearly visible, both feet off the ground',
        'ko': 'knocked out lying completely flat on his back on the ground, side view, body stretched out horizontally, head on the floor, dizzy swirly eyes behind his glasses, arms limp at his sides',
    },
    'jinbe': {
        'kick': 'doing a powerful front kick to the right, both arms raised in a fishman karate guard, exactly two arms and two hands',
    },
    'robin': {
        'super': 'Gigantesco Mano: arms crossed in front of her chest in her signature pose, a soft pink and purple petal aura around her, no white glow, exactly two arms',
    },
    'chopper_mp': {
        'attack': 'seen from the side in profile facing right, throwing a straight punch to the right: the punching arm starts at his shoulder at the top corner of his torso, upper arm and forearm stretched straight out at shoulder height ending in one big dark fist, his other arm hidden behind his body, exactly one visible arm, nothing growing from his chest',
        'special': 'seen from the side in profile facing right, lunging forward with a massive straight cross punch: the punching arm comes out from behind his chest at the far shoulder right next to his neck and chin, stretched straight out to the right ending in one big dark fist, his near arm hanging down at his side, exactly two arms, nothing growing from the middle of his chest',
        'upper': 'leaping with a rising uppercut, right fist raised high above his head, left arm down at his side, both arms clearly visible, both feet off the ground',
    },
    'chopper': {
        'idle': 'in a ready stance with tiny hooves raised, big round shiny black eyes with a white highlight dot (the same eyes as in his attack pose), exactly two arms',
        'win': 'cheering with both tiny arms raised, big round shiny black eyes with a white highlight dot, happy open mouth, exactly two arms',
        'attack': 'throwing a punch to the right with ONE arm extended, the other arm pulled back at his side, big round shiny black eyes, exactly two arms',
        'special': 'Horn Point: charging forward head-first with his big antlers pointed at the right, both small arms tucked at his sides, exactly two arms',
    },
    'luffy_g5': {
        'bazooka': 'Gear 5 Gum-Gum Bazooka: bending far forward with BOTH arms stretched straight forward together, both big white open palms side by side pushing to the right, joyful grin',
    },
    'crocodile': {
        'upper': 'rising upward swing: his hook arm (gold cuff and curved hook only, no hand) swung straight up above his head, his other normal hand clenched low at his side, both feet off the ground',
        'super': 'unleashing a giant sandstorm: arms spread wide, ONE arm ends in the gold cuff and curved hook (no hand), the OTHER arm ends in a normal open hand (no hook); swirling golden sand around him',
        'attack': 'swiping his golden hook forward to the right: the extended arm ends in the gold cuff and the curved hook only (no hand, no fist on that arm), his other normal hand held back at his side',
        'idle': 'standing in a lazy ready stance: his right hand is a normal fist at his chest, his LEFT arm ends in the gold cuff and curved hook (no hand) held down at his side',
        'special': 'Desert Spada: sweeping his RIGHT normal hand forward with sand blasting from it, his LEFT arm ends in the gold cuff and curved hook (no hand) held back',
        'hurt': 'flinching from a hit, eyes squeezed shut: right normal hand flung out, LEFT arm ends in the gold cuff and curved hook (no hand)',
        'block': 'blocking with his LEFT hook arm (gold cuff and curved hook, no hand) raised across his face, his right normal hand behind it',
    },
    'usopp': {
        'attack': 'throwing a straight punch to the right with his right arm, his left arm bent at his side, exactly two arms attached at the shoulders',
        'upper': 'leaping with a rising uppercut, ONE fist raised above his head (not behind his hair), the other arm down, both feet off the ground, exactly two arms',
        'special': 'aiming a big green slingshot shaped exactly like the letter Y (a Y-shaped fork with a rubber band stretched between the two prongs) held upright in his outstretched left hand toward the right, his right hand pulling the band back, a small fireball flying out',
        'super': 'holding his big green Kabuto slingshot pointed up and forward with both hands, a giant flaming phoenix of fire bursting out of it, epic pose',
    },
    'zoro': {
        'idle': 'in a ready two-sword stance, both katana raised, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'attack': 'swinging both katana in a wide forward slash to the right, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'kick': 'deep lunge to the right thrusting one katana straight forward, the other katana held back, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'upper': 'leaping with a rising slash, both katana swung up above his head, both feet off the ground, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'special': '36 Pound Cannon: arms crossed in front of his chest so the two katana form a big X, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'super': 'menacing stance with both katana held out low to his sides, intense dark aura, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'hurt': 'flinching from a hit, upper body bent back, eyes squeezed shut, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'block': 'blocking by crossing both katana in an X in front of his body, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'jump': 'mid-air jump, knees tucked, both feet off the ground, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'win': 'confident victory pose, both katana held out to the sides, smirking, holding exactly TWO katana, one in each hand; his mouth is closed with NOTHING in it (no sword in his mouth); no other swords anywhere, nothing at his hip',
        'ko': 'knocked out lying flat on his back, side view, one face with two dizzy swirly eyes, his two katana lying beside his hands, mouth closed with nothing in it',
    },
    'luffy': {
        'bazooka': 'Gum-Gum Bazooka: bending far forward at the waist with BOTH arms stretched straight forward together, both open palms side by side pushing to the right',
    },
    'mihawk': {
        'windup': 'raising Yoru high above and behind his head, body coiled and leaning back, about to slash downward, his ONE sword Yoru (a giant black blade with a gold cross guard) gripped by its long handle with both hands; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'attack': 'seen from the side in profile facing right, leaning forward right after a downward chop: both hands gripping the sword handle low in front of his hips, the long black blade angled steeply downward with its tip almost touching the floor in front of his feet on the right, the blade below his hands and never above his head, his ONE sword Yoru (a giant black blade with a gold cross guard) gripped by its long handle with both hands; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'kick': 'deep lunging thrust: Yoru thrust straight forward to the right at chest height, his ONE sword Yoru (a giant black blade with a gold cross guard) gripped by its long handle with both hands; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'upper': 'rising upward slash: Yoru swung up high above his head with the blade pointing to the sky, one foot off the ground, his ONE sword Yoru (a giant black blade with a gold cross guard) gripped by its long handle with both hands; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'special': 'releasing a flying slash: Yoru swung horizontally forward to the right at full extension, a green crescent of energy just leaving the blade close to him, his ONE sword Yoru (a giant black blade with a gold cross guard) gripped by its long handle with both hands; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'super': 'the instant after his strongest slash, like in the anime: crouched low with his back half turned, head bowed so the hat brim shades his eyes, holding his ONE sword Yoru upright in front of his chest with both hands right under the gold cross guard, the long black blade pointing straight up, his long black coat flaring out wide behind him, a thin glowing green aura close around him; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'slashfinish': 'just finished the worlds strongest slash: body twisted around, crouched low, Yoru swept down and back behind him, coat flowing, his ONE sword Yoru (a giant black blade with a gold cross guard) gripped by its long handle with both hands; the whole figure, sword and effects fully inside the frame with a wide empty margin on every side',
        'win': 'calm victory pose, holding his ONE sword Yoru resting on his shoulder by its handle, the other hand at his side',
    },
    'sanji': {   # Sanji never uses his hands to fight: hands stay in his pockets, every attack is a kick
        'idle': 'standing calmly with BOTH feet flat on the ground, both hands in his pants pockets, relaxed confident stance, not kicking',
        'attack': 'doing a fast straight front kick to the right with both hands in his pockets',
        'kick': 'doing a powerful high roundhouse kick to the right with both hands in his pockets',
        'upper': 'doing a rising flip kick straight upward, leg pointing to the sky, hands in pockets, both feet off the ground',
        'special': 'Diable Jambe: a spinning kick with his right leg glowing red-hot and wreathed in flames, hands in pockets',
        'super': 'Ifrit Jambe: standing on one leg, the other leg raised and burning with intense blue flames, hands in pockets',
        'block': 'blocking by raising one knee and shin in front of his body, hands in pockets',
        'jump': 'mid-air jump, knees tucked, both hands in his pockets',
    },
}

# Reference images supplied by the user (design source) for `gen_sprites.py refbase`
import os
# the owner's reference images (not in the repo); override with RUMBLE_REFS
USER_REF_DIR = os.environ.get('RUMBLE_REFS', os.path.join(os.path.expanduser('~'), 'Desktop', 'Scratchpad', 'Rumble Arena')).replace(os.sep, '/')
USER_REFS = {
    'buggy': 'Character/buggy.jpg', 'yamato': 'Character/yamato.webp', 'arlong': 'Character/arlong.webp', 'kuma': 'Character/kuma.jpg', 'enel': 'Character/enel.jpg', 'sabo': 'Character/sabo.jpg',
    'marco': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'refs', 'marco_crop.png'),   # emoji panel cropped off
    'smoker': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'refs', 'smoker_crop.png'),
    'imu': 'imu.jpg',
    'luffy_g5': 'gear 5.png',
    'chopper_mp': 'monster point.jpg',
    'bigmom': 'bigmom.jpg', 'hancock': 'boa.jpg', 'chopper': 'chopper.webp', 'doflamingo': 'doflamingo.jpg',
    'franky': 'franky.jpg', 'garp': 'garp.jpg', 'jinbe': 'jinbei.jpg', 'kaido': 'kaido.jpg',
    'kizaru': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'refs', 'kizaru2_crop.png'),   # owner's correct design (kizaru 2.jpg, logo cropped)
    'robin': 'robin.jpg', 'whitebeard': 'whitebeard.png',
    'luffy': 'luffy.jpg', 'zoro': 'zoro.jpg', 'nami': 'nami.jpg', 'usopp': 'usopp.jpg', 'sanji': 'sanji.png',
    'brook': 'brook.jpg', 'akainu': 'akainu.png', 'aokiji': 'kuzan.jpg', 'ace': 'ace.jpg', 'shanks': 'shanks.jpg',
    'blackbeard': 'blackbeard.jpg', 'mihawk': 'images.jpg', 'crocodile': 'crocodile.jpg', 'law': 'law.jpg',
}
# refs may sit directly in USER_REF_DIR or in its Character/ subfolder (the owner keeps them there now)
for _k, _v in list(USER_REFS.items()):
    if not os.path.isabs(_v) and not os.path.exists(os.path.join(USER_REF_DIR, _v)) and os.path.exists(os.path.join(USER_REF_DIR, 'Character', _v)):
        USER_REFS[_k] = 'Character/' + _v

# Extra sprites (drawn next to a fighter in game)
EXTRAS = {
    'bigmom': {
        'prometheus': 'Prometheus from One Piece: a living sun homie, a round blazing ball of orange and yellow fire with a big grinning face, fiery mane, small flame arms, floating',
        'zeus': 'Zeus from One Piece: a living thundercloud homie, a fluffy dark grey storm cloud with a cheeky face, small lightning bolts crackling around it, floating',
    },
}

# Stage backgrounds for `gen_sprites.py stages`: id -> (reference file in USER_REF_DIR/background, scene description)
STAGES = {
    'sunny': ('sunny.jpg', 'the lawn deck of the Thousand Sunny pirate ship: green grass deck, giant wooden main mast in the middle, cream colored cabin walls with round windows and red-white striped doors, white railings and staircases on both sides, blue sky'),
    'marineford': ('marineford.jpg', 'Marineford war: the Marine headquarters fortress with a Japanese style castle tower, white walls with the Marine kanji, frozen icy bay with broken pirate ships stuck in the ice, snowy mountains, dramatic sky'),
    'wano': ('wano.jpg', 'Wano country: a giant Japanese castle on a cliff with a huge tree bending around it, traditional Japanese town rooftops, a waterfall, cherry blossoms, red wooden bridge railings, bright blue sky'),
    'alabasta': ('alabasta.jpg', 'Alabasta: a grand white desert palace with golden onion domes on top of a rocky sandstone cliff, a long stone staircase, rocky desert mountains, deep blue sky'),
    'enies': ('enies lobby.jpg', 'Enies Lobby: the tall white government courthouse tower with the big sign ENIES LOBBY, green doors and windows, the World Government flag, blue sky with fluffy clouds'),
    'skyisland': ('sky island.avif', 'Skypiea sky island: a giant golden bell hanging between ancient golden ruin pillars wrapped in green vines, on top of fluffy white clouds, dramatic sky'),
    'thriller': ('thriller bark.png', 'Thriller Bark: a spooky gothic castle on a ghost ship island, huge rusty chains in the purple misty sky, foggy graveyard forest, dark purple and blue night'),
    'elbaph': ('elbaph.webp', 'Elbaph, land of giants: the enormous chained giant Loki in the background, his eyes covered by a dark cloth blindfold tied around his head, huge chains, giant wooden hall with huge shields and barrels, snowy ground, cold blue and purple tones'),
}

# Effect art for `gen_sprites.py fx`: id -> (mode, width, height, prompt)
# mode 'add' = rendered on pure black and drawn with additive blending (fire, light, energy)
# mode 'cut' = rendered on pure white and cut out (solid objects)
FX_STYLE = 'anime game effect art, vivid colors, clean shapes, highly detailed, centered, nothing else in the image'
FX_ASSETS = {
    'buggycannon': ('cut', 1024, 512, 'a gigantic thick black iron pirate cannon barrel lying low and horizontal, perfectly side view, pointing straight to the right, a huge round open muzzle at the right end, the barrel fills almost the whole height of the image, two small wooden wheels under the barrel at the bottom, a red and white clown pattern band around the barrel, plain pure white background, the whole object fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'sharktooth':  ('cut', 1024, 512, 'one big sharp white triangular shark tooth flying to the right point first, with short speed lines behind it, side view, plain pure white background, the whole object fully inside the frame with a wide empty margin on every side, nothing cut off'),
    # ---- new fighters (Buggy, Smoker, Marco, Sabo, Yamato, Arlong, Kuma, Enel)
    'buggyhand':   ('cut', 1024, 512, 'a flying cartoon white-gloved hand with a red cuff holding three small silver throwing knives fanned between its fingers, flying to the right, short speed lines behind it, plain pure white background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'buggysaw':    ('cut', 768, 768, 'a spinning cartoon buzzsaw wheel made of two legs in puffy red and brown striped pants and brown boots with sharp knife blades sticking out of the boot tips, motion blur swirl, side view, plain pure white background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'buggyfest':   ('cut', 1024, 1024, 'a whirlwind of many floating cartoon clown pirate body pieces (white gloved hands, brown boots, red striped pant legs, a big round red clown nose) swirling in a ring with small silver throwing knives and colorful confetti, plain pure white background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'buggyball':   ('cut', 768, 768, 'a big round red cannonball with a white skull and crossbones painted on it and a short lit fuse sparking on top, plain pure white background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'smokefist':   ('add', 1024, 640, 'a giant fist made of thick billowing white smoke punching to the right, a long white smoke trail behind it, side view, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'smoketrap':   ('add', 768, 1024, 'a towering swirling vertical column of thick white smoke spiraling upward like a cage, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'bluebird':    ('add', 1024, 640, 'a swirling ball of blue and yellow phoenix flame shaped like a small bird with spread wings, flying to the right, flame trail behind it, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'bluephoenix': ('add', 1024, 768, 'a majestic phoenix made of bright blue flames with yellow flame tips, huge wings spread, long flaming tail, diving to the right with its talons forward, side view, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'firedragon':  ('add', 1024, 768, 'a fierce eastern dragon made entirely of roaring orange and red fire with open jaws and claws forward, flying to the right, side view, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'dragonbreath':('add', 768, 1024, 'a ground shockwave eruption: cracked rocks and a dome of orange and white energy bursting upward from the ground, debris flying, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'icebreath':   ('add', 1024, 384, 'a long horizontal blast of freezing breath, swirling white and cyan frost with sharp ice shards, shooting to the right, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'baguabolt':   ('add', 512, 1024, 'a massive vertical strike of crackling black and white lightning with red sparks crashing down onto the ground, shockwave at the bottom, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'pawcannon':   ('add', 768, 768, 'a glowing translucent pale blue shockwave bubble shaped exactly like a bear paw print (one big pad and four round toe pads), shockwave rings around it, flying to the right, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'ursashock':   ('add', 1024, 1024, 'a gigantic glowing compressed air bubble shaped exactly like a bear paw print (one big pad and four round toe pads), pale blue and white, crackling with energy, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'thunderbird': ('add', 1024, 768, 'a giant eagle made of crackling bright blue and white lightning, wings spread wide, flying to the right, side view, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'elthor':      ('add', 512, 1024, 'a gigantic wide column of blue-white lightning crashing straight down from a dark storm cloud at the top to the ground, branching bolts, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'amaru':       ('add', 1024, 1024, 'a giant muscular thunder god made of crackling blue-white lightning, raising both fists, a ring of four drums floating behind his back, Raijin, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'raigo':       ('add', 1024, 1024, 'a gigantic dark swirling thundercloud sphere crackling with blue lightning bolts all around it, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    # Imu (First Twenty Weapons / Omen): black flames, so cut from white instead of additive on black
    'omenorb':     ('cut', 768, 768, 'a sentient fireball of pitch black flames with a glowing crimson red outline and one big glaring red eye in its center, flying to the right, black flames trailing behind it to the left, plain pure white background'),
    'stigma':      ('cut', 512, 1024, 'a huge ancient black spear wreathed in pitch black flames with glowing crimson edges, pointing straight down like it is falling from the sky, ornate black and gold cross guard at the top, plain pure white background'),
    'nemesis':     ('cut', 1024, 384, 'a long horizontal blade made of pitch black flame with a glowing crimson red edge, shooting to the right out of an ornate golden sword crossguard on the far left, sharp point on the right, plain pure white background'),
    'omensnake':   ('cut', 1024, 512, 'a giant serpent made of pitch black flames with a demonic horned head, many glaring red eyes and open fanged jaws, lunging to the right, its flaming body trailing to the left, glowing crimson red edges, plain pure white background'),
    'phoenix':     ('add', 1024, 768, 'a majestic phoenix bird made entirely of blazing orange, yellow and red fire, wings spread wide, long flaming tail feathers, flying to the right, side view, on a pure black background'),
    'firefist':    ('add', 1024, 640, 'a giant fist made of roaring orange fire flying to the right, long flame trail streaming behind it, side view, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'flamesun':    ('add', 1024, 1024, 'a gigantic blazing sun made of swirling fire, bright yellow-white core, orange and red flames licking outward, on a pure black background'),
    'slash_blue':  ('add', 768, 1024, 'a large crescent moon shaped flying sword slash wave of white and pale blue energy, curved, opening toward the left, sharp edge facing right, on a pure black background'),
    'slash_green': ('add', 768, 1024, 'a huge crescent moon shaped flying sword slash wave of bright green and black energy, curved, sharp edge facing right, on a pure black background'),
    'slash_ice':   ('add', 768, 1024, 'a crescent moon shaped flying sword slash wave of icy cyan frost with snowflakes and ice crystals, sharp edge facing right, on a pure black background'),
    'slash_haki':  ('add', 768, 1024, 'a crescent moon shaped flying sword slash wave of crimson red energy with black lightning, sharp edge facing right, on a pure black background'),
    'cyclone':     ('add', 640, 1024, 'a swirling tornado of wind and rain, white and light blue spirals, vertical, on a pure black background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'sandstorm':   ('cut', 640, 1024, 'a swirling vertical tornado made of desert sand and dust, tan and brown, plain pure white background, the whole effect fully inside the frame with a wide empty margin on every side, nothing cut off'),
    'icespear':    ('cut', 1024, 512, 'a long sharp spear made of clear blue ice, pointing to the right, horizontal, plain pure white background'),
    'heartarrow':  ('add', 1024, 512, 'a glowing pink energy arrow with a heart shaped tip flying to the right, pink sparkles trail, on a pure black background'),
    'rocketfist':  ('cut', 1024, 640, 'a big red and blue robotic metal fist rocket flying to the right, orange flames shooting out of the wrist, side view, plain pure white background'),
    'watershot':   ('add', 1024, 640, 'a powerful bullet of splashing sea water flying to the right, droplets and spray, side view, on a pure black background'),
    'waterfist':   ('add', 1024, 1024, 'a gigantic fist made of crashing ocean water and waves punching to the right, on a pure black background'),
    'cannonball':  ('cut', 768, 768, 'a heavy black iron cannonball with a white shine highlight, plain pure white background'),
    'bajrangfist': ('cut', 1024, 1024, 'a gigantic puffy white cartoon fist, rubbery and bouncy, knuckles facing right, punching to the right, plain pure white background'),
    'asura':       ('cut', 1024, 1024, 'Asura demon god spirit from One Piece: a translucent dark purple ghostly silhouette with three faces and six arms, holding nine katana swords spread out like a fan, ominous red eyes, plain pure white background'),
    'manohand':    ('cut', 768, 1024, 'a giant open hand rising upward with fingers spread, made of many smaller human hands, light pink skin, pink flower petals swirling around, plain pure white background'),
    'magmafist':   ('add', 768, 1024, 'a giant fist of molten magma and fire falling downward like a meteor, glowing red and orange, smoke trail above it, on a pure black background'),
    'eruption':    ('add', 768, 1024, 'a towering pillar of erupting red magma and fire shooting straight upward from the ground, on a pure black background'),
    'kaidodragon': ('cut', 1024, 1024, 'a long blue eastern dragon with horns, golden mane and long whiskers coiling in a spiral, Kaido dragon form, roaring, plain pure white background'),
    'gammaknife':  ('add', 1024, 512, 'a glowing pale blue energy blade shaped like a long sword, horizontal, pointing right, on a pure black background'),
    'quake':       ('add', 1024, 1024, 'a white shockwave sphere with cracks like shattered glass radiating outward, earthquake impact, on a pure black background'),
    'lightning':   ('add', 512, 1024, 'a huge jagged lightning bolt striking straight down, bright white core with yellow and blue glow, on a pure black background'),
    'iceberg':     ('cut', 1024, 768, 'a cluster of tall jagged blue ice crystals erupting from the ground, plain pure white background'),
    'blackhole':   ('add', 1024, 1024, 'a swirling vortex of dark purple and black energy with a glowing purple rim, black hole, on a pure black background'),
    'trampolia':   ('cut', 768, 1024, 'Pop Green Trampolia: a giant bouncy green carnivorous plant with a huge round mouth and big leaves bursting up from the ground, plain pure white background'),
    'dragontwister': ('cut', 768, 1024, 'Kaido the long blue eastern dragon flying upward in a tight corkscrew spiral, its body coiling around empty air, head at the top roaring, golden mane and whiskers, no tornado, no clouds, no wind, vertical composition, the whole dragon fully inside the frame with empty margin around it, plain pure white background'),
    'jetfist':     ('cut', 1024, 768, 'a single clenched cartoon fist punching to the right, side view of the knuckles, light tan skin, thick black outlines, flat cel shading, short motion lines behind it, chibi anime style, the whole fist fully inside the frame with a wide margin, plain pure white background'),
    'kongfist':    ('cut', 1024, 1024, 'Monkey D. Luffy Gear 4 Kong Gun fist from One Piece: one gigantic inflated muscular fist coated in glossy black Armament Haki, thick red flame-like markings on the forearm, the fist punching to the right, side view of the knuckles, thick black outlines, anime style, the whole fist fully inside the frame with a wide margin, plain pure white background'),
    'katana':      ('cut', 1024, 512, 'Wado Ichimonji: a single Japanese katana lying perfectly horizontal, white wrapped handle on the left, small round gold guard, one long straight shiny silver blade pointing to the right, anime style with thick black outlines, the whole sword fully inside the frame with a margin, plain pure white background'),
    'hook':        ('cut', 768, 1024, 'Sir Crocodile golden hook: one short gold metal wrist cuff at the bottom with a single long slim curved shiny golden hook rising out of it, curving to the right at the top, anime style with thick black outlines, upright, the whole object fully inside the frame with a margin, plain pure white background'),
    'soulghost':   ('cut', 512, 512, 'a cute translucent pale blue ghost spirit with a little face and a wispy tail, plain pure white background'),
    'magmahound':  ('add', 1024, 768, 'Inugami Guren: a huge snarling dog head made of molten magma and fire with open jaws lunging to the right, glowing red and orange, on a pure black background'),
    'icepheasant': ('cut', 1024, 768, 'Pheasant Beak: a gigantic pheasant bird made of clear blue ice flying to the right with wings spread and a long tail, plain pure white background'),
    'robindemon':  ('cut', 768, 1024, 'Demonio Fleur: a giant dark demonic silhouette of a tall woman with long black hair, huge black wings made of many arms, glowing eyes, ominous purple aura, plain pure white background'),
    'crossfire':   ('add', 1024, 1024, 'Jujika: a huge X-shaped cross of blazing orange fire, on a pure black background'),
    'lightsword':  ('add', 1024, 512, 'Ama no Murakumo: a long glowing sword made of pure golden-white light, horizontal, pointing right, on a pure black background'),
    'bluedragon':  ('cut', 1024, 640, 'Kaido in his dragon form: a huge long blue eastern dragon with horns, golden mane and whiskers, flying straight to the right with its body stretched out, mouth open roaring, side view, plain pure white background'),
}

# How each effect image is oriented: mirror at cut time, base direction, or always upright
FX_META = {
    'smoketrap': {'upright': True}, 'baguabolt': {'upright': True}, 'elthor': {'upright': True}, 'amaru': {'upright': True}, 'dragonbreath': {'upright': True},
    'buggysaw': {'upright': True}, 'buggyfest': {'upright': True}, 'raigo': {'upright': True}, 'pawcannon': {'upright': True}, 'ursashock': {'upright': True},
    'stigma': {'upright': True},
    'slash_blue': {'mirror': True}, 'slash_green': {'mirror': True}, 'slash_ice': {'mirror': True}, 'slash_haki': {'mirror': True},
    'magmafist': {'rot': -1.5708}, 'cyclone': {'upright': True}, 'sandstorm': {'upright': True}, 'lightning': {'upright': True},
    'eruption': {'upright': True}, 'iceberg': {'upright': True}, 'kaidodragon': {'upright': True}, 'manohand': {'upright': True},
    'asura': {'upright': True}, 'dragontwister': {'upright': True}, 'trampolia': {'upright': True}, 'robindemon': {'upright': True}, 'quake': {'upright': True}, 'flamesun': {'upright': True},
    'blackhole': {'upright': True}, 'crossfire': {'upright': True}, 'cannonball': {'upright': True}, 'waterfist': {'upright': True},
}
