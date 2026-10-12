/* English — chapters 4–5 (story_ch4.js / story_ch5.js) */
Object.assign(window.GAME_EN.items, {
  mushRed: { name: "Red-capped mushroom (label: Grow)", desc: "The label says it makes you grow. Labels in this wood cannot be trusted." },
  mushBlue: { name: "Blue-capped mushroom (label: Shrink)", desc: "The label says it makes you shrink." },
  mushWhite: { name: "White-capped mushroom (label: Nothing)", desc: "The label says nothing will happen." }
});
Object.assign(window.GAME_EN.scenes, {

  crossroads: {
    title: "The Fork in the Wood",
    pages: [
      `Out of the Rabbit's house, there was a wood.

The paths came undone like a knot, into four. Three were well trodden. One was an animal track.

At the middle of the fork stood **three signboards**.

Each looked written by a different hand. At the foot of the posts, a small notice.`,
      `The fork in the wood. Three signboards.`,
      `The three trodden paths: **the left road, the middle road, the right road**.

Their destinations: the tea-party, the Queen's ground, the Duchess's house.

Which road goes where? The signboards should tell you. **They should.**`
    ],
    options: {
      signs: { label: "Read the three signboards" }, left: { label: "The left road" }, mid: { label: "The middle road" },
      right: { label: "The right road" }, beast: { label: "The animal track" }, back: { label: "Back toward the pool" }
    }
  },
  crossroads_signs: {
    title: "Three Signboards",
    pages: [
      `Sign A: "The tea-party is down the **right** road."

Sign B: "The Queen's ground is **not** down the **left** road."

Sign C: "The Duchess's house is **not** down the **right** road."

The notice at the foot of the posts:

"From the signwriter. **Of these three signs, only one tells the truth.** The other two are lies. Each of the three roads leads to exactly one of the places. No two are swapped."`
    ],
    options: { close: { label: "Step away from the signs" } }
  },
  mushroom: {
    title: "The Mushroom Glade",
    pages: [
      `Beyond the animal track lay a glade of mushrooms.

The caps were bigger than Alice was tall. Above them, blue smoke. A Caterpillar was smoking a hookah.

At her feet, three mushrooms with different colored caps. Each had a label stuck in it.

"Red cap — **Grow**"
"Blue cap — **Shrink**"
"White cap — **Nothing happens**"`,
      `The mushroom glade. Three mushrooms with differently colored caps. The labels are as before.`,
      `From the tree above, a pigeon's shrieking.

(Who stuck the labels in?)`
    ],
    options: {
      cat: { label: "Speak to the Caterpillar" }, pigeon: { label: "The pigeon in the tree" },
      red: { label: "The red-capped mushroom", msg: "She broke off a red cap." },
      blue: { label: "The blue-capped mushroom", msg: "She broke off a blue cap." },
      white: { label: "The white-capped mushroom", msg: "She broke off a white cap." },
      back: { label: "Back to the fork" }
    }
  },
  caterpillar: {
    title: "The Caterpillar",
    pages: [
      `The Caterpillar looked at Alice, slowly.

"**Who are you?**"

Alice began to answer, and noticed that a name would be no use here.

"There is no need to give your name," said the Caterpillar. "**Let your belongings answer.** I shall ask three things."`,
      `The Caterpillar blew out smoke, pleased.

"You are you. ...Go."`
    ],
    options: { ask: { label: "Answer the three questions" }, back: { label: "Back to the glade" } }
  },
  cq1: {
    title: "The First Question",
    pages: [`"The first," said the Caterpillar.

"At **what time** has your pocket watch stopped?"`],
    options: {
      a4: { label: "\"Four o'clock.\"" }, a559: { label: "\"Five fifty-nine.\"" },
      a6: { label: "\"Six o'clock.\"", locked: "You do not have a watch." },
      a0: { label: "\"I don't have a watch.\"" }
    }
  },
  cq2: {
    title: "The Second Question",
    pages: [`"The second."

"What does your ledger say in the **difference** column?"`],
    options: {
      b3: { label: "\"Three.\"" }, b5: { label: "\"Five.\"", locked: "You do not have a ledger." },
      b7: { label: "\"Seven.\"" }, b12: { label: "\"Twelve.\"" }
    }
  },
  cq3: {
    title: "The Third Question",
    pages: [`"The third."

"It is engraved on the back of the watch. **From whom, to whom?**"`],
    options: {
      c1: { label: "\"From A., to L.\"" }, c2: { label: "\"From L., to A.\"" },
      c3: { label: "\"From R., to A.\"" }, c4: { label: "\"There is nothing engraved.\"" }
    }
  },
  cat_angry: {
    title: "No",
    pages: [`"...No."

The Caterpillar blew one ring of smoke. It loosened slowly in front of Alice's face.

"Look at your belongings properly, then come back."

(You can look at the ledger, and the watch, again. **There is no shame in re-reading.**)`],
    options: { back: { label: "Withdraw" } }
  },
  cat_ok: {
    title: "Belongings Do Not Lie",
    pages: [`The Caterpillar breathed out smoke, slowly.

"...Very well. Belongings do not lie. Owners do."

Then he raised himself a little.

"One piece of advice. **All three labels at your feet are lies.** And **the red cap does something.**"`],
    options: { on: { label: "Nod" } }
  },
  pigeon: {
    title: "The Pigeon in the Tree",
    pages: [
      `In the tree, a pigeon was shrieking.

"Serpent! An egg-eating serpent!"

Alice had eaten eggs. Ordinary ones, for breakfast.

"**Whatever eats eggs is a serpent**," said the Pigeon. "You eat eggs. Therefore you are a serpent."`,
      `The Pigeon is still muttering in her nest.`
    ],
    options: {
      p1: { label: "\"I am not a serpent!\"" },
      p2: { label: "\"Serpents eat eggs. But eating eggs does not make one a serpent.\"" },
      p3: { label: "\"I have never eaten an egg.\"" },
      p4: { label: "\"...Then let me be a serpent.\"" },
      back: { label: "Step away from the tree" }
    }
  },
  pigeon_wrong: {
    title: "Serpent, Serpent",
    pages: [`"Serpent! Serpent!"

The Pigeon flapped so hard she nearly fell out of the nest.

(You did not lose on logic. **You lost on how you said it.**)`],
    options: { back: { label: "Back away" } }
  },
  pigeon_ok: {
    title: "The Argument Holds",
    pages: [`The Pigeon stopped flapping.

"...Hm. ...The argument holds. Annoyingly."

After a while, she said quietly:

"One thing I'll tell you. **Her Majesty loses her temper, and then someone's head, at the word 'no'.** Someone's head being yours."`],
    options: { on: { label: "Thank her" } }
  },

  duchess: {
    title: "The Duchess's House",
    pages: [
      `Down the right road, there was a smell of smoke.

The Duchess's house breathed pepper smoke out of its chimney. Every window was fogged, as if weeping.

Pieces of broken plates lay around the door. Somewhere, a baby was crying, and someone was sneezing.`,
      `The Duchess's house. Pepper smoke still rises from the chimney.`,
      `On the roof, **a grin** hovered by itself.`
    ],
    options: {
      kfan: { label: "Open the fan and go into the kitchen" }, kplain: { label: "Hold your breath and go into the kitchen" },
      cat: { label: "The grin on the roof" }, back: { label: "Back to the fork" }
    }
  },
  kitchen: {
    title: "The Pepper Kitchen (In the Wind)",
    pages: [`She went into the kitchen, fanning a wind before her. The pepper fog split in two ahead of Alice.

At the great cauldron, the Cook, hurling plates.

"Tarts? I baked **seven**. At **three o'clock**. Put them on a tray and set it out in the hall. That's all I know!"

"Ingredients for twelve? Yes, I bought them. Her Majesty said to make **twelve**. But the pot was too small, so I could only bake **seven**."

(The five in the ledger. ...Ingredients for five tarts went unused. What was never used cannot have been stolen.)`],
    options: { out: { label: "Leave the kitchen" } }
  },
  kitchen_pep: {
    title: "The Pepper Kitchen",
    pages: [
      `She went in holding her breath. ...In five seconds, her eyes ran.

The pepper stabs eyes and throat alike. At the great cauldron, the Cook, hurling plates.

"Tarts? I baked **seven**. At **three o'clock**. Put them on a tray and set it out in the hall. That's all I know!"

"Ingredients for twelve? Yes, I bought them. Her Majesty said to make **twelve**. But the pot was too small, so I could only bake **seven**."

(The five in the ledger. ...Ingredients for five tarts went unused. What was never used cannot have been stolen.)`,
      `The second time.

Before she could hold her breath, her nose began to itch. The itch went down into her chest.

The kitchen floor tilted.`
    ],
    options: { out: { label: "Leave the kitchen" }, sneeze: { label: "...ah-" } }
  },
  cheshire: {
    title: "The Cheshire Cat",
    pages: [
      `On the roof, a grin floated alone.

The grin slowly took the form of a cat. "Hello, auditor."

"Everyone here is mad. **Me too.** ...Shall I prove it?"`,
      `A little of the grin remains on the roof.`
    ],
    options: { ask: { label: "Listen to the proof" }, follow: { label: "Follow the cat" }, back: { label: "Back to the front of the house" } }
  },
  cheshire_q: {
    title: "The Proof of Madness",
    pages: [`"A dog **growls** when it is angry. It **wags its tail** when it is pleased."

The cat was swishing his tail.

"I **growl when I am pleased and wag my tail when I am angry**. So I am the dog's opposite."

"Now. At this moment, I am **wagging** my tail. **Am I angry, or pleased?**"`],
    options: {
      angry: { label: "\"You are angry.\"" }, glad: { label: "\"You are pleased.\"" },
      same: { label: "\"The same as a dog, so pleased.\"" }, mad: { label: "\"You are mad, so there is no answer.\"" }
    }
  },
  cheshire_wrong: {
    title: "A Grin",
    pages: [`The cat grinned.

"Wrong. ...What a pity. Lay it out again in your head."

(The dog's rule and the cat's rule. **Which is which?**)`],
    options: { back: { label: "Think again" } }
  },
  cheshire_ok: {
    title: "Correct",
    pages: [`"Correct. ...Even madness can be consistent."

The cat thinned out, satisfied.

"As a reward, a word about the garden. At the entrance to the maze, two gateposts carry a crest."

"**The dove is the right wing. The cat is the left ear.**"

"That is all."

The cat vanished. The grin lingered a little while.`],
    options: { on: { label: "Watch what remains of the grin" } }
  }
});
