// The myth bank — 62 entries across 14 psychological shapes, ported from
// spec/myth-index.json (the source of truth authored 13 Aug 2026).
//
// WHY THIS EXISTS. The composer used to derive its governing imagery from the
// chart's dominant element: "fire favors quest, flame, forge, dawn; water
// favors ocean, tide, well, undertow". Elemental palettes are tiny, so they
// recur — a measured audit found a torch governing four of five real charts,
// including one that was air-dominant with fire third of four, and the
// Ascendant rendered as a door or threshold in 100% of documents.
//
// Myths are numerous, chart-specific, and carry their own development, so the
// image inherits an arc instead of a mood. The rule is: myth first, image
// second. The myth is chosen for the chart's HARDEST theme; whatever object,
// place or gesture the story turns on becomes the portrait's governing image.
//
// TIERS encode durability, not quality. A "current" entry is eligible only if
// the reader was under 55 when it was released — a 2013 film cannot be the
// governing image of a portrait for someone born in 1940.

export interface MythShape { id: string; name: string; gloss: string }
export interface Myth {
  id: string; title: string; source: string;
  tier: "perennial" | "canonical" | "current";
  release?: number; review?: number; shape: string;
  story: string; turn: string; image: string; siblings: string[];
}

export const MYTH_SHAPES: MythShape[] = [
  { id: "mark-at-sovereignty", name: "A visible mark at the place of sovereignty", gloss: "the wound sits exactly where the person must be seen, and seems to disqualify them from standing there" },
  { id: "ordeal-undergone", name: "An ordeal that must be undergone, not avoided", gloss: "there is no route around; the only way out is through, and something is left behind in payment" },
  { id: "gift-not-grasped", name: "A gift that arrives only when it is not grasped at", gloss: "the thing wanted cannot be taken, only received — and wanting it too visibly is what prevents it" },
  { id: "two-natures", name: "Two natures in one body that will not reconcile", gloss: "both are real, neither is the disguise, and the cost is in the switching" },
  { id: "promise-costs-instrument", name: "A promise that costs the thing it was made with", gloss: "the price of being trusted is the very faculty used to make the promise" },
  { id: "maker-cannot-inhabit", name: "The maker who cannot inhabit what they make", gloss: "builds the thing perfectly and cannot live in it, or cannot look at it" },
  { id: "knowledge-for-faculty", name: "Knowledge bought at the price of a faculty", gloss: "sight traded for foresight; the loss is the tuition" },
  { id: "return-changes-returner", name: "The return that changes the returner", gloss: "goes away, comes back, and the world has moved without them" },
  { id: "power-taken-hollows", name: "Power gathered by taking, and the cost paid by the taker", gloss: "each acquisition is paid for by something the taker loved; the victory arrives empty" },
  { id: "double-life", name: "The double life that cannot hold", gloss: "one self is performed and one is hidden, and the seam between them is where the life leaks" },
  { id: "built-for-purpose-wants-otherwise", name: "Built for a purpose, wanting otherwise", gloss: "made or raised to be one thing, and quietly refusing it" },
  { id: "mentor-failure-repeated", name: "The mentor's failure, repeated by the student", gloss: "the inherited flaw travels down the line and is only broken deliberately" },
  { id: "small-thing-carried-far", name: "The small thing carried a long way", gloss: "the burden is not heroic, the carrying is; the one who carries is not the one the story is named for" },
  { id: "kept-for-someone-not-coming", name: "Kept for someone who is not coming", gloss: "a fidelity maintained past its object; devotion outliving its reason" },
];

