import type { WordCatalogEntry } from './spelling'

export function normalizeEnunciationText(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, '')
}

export function estimateSyllableCount(word: string) {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')

  if (!normalized) {
    return 0
  }

  if (normalized.length <= 3) {
    return 1
  }

  const silentEAdjusted = normalized.endsWith('e') && !normalized.endsWith('le')
    ? normalized.slice(0, -1)
    : normalized
  const vowelGroups = silentEAdjusted.match(/[aeiouy]+/g) ?? []

  return Math.max(1, vowelGroups.length)
}

export function shouldUseCanonicalEnunciation(word: string) {
  return estimateSyllableCount(word) === 1
}

export function hasValidEnunciation(entry: Pick<WordCatalogEntry, 'word' | 'normalizedWord' | 'enunciationText'>) {
  return normalizeEnunciationText(entry.enunciationText) === entry.normalizedWord
}

const entries = [
  ['acorn', 'a...corn', 5, 7, 1, ['nature']], ['ankle', 'an...kle', 5, 7, 1, ['body']], ['ant', 'ant', 5, 7, 1, ['animals']],
  ['apple', 'ap...ple', 5, 7, 1, ['food']], ['apron', 'a...pron', 5, 7, 1, ['clothes']], ['back', 'back', 5, 7, 1, ['core']],
  ['badge', 'badge', 5, 7, 1, ['objects']], ['ball', 'ball', 5, 7, 1, ['play']], ['barn', 'barn', 5, 7, 1, ['places']],
  ['bear', 'bear', 5, 7, 1, ['animals']], ['bed', 'bed', 5, 7, 1, ['home']], ['bee', 'bee', 5, 7, 1, ['animals']],
  ['bell', 'bell', 5, 7, 1, ['sound']], ['berry', 'ber...ry', 5, 7, 1, ['food']], ['bird', 'bird', 5, 7, 1, ['animals']],
  ['block', 'block', 5, 7, 1, ['play']], ['blue', 'blue', 5, 7, 1, ['colors']], ['boat', 'boat', 5, 7, 1, ['travel']],
  ['book', 'book', 5, 7, 1, ['school']], ['boots', 'boots', 5, 7, 1, ['clothes']], ['bottle', 'bot...tle', 5, 7, 1, ['home']],
  ['bread', 'bread', 5, 7, 1, ['food']], ['broom', 'broom', 5, 7, 1, ['home']], ['brush', 'brush', 5, 7, 1, ['home']],
  ['bug', 'bug', 5, 7, 1, ['animals']], ['bunny', 'bun...ny', 5, 7, 1, ['animals']], ['bus', 'bus', 5, 7, 1, ['travel']],
  ['cabin', 'cab...in', 5, 7, 1, ['places']], ['cactus', 'cac...tus', 5, 7, 1, ['nature']], ['cake', 'cake', 5, 7, 1, ['food']],
  ['candy', 'can...dy', 5, 7, 1, ['food']], ['cat', 'cat', 5, 7, 1, ['animals']], ['chair', 'chair', 5, 7, 1, ['home']],
  ['cheese', 'cheese', 5, 7, 1, ['food']], ['chick', 'chick', 5, 7, 1, ['animals']], ['chimney', 'chim...ney', 5, 7, 1, ['home']],
  ['clock', 'clock', 5, 7, 1, ['time']], ['cloud', 'cloud', 5, 7, 1, ['weather']], ['clown', 'clown', 5, 7, 1, ['play']],
  ['coat', 'coat', 5, 7, 1, ['clothes']], ['cookie', 'cook...ie', 5, 7, 1, ['food']], ['corn', 'corn', 5, 7, 1, ['food']],
  ['cottage', 'cot...tage', 5, 7, 1, ['home']], ['cow', 'cow', 5, 7, 1, ['animals']], ['crab', 'crab', 5, 7, 1, ['animals']],
  ['crayon', 'cray...on', 5, 7, 1, ['art']], ['crow', 'crow', 5, 7, 1, ['animals']], ['crown', 'crown', 5, 7, 1, ['celebration']],
  ['cup', 'cup', 5, 7, 1, ['home']], ['dance', 'dance', 5, 7, 1, ['play']], ['day', 'day', 5, 7, 1, ['time']],
  ['deer', 'deer', 5, 7, 1, ['animals']], ['desk', 'desk', 5, 7, 1, ['school']], ['dish', 'dish', 5, 7, 1, ['home']],
  ['dog', 'dog', 5, 7, 1, ['animals']], ['doll', 'doll', 5, 7, 1, ['play']], ['donkey', 'don...key', 5, 7, 1, ['animals']],
  ['door', 'door', 5, 7, 1, ['home']], ['drum', 'drum', 5, 7, 1, ['music']], ['duck', 'duck', 5, 7, 1, ['animals']],
  ['eagle', 'ea...gle', 5, 7, 1, ['animals']], ['earth', 'earth', 5, 7, 1, ['space']], ['egg', 'egg', 5, 7, 1, ['food']],
  ['elbow', 'el...bow', 5, 7, 1, ['body']], ['engine', 'en...gine', 5, 7, 1, ['travel']], ['farm', 'farm', 5, 7, 1, ['places']],
  ['fence', 'fence', 5, 7, 1, ['home']], ['field', 'field', 5, 7, 1, ['nature']], ['fire', 'fire', 5, 7, 1, ['weather']],
  ['fish', 'fish', 5, 7, 1, ['animals']], ['flag', 'flag', 5, 7, 1, ['objects']], ['flashlight', 'flash...light', 5, 7, 1, ['objects']],
  ['fox', 'fox', 5, 7, 1, ['animals']], ['frog', 'frog', 5, 7, 1, ['animals']], ['game', 'game', 5, 7, 1, ['play']],
  ['gate', 'gate', 5, 7, 1, ['home']], ['ghost', 'ghost', 5, 7, 1, ['stories']], ['gift', 'gift', 5, 7, 1, ['celebration']],
  ['glad', 'glad', 5, 7, 1, ['feelings']], ['glove', 'glove', 5, 7, 1, ['clothes']], ['goat', 'goat', 5, 7, 1, ['animals']],
  ['grape', 'gra...pe', 5, 7, 1, ['food']], ['grass', 'grass', 5, 7, 1, ['nature']], ['green', 'green', 5, 7, 1, ['colors']],
  ['hand', 'hand', 5, 7, 1, ['body']], ['hat', 'hat', 5, 7, 1, ['clothes']], ['hill', 'hill', 5, 7, 1, ['nature']],
  ['honey', 'hon...ey', 5, 7, 1, ['food']], ['horse', 'horse', 5, 7, 1, ['animals']], ['house', 'house', 5, 7, 1, ['home']],
  ['igloo', 'ig...loo', 5, 7, 1, ['places']], ['insect', 'in...sect', 5, 7, 1, ['animals']], ['jam', 'jam', 5, 7, 1, ['food']],
  ['jelly', 'jel...ly', 5, 7, 1, ['food']], ['juice', 'juice', 5, 7, 1, ['food']], ['jump', 'jump', 5, 7, 1, ['play']],
  ['key', 'key', 5, 7, 1, ['objects']], ['kite', 'kite', 5, 7, 1, ['play']], ['koala', 'ko...a...la', 5, 7, 1, ['animals']],
  ['lamp', 'lamp', 5, 7, 1, ['home']], ['leaf', 'leaf', 5, 7, 1, ['nature']], ['light', 'light', 5, 7, 1, ['home']],
  ['lion', 'li...on', 5, 7, 1, ['animals']], ['lizard', 'liz...ard', 5, 7, 1, ['animals']], ['log', 'log', 5, 7, 1, ['nature']],
  ['lunch', 'lunch', 5, 7, 1, ['food']], ['map', 'map', 5, 7, 1, ['places']], ['milk', 'milk', 5, 7, 1, ['food']],
  ['mirror', 'mir...ror', 5, 7, 1, ['home']], ['moon', 'moon', 5, 7, 1, ['space']], ['mouse', 'mouse', 5, 7, 1, ['animals']],
  ['nail', 'nail', 5, 7, 1, ['objects']], ['nest', 'nest', 5, 7, 1, ['animals']], ['notebook', 'note...book', 5, 7, 1, ['school']],
  ['owl', 'owl', 5, 7, 1, ['animals']], ['pancake', 'pan...cake', 5, 7, 1, ['food']], ['park', 'park', 5, 7, 1, ['places']],
  ['parrot', 'par...rot', 5, 7, 1, ['animals']], ['peach', 'peach', 5, 7, 1, ['food']], ['pear', 'pear', 5, 7, 1, ['food']],
  ['pen', 'pen', 5, 7, 1, ['school']], ['pink', 'pink', 5, 7, 1, ['colors']], ['plane', 'pla...ne', 5, 7, 1, ['travel']],
  ['plant', 'plant', 5, 7, 1, ['nature']], ['rain', 'rain', 5, 7, 1, ['weather']], ['ring', 'ring', 5, 7, 1, ['objects']],
  ['road', 'road', 5, 7, 1, ['travel']], ['robot', 'ro...bot', 5, 7, 1, ['play']], ['rope', 'rope', 5, 7, 1, ['play']],
  ['sand', 'sand', 5, 7, 1, ['nature']], ['scarf', 'scarf', 5, 7, 1, ['clothes']], ['school', 'school', 5, 7, 1, ['school']],
  ['seed', 'seed', 5, 7, 1, ['nature']], ['shark', 'shark', 5, 7, 1, ['animals']], ['shell', 'shell', 5, 7, 1, ['nature']],
  ['ship', 'ship', 5, 7, 1, ['travel']], ['shoe', 'shoe', 5, 7, 1, ['clothes']], ['shop', 'shop', 5, 7, 1, ['places']],
  ['sing', 'sing', 5, 7, 1, ['music']], ['smile', 'smile', 5, 7, 1, ['feelings']], ['snack', 'snack', 5, 7, 1, ['food']],
  ['snow', 'snow', 5, 7, 1, ['weather']], ['sock', 'sock', 5, 7, 1, ['clothes']], ['spoon', 'spoon', 5, 7, 1, ['home']],
  ['stamp', 'stamp', 5, 7, 1, ['school']], ['star', 'star', 5, 7, 1, ['space']], ['stick', 'stick', 5, 7, 1, ['nature']],
  ['stone', 'sto...ne', 5, 7, 1, ['nature']], ['storm', 'storm', 5, 7, 1, ['weather']], ['sun', 'sun', 5, 7, 1, ['space']],
  ['swing', 'swing', 5, 7, 1, ['play']], ['table', 'tab...le', 5, 7, 1, ['home']], ['tent', 'tent', 5, 7, 1, ['places']],
  ['tiger', 'ti...ger', 5, 7, 1, ['animals']], ['toast', 'toast', 5, 7, 1, ['food']], ['train', 'train', 5, 7, 1, ['travel']],
  ['tree', 'tree', 5, 7, 1, ['nature']], ['truck', 'truck', 5, 7, 1, ['travel']], ['water', 'wa...ter', 5, 7, 1, ['nature']],
  ['whale', 'whale', 5, 7, 1, ['animals']], ['window', 'win...dow', 5, 7, 1, ['home']], ['worm', 'worm', 5, 7, 1, ['animals']],
  ['yellow', 'yel...low', 5, 7, 1, ['colors']], ['zebra', 'zeb...ra', 5, 7, 1, ['animals']],

  ['above', 'ab...o...ve', 7, 9, 2, ['position']], ['across', 'a...cross', 7, 9, 2, ['position']], ['afraid', 'a...fraid', 7, 9, 2, ['feelings']],
  ['airplane', 'air...plane', 7, 9, 2, ['travel']], ['airport', 'air...port', 7, 9, 2, ['places']], ['almost', 'al...most', 7, 9, 2, ['core']],
  ['animal', 'an...i...mal', 7, 9, 2, ['animals']], ['artist', 'ar...tist', 7, 9, 2, ['art']], ['baboon', 'ba...boon', 7, 9, 2, ['animals']],
  ['backpack', 'back...pack', 7, 9, 2, ['school']], ['balance', 'bal...ance', 7, 9, 2, ['body']], ['banana', 'ba...na...na', 7, 9, 2, ['food']],
  ['basket', 'bas...ket', 7, 9, 2, ['objects']], ['beach', 'beach', 7, 9, 2, ['places']], ['bedroom', 'bed...room', 7, 9, 2, ['home']],
  ['beetle', 'bee...tle', 7, 9, 2, ['animals']], ['begin', 'be...gin', 7, 9, 2, ['school']], ['between', 'be...tween', 7, 9, 2, ['position']],
  ['bicycle', 'bi...cy...cle', 7, 9, 2, ['travel']], ['birthday', 'birth...day', 7, 9, 2, ['celebration']], ['blanket', 'blan...ket', 7, 9, 2, ['home']],
  ['blossom', 'blos...som', 7, 9, 2, ['nature']], ['branch', 'branch', 7, 9, 2, ['nature']], ['bright', 'bright', 7, 9, 2, ['describing']],
  ['bubble', 'bub...ble', 7, 9, 2, ['play']], ['button', 'but...ton', 7, 9, 2, ['clothes']], ['candle', 'can...dle', 7, 9, 2, ['home']],
  ['captain', 'cap...tain', 7, 9, 2, ['people']], ['carrot', 'car...rot', 7, 9, 2, ['food']], ['cartoon', 'car...toon', 7, 9, 2, ['stories']],
  ['castle', 'cas...tle', 7, 9, 2, ['places']], ['cereal', 'ce...real', 7, 9, 2, ['food']], ['cheetah', 'chee...tah', 7, 9, 2, ['animals']],
  ['chicken', 'chick...en', 7, 9, 2, ['animals']], ['circle', 'cir...cle', 7, 9, 2, ['math']], ['climber', 'clim...ber', 7, 9, 2, ['people']],
  ['closet', 'clo...set', 7, 9, 2, ['home']], ['cobweb', 'cob...web', 7, 9, 2, ['nature']], ['corner', 'cor...ner', 7, 9, 2, ['position']],
  ['cousin', 'cou...sin', 7, 9, 2, ['people']], ['cupcake', 'cup...cake', 7, 9, 2, ['food']], ['curtain', 'cur...tain', 7, 9, 2, ['home']],
  ['daisy', 'dai...sy', 7, 9, 2, ['nature']], ['dentist', 'den...tist', 7, 9, 2, ['people']], ['desert', 'des...ert', 7, 9, 2, ['places']],
  ['dinner', 'din...ner', 7, 9, 2, ['food']], ['doctor', 'doc...tor', 7, 9, 2, ['people']], ['dolphin', 'dol...phin', 7, 9, 2, ['animals']],
  ['dragon', 'dra...gon', 7, 9, 2, ['magic']], ['drawer', 'draw...er', 7, 9, 2, ['home']], ['dream', 'dream', 7, 9, 2, ['feelings']],
  ['drizzle', 'driz...zle', 7, 9, 2, ['weather']], ['every', 'ev...e...ry', 7, 9, 2, ['core']], ['fairy', 'fair...y', 7, 9, 2, ['magic']],
  ['family', 'fam...i...ly', 7, 9, 2, ['people']], ['farmer', 'farm...er', 7, 9, 2, ['people']], ['feather', 'feat...her', 7, 9, 2, ['animals']],
  ['fever', 'fe...ver', 7, 9, 2, ['body']], ['flamingo', 'fla...min...go', 7, 9, 2, ['animals']], ['flower', 'flo...wer', 7, 9, 2, ['nature']],
  ['forest', 'for...est', 7, 9, 2, ['nature']], ['friend', 'friend', 7, 9, 2, ['people']], ['garden', 'gar...den', 7, 9, 2, ['nature']],
  ['giant', 'giant', 7, 9, 2, ['describing']], ['ginger', 'gin...ger', 7, 9, 2, ['food']], ['giraffe', 'gi...raffe', 7, 9, 2, ['animals']],
  ['glitter', 'glit...ter', 7, 9, 2, ['magic']], ['goblin', 'gob...lin', 7, 9, 2, ['stories']], ['guitar', 'gui...tar', 7, 9, 2, ['music']],
  ['hammer', 'ham...mer', 7, 9, 2, ['objects']], ['happen', 'hap...pen', 7, 9, 2, ['core']], ['happy', 'hap...py', 7, 9, 2, ['feelings']],
  ['harbor', 'har...bor', 7, 9, 2, ['places']], ['helmet', 'hel...met', 7, 9, 2, ['clothes']], ['hidden', 'hid...den', 7, 9, 2, ['describing']],
  ['holiday', 'hol...i...day', 7, 9, 2, ['celebration']], ['island', 'is...land', 7, 9, 2, ['places']], ['jacket', 'jac...ket', 7, 9, 2, ['clothes']],
  ['jigsaw', 'jig...saw', 7, 9, 2, ['play']], ['jumper', 'jump...er', 7, 9, 2, ['clothes']], ['jungle', 'jun...gle', 7, 9, 2, ['places']],
  ['kangaroo', 'kan...ga...roo', 7, 9, 2, ['animals']], ['ketchup', 'ketch...up', 7, 9, 2, ['food']], ['kitten', 'kit...ten', 7, 9, 2, ['animals']],
  ['ladder', 'lad...der', 7, 9, 2, ['objects']], ['ladybug', 'la...dy...bug', 7, 9, 2, ['animals']], ['lantern', 'lan...tern', 7, 9, 2, ['home']],
  ['laundry', 'laun...dry', 7, 9, 2, ['home']], ['lemon', 'lem...on', 7, 9, 2, ['food']], ['letter', 'let...ter', 7, 9, 2, ['school']],
  ['magic', 'ma...gic', 7, 9, 2, ['magic']], ['mailbox', 'mail...box', 7, 9, 2, ['home']], ['marble', 'mar...ble', 7, 9, 2, ['play']],
  ['market', 'mar...ket', 7, 9, 2, ['places']], ['mascot', 'mas...cot', 7, 9, 2, ['school']], ['meadow', 'mead...ow', 7, 9, 2, ['nature']],
  ['middle', 'mid...dle', 7, 9, 2, ['position']], ['minute', 'min...u...te', 7, 9, 2, ['time']], ['misty', 'mis...ty', 7, 9, 2, ['weather']],
  ['monkey', 'mon...key', 7, 9, 2, ['animals']], ['morning', 'morn...ing', 7, 9, 2, ['time']], ['muffin', 'muf...fin', 7, 9, 2, ['food']],
  ['music', 'mu...sic', 7, 9, 2, ['music']], ['napkin', 'nap...kin', 7, 9, 2, ['home']], ['ocean', 'o...cean', 7, 9, 2, ['nature']],
  ['orange', 'or...an...ge', 7, 9, 2, ['colors']], ['otter', 'ot...ter', 7, 9, 2, ['animals']], ['outside', 'out...side', 7, 9, 2, ['position']],
  ['paint', 'paint', 7, 9, 2, ['art']], ['panda', 'pan...da', 7, 9, 2, ['animals']], ['pepper', 'pep...per', 7, 9, 2, ['food']],
  ['picnic', 'pic...nic', 7, 9, 2, ['food']], ['pillow', 'pil...low', 7, 9, 2, ['home']], ['pirate', 'pi...rate', 7, 9, 2, ['people']],
  ['planet', 'pla...net', 7, 9, 2, ['space']], ['pocket', 'poc...ket', 7, 9, 2, ['clothes']], ['polar', 'po...lar', 7, 9, 2, ['animals']],
  ['pretty', 'pret...ty', 7, 9, 2, ['describing']], ['pumpkin', 'pump...kin', 7, 9, 2, ['food']], ['puppy', 'pup...py', 7, 9, 2, ['animals']],
  ['purple', 'pur...ple', 7, 9, 2, ['colors']], ['rabbit', 'rab...bit', 7, 9, 2, ['animals']], ['rainbow', 'rain...bow', 7, 9, 2, ['weather']],
  ['raincoat', 'rain...coat', 7, 9, 2, ['clothes']], ['river', 'riv...er', 7, 9, 2, ['nature']], ['rocket', 'roc...ket', 7, 9, 2, ['space']],
  ['rowboat', 'row...boat', 7, 9, 2, ['travel']], ['saddle', 'sad...dle', 7, 9, 2, ['objects']], ['sailor', 'sai...lor', 7, 9, 2, ['people']],
  ['salad', 'sal...ad', 7, 9, 2, ['food']], ['sandbox', 'sand...box', 7, 9, 2, ['play']], ['seesaw', 'see...saw', 7, 9, 2, ['play']],
  ['shiny', 'shi...ny', 7, 9, 2, ['describing']], ['silver', 'sil...ver', 7, 9, 2, ['colors']], ['snowman', 'snow...man', 7, 9, 2, ['weather']],
  ['spring', 'spring', 7, 9, 2, ['time']], ['story', 'sto...ry', 7, 9, 2, ['school']], ['street', 'street', 7, 9, 2, ['places']],
  ['summer', 'sum...mer', 7, 9, 2, ['time']], ['sunlight', 'sun...light', 7, 9, 2, ['nature']], ['tadpole', 'tad...pole', 7, 9, 2, ['animals']],
  ['teacher', 'teac...her', 7, 9, 2, ['people']], ['teapot', 'tea...pot', 7, 9, 2, ['home']], ['teaspoon', 'tea...spoon', 7, 9, 2, ['home']],
  ['thunder', 'thun...der', 7, 9, 2, ['weather']], ['ticket', 'tick...et', 7, 9, 2, ['objects']], ['tomato', 'to...ma...to', 7, 9, 2, ['food']],
  ['tractor', 'trac...tor', 7, 9, 2, ['travel']], ['traffic', 'traf...fic', 7, 9, 2, ['travel']], ['trombone', 'trom...bone', 7, 9, 2, ['music']],
  ['tunnel', 'tun...nel', 7, 9, 2, ['places']], ['turkey', 'tur...key', 7, 9, 2, ['animals']], ['volcano', 'vol...ca...no', 7, 9, 2, ['nature']],
  ['wallet', 'wal...let', 7, 9, 2, ['objects']], ['walrus', 'wal...rus', 7, 9, 2, ['animals']], ['willow', 'wil...low', 7, 9, 2, ['nature']],
  ['winter', 'win...ter', 7, 9, 2, ['time']], ['wonder', 'won...der', 7, 9, 2, ['feelings']], ['yogurt', 'yo...gurt', 7, 9, 2, ['food']],
  ['zipper', 'zip...per', 7, 9, 2, ['clothes']], ['zookeeper', 'zoo...keep...er', 7, 9, 2, ['people']],

  ['adventure', 'ad...ven...tu...re', 9, 12, 3, ['stories']], ['answer', 'an...swer', 9, 12, 3, ['school']], ['astronaut', 'as...tro...naut', 9, 12, 3, ['space']],
  ['avalanche', 'av...a...lanche', 9, 12, 3, ['weather']], ['beautiful', 'beaut...i...ful', 9, 12, 3, ['describing']], ['because', 'bec...au...se', 9, 12, 3, ['core']],
  ['binoculars', 'bi...noc...u...lars', 9, 12, 3, ['objects']], ['calendar', 'cal...en...dar', 9, 12, 3, ['time']], ['careful', 'care...ful', 9, 12, 3, ['describing']],
  ['celebrate', 'cel...eb...ra...te', 9, 12, 3, ['celebration']], ['century', 'cen...tu...ry', 9, 12, 3, ['time']], ['chocolate', 'choc...o...la...te', 9, 12, 3, ['food']],
  ['collect', 'col...lect', 9, 12, 3, ['core']], ['compass', 'com...pass', 9, 12, 3, ['objects']], ['crystal', 'crys...tal', 9, 12, 3, ['magic']],
  ['curious', 'cu...rious', 9, 12, 3, ['feelings']], ['daughter', 'daug...hter', 9, 12, 3, ['people']], ['dinosaur', 'di...no...saur', 9, 12, 3, ['animals']],
  ['discover', 'dis...co...ver', 9, 12, 3, ['core']], ['distant', 'dis...tant', 9, 12, 3, ['describing']], ['dragonfly', 'drag...on...fly', 9, 12, 3, ['animals']],
  ['electric', 'el...ec...tric', 9, 12, 3, ['science']], ['enough', 'e...nough', 9, 12, 3, ['core']], ['equation', 'e...qua...tion', 9, 12, 3, ['math']],
  ['feast', 'feast', 9, 12, 3, ['celebration']], ['festival', 'fes...ti...val', 9, 12, 3, ['celebration']], ['fraction', 'frac...tion', 9, 12, 3, ['math']],
  ['galaxy', 'gal...a...xy', 9, 12, 3, ['space']], ['geography', 'ge...og...ra...phy', 9, 12, 3, ['school']], ['giggle', 'gig...gle', 9, 12, 3, ['feelings']],
  ['guardian', 'guar...dian', 9, 12, 3, ['people']], ['history', 'his...to...ry', 9, 12, 3, ['school']], ['horizon', 'ho...ri...zon', 9, 12, 3, ['nature']],
  ['imagine', 'im...a...gi...ne', 9, 12, 3, ['stories']], ['journey', 'jour...ney', 9, 12, 3, ['travel']], ['library', 'lib...ra...ry', 9, 12, 3, ['places']],
  ['measure', 'meas...u...re', 9, 12, 3, ['math']], ['message', 'mes...sa...ge', 9, 12, 3, ['communication']], ['microscope', 'mi...cro...scope', 9, 12, 3, ['science']],
  ['mountain', 'moun...tain', 9, 12, 3, ['nature']], ['musician', 'mus...i...cian', 9, 12, 3, ['people']], ['mystery', 'mys...te...ry', 9, 12, 3, ['stories']],
  ['neighbor', 'neig...hbor', 9, 12, 3, ['people']], ['orchard', 'or...chard', 9, 12, 3, ['nature']], ['outline', 'out...line', 9, 12, 3, ['school']],
  ['pattern', 'pat...tern', 9, 12, 3, ['math']], ['penguin', 'pen...guin', 9, 12, 3, ['animals']], ['picture', 'pic...tu...re', 9, 12, 3, ['art']],
  ['pioneer', 'pio...neer', 9, 12, 3, ['history']], ['practice', 'prac...ti...ce', 9, 12, 3, ['school']], ['president', 'pres...i...dent', 9, 12, 3, ['people']],
  ['protect', 'pro...tect', 9, 12, 3, ['core']], ['recess', 're...cess', 9, 12, 3, ['school']], ['remember', 'rem...em...ber', 9, 12, 3, ['core']],
  ['science', 'scien...ce', 9, 12, 3, ['school']], ['shadow', 'sha...dow', 9, 12, 3, ['nature']], ['special', 'spe...cial', 9, 12, 3, ['describing']],
  ['squirrel', 'squir...rel', 9, 12, 3, ['animals']], ['stretch', 'stretch', 9, 12, 3, ['body']], ['student', 'stu...dent', 9, 12, 3, ['people']],
  ['surprise', 'sur...pri...se', 9, 12, 3, ['feelings']], ['treasure', 'treas...u...re', 9, 12, 3, ['stories']], ['triangle', 'trian...gle', 9, 12, 3, ['math']],
  ['umbrella', 'um...brel...la', 9, 12, 3, ['weather']], ['unicorn', 'un...i...corn', 9, 12, 3, ['magic']], ['vacation', 'vac...a...tion', 9, 12, 3, ['time']],
  ['volunteer', 'vol...un...teer', 9, 12, 3, ['people']], ['whisper', 'whis...per', 9, 12, 3, ['communication']], ['wizard', 'wi...zard', 9, 12, 3, ['magic']]
] as const

export const WORD_CATALOG: WordCatalogEntry[] = entries.map(([word, enunciationText, ageBandMin, ageBandMax, difficulty, tags]) => ({
  id: word,
  word,
  normalizedWord: word.toLowerCase(),
  enunciationText: shouldUseCanonicalEnunciation(word) ? word : enunciationText,
  ageBandMin,
  ageBandMax,
  difficulty,
  tags: [...tags]
}))
