/* English — chapters 1–3 (overlay on story_ch1.js / story_ch3.js). Same scene ids, same option ids. pages[] follows the Japanese pages[] order. */
window.GAME_EN = window.GAME_EN || { scenes: {} };
Object.assign(window.GAME_EN, {
  title: "Alice's Dark Afternoon",
  eyebrow: "AN INTERACTIVE PICTURE BOOK FOR GROWN-UPS",
  subtitle: "Solve the riddles. Get past six o'clock. A very hard picture book for adults.",
  credit: "Based on Lewis Carroll's Alice's Adventures in Wonderland (1865). Art: Gemini (watercolor).",
  clock: { msg: "Somewhere far off, a bell begins to ring." },
  items: {
    ledger: { name: "The ledger", desc: "The kitchen accounts of the Queen of Hearts & Co. The last page has been torn out." },
    watch: { name: "Broken pocket watch", desc: "The hands are stuck at six. There is an engraving on the back." },
    jar: { name: "Empty jar", desc: "Labeled Orange Marmalade. Empty." },
    key: { name: "Tiny golden key", desc: "The key to a very small door." },
    fan: { name: "White fan", desc: "Something the Rabbit dropped." },
    gloves: { name: "White gloves", desc: "Something the Rabbit dropped. One is damp." },
    spoon: { name: "Silver spoon", desc: "There is a tiny hole in the handle." },
    letter: { name: "An opened letter", desc: "Addressed to Alice." },
    pen: { name: "Fountain pen", desc: "The tool of Alice's trade." }
  },
  zones: {
    bank: { name: "The Riverbank" }, hole: { name: "The Hole" }, hall: { name: "The Hall of Doors" }, pool: { name: "The Pool of Tears" },
    house: { name: "The White Rabbit's House" }, wood: { name: "The Wood" }, mush: { name: "The Mushroom Glade" }, duchess: { name: "The Duchess's House" },
    tea: { name: "The Tea-Party at Six" }, garden: { name: "The Queen's Ground" }, school: { name: "The Mock Turtle's School" },
    maze: { name: "The Hedge Maze" }, court: { name: "The Court of Hearts" }, six: { name: "The Room at Six" }
  },
  endingKinds: {
    true: { name: "Past Six O'Clock", banner: "Congratulations!" }, happy: { name: "A Gentle Ending" }, normal: { name: "An Ordinary Ending" },
    bad: { name: "A Quiet, Heavy Ending" }, loop: { name: "On Repeat" }, stuck: { name: "Unable to Move" }
  }
});
Object.assign(window.GAME_EN.scenes, {

  river: {
    title: "The Bench by the River",
    pages: [
      `Four in the afternoon. A bench by the river.

Alice had someone else's ledger open on her knees. The kitchen accounts of the Queen of Hearts & Co. Six months' worth.

Twenty-eight years old. Auditor. Her job was to find the lies in numbers.

It would not balance. No matter how many times she added it up.

The wind turned a page. The river glittered, slowly.

...Something white ran past the end of the bench.

"I'm late! I'm late! Look at the time!"

A rabbit. In a waistcoat, clutching a pocket watch.`,
      `The bench by the river. The light of four o'clock.

The wind turns a page.`,
      `Alice looked up from the ledger.

At times like this, a grown-up pretends not to have seen. But the chain on that watch was something **she recognized**.`
    ],
    options: {
      ledger: { label: "The ledger on the bench", msg: "She put the ledger in her bag." },
      pen: { label: "The fountain pen in your breast pocket", msg: "She clipped the pen into her pocket. A tool of her trade." },
      open: { label: "Open the ledger again" },
      rabbit: { label: "Follow the Rabbit" },
      rabbit0: { label: "Follow the Rabbit", msg: "She realized she was running with the ledger left behind on the bench." },
      wait: { label: "Stay on the bench, counting the ticking", msg: "The tick of a second hand... no. That was her own pulse." },
      wait2: { label: "Stay anyway, and keep counting" }
    }
  },
  river_ledger: {
    title: "Kitchen Accounts, Queen of Hearts & Co.",
    pages: [
      `**Queen of Hearts & Co. — Kitchen Accounts (second half)**

Purchases: flour, butter, raspberries, sugar. Altogether, enough for **twelve** tarts.

Production record: today, three o'clock. Output: **seven** tarts.

In the difference column, in Alice's own hand, in red: "**5**".

The last page has been torn out.

On the torn edge, a number can just be made out: "==six o'clock==".`
    ],
    options: { close: { label: "Close the ledger" } }
  },
  hole: {
    title: "The Hole at the Foot of the Hedge",
    pages: [
      `The Rabbit had dived into a hole at the foot of the hedge.

Much too small for a grown woman to crawl into. And yet the mouth of the hole fit Alice's shoulders exactly.

Something lay on the ground.

A broken pocket watch. Its hands were stopped at **six**.`,
      `The hole at the foot of the hedge. The mouth fits your shoulders exactly.`,
      `A wind rises from deep in the hole.

It smells of old paper.`
    ],
    options: {
      watch: { label: "The broken pocket watch", msg: "The watch was cold." },
      engraving: { label: "Look at the back of the watch" },
      down: { label: "Climb down into the hole" },
      back: { label: "Go back to the riverbank" }
    }
  },
  watch_read: {
    title: "The Back of the Watch",
    pages: [
      `There is a thin engraving on the back.

"**From L., to A. Be late if you must.**"

Alice traced the letters with her thumb.

L. She knew that initial. And she knew that her mind had **put it away at once**.`
    ],
    options: { close: { label: "Close your hand around the watch" } }
  },
  fall: {
    title: "The Long Fall",
    pages: [
      `She fell. She was falling. She went on falling.

The walls were shelves. On the shelves: jars, a map, a ledger, a clock.

(Falling, you can only catch what is in reach. You have two hands.)`,
      `Falling. The shelves drift slowly upward.`,
      `Warm air rises from below.

Her sense of time grows thin.`
    ],
    options: {
      orange: { label: "A jar labeled Orange Marmalade", msg: "She opened the lid. Empty. Only the label was grand." },
      strawberry: { label: "A jar of strawberry jam" },
      map: { label: "A map pinned to the wall" },
      down: { label: "Keep falling" }
    }
  },
  fall_jam: {
    title: "The Jam Jar",
    pages: [
      `The jar was half full.

She put a finger in, and licked it. Sweet. Far too sweet. **A tired body is grateful.**

By the time she noticed, her fingers were sticky and so was the edge of the shelf.

...She had spent rather a lot of time on it.`
    ],
    options: { close: { label: "Wipe your fingers on a handkerchief" } }
  },
  fall_map: {
    title: "The Map on the Wall",
    pages: [
      `It was a map of a maze. At the entrance, "**IN**". At the center, "**GARDEN**".

In the margin, in a thin hand, were directions.

"==Two doves fly off together. The cat looks back, once. A dove, once. A cat, twice.=="

Below, smaller still:

"**Which hand is the dove, and which the cat? Ask the gateposts.**"

Alice committed it to memory. Or thought she did.`
    ],
    options: { close: { label: "Take your hand from the map" } }
  },
  hall: {
    title: "The Hall of Doors",
    pages: [
      `She had landed. A hall.

A glass table reaching to the ceiling. No windows. Doors all around, every one locked.

Only **a small door behind a curtain** stood slightly open.

It was no higher than her knee.`,
      `The Hall of Doors. No windows.`,
      `Her head is jammed against the ceiling. The glass table is at waist height.`,
      `The glass table is a **cliff**. The little door is exactly at eye level.`,
      `On the table: a key, a bottle, a cake.

The bottle: "**Drink me. Two mouthfuls at most.**"

The cake: "**Eat me. Two mouthfuls at most.**"

Alice was an auditor. She knew that **a limit on a figure has a reason behind it.**`
    ],
    options: {
      drinkL: { label: "Drink from the bottle", locked: "The bottle is empty now.", msg: "She shrank at once. Just the right size." },
      drinkN: { label: "Drink from the bottle", locked: "The bottle is empty now.", msg: "The world grew enormous." },
      drinkS: { label: "Drink from the bottle", msg: "Shrink any further, and what then?" },
      eatN: { label: "Eat the cake", locked: "Nothing is left but crumbs.", msg: "Her head drew closer to the ceiling." },
      eatS: { label: "Eat the cake", locked: "Nothing is left but crumbs.", msg: "She was a little closer to her old size." },
      eatL: { label: "Eat the cake", msg: "Grow any larger, and what then?" },
      key: { label: "The key on the glass table", locked: "She can't reach it.", msg: "The key was tiny, and golden." },
      door: { label: "The small door behind the curtain", locked: "The door is small. And it needs a key." },
      giveup: { label: "I can't think any more. Sit down in a corner of the hall" }
    }
  },
  hall_giveup: {
    title: "A Corner of the Hall",
    pages: [
      `The hall is quiet. Every door is shut.

Sitting down, she found the floor warmer than she'd expected.

Nobody comes.

**One more reason to hurry has gone.**`
    ],
    options: { stay: { label: "Stay where you are" }, up: { label: "Stand up" } }
  },

  tears: {
    title: "The Pool of Tears",
    pages: [
      `Beyond the door was not a passage.

It was a **shore**.

A pool lay before her, truly vast. To a body this small, the far side was lost in haze.

The water smelled of salt. ...The smell of tears.

(Alice was not crying. Probably.)`,
      `The shore of the Pool of Tears. The smell of salt.`,
      `Things that have washed up are scattered along the shore.

Swim, or cling to something. Either way, **you will get wet.**`
    ],
    options: {
      swim: { label: "Swim across" },
      float: { label: "Cling to the empty jar and cross", locked: "You have nothing to cling to." },
      look: { label: "Peer at the water" }
    }
  },
  tears_look: {
    title: "The Water's Surface",
    pages: [
      `A face is reflected. Twenty-eight, and tired.

Over its shoulder, she felt there was **someone else** in the reflection.

She turned. Nobody.

(The face in the water was a little younger than Alice.)`
    ],
    options: { close: { label: "Look away" } }
  },
  tears_swim: {
    title: "In the Tears",
    pages: [
      `She swam. Her clothes were heavy.

Salt water stung her eyes. It felt like crying, and she nearly laughed.

Halfway across, she bumped into a plank. She clung to it and caught her breath.

It took a long time to reach the far shore.`
    ],
    options: { on: { label: "Climb ashore" } }
  },
  caucus: {
    title: "The Caucus-Race",
    pages: [
      `On the far shore, a crowd of wet creatures had gathered. A Dodo. A Lory. An Eaglet. A Duck. And a Mouse.

None of them was properly dry.

"The best way to get dry," announced the Dodo, "is a **Caucus-race**."

They set off in a ring. Nobody could say when it began, or when it would end.`,
      `The remains of the Caucus-race. Half-dried creatures are still strolling in circles.`,
      `It was over. Apparently.

The Dodo puffed out his chest. "Everyone has won. There are prizes."

Then he looked hard at Alice. "Auditor, I'm told. Kindly tally the prizes."`
    ],
    options: {
      prize: { label: "Agree to tally the prizes" },
      mouse: { label: "Talk to the Mouse" },
      house: { label: "Head for the White Rabbit's house" },
      wood: { label: "Head into the wood" }
    }
  },
  dodo_prize: {
    title: "Tallying the Prizes",
    pages: [
      `The Dodo turned a bag upside down. Comfits rolled everywhere.

"**Seventeen** of them."

"There were **six** runners, counting me. They are shared out equally among the six. Whatever is left over goes to the referee, which is me. Now, Auditor: **how many does the referee get?**"

Everyone was looking at Alice.`
    ],
    options: {
      a1: { label: "\"One.\"" }, a2: { label: "\"Two.\"" }, a3: { label: "\"Three.\"" }, a5: { label: "\"Five.\"" },
      no: { label: "\"I would rather not.\"" }
    }
  },
  dodo_wrong: {
    title: "Run It Again",
    pages: [
      `"Wrong!" The Dodo struck the ground with his stick. "Whoever can't balance the sum runs again!"

She was made to run one more lap. Her feet were still sticky with salt.

(An auditor, making a mistake in addition.)`
    ],
    options: { back: { label: "Catch your breath" } }
  },
  dodo_right: {
    title: "The Right Tally",
    pages: [
      `Seventeen divided by six. Six twos. Five left over.

"...Correct," said the Dodo, a little sourly. "I do not like auditors. But I am grateful."

The Mouse crept close.

"**If you go to the house with the pepper, take a fan.** Make a wind, and the pepper runs away."

And with that the Mouse slipped back into the crowd.`
    ],
    options: { on: { label: "Nod" } }
  },
  mouse_talk: {
    title: "The Mouse's Tale",
    pages: [
      `"It is a long and sad tale," said the Mouse.

"Once, a cat, and a dog, and... no. I need not tell that."

The Mouse looked hard into Alice's face.

"Have you ever **kept someone waiting**?"

She could not answer.

The Mouse nodded. "So have I. **The one who makes others wait is always busy.** Only the one who waits knows what spare time is."`
    ],
    options: { close: { label: "Look down" } }
  },
  rabbit_house: {
    title: "The White Rabbit's House",
    pages: [
      `The White Rabbit's house was far too tidy.

The shoes were lined up. The umbrellas were set at matching angles. In this house, only lateness was out of order.

On the table, a memo in the Rabbit's cramped hand.

"==Fan and gloves. The attic. Hurry.=="`,
      `The White Rabbit's house. The shoes are lined up.`,
      `(The door at the back opens onto stairs to the attic.)`
    ],
    options: {
      fan: { label: "The white fan on the table", msg: "The fan was light." },
      gloves: { label: "The white gloves in the drawer", msg: "One of the gloves was damp." },
      bottle: { label: "An unlabeled bottle on the shelf" },
      attic: { label: "The stairs to the attic" },
      out1: { label: "Back to the Pool of Tears" },
      out2: { label: "Out into the wood" }
    }
  },
  house_bottle: {
    title: "The Unlabeled Bottle",
    pages: [
      `The bottle has no label.

Instead, a **scrap of paper** is tied to the stopper with thread. The front is blank. Through the back, you can see the reverse of the words "==Do not drink==".

If you drank it, something would happen.

Something the Rabbit does not want seen.`
    ],
    options: { drink: { label: "Pull the stopper and drink" }, put: { label: "Put the bottle back on the shelf" } }
  },
  rabbit_attic: {
    title: "The Attic",
    pages: [
      `The attic was a mountain of papers.

The White Rabbit was at a desk, in front of the cracked face of a clock.

"Late!" he said, without looking up. "The gloves and the fan?"

Alice felt she had just been named **Mary Ann**.`,
      `The White Rabbit, gloved and fanning himself, nodded in satisfaction.

"...Thank you. Take the **spoon**. The back of a watch opens with it."

Then he looked at Alice, just a little.

"You mustn't be late. I am already too late."`
    ],
    options: {
      give: { label: "Hand over the fan and the gloves", locked: "The Rabbit stopped and looked at her hands. It seemed to say: not enough.", msg: "The Rabbit gave her a silver spoon. There was a tiny hole in the handle." },
      book: { label: "Peek at the Rabbit's appointment book" },
      down: { label: "Go down the stairs" }
    }
  },
  rabbit_book: {
    title: "The Rabbit's Appointment Book",
    pages: [
      `The Rabbit's appointment book ran by the minute.

"4:00 p.m. — Fetch the **auditor** from the riverbank."

"4:30 p.m. — The Queen's ground. Croquet."

"Tea-party — time: **stuck at six**. Seats run clockwise, one to six. **Hatter is one, March Hare is two, Dormouse is three.** After every cup, everyone moves one seat clockwise."

"**Six o'clock sharp** — The Court of Hearts. Latecomers will be..."

The rest has bled away into the ink.`
    ],
    options: { close: { label: "Close the book" } }
  }
});