export const MYTHS: Myth[] = [
  { id: "nuada", title: "Nuada Airgetlám", source: "Irish", tier: "perennial", shape: "mark-at-sovereignty", story: "By the law of the Tuatha Dé Danann no blemished man could be king. Nuada lost a hand at the first battle of Mag Tuired and gave up the throne to a man who ruled badly.", turn: "A physician made him a hand of silver that moved like a hand; later it was made flesh. He took the kingship back.", image: "the silver hand", siblings: ["fma-automail", "strange-hands"] },
  { id: "hephaestus", title: "Hephaestus", source: "Greek", tier: "perennial", shape: "mark-at-sovereignty", story: "Thrown from Olympus and lamed, and thereafter the maker of everything the gods wore into battle.", turn: "The forge is under a mountain and he does not leave it. The gods come to him.", image: "the workshop under the mountain", siblings: [] },
  { id: "sunjata", title: "Sunjata", source: "Mande, West Africa", tier: "perennial", shape: "mark-at-sovereignty", story: "Could not walk until he was seven, mocked as the crippled heir in a court that expected a king.", turn: "Rose by pulling himself up on an iron bar that bent in his hands.", image: "the bent iron bar", siblings: [] },
  { id: "zuko", title: "Zuko's scar", source: "Avatar: The Last Airbender", tier: "current", review: 2032, shape: "mark-at-sovereignty", story: "Burned across the face by his own father in front of the court, for speaking out of turn, and banished to chase an impossible quarry as the price of return.", turn: "He spends years believing the scar is what disqualifies him and the quarry is what will redeem him. It is the other way round. He is only fit to rule once he stops trying to earn back the room that marked him.", image: "the scar he stops hiding", siblings: ["kintsugi"] },
  { id: "phantom-mask", title: "The Phantom's mask", source: "Leroux / stage", tier: "canonical", shape: "mark-at-sovereignty", story: "A face that cannot be shown, in a building devoted entirely to being seen, by a man who is the best musician in it.", turn: "Everything he makes is made from behind the mask, and the mask is what finally costs him the thing he made it all for.", image: "the mask", siblings: ["two-face"] },
  { id: "two-face", title: "Harvey Dent", source: "Batman", tier: "canonical", shape: "mark-at-sovereignty", story: "The public prosecutor whose face is destroyed on one side, so that the split he already carried is made visible.", turn: "He hands the decision to a coin rather than hold both halves himself.", image: "the coin", siblings: ["phantom-mask"] },
  { id: "inanna", title: "Inanna's descent", source: "Sumerian", tier: "perennial", shape: "ordeal-undergone", story: "At each of seven gates she surrenders one more piece of her regalia, arriving at the bottom with nothing, and is hung on a hook.", turn: "She returns, but the law of that place is that something must be left in her place.", image: "the seven gates", siblings: [] },
  { id: "vainamoinen", title: "Väinämöinen's wound", source: "Finnish", tier: "perennial", shape: "ordeal-undergone", story: "Cuts his own knee building a boat and cannot staunch it by any ordinary means.", turn: "The bleeding stops only when someone finds the words for the origin of iron. The thing has to be correctly named before it will close.", image: "the words for iron", siblings: [] },
  { id: "izanagi", title: "Izanagi at the border", source: "Japanese", tier: "perennial", shape: "ordeal-undergone", story: "Goes into the underworld to bring his wife back and is told not to look at her. He looks.", turn: "He spends the rest of the story sealing the door with a boulder, and the sealing is the only part he can still control.", image: "the boulder at the mouth", siblings: [] },
  { id: "furiosa", title: "Furiosa's road", source: "Mad Max: Fury Road", tier: "current", review: 2035, shape: "ordeal-undergone", story: "Drives for days toward a remembered green place, carrying people she has stolen back, and finds the green place gone.", turn: "The only way out is to turn the vehicle around and go back through the same storm, toward the same fortress, at the same speed. What she was fleeing is what she has to take.", image: "the turn back through the storm", siblings: [] },
  { id: "frodo", title: "The road to the mountain", source: "Tolkien", tier: "canonical", shape: "ordeal-undergone", story: "A journey undertaken by the one least equipped for it, toward the one place the thing can be destroyed.", turn: "At the last moment he cannot do it voluntarily; it is taken from him. He does not get to be the one who chooses at the end.", image: "the last stretch of road", siblings: [] },
  { id: "colossus", title: "Shadow of the Colossus", source: "game, 2005", tier: "current", release: 2005, review: 2032, shape: "ordeal-undergone", story: "To bring one person back, he is told to kill sixteen enormous, mostly peaceful things. Each one is beautiful, and each one takes a long time.", turn: "With every kill something enters him. By the end he is closer to the colossi than to the person he was doing it for.", image: "the sixteen", siblings: ["walter-white"] },
  { id: "fisher-king", title: "The Fisher King", source: "Welsh / Arthurian", tier: "perennial", shape: "gift-not-grasped", story: "Wounded and unhealing, the land waste along with him, and a cure that is not a deed.", turn: "The cure is a question, and Percival fails the first time by being too polite to ask it.", image: "the question not asked", siblings: [] },
  { id: "baucis", title: "Baucis and Philemon", source: "Greek / Roman", tier: "perennial", shape: "gift-not-grasped", story: "The only house in the valley that opened its door to two strangers with nothing to offer.", turn: "The strangers were gods. The valley drowned. The house became a temple, and they had asked for nothing.", image: "the door opened to strangers", siblings: [] },
  { id: "crane-wife", title: "The crane wife", source: "Japanese", tier: "perennial", shape: "gift-not-grasped", story: "She weaves the cloth that keeps them fed, on the single condition that he never watch her do it.", turn: "He watches. She is a crane, plucking her own feathers to make the cloth. She leaves, because that is what she is.", image: "the loom behind the screen", siblings: ["selkie"] },
  { id: "chihiro", title: "Spirited Away", source: "Studio Ghibli, 2001", tier: "canonical", release: 2001, shape: "gift-not-grasped", story: "A child in a world that runs on contracts takes a job she is bad at, is renamed, and slowly forgets what she was called.", turn: "She cannot demand her way out. She works, keeps her word to people who cannot help her, and the way out arrives as a name someone else remembered for her.", image: "the name remembered", siblings: [] },
  { id: "ego", title: "Anton Ego's plate", source: "Ratatouille, 2007", tier: "canonical", release: 2007, shape: "gift-not-grasped", story: "A critic who has built an entire authority on never being pleased, sitting down to a peasant dish he expects to dismiss.", turn: "The first bite returns him to a kitchen he had not thought about in fifty years, and he cannot get his authority back on afterwards, and does not want it.", image: "the plate that undoes the critic", siblings: [] },
  { id: "sedna", title: "Sedna", source: "Inuit", tier: "perennial", shape: "two-natures", story: "Her fingers, cut away at the gunwale, become the seals and the whales. She goes to the sea floor and rules there.", turn: "She will not release the animals until a shaman comes down and combs her hair, because no one else will touch her.", image: "the hair that must be combed", siblings: [] },
  { id: "selkie", title: "The selkie", source: "Orkney / Hebridean", tier: "perennial", shape: "two-natures", story: "A sealskin hidden in the rafters keeps her human, and married, and a mother.", turn: "She finds it. She goes. She is not cruel; she is a seal.", image: "the hidden skin", siblings: ["crane-wife"] },
  { id: "ganesha", title: "Ganesha's tusk", source: "Hindu", tier: "perennial", shape: "two-natures", story: "Agreed to transcribe an enormous poem without stopping, and the pen failed partway through.", turn: "He broke off his own tusk and wrote with it, because he had promised not to stop.", image: "the broken tusk used as a pen", siblings: ["tyr"] },
  { id: "banner", title: "Banner and the other one", source: "Marvel", tier: "current", review: 2035, shape: "two-natures", story: "A physicist whose entire discipline is control, sharing a body with something that is pure uncontrolled reaction.", turn: "Every attempt to suppress it makes it larger. The only version that works is an agreement, negotiated, in which both get to exist and neither is in charge full time.", image: "the agreement", siblings: ["jekyll", "tyler", "gollum"] },
  { id: "jekyll", title: "Jekyll and Hyde", source: "Stevenson", tier: "canonical", shape: "two-natures", story: "A respectable man builds a chemical door to the part of himself he cannot admit to owning.", turn: "The door stops needing the chemical. The second self arrives on its own.", image: "the door that opens by itself", siblings: ["tyler", "gollum", "banner"] },
  { id: "elsa", title: "Elsa's gloves", source: "Frozen, 2013", tier: "current", release: 2013, review: 2032, shape: "two-natures", story: "A child told her power is dangerous, given gloves, and taught that concealment is the same thing as goodness.", turn: "The concealment is what causes the disaster, not the power. What she has never been taught is the third option: to use it deliberately, in front of people.", image: "the gloves", siblings: [] },
  { id: "tyr", title: "Týr and Fenrir", source: "Norse", tier: "perennial", shape: "promise-costs-instrument", story: "The wolf would only accept the binding if a god put a hand in its mouth as surety.", turn: "Týr used his sword hand, knowing exactly what would happen, because someone had to.", image: "the hand in the wolf's mouth", siblings: ["ganesha"] },
  { id: "jephthah", title: "Jephthah's vow", source: "Hebrew", tier: "perennial", shape: "promise-costs-instrument", story: "Swore to give up whatever came out of his house first if he won.", turn: "His daughter came out first, and he was a man who kept his word.", image: "the door of the house", siblings: [] },
  { id: "faust", title: "Faust's page", source: "German", tier: "perennial", shape: "promise-costs-instrument", story: "A signature in the correct ink, freely given, in exchange for exactly what was asked for.", turn: "He gets it. That was never the problem.", image: "the ink", siblings: ["little-mermaid"] },
  { id: "little-mermaid", title: "The traded voice", source: "Andersen", tier: "canonical", shape: "promise-costs-instrument", story: "To be able to walk toward the person she wants, she gives up the voice she would have been known by.", turn: "She arrives, beautiful and mute, and cannot say the one thing that would have settled it.", image: "the traded voice", siblings: ["faust"] },
  { id: "fma-automail", title: "Equivalent exchange", source: "Fullmetal Alchemist", tier: "current", review: 2035, shape: "promise-costs-instrument", story: "Two brothers try to bring their mother back and pay the law's price: one loses an arm and a leg, the other his whole body.", turn: "The elder gets a steel arm and spends the series learning that the law he trusted does not price grief correctly, and that some things are given rather than exchanged.", image: "the steel arm", siblings: ["nuada", "strange-hands"] },
  { id: "daedalus", title: "Daedalus", source: "Greek", tier: "perennial", shape: "maker-cannot-inhabit", story: "Built the labyrinth so well that he could not find his own way back out of it.", turn: "Then built wings, and lost the son who wore them.", image: "the labyrinth he built and could not leave", siblings: ["pygmalion", "frankenstein"] },
  { id: "pygmalion", title: "Pygmalion", source: "Greek", tier: "perennial", shape: "maker-cannot-inhabit", story: "Carved the person he could not find anywhere, in the material he was best at.", turn: "Craft could not finish it. She had to be given to him by someone else.", image: "the unfinished statue", siblings: ["daedalus", "frankenstein"] },
  { id: "kintsugi", title: "Kintsugi", source: "Japanese craft", tier: "perennial", shape: "maker-cannot-inhabit", story: "A broken bowl repaired not invisibly but in gold, along every crack.", turn: "The most valuable and most visible thing about the finished bowl is where it failed.", image: "the gold seam", siblings: ["zuko"] },
  { id: "frankenstein", title: "Victor Frankenstein", source: "Shelley", tier: "canonical", shape: "maker-cannot-inhabit", story: "Works alone for two years to make a living thing, and succeeds.", turn: "He looks at it once and runs, and the running is the whole tragedy. Nothing that follows would have happened if he had stayed in the room.", image: "the creature at the window", siblings: ["daedalus", "pygmalion"] },
  { id: "jiro", title: "The Wind Rises", source: "Studio Ghibli, 2013", tier: "current", release: 2013, review: 2035, shape: "maker-cannot-inhabit", story: "An engineer who dreams only of beautiful aircraft, in a country that will only fund them as weapons.", turn: "He builds the most beautiful thing he can. None of them come back.", image: "the field of wrecks", siblings: ["oppenheimer-adj"] },
  { id: "odin-well", title: "Odin at the well", source: "Norse", tier: "perennial", shape: "knowledge-for-faculty", story: "Gave an eye to Mímir for one drink from the well beneath the world tree.", turn: "The eye stays down there, in the water, looking up.", image: "the eye in the well", siblings: ["tiresias"] },
  { id: "tiresias", title: "Tiresias", source: "Greek", tier: "perennial", shape: "knowledge-for-faculty", story: "Blinded, and given prophecy in exchange.", turn: "He sees only what has not happened yet, and no one acts on any of it.", image: "the staff", siblings: ["odin-well"] },
  { id: "bran-head", title: "Bran's head", source: "Welsh", tier: "perennial", shape: "knowledge-for-faculty", story: "Mortally wounded, he instructs his companions to cut off his head and carry it.", turn: "It went on talking and kept excellent company for eighty years before they buried it, facing the sea.", image: "the talking head", siblings: [] },
  { id: "strange-hands", title: "The surgeon's hands", source: "Doctor Strange, 2016", tier: "current", release: 2016, review: 2032, shape: "knowledge-for-faculty", story: "The best surgeon in the building destroys his hands in a car he was driving too fast while reading.", turn: "He spends everything he has trying to get them back, and only starts learning when he stops. The discipline he ends up with requires the hands to be exactly as ruined as they are.", image: "the ruined hands", siblings: ["nuada", "fma-automail"] },
  { id: "charlie", title: "Flowers for Algernon", source: "Keyes", tier: "canonical", shape: "knowledge-for-faculty", story: "A man of limited intelligence is made brilliant by a procedure, and can suddenly see exactly how the people around him had been treating him.", turn: "The effect is temporary, and he is intelligent enough, for a while, to watch it going.", image: "the progress reports", siblings: [] },
  { id: "urashima", title: "Urashima Tarō", source: "Japanese", tier: "perennial", shape: "return-changes-returner", story: "Three days under the sea as an honoured guest; three hundred years on land.", turn: "He is given a box and told not to open it. It holds all the time he skipped, and he opens it.", image: "the box of years", siblings: ["cooper"] },
  { id: "rip", title: "Rip Van Winkle", source: "Irving", tier: "canonical", shape: "return-changes-returner", story: "Sleeps through a revolution in the hills above his own village.", turn: "He comes back to a place that has changed its allegiance without consulting him, and the portrait on the inn sign is a different man.", image: "the changed sign over the inn", siblings: ["cap", "seven-sleepers"] },
  { id: "seven-sleepers", title: "The Seven Sleepers", source: "Christian / Islamic", tier: "perennial", shape: "return-changes-returner", story: "Walled into a cave to escape persecution, they wake centuries later and send one of their number into town for bread.", turn: "He tries to pay with a coin nobody has seen in two hundred years, and that is how they are recognised.", image: "the obsolete coin", siblings: ["rip", "cap"] },
  { id: "cooper", title: "Interstellar's messages", source: "2014", tier: "current", release: 2014, review: 2035, shape: "return-changes-returner", story: "A few hours near a gravity well cost him twenty-three years of transmissions from home, all of which arrive at once.", turn: "He watches his children grow up and give up on him in a single sitting, and there was never a version where he could have both.", image: "the stacked messages", siblings: ["urashima"] },
  { id: "cap", title: "Out of the ice", source: "Captain America", tier: "current", review: 2035, shape: "return-changes-returner", story: "Wakes seventy years late, physically unchanged, into a world whose vocabulary he does not have.", turn: "He is not obsolete and everyone treats him as though he is, and the only real loss is that there is nobody left to be ordinary with.", image: "the notebook of things to catch up on", siblings: ["rip", "seven-sleepers"] },
  { id: "thanos", title: "The collector's glove", source: "Marvel", tier: "current", review: 2035, shape: "power-taken-hollows", story: "Six stones, and each one is held by someone who will not give it up. He assembles them one at a time, over years, at a price paid each time by somebody else — and once, unbearably, by the one person he loves.", turn: "He wins. He gets the whole thing, exactly as designed. And the last image of him is a man sitting alone on a porch, at the far end of the universe, watching a sunrise nobody else is there to see.", image: "the glove", siblings: ["one-ring"] },
  { id: "one-ring", title: "The ring", source: "Tolkien", tier: "canonical", shape: "power-taken-hollows", story: "A small object that grants exactly what is asked of it, and takes its fee in attention.", turn: "It does not corrupt by force. It corrupts by being carried, and by being useful, and by the carrier being the one who decides they are strong enough.", image: "the ring", siblings: ["thanos"] },
  { id: "walter-white", title: "The empire", source: "Breaking Bad", tier: "current", review: 2032, shape: "power-taken-hollows", story: "A man begins doing something monstrous for reasons anyone would accept, and keeps a very good justification running the entire time.", turn: "At the very end he admits it was never for his family. He did it because he was good at it and it made him feel alive, and the admission costs him nothing because there is nobody left to lose.", image: "the barrel in the desert", siblings: ["colossus"] },
  { id: "clark", title: "The glasses", source: "Superman", tier: "canonical", shape: "double-life", story: "The disguise is not the cape. The disguise is the mild, apologetic, slightly clumsy man at the desk.", turn: "The performed self is the one that gets the friendships, and he cannot bring the other one into the room without ending them.", image: "the glasses", siblings: [] },
  { id: "don-draper", title: "The name that isn't his", source: "Mad Men", tier: "current", review: 2032, shape: "double-life", story: "A man takes a dead officer's identity in a war and builds an entire successful life inside a name he was not given.", turn: "Everything he earns belongs to a person who does not exist, so none of it lands. He keeps waiting to be found out, and being found out turns out not to be the problem.", image: "the dog tags", siblings: [] },
  { id: "tyler", title: "The second self who does the wanting", source: "Fight Club", tier: "current", review: 2032, shape: "double-life", story: "A man who cannot want anything out loud generates someone who wants everything out loud and does it on his behalf.", turn: "The arrangement works beautifully for a while. It stops working when the second self starts making commitments the first one has to keep.", image: "the second self", siblings: ["jekyll", "gollum", "banner"] },
  { id: "gollum", title: "Sméagol and Gollum", source: "Tolkien", tier: "canonical", shape: "double-life", story: "Two voices in one body, having the same argument for five hundred years, out loud, when nobody is listening.", turn: "There is a moment where the kinder voice nearly wins, and it is broken by an unkindness from outside at exactly the wrong second.", image: "the argument out loud", siblings: ["jekyll", "tyler", "banner"] },
  { id: "roy-batty", title: "Roy Batty", source: "Blade Runner", tier: "canonical", shape: "built-for-purpose-wants-otherwise", story: "Engineered as a weapon with a four-year lifespan, he spends his last hours not fighting but trying to get someone to extend it.", turn: "In the final minutes he saves the man sent to kill him, and then describes what he has seen to the only person available, because otherwise it goes with him.", image: "the things nobody else saw", siblings: [] },
  { id: "iron-giant", title: "The Iron Giant", source: "1999", tier: "canonical", release: 1999, shape: "built-for-purpose-wants-otherwise", story: "A weapon that arrives with no memory of being one, is befriended, and is triggered back into its design when it is shot at.", turn: "It gets to decide, once, at the last moment, what it is. The decision is a sentence it says to itself on the way up.", image: "the choice on the way up", siblings: [] },
  { id: "data", title: "Data's chip", source: "Star Trek", tier: "canonical", shape: "built-for-purpose-wants-otherwise", story: "Built without feeling, and spends decades studying humanity in order to approximate it from the outside.", turn: "When the capacity is finally installed, what arrives first is not joy. It is everything he had been protected from.", image: "the installed chip", siblings: [] },
  { id: "wall-e", title: "The last unit still working", source: "WALL-E, 2008", tier: "canonical", release: 2008, shape: "kept-for-someone-not-coming", story: "Every other unit stopped centuries ago. This one keeps compacting rubbish on an empty planet, on schedule, and collects the objects it finds interesting.", turn: "Nobody assigned the collecting. That part was never in the brief, and it is the part that turns out to matter.", image: "the shelf of kept things", siblings: [] },
  { id: "hachiko", title: "Hachikō", source: "Japanese, historical", tier: "canonical", shape: "kept-for-someone-not-coming", story: "A dog met his owner at the station every evening. The owner died at work one day and did not come back.", turn: "The dog kept coming to the station at the same time for nine years, and the town, gradually, started feeding him.", image: "the evening train", siblings: ["penelope-adj"] },
  { id: "penelope-adj", title: "Penelope's shroud", source: "Greek", tier: "perennial", shape: "kept-for-someone-not-coming", story: "Told she must remarry when the shroud is finished, she weaves it all day.", turn: "Every night she unpicks the day's work, for three years, and the fidelity is entirely made of undoing.", image: "the unpicked weaving", siblings: ["hachiko"] },
  { id: "obi-anakin", title: "The teacher who taught it wrong", source: "Star Wars", tier: "canonical", shape: "mentor-failure-repeated", story: "A young teacher, not much older than the student, raises him in an order whose rule is detachment, and the student's whole problem is that he cannot detach.", turn: "The lesson is delivered exactly as it was received, without being examined once, and it produces the same result a generation later.", image: "the lesson passed on unexamined", siblings: ["luke-ben"] },
  { id: "luke-ben", title: "The moment in the hut", source: "Star Wars", tier: "current", review: 2032, shape: "mentor-failure-repeated", story: "A master looks into his sleeping student, sees what the student might become, and for one instant acts on it.", turn: "The instant is what makes it true. He causes the thing he was trying to prevent, and then hides on an island for a decade rather than look at that.", image: "the instant in the dark", siblings: ["obi-anakin"] },
  { id: "sam", title: "The one who carries the carrier", source: "Tolkien", tier: "canonical", shape: "small-thing-carried-far", story: "Not the hero, not the chosen, not the one the prophecy names. The gardener who came along.", turn: "On the last slope he cannot carry the burden — that is not permitted — so he carries the person carrying it. The story is not named after him.", image: "carrying the one who carries", siblings: [] },
  { id: "atreyu-adj", title: "The swamp", source: "The NeverEnding Story", tier: "canonical", shape: "small-thing-carried-far", story: "A boy crossing a swamp where the mud is made of despair, with a horse who is not magic and not chosen.", turn: "The horse stops. The boy pulls and shouts and cannot make him move, and that is the scene everyone who saw it at seven still remembers.", image: "the horse who stops", siblings: [] },
  { id: "orpheus-adj", title: "Orpheus", source: "Greek", tier: "perennial", shape: "ordeal-undergone", story: "Sings his way into the underworld and is granted the one thing nobody is granted, on one condition.", turn: "He turns around within sight of the exit. Every version of the story agrees that he had almost made it, and none of them agree on why he turned.", image: "the last few steps", siblings: [] },
  { id: "oppenheimer-adj", title: "The test", source: "historical", tier: "canonical", shape: "maker-cannot-inhabit", story: "Assembles the best minds available for a problem that is genuinely fascinating, and solves it.", turn: "He is congratulated for it for the rest of his life by people who do not understand what he is apologising for.", image: "the morning of the test", siblings: ["jiro"] },
];

