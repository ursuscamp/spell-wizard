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
  ['ant', 'ant', 5, 7, 1, ['animals']], ['apple', 'ap...pul', 5, 7, 1, ['food']], ['back', 'back', 5, 7, 1, ['core']],
  ['ball', 'ball', 5, 7, 1, ['play']], ['bed', 'bed', 5, 7, 1, ['home']], ['bell', 'bell', 5, 7, 1, ['sound']],
  ['bird', 'bird', 5, 7, 1, ['animals']], ['blue', 'bloo', 5, 7, 1, ['colors']], ['boat', 'boht', 5, 7, 1, ['travel']],
  ['book', 'book', 5, 7, 1, ['school']], ['cake', 'kayk', 5, 7, 1, ['food']], ['cat', 'cat', 5, 7, 1, ['animals']],
  ['chair', 'chair', 5, 7, 1, ['home']], ['cloud', 'cloud', 5, 7, 1, ['weather']], ['coat', 'koht', 5, 7, 1, ['clothes']],
  ['corn', 'corn', 5, 7, 1, ['food']], ['dance', 'dance', 5, 7, 1, ['play']], ['day', 'day', 5, 7, 1, ['time']],
  ['doll', 'doll', 5, 7, 1, ['play']], ['door', 'door', 5, 7, 1, ['home']], ['drum', 'drum', 5, 7, 1, ['music']],
  ['duck', 'duck', 5, 7, 1, ['animals']], ['farm', 'farm', 5, 7, 1, ['places']], ['fish', 'fish', 5, 7, 1, ['animals']],
  ['frog', 'frog', 5, 7, 1, ['animals']], ['game', 'gaym', 5, 7, 1, ['play']], ['gate', 'gayt', 5, 7, 1, ['home']],
  ['gift', 'gift', 5, 7, 1, ['celebration']], ['glad', 'glad', 5, 7, 1, ['feelings']], ['grape', 'grayp', 5, 7, 1, ['food']],
  ['green', 'green', 5, 7, 1, ['colors']], ['hand', 'hand', 5, 7, 1, ['body']], ['hat', 'hat', 5, 7, 1, ['clothes']],
  ['hill', 'hill', 5, 7, 1, ['nature']], ['jump', 'jump', 5, 7, 1, ['play']], ['kite', 'kite', 5, 7, 1, ['play']],
  ['lamp', 'lamp', 5, 7, 1, ['home']], ['leaf', 'leef', 5, 7, 1, ['nature']], ['light', 'lite', 5, 7, 1, ['home']],
  ['milk', 'milk', 5, 7, 1, ['food']], ['moon', 'moon', 5, 7, 1, ['space']], ['nest', 'nest', 5, 7, 1, ['animals']],
  ['park', 'park', 5, 7, 1, ['places']], ['pink', 'pink', 5, 7, 1, ['colors']], ['plane', 'playn', 5, 7, 1, ['travel']],
  ['plant', 'plant', 5, 7, 1, ['nature']], ['rain', 'rayn', 5, 7, 1, ['weather']], ['ring', 'ring', 5, 7, 1, ['objects']],
  ['robot', 'row...bot', 5, 7, 1, ['play']], ['school', 'skool', 5, 7, 1, ['school']], ['seed', 'seed', 5, 7, 1, ['nature']],
  ['ship', 'ship', 5, 7, 1, ['travel']], ['shoe', 'shoe', 5, 7, 1, ['clothes']], ['shop', 'shop', 5, 7, 1, ['places']],
  ['sing', 'sing', 5, 7, 1, ['music']], ['snow', 'snow', 5, 7, 1, ['weather']], ['sock', 'sock', 5, 7, 1, ['clothes']],
  ['star', 'star', 5, 7, 1, ['space']], ['stone', 'stohn', 5, 7, 1, ['nature']], ['sun', 'sun', 5, 7, 1, ['space']],
  ['swing', 'swing', 5, 7, 1, ['play']], ['table', 'tay...bul', 5, 7, 1, ['home']], ['tiger', 'tie...ger', 5, 7, 1, ['animals']],
  ['train', 'trayn', 5, 7, 1, ['travel']], ['tree', 'tree', 5, 7, 1, ['nature']], ['water', 'wah...ter', 5, 7, 1, ['nature']],
  ['window', 'win...doe', 5, 7, 1, ['home']], ['yellow', 'yel...low', 5, 7, 1, ['colors']], ['zebra', 'zee...bruh', 5, 7, 1, ['animals']],

  ['acorn', 'a...corn', 5, 7, 1, ['nature']], ['bear', 'bear', 5, 7, 1, ['animals']], ['bee', 'bee', 5, 7, 1, ['animals']],
  ['block', 'block', 5, 7, 1, ['play']], ['bread', 'bread', 5, 7, 1, ['food']], ['broom', 'broom', 5, 7, 1, ['home']],
  ['brush', 'brush', 5, 7, 1, ['home']], ['bug', 'bug', 5, 7, 1, ['animals']], ['bus', 'bus', 5, 7, 1, ['travel']],
  ['clock', 'clock', 5, 7, 1, ['time']], ['crab', 'crab', 5, 7, 1, ['animals']], ['crow', 'crow', 5, 7, 1, ['animals']],
  ['cup', 'cup', 5, 7, 1, ['home']], ['deer', 'deer', 5, 7, 1, ['animals']], ['dish', 'dish', 5, 7, 1, ['home']],
  ['dog', 'dog', 5, 7, 1, ['animals']], ['flag', 'flag', 5, 7, 1, ['objects']], ['fox', 'fox', 5, 7, 1, ['animals']],
  ['glove', 'glove', 5, 7, 1, ['clothes']], ['goat', 'goat', 5, 7, 1, ['animals']], ['grass', 'grass', 5, 7, 1, ['nature']],
  ['horse', 'horse', 5, 7, 1, ['animals']], ['house', 'house', 5, 7, 1, ['home']], ['jam', 'jam', 5, 7, 1, ['food']],
  ['juice', 'juice', 5, 7, 1, ['food']], ['key', 'key', 5, 7, 1, ['objects']], ['lion', 'li...on', 5, 7, 1, ['animals']],
  ['log', 'log', 5, 7, 1, ['nature']], ['map', 'map', 5, 7, 1, ['places']], ['mouse', 'mouse', 5, 7, 1, ['animals']],
  ['peach', 'peach', 5, 7, 1, ['food']], ['pear', 'pear', 5, 7, 1, ['food']], ['pen', 'pen', 5, 7, 1, ['school']],
  ['road', 'road', 5, 7, 1, ['travel']], ['rope', 'rope', 5, 7, 1, ['play']], ['sand', 'sand', 5, 7, 1, ['nature']],
  ['scarf', 'scarf', 5, 7, 1, ['clothes']], ['shark', 'shark', 5, 7, 1, ['animals']], ['shell', 'shell', 5, 7, 1, ['nature']],
  ['smile', 'smile', 5, 7, 1, ['feelings']], ['snack', 'snack', 5, 7, 1, ['food']], ['spoon', 'spoon', 5, 7, 1, ['home']],
  ['stamp', 'stamp', 5, 7, 1, ['school']], ['stick', 'stick', 5, 7, 1, ['nature']], ['storm', 'storm', 5, 7, 1, ['weather']],
  ['tent', 'tent', 5, 7, 1, ['places']], ['toast', 'toast', 5, 7, 1, ['food']], ['truck', 'truck', 5, 7, 1, ['travel']],
  ['whale', 'whale', 5, 7, 1, ['animals']], ['worm', 'worm', 5, 7, 1, ['animals']],

  ['above', 'uh...buv', 7, 9, 2, ['position']], ['almost', 'awl...most', 7, 9, 2, ['core']], ['animal', 'an...uh...mul', 7, 9, 2, ['animals']],
  ['basket', 'bas...kit', 7, 9, 2, ['objects']], ['beach', 'beech', 7, 9, 2, ['places']], ['begin', 'bih...gin', 7, 9, 2, ['school']],
  ['blanket', 'blan...kit', 7, 9, 2, ['home']], ['branch', 'branch', 7, 9, 2, ['nature']], ['bright', 'brite', 7, 9, 2, ['describing']],
  ['bubble', 'bub...bul', 7, 9, 2, ['play']], ['candle', 'can...dul', 7, 9, 2, ['home']], ['captain', 'cap...tin', 7, 9, 2, ['people']],
  ['castle', 'cas...sul', 7, 9, 2, ['places']], ['cereal', 'seer...ee...ul', 7, 9, 2, ['food']], ['circle', 'sur...kul', 7, 9, 2, ['math']],
  ['climber', 'clime...ber', 7, 9, 2, ['people']], ['closet', 'claw...zit', 7, 9, 2, ['home']], ['corner', 'kor...ner', 7, 9, 2, ['position']],
  ['dragon', 'drag...un', 7, 9, 2, ['magic']], ['dream', 'dreem', 7, 9, 2, ['feelings']], ['every', 'ev...ree', 7, 9, 2, ['core']],
  ['family', 'fam...uh...lee', 7, 9, 2, ['people']], ['feather', 'feh...ther', 7, 9, 2, ['animals']], ['flower', 'flou...er', 7, 9, 2, ['nature']],
  ['friend', 'frend', 7, 9, 2, ['people']], ['garden', 'gar...den', 7, 9, 2, ['nature']], ['giant', 'jye...unt', 7, 9, 2, ['describing']],
  ['glitter', 'glit...ter', 7, 9, 2, ['magic']], ['hammer', 'ham...mer', 7, 9, 2, ['objects']], ['happen', 'hap...pen', 7, 9, 2, ['core']],
  ['happy', 'hap...ee', 7, 9, 2, ['feelings']], ['hidden', 'hid...den', 7, 9, 2, ['describing']], ['jacket', 'jack...it', 7, 9, 2, ['clothes']],
  ['jungle', 'jung...gul', 7, 9, 2, ['places']], ['kitten', 'kit...ten', 7, 9, 2, ['animals']], ['ladder', 'lad...der', 7, 9, 2, ['objects']],
  ['letter', 'let...ter', 7, 9, 2, ['school']], ['magic', 'maj...ik', 7, 9, 2, ['magic']], ['market', 'mar...kit', 7, 9, 2, ['places']],
  ['middle', 'mid...dul', 7, 9, 2, ['position']], ['minute', 'min...ut', 7, 9, 2, ['time']], ['napkin', 'nap...kin', 7, 9, 2, ['home']],
  ['ocean', 'oh...shun', 7, 9, 2, ['nature']], ['orange', 'or...inj', 7, 9, 2, ['colors']], ['outside', 'out...side', 7, 9, 2, ['position']],
  ['paint', 'paynt', 7, 9, 2, ['art']], ['pillow', 'pil...low', 7, 9, 2, ['home']], ['planet', 'plan...it', 7, 9, 2, ['space']],
  ['pocket', 'pok...it', 7, 9, 2, ['clothes']], ['pretty', 'prit...ee', 7, 9, 2, ['describing']], ['purple', 'pur...pul', 7, 9, 2, ['colors']],
  ['rabbit', 'rab...bit', 7, 9, 2, ['animals']], ['rainbow', 'rayn...boh', 7, 9, 2, ['weather']], ['rocket', 'rah...kit', 7, 9, 2, ['space']],
  ['sailor', 'say...ler', 7, 9, 2, ['people']], ['silver', 'sil...ver', 7, 9, 2, ['colors']], ['snowman', 'snow...man', 7, 9, 2, ['weather']],
  ['spring', 'spring', 7, 9, 2, ['time']], ['story', 'stor...ee', 7, 9, 2, ['school']], ['street', 'street', 7, 9, 2, ['places']],
  ['summer', 'sum...mer', 7, 9, 2, ['time']], ['teacher', 'tee...cher', 7, 9, 2, ['people']], ['thunder', 'thun...der', 7, 9, 2, ['weather']],
  ['tunnel', 'tun...nul', 7, 9, 2, ['places']], ['winter', 'win...ter', 7, 9, 2, ['time']], ['wonder', 'wun...der', 7, 9, 2, ['feelings']],

  ['across', 'a...cross', 7, 9, 2, ['position']], ['afraid', 'a...fraid', 7, 9, 2, ['feelings']], ['airplane', 'air...plane', 7, 9, 2, ['travel']],
  ['airport', 'air...port', 7, 9, 2, ['places']], ['backpack', 'back...pack', 7, 9, 2, ['school']], ['balance', 'bal...ance', 7, 9, 2, ['body']],
  ['banana', 'ba...na...na', 7, 9, 2, ['food']], ['beetle', 'bee...tle', 7, 9, 2, ['animals']], ['between', 'be...tween', 7, 9, 2, ['position']],
  ['bicycle', 'bi...cy...cle', 7, 9, 2, ['travel']], ['button', 'but...ton', 7, 9, 2, ['clothes']], ['carrot', 'car...rot', 7, 9, 2, ['food']],
  ['cobweb', 'cob...web', 7, 9, 2, ['nature']], ['cousin', 'cou...sin', 7, 9, 2, ['people']], ['dentist', 'den...tist', 7, 9, 2, ['people']],
  ['dinner', 'din...ner', 7, 9, 2, ['food']], ['dolphin', 'dol...phin', 7, 9, 2, ['animals']], ['farmer', 'farm...er', 7, 9, 2, ['people']],
  ['forest', 'for...est', 7, 9, 2, ['nature']], ['goblin', 'gob...lin', 7, 9, 2, ['stories']], ['helmet', 'hel...met', 7, 9, 2, ['clothes']],
  ['island', 'is...land', 7, 9, 2, ['places']], ['jumper', 'jump...er', 7, 9, 2, ['clothes']], ['lantern', 'lan...tern', 7, 9, 2, ['home']],
  ['lemon', 'lem...on', 7, 9, 2, ['food']], ['marble', 'mar...ble', 7, 9, 2, ['play']], ['meadow', 'mead...ow', 7, 9, 2, ['nature']],
  ['monkey', 'mon...key', 7, 9, 2, ['animals']], ['morning', 'morn...ing', 7, 9, 2, ['time']], ['muffin', 'muf...fin', 7, 9, 2, ['food']],
  ['music', 'mu...sic', 7, 9, 2, ['music']], ['panda', 'pan...da', 7, 9, 2, ['animals']], ['pepper', 'pep...per', 7, 9, 2, ['food']],
  ['picnic', 'pic...nic', 7, 9, 2, ['food']], ['pirate', 'pi...rate', 7, 9, 2, ['people']], ['polar', 'po...lar', 7, 9, 2, ['animals']],
  ['puppy', 'pup...py', 7, 9, 2, ['animals']], ['river', 'riv...er', 7, 9, 2, ['nature']], ['saddle', 'sad...dle', 7, 9, 2, ['objects']],
  ['salad', 'sal...ad', 7, 9, 2, ['food']], ['sandbox', 'sand...box', 7, 9, 2, ['play']], ['sunlight', 'sun...light', 7, 9, 2, ['nature']],
  ['tadpole', 'tad...pole', 7, 9, 2, ['animals']], ['ticket', 'tick...et', 7, 9, 2, ['objects']], ['tomato', 'to...ma...to', 7, 9, 2, ['food']],
  ['tractor', 'trac...tor', 7, 9, 2, ['travel']], ['traffic', 'traf...fic', 7, 9, 2, ['travel']], ['turkey', 'tur...key', 7, 9, 2, ['animals']],
  ['wallet', 'wal...let', 7, 9, 2, ['objects']], ['zookeeper', 'zoo...keep...er', 7, 9, 2, ['people']],

  ['adventure', 'ad...ven...cher', 9, 12, 3, ['stories']], ['answer', 'an...ser', 9, 12, 3, ['school']], ['beautiful', 'byoo...tuh...ful', 9, 12, 3, ['describing']],
  ['because', 'bih...cawz', 9, 12, 3, ['core']], ['calendar', 'cal...en...der', 9, 12, 3, ['time']],
  ['careful', 'care...ful', 9, 12, 3, ['describing']], ['celebrate', 'sel...uh...brayt', 9, 12, 3, ['celebration']], ['century', 'sen...cher...ee', 9, 12, 3, ['time']],
  ['chocolate', 'chawk...lit', 9, 12, 3, ['food']], ['collect', 'kuh...lekt', 9, 12, 3, ['core']], ['compass', 'kum...pus', 9, 12, 3, ['objects']],
  ['crystal', 'kris...tul', 9, 12, 3, ['magic']], ['curious', 'cure...ee...us', 9, 12, 3, ['feelings']], ['daughter', 'daw...ter', 9, 12, 3, ['people']],
  ['discover', 'dih...scuv...er', 9, 12, 3, ['core']], ['distant', 'dis...tunt', 9, 12, 3, ['describing']], ['dragonfly', 'drag...un...fly', 9, 12, 3, ['animals']],
  ['electric', 'ee...lek...trik', 9, 12, 3, ['science']], ['enough', 'ee...nuf', 9, 12, 3, ['core']], ['feast', 'feest', 9, 12, 3, ['celebration']],
  ['festival', 'fes...tuh...vul', 9, 12, 3, ['celebration']], ['fraction', 'frak...shun', 9, 12, 3, ['math']], ['galaxy', 'gal...uk...see', 9, 12, 3, ['space']],
  ['giggle', 'gig...gul', 9, 12, 3, ['feelings']], ['guardian', 'gar...dee...un', 9, 12, 3, ['people']], ['history', 'his...ter...ee', 9, 12, 3, ['school']],
  ['imagine', 'ih...maj...in', 9, 12, 3, ['stories']], ['journey', 'jer...nee', 9, 12, 3, ['travel']], ['library', 'ly...brer...ee', 9, 12, 3, ['places']],
  ['measure', 'mezh...er', 9, 12, 3, ['math']], ['message', 'mes...ij', 9, 12, 3, ['communication']], ['mountain', 'moun...tin', 9, 12, 3, ['nature']],
  ['musician', 'myoo...zish...un', 9, 12, 3, ['people']], ['mystery', 'mis...ter...ee', 9, 12, 3, ['stories']], ['neighbor', 'nay...ber', 9, 12, 3, ['people']],
  ['orchard', 'or...cherd', 9, 12, 3, ['nature']], ['outline', 'out...line', 9, 12, 3, ['school']], ['pattern', 'pat...tern', 9, 12, 3, ['math']],
  ['penguin', 'peng...gwin', 9, 12, 3, ['animals']], ['picture', 'pik...cher', 9, 12, 3, ['art']], ['pioneer', 'pie...uh...neer', 9, 12, 3, ['history']],
  ['practice', 'prak...tis', 9, 12, 3, ['school']], ['protect', 'pruh...tekt', 9, 12, 3, ['core']], ['recess', 'ree...sess', 9, 12, 3, ['school']],
  ['remember', 'rih...mem...ber', 9, 12, 3, ['core']], ['science', 'sye...uns', 9, 12, 3, ['school']], ['shadow', 'shad...oh', 9, 12, 3, ['nature']],
  ['special', 'spesh...ul', 9, 12, 3, ['describing']], ['squirrel', 'skwir...ul', 9, 12, 3, ['animals']], ['stretch', 'stretch', 9, 12, 3, ['body']],
  ['student', 'stoo...dent', 9, 12, 3, ['people']], ['surprise', 'ser...prize', 9, 12, 3, ['feelings']], ['treasure', 'trezh...er', 9, 12, 3, ['stories']],
  ['triangle', 'try...ang...gul', 9, 12, 3, ['math']], ['umbrella', 'um...brel...uh', 9, 12, 3, ['weather']], ['unicorn', 'yoo...nih...corn', 9, 12, 3, ['magic']],
  ['vacation', 'vay...kay...shun', 9, 12, 3, ['time']], ['whisper', 'whis...per', 9, 12, 3, ['communication']], ['wizard', 'wiz...erd', 9, 12, 3, ['magic']]
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
