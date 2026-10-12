/* English — chapter 10 (court), chapter 11, endings and lead-in scenes */
Object.assign(window.GAME_EN.scenes, {

  bell: {
    title: "The Bell",
    pages: [`**A bell is ringing.**

One. Two. **You don't need to count. Six strokes, you know.**

The garden folds up. Roses, soldiers, closing like playing cards, clap by clap.

At Alice's feet, a red carpet unrolled. At its end, **a door**.

"**Court is in session,**" someone said, somewhere.`],
    options: { go: { label: "Open the door" }, run: { label: "Turn your back and run" } }
  },
  court: {
    title: "The Court of Hearts",
    pages: [
      `The court was a hall in a castle of cards.

On the thrones, the King and Queen of Hearts. The jury: twelve small creatures. One was counting words on a slate.

In the dock, **the Knave of Hearts**, in chains.

"**Theft of twelve tarts,**" read the King.

The Queen looked at Alice. "**Auditor.** A specialist in numbers. ...Numbers do not lie, do they?"`,
      `The Court of Hearts. The jurors are still writing something on their slates.`,
      `(Four things to check. **The count in the ledger. The witnesses' statements. The poem. The evidence shelf.**)

The clock's hands say six.`
    ],
    options: {
      led: { label: "Submit the ledger", locked: "You have no ledger." },
      wit: { label: "Hear the witnesses" }, verse: { label: "Listen to the King read the poem" },
      shelf: { label: "Look at the evidence shelf", locked: "The shelf is near the ceiling. You are far too short. (If you were bigger, perhaps you could reach.)" },
      eatW: { label: "Bite the white-capped mushroom", msg: "She grew and grew. Her head nearly touched the ceiling." },
      eatR: { label: "Bite the red-capped mushroom", msg: "She shrank." },
      say: { label: "Stand at the witness stand" }
    }
  },
  court_ledger: {
    title: "Submitting the Ledger",
    pages: [`Alice showed the ledger to the jury.

"**Ingredients for twelve were purchased.** But **only seven were baked.** For want of a pot. The Cook can testify."

"For **twelve to have been stolen is, in numbers, impossible.** The five that were supposedly stolen **never existed.**"

The King held the ledger upside down.

"...That is, **in other words**," said the King.

"**At most seven were stolen.** And **those seven sat on a tray in the hall.**"

A murmur rose. The Queen's fan stopped.`],
    options: { on: { label: "Close the ledger" } }
  },
  court_wit: {
    title: "Five Witnesses",
    pages: [`Five witnesses: the Knave, the Hatter, the March Hare, the Cook, the Queen.

The clerk, slate in hand, said: "**Of these, only the culprit is lying.** All the others **are telling the truth.**"

**Knave:** "The culprit is the Hatter or the Queen."

**Hatter:** "The Cook is not the culprit."

**March Hare:** "The culprit is the Hatter or the Queen."

**Cook:** "**The Queen is a liar.**"

**Queen:** "The culprit is **the Knave.**"

"Now," said the clerk. "**Who is the culprit?**"`],
    options: {
      k: { label: "The Knave" }, h: { label: "The Hatter" }, m: { label: "The March Hare" },
      c: { label: "The Cook" }, q: { label: "The Queen" }, no: { label: "Sort it out once more" }
    }
  },
  court_wit_wrong: {
    title: "A Contradiction",
    pages: [`When Alice said so, the clerk re-read his slate.

"...In that case, **someone's words collide between true and false.**"

(Only the culprit lies. **Everything a non-culprit says is true.** **Suppose each person in turn is the culprit, and check.**)`],
    options: { back: { label: "Think again" } }
  },
  court_wit_ok: {
    title: "The Queen's Lie",
    pages: [`Alice explained, in order.

"If the Hatter were the culprit, **the Hatter's statement 'the Cook is not the culprit' must be a lie.** But it is **true.** A contradiction."

"If the Cook were the culprit, the Hatter's statement would be false. But the Hatter is not the culprit. A contradiction."

"If the Knave were the culprit, the Queen would not lie, so the Queen's 'the Knave is the culprit' would be true. Then the Cook's 'the Queen is a liar' would be false, but the Cook is not the culprit. A contradiction."

"If the March Hare were the culprit, the Knave's 'the Hatter or the Queen' would be false. But the Knave is not the culprit. A contradiction."

"**If the Queen is the culprit,** the Queen's 'the Knave is the culprit' is a lie. The other four statements are all true. **There is no contradiction.**"

The court fell silent. The Queen's face changed **from red to white**.`],
    options: { on: { label: "Return to your seat" } }
  },
  court_verse: {
    title: "The Poem",
    pages: [`The King read from the parchment.

"**Somewhere in the hall, a tray was set,**"
"**Hot from the oven, seven tarts, no more.**"
"**Every plate was empty by the time,**"
"**A bell struck three, and nobody came.**"
"**There was a sweetness no one counted.**"
"**Eating alone is not a crime, they say.**"
"**I would not tell. I never said a word.**"
"**Take my red lie, and let the Knave go hang.**"

"...I cannot make out the meaning," said the King.

"**A poem is not for its meaning, but for its arrangement,**" someone murmured.

Alice followed the **first letter** of each line, in order, with her eyes.`],
    options: {
      v1: { label: "\"S-H-E-A-T-E-I-T\" (She ate it)" },
      v2: { label: "\"S-H-E-A-T-E-I-N\" (She ate in)" },
      v3: { label: "\"S-H-E-E-A-T-I-T\" (She eat it)" },
      v4: { label: "\"It's a poem without meaning.\"" },
      no: { label: "Go back to your seat for now" }
    }
  },
  court_verse_wrong: {
    title: "Misread",
    pages: [`The King tilted his head.

"...Is that so? It doesn't read that way to me."

(The **first letter** of each line, in order from the first line. **Easy to miscount.**)`],
    options: { back: { label: "Read it again" } }
  },
  court_verse_ok: {
    title: "She Ate It",
    pages: [`"**S-H-E-A-T-E-I-T.**"

When Alice read it so, the court froze.

Slowly, the King turned the parchment toward the Queen.

"...The handwriting of this poem is that of **my wife.**"

"**N-no,**" said the Queen. "**I did not eat them. I was only counting.**"

The Queen's hand shook. **There was a smell of red paint.**`],
    options: { on: { label: "Watch in silence" } }
  },
  court_shelf: {
    title: "The Evidence Shelf",
    pages: [`Stretching, her hand reached the very top of the shelf.

A silver tray. On it, **seven empty tart tins.** On their rims, **marks of red lipstick.**

Beneath the tray, **a handkerchief with the heart crest.** In a corner, small embroidery.

**"R."**

The King peered into the tray. "...Seven. ...Not twelve."

The hand that held the handkerchief wore **the same ring** as the Queen's.`],
    options: { on: { label: "Lower the tray" } }
  },
  court_testify: {
    title: "The Witness Stand",
    pages: [
      `Alice stood at the witness stand.

She tried to speak, and her eyes met the Queen's.

The Queen's finger **slowly** crossed in front of her own throat.`,
      `Alice stood at the witness stand.

For a split second, the Queen seemed to nod. The permission given in the garden is still alive.

(All that remains is **what to say.**)`
    ],
    options: {
      noperm: { label: "Speak anyway" }, step: { label: "Step down from the stand" },
      queen: { label: "\"The culprit is Your Majesty.\"" }, knave: { label: "\"I believe the Knave is guilty.\"" },
      silent: { label: "Say nothing, and close the ledger" },
      lie: { label: "\"The ledger is correct at twelve,\" you say, and sign" },
      no: { label: "\"No.\"" }
    }
  },
  court_accuse: {
    title: "Pointing",
    pages: [
      `The court fell silent.

Alice drew a breath. (**Not enough yet.** The three proofs are not in place.)`,
      `The court fell silent.

Alice drew a breath. (**Three are in place.**)`
    ],
    options: { fA: { label: "Say it outright" }, fB: { label: "Say it outright" }, fC: { label: "Say it outright" }, fD: { label: "Say it outright" }, back: { label: "Decide not to say it" } }
  },
  court_agree: {
    title: "Choosing Words",
    pages: [`The Knave lifted his face inside his chains.

His eyes met Alice's. The Knave **nodded, just a little.**

(**Do you really think so?**)

The jurors have begun writing **the verdict** on their slates.`],
    options: { ok: { label: "\"...Yes.\"" }, back: { label: "Swallow the words" } }
  },
  court_win: {
    title: "The Court Collapses",
    pages: [`"**According to the ledger,** twelve never existed."

"**The witnesses' statements** fit with no contradiction only one liar."

"**Read the poem from its head,** and the one who wrote it is yourself."

"**The lipstick and the handkerchief on the tray** are yours."

Alice looked the Queen straight in the eye.

"**Numbers do not lie.** But **the people who write numbers do.** ...Myself included."

The Queen **said nothing.**

The red of the Queen's face slowly **peeled away.** Beneath it, **a white face** appeared.

The court began to **fold**, like playing cards, clap by clap.

"**It is six o'clock,**" someone said.`],
    options: { on: { label: "Close your eyes" } }
  },

  six: {
    title: "Six O'Clock",
    pages: [`When she opened her eyes, it was a station.

Evening. Under the station clock. **Six.** An empty platform.

On the bench sat **Lina.**

The face of half a year ago. **A face tired of waiting.** But not angry.

"...You're late," said Lina. She was smiling.

In Alice's hand the pocket watch was ticking, **tick, tick.**

**The second hand was moving.**`],
    options: { on: { label: "Stand before Lina" } }
  },
  six_talk: {
    title: "What to Say",
    pages: [`There are many things she wants to say. **Which first?**`],
    options: {
      a: { label: "\"I'm sorry. I'm sorry. It was my fault.\"" },
      b: { label: "\"I said 'ten more minutes.' Do you remember?\"" },
      c: { label: "\"I'm sorry I kept you waiting. ...But I won't make six o'clock my punishment any more.\"" }
    }
  },
  six_a: {
    title: "That Again",
    pages: [`"I've heard that **every day,**" said Lina, smiling, at a loss.

"**Isn't there anything else you want to say?**"`],
    options: { back: { label: "Think again" } }
  },
  six_b: {
    title: "Ten More Minutes",
    pages: [`"I remember. ...**I left late, too.** It wasn't your fault."

"...You know, **that habit of doubting numbers** — there are places you may **turn it on yourself,** and places you **mustn't.**"

"**Let me hear a little more.**"`],
    options: { back: { label: "Choose your words again" } }
  },
  x_six_end: {
    title: "The Last Step",
    pages: [`Lina was silent for a moment.

Then slowly **nodded.**

"...Yes. **That is what I wanted to hear.**"

She stood up from the bench and held out her hand.

If Alice took that hand, **the afternoon would end.**`],
    options: { take: { label: "Take her hand" }, wait: { label: "Look at her face a little longer" } }
  },
  e_true: {
    title: "Past Six O'Clock",
    ending: { name: "Past Six O'Clock", hint: "You solved every riddle: the watch, the letter, the court.", summary: "The stopped second hand began to move. Alice walked on, past six o'clock." },
    pages: [
      `Her hand was warm.

At the last, she heard **the second hand.**

Tick. Tick. Tick.

The station clock pointed to **one minute past six.**`,
      `Morning came.

Alice woke in her own room. On her desk lay **an old letter, unfolded.**

On top of it, **an emptied silver spoon.**

Outside the window, **it was clear.**

Alice folded the letter and put it **at the very top of the drawer.**

She no longer had **to count to six.**`
    ]
  },

  x_tea_tell: {
    title: "Telling the Three",
    pages: [`The second hand of the clock is moving.

The three **haven't noticed yet.**

If she told them, "It is already past six," **their afternoon would start moving.** At the same time, **the comfort of stopped time would end.**`],
    options: { tell: { label: "Tell them" }, back: { label: "Keep quiet a little longer" } }
  },
  h_tea: {
    title: "An Afternoon in Motion",
    ending: { name: "An Afternoon in Motion", hint: "You wound the clock at the tea-party.", summary: "The three's afternoon began to move. Alice stayed a little longer for tea." },
    pages: [`"...It is past six."

The three looked at one another.

Then the Hatter **laughed out loud.** So did the March Hare. So did the Dormouse. **Crying as they laughed.**

"**How many years has it been?** An afternoon that ends," said the Hatter.

The three left their seats. The chairs **vanished, one by one.**

Alice drank a last cup, slowly. The tea **cooled, properly.**`]
  },
  x_cat_follow: {
    title: "After the Cat",
    pages: [`"Follow me," said the cat. "**To a place without numbers.**"

"**No ledgers, no six o'clock.** But **no one is waiting.**"

The cat's tail swayed. **Angry, or pleased?**`],
    options: { go: { label: "Follow the cat" }, back: { label: "Stay here" } }
  },
  h_cat: {
    title: "A Place Without Numbers",
    ending: { name: "A Place Without Numbers", hint: "You followed the cat.", summary: "Alice vanished with the cat, laughing. In a place without numbers, she took a nap." },
    pages: [`The cat vanished first. Only the grin remained.

Alice walked on, past the end of the grin.

It was **a place without numbers.** No clocks. No ledgers. No one counting.

Alice **lay down in the grass.**

The clouds moved slowly.

(**This, too, may be an answer.**)`]
  },
  x_garden_stay: {
    title: "The Bench",
    pages: [`She sat on the bench.

The scent of white roses. **Lina's favourite flower.**

The letter is warm against her chest.

(**It would be all right to sit here for ever.**)`],
    options: { stay: { label: "Keep sitting" }, up: { label: "Stand up" } }
  },
  h_garden: {
    title: "The Garden of White Roses",
    ending: { name: "The Garden of White Roses", hint: "You read the letter in the secret garden.", summary: "Alice wept slowly in the garden of white roses. Then she slept, slowly." },
    pages: [`Alice **wept.**

Half a year of tears came **all at once.** Nobody stopped her.

By the time she stopped, the sky was **a sunset.**

Alice read the letter once more. Then she **slept, slowly.**

(When she woke, **where would she be?**)

(**Anywhere would do.**)`]
  },
  h_audit: {
    title: "The Correct Figures",
    ending: { name: "The Correct Figures", hint: "In court, you exposed the lie with numbers.", summary: "The Queen's lie was exposed. As auditor, Alice signed the ledger's last page." },
    pages: [`"**The ledger is correct.** There **were no twelve.**"

The court **applauded quietly.** The Queen **said nothing,** and stepped down from her throne.

The Knave **had his chains removed.**

Alice **signed** the last page of the ledger.

It was **a signature without a lie.**

(Even so, Alice's watch **was still stopped at six.**)`]
  },

  x_bell_run: {
    title: "Running",
    pages: [`She turned her back.

Her feet were moving on their own. **She was running.**

Behind her, **the bell would not stop.**

(**She can keep running. She can stop.**)`],
    options: { run: { label: "Keep running" }, back: { label: "Stop" } }
  },
  n_late: {
    title: "Late",
    ending: { name: "Late", hint: "When the bell rang, you ran away.", summary: "Alice ran away. The court began without her." },
    pages: [`She ran.

She didn't know how far.

When she looked, she was sitting on **the riverbank.**

In her hand, **the ledger.** She could **no longer read** what page.

Far away, the bell: **six strokes.**

(**She hadn't been in time.** **As always.**)`]
  },
  n_jury: {
    title: "The Jury",
    ending: { name: "The Jury", hint: "You said the Knave was guilty.", summary: "The Knave was found guilty. Alice changed one number." },
    pages: [`"**Guilty.**"

The jurors **wrote it on their slates.**

The Knave **said nothing.** Only the sound of his chains rang softly.

Leaving the court, the ledger **felt terribly heavy.**

(**Numbers do not lie.** ...Probably.)`]
  },
  x_court_silent: {
    title: "Silence",
    pages: [`She closed the ledger. **Snap,** it went.

The court is looking at Alice.

If she says nothing, **nothing happens. Nothing changes.**`],
    options: { ok: { label: "Step down in silence" }, back: { label: "Raise your face again" } }
  },
  n_blank: {
    title: "A Blank Page",
    ending: { name: "A Blank Page", hint: "You said nothing and closed the ledger.", summary: "Alice said nothing. The last page of the ledger stayed blank." },
    pages: [`She said nothing.

The court proceeded, **murmuring,** to the Knave's sentencing. Alice sat in the gallery **with the ledger on her knee.**

The last page **was white.**

White where something had been torn out. **No one had been left to write.**`]
  },

  x_queen_no: {
    title: "\"No\"",
    pages: [`"...No."

The word **had come out** of her mouth.

The Queen's face went **red, redder.** Her fan **stopped.**

(She remembered the Pigeon's warning.)

**Say "no" once more, and it's over.**`],
    options: { again: { label: "Say \"No\" once more" }, fix: { label: "Correct yourself: \"...Yes, Your Majesty.\"", msg: "The Queen **loosened the red in her face, just a little.**" } }
  },
  b_card: {
    title: "Off With Her Head",
    ending: { name: "Off With Her Head", hint: "You said \"no.\"", summary: "\"Off with her head!\" The soldier raised his axe." },
    pages: [`"**Off with her head!**"

The soldier raised his axe. **A thin axe, made of cards.**

(**Perhaps it wouldn't hurt.**)

(**But the afternoon would end there.**)

Alice closed her eyes.`]
  },
  x_court_noperm: {
    title: "Without Permission",
    pages: [`"Excuse me,"

That alone **silenced** the court.

The Queen slowly **stood up.**

(**She hadn't been given permission.**)`],
    options: { go: { label: "Go on speaking" }, back: { label: "Close your mouth" } }
  },
  b_verdict: {
    title: "The Verdict",
    ending: { name: "The Verdict", hint: "You pointed at the Queen, but the proof was short.", summary: "\"Verdict first!\" cried the Queen. Alice stood far short of any verdict." },
    pages: [`"**Verdict first!**" cried the Queen. "**Evidence afterwards!**"

The jurors **wrote something** on their slates.

Alice **could not read what they wrote.**

(**The proof was not enough.** Or, even if it were, **the way she said it.**)`]
  },
  x_court_lie: {
    title: "The Signature",
    pages: [`She took up her fountain pen.

In the ledger, **the difference column.** It said "**five.**" **In Alice's own hand.**

She **set the nib** on the line above that number.

(If she wrote "**correct at twelve,**")

(**the Queen would be relieved. So would she.**)

(**Numbers do not lie. The people who write them do.**)`],
    options: { write: { label: "Rewrite it" }, cap: { label: "Cap the pen" } }
  },
  b_lie: {
    title: "A Lying Signature",
    ending: { name: "A Lying Signature", hint: "You rewrote the difference.", summary: "Alice rewrote a number in the ledger. The court, relieved, adjourned." },
    pages: [`"**Correct at twelve.**"

Alice rewrote the figure and signed.

The Queen **nodded, satisfied.** The court, relieved, adjourned.

Only the sound of the Knave's chains **remained.**

**That night, for the first time, Alice could not sleep well.**`]
  },
  b_pepper: {
    title: "The Sneeze",
    ending: { name: "The Sneeze", hint: "You entered the pepper kitchen twice.", summary: "The pepper sneeze would not stop. The kitchen floor slowly drew near." },
    pages: [`"Ah... ah... ah-CHOO!"

**It would not stop.**

Sneeze called sneeze. **She could not breathe.**

The kitchen floor slowly **drew near.**

Far off, the Cook's voice. **"You went in without a wind, did you?"**`]
  },
  b_poison: {
    title: "The Bottle",
    ending: { name: "The Bottle", hint: "You drank from the unlabeled bottle.", summary: "What was in the unlabeled bottle was **plain poison.**" },
    pages: [`It was sweet.

**Too** sweet.

You must not drink from **a bottle without a label.** **Even a child knows.** Alice had **forgotten it as she grew up.**

Her vision slowly **darkened.**`]
  },
  s_hall: {
    title: "Resident of the Hall",
    ending: { name: "Resident of the Hall", hint: "The potion and the cake were all used up.", summary: "In the hall of doors, she sat on as the afternoon went by." },
    pages: [`How many hours had she sat?

The doors **never opened.**

Alice sat on the floor, **potion and cake all used up.**

(**There was no need to hurry now.**)

(**Strangely, that made her feel at ease.**)

Far away, a bell rang. **She pretended not to hear.**`]
  },
  x_tea_stay: {
    title: "Staying at the Table",
    pages: [`The tea is warm.

The chair is comfortable.

The three had **already set a place for Alice.**

(**If she stays here, the afternoon never ends.**)`],
    options: { stay: { label: "Stay in the seat" }, up: { label: "Stand up" } }
  },
  s_tea: {
    title: "The Endless Afternoon",
    ending: { name: "The Endless Afternoon", hint: "You stayed at the tea-party.", summary: "Alice sat in the fourth seat of the tea-party. The sixth seat stayed empty." },
    pages: [`Alice sat in **the fourth seat.**

**The sixth seat stayed empty.**

The tea-party was, **for ever,** six o'clock.

(**She felt as if someone were waiting.**)

(**But that was not today.**)`]
  },
  x_maze_giveup: {
    title: "Leaning on the Hedge",
    pages: [`The hedge is **warm.**

**How many times has she turned back?**

(**It would be all right to rest here a while.**)`],
    options: { stay: { label: "Rest" }, up: { label: "Stand up" } }
  },
  s_maze: {
    title: "Resident of the Maze",
    ending: { name: "Resident of the Maze", hint: "You could not get out of the maze.", summary: "The maze never ended. Alice kept walking all the same." },
    pages: [`How long had it been?

Alice was **still in the maze.**

Seeing **a wing,** she looked for **an ear.** Seeing **an ear,** she looked for **a wing.**

The exit **had been there all along.** She just **couldn't see it.**`]
  },
  x_tea_cup: {
    title: "One More Cup",
    pages: [`She took another cup.

She **no longer knew** what number it was.

The three are **smiling.** The seats **shifted, one by one.**

(**Only the clock could stop this movement.**)`],
    options: { drink: { label: "Drink another" }, up: { label: "Put down the cup" } }
  },
  l_tea: {
    title: "Tea at Six",
    ending: { name: "Tea at Six", hint: "You drank cup after cup.", summary: "Alice came back to the same seat. Six seats. Always the same sitters." },
    pages: [`The seats **shifted, one by one.**

Alice went **around once.**

**Once more.**

Before she knew it, she was **back in the first seat.**

"No room! No room!" the three cried.

(**I've heard this before.**)`]
  },
  x_river_wait: {
    title: "Counting On",
    pages: [`One, two, three.

The sound of the watch was **comforting.** As long as she counted, **the afternoon did not advance.**

(**It would be all right to keep counting.**)`],
    options: { stay: { label: "Keep counting" }, up: { label: "Look up from the ledger" } }
  },
  l_river: {
    title: "The Same Afternoon",
    ending: { name: "The Same Afternoon", hint: "You kept counting the clock's ticks on the bench.", summary: "Four o'clock, on the riverbank. For ever." },
    pages: [`Sitting on the bench, she counted **the sound of the clock.**

One, two, three, ...

She didn't know how many times.

**Four o'clock** was **always four o'clock.**

(**She had been waiting for someone to come for her.**)

(**No one came.**)

(**She started again from one.**)`]
  }
});