const BY_ID = new Map(MYTHS.map((m) => [m.id, m]));

/** A stable 32-bit hash. Selection must be DETERMINISTIC per chart: the same
    chart recast must reach for the same story, or the portrait's governing
    image changes identity between readings of one life. */
function seedOf(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/** A "current" entry is eligible only if the reader was under 55 when it came
    out. Without a birth year we stay conservative and offer only material that
    does not date. Birth year raises the ceiling; it never lowers the floor. */
function eligible(myth: Myth, birthYear: number | null): boolean {
  if (myth.tier !== "current") return true;
  if (birthYear === null) return false;
  // Not every source string carries its year ("Marvel", "Star Wars"), but every
  // "current" entry carries a review year. Reviews are set roughly a
  // generation out, so review − 25 is a serviceable stand-in for release.
  // Erring toward NOT offering a contemporary story is the safe direction:
  // the cost is a slightly less surprising portrait, not a baffling one.
  const release = myth.release ?? (myth.review ? myth.review - 25 : null);
  if (release === null) return false;
  return birthYear > release - 55;
}

/**
 * Durability as a WEIGHTING, not a gate.
 *
 * The spec's own rule was "prefer the most durable tier that fits" — but a hard
 * preference collapses each shape to its two or three perennial entries and the
 * contemporary half of the bank never gets chosen at all. Measured: 40 charts
 * reaching for the same shape produced only 3 distinct stories, and Zuko, Mad
 * Max and Ratatouille were structurally unreachable.
 *
 * So durability tilts the odds instead of deciding them. Folk and classical
 * material still comes up most often; a reader who would recognise Fullmetal
 * Alchemist can still get it. "current" entries already carry a review year,
 * which is the mechanism for handling their decay — suppressing them entirely
 * was belt AND braces at the cost of the variety the bank exists to provide.
 */
const TIER_WEIGHT: Record<Myth["tier"], number> = { perennial: 3, canonical: 2, current: 2 };

/**
 * Choose one myth for a shape. Prefer the most durable tier that fits, then
 * pick within that tier by chart seed so two different charts reaching for the
 * same shape rarely reach for the same story.
 *
 * `exclude` suppresses entries AND their siblings — "the silver hand", "the
 * steel arm" and "the ruined hands" are one idea in three costumes, and
 * banning one while allowing the others defeats the point.
 */
export function selectMyth(
  shapeId: string,
  seedText: string,
  birthYear: number | null,
  exclude: string[] = [],
): Myth | null {
  const banned = new Set(exclude);
  for (const id of exclude) {
    for (const sibling of BY_ID.get(id)?.siblings ?? []) banned.add(sibling);
    for (const myth of MYTHS) if (myth.siblings.includes(id)) banned.add(myth.id);
  }
  const pool = MYTHS.filter((m) => m.shape === shapeId && !banned.has(m.id) && eligible(m, birthYear));
  if (pool.length === 0) return null;
  // Stable order regardless of source-file ordering, then a weighted draw by
  // chart seed — arithmetic, so the same chart always reaches the same story.
  pool.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const total = pool.reduce((sum, m) => sum + TIER_WEIGHT[m.tier], 0);
  let ticket = seedOf(seedText) % total;
  for (const myth of pool) {
    ticket -= TIER_WEIGHT[myth.tier];
    if (ticket < 0) return myth;
  }
  return pool[pool.length - 1];
}

/** The shape list as the shape-namer sees it. */
export function shapeMenu(): string {
  return MYTH_SHAPES.map((s) => `${s.id} — ${s.name}: ${s.gloss}`).join("\n");
}

/** Everything the composer is told about its myth. Story, turn, and the image
    the story turns on — never the tier, the source taxonomy, or the id. */
export function mythBrief(myth: Myth): string {
  return [
    `TITLE: ${myth.title} (${myth.source})`,
    `STORY: ${myth.story}`,
    `THE TURN: ${myth.turn}`,
    `THE IMAGE THE STORY TURNS ON: ${myth.image}`,
  ].join("\n");
}
