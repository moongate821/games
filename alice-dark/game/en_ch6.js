/* English — chapters 6–9 (story_ch6.js … story_ch9.js) */
Object.assign(window.GAME_EN.scenes, {

  tea: {
    title: "The Tea-Party at Six",
    pages: [
      `The left road ended in a garden. Not so much a garden as **a stopped afternoon**.

A long table. Six chairs. A small tag on each chair back, clockwise, **one to six**.

Six teacups. Steam rises from the pot, and the tea never runs low.

On a branch hangs a grandfather clock. Its hands: **six o'clock**.

The Hatter in seat one, the March Hare in seat two, the Dormouse in seat three, all taking tea.

"No room! No room!" they cried out together.

Six seats. Only three sitting.`,
      `The tea-party at six. The clock says six.`,
      `The second hand of the clock **is moving**.

The three have not noticed yet.`,
      `The tea is warm. Warm forever.

If you stay here, the afternoon never ends. **For some, that is the most welcome thing there is.**`
    ],
    options: {
      seats: { label: "Try sitting down" }, raven: { label: "Answer the Hatter's riddle" }, dm: { label: "Listen to the Dormouse" },
      hatter: { label: "Show the Hatter your watch" }, tell: { label: "Tell the three, \"It is already past six\"" },
      wind: { label: "Wind the clock's crown", msg: "A click. ...The second hand began to move." },
      cup: { label: "Take another cup of tea", msg: "The tea was warm. Forever warm." }, cup2: { label: "Take another cup of tea" },
      stay: { label: "Stay on at the tea-party" }, leave: { label: "Leave the tea-party" }
    }
  },
  tea_seats: {
    title: "Rotating Seats",
    pages: [`"Sit down," said the Hatter. "But **there is a rule**."

"With **each cup** of tea, everyone **moves one seat clockwise**. That is the custom here."

"**After the third cup**, you must be sitting **one seat before mine** (the neighbour counter-clockwise). Otherwise, no cup for you."

"Now, **which seat** do you take, **now**?"

(Seats run clockwise, one to six. The Hatter is in seat one.)`],
    options: {
      s1: { label: "Seat one" }, s2: { label: "Seat two" }, s3: { label: "Seat three" }, s4: { label: "Seat four" },
      s5: { label: "Seat five" }, s6: { label: "Seat six" }, no: { label: "Stay standing and think" }
    }
  },
  tea_seat_wrong: {
    title: "After the Third Cup",
    pages: [`The third cup.

Everyone moved one seat clockwise. The Dormouse toppled onto Alice. The March Hare's elbow knocked over a cup.

"Wrong. Wrong," said the Hatter, delighted. "**Count again.**"`],
    options: { back: { label: "Leave the seat" } }
  },
  tea_seat_ok: {
    title: "After the Third Cup",
    pages: [`The third cup.

Everyone moved a seat. ...Alice found herself one seat before the Hatter.

The Hatter grinned. "Pass. ...Though the time is still six."`],
    options: { on: { label: "Accept the tea" } }
  },
  tea_raven: {
    title: "A Riddle",
    pages: [`The Hatter took a black feather out of his hat.

"**Why is a raven like a writing-desk?**"

"I don't know the answer," he added. "But I never said **there isn't one**."`],
    options: {
      r1: { label: "\"Both can produce notes. Though both are terribly flat.\"" },
      r2: { label: "\"Both are black.\"" },
      r3: { label: "\"Both write with feathers.\"" },
      r4: { label: "\"There isn't an answer.\"" },
      no: { label: "\"I'll pass.\"" }
    }
  },
  tea_raven_wrong: {
    title: "Wrong",
    pages: [`The Hatter, disappointed, readjusted his hat.

"No. ...Well, not that it's not, but **no**."

(Here, **words** are the most treacherous thing.)`],
    options: { back: { label: "Sip your tea" } }
  },
  tea_raven_ok: {
    title: "Producing Notes",
    pages: [`"...Notes. Notes of sound. Notes you write down."

The Hatter slapped his knee and laughed. He laughed so hard his hat fell off.

"That's it! Even the flatness! **For the first time in ages, a word beat a word.**"

The March Hare clapped. Somewhere far away, someone seemed to cry.`],
    options: { on: { label: "Nod, a little embarrassed" } }
  },
  tea_dormouse: {
    title: "The Dormouse's Story",
    pages: [
      `The Dormouse began, half asleep.

"Once, three sisters lived at the bottom of a well. A treacle well. They drew pictures. Only things beginning with **M**."

"For instance..."

The Dormouse snored. He opened his eyes and went on.

"...for instance, **what was it**. You say four."

(Four things beginning with M. If you get one wrong, the Dormouse just goes back to sleep.)`,
      `Four, in the end.

The Dormouse closed his eyes, content. "...Yes, that. ...That."`
    ],
    options: {
      m1: { label: "Moon", msg: "\"Moon. ...Yes.\"" },
      m2: { label: "Mirror", msg: "\"Mirror. ...Yes.\"" },
      m3: { label: "Maze", msg: "\"Maze. ...Yes.\"" },
      m4: { label: "Milk", msg: "\"Milk. ...Yes.\"" },
      n1: { label: "Cat" }, n2: { label: "Clock" }, n3: { label: "Lamp" }, n4: { label: "Hat" },
      done: { label: "Finish listening to the Dormouse" }, no: { label: "Step away so as not to wake him" }
    }
  },
  tea_dm_wrong: {
    title: "No",
    pages: [`"...No."

So saying, the Dormouse went back to sleep.

(Beginning with **M**. Think of the first letter again.)`],
    options: { back: { label: "Slip back quietly" } }
  },
  tea_dm_ok: {
    title: "Bottom of the Well",
    pages: [`"...The sisters at the bottom of the well," said the Dormouse, in his dream.

"They drew and drew, and **it was never in time**. Just a little more, just a little more, they thought, until **the well was full**."

Nobody laughed.

The March Hare quietly put down his cup.`],
    options: { on: { label: "Nod in silence" } }
  },
  hatter_time: {
    title: "Show the Watch",
    pages: [`"You have solved two," said the Hatter.

"Then show me. **The stopped watch.**"

She laid the pocket watch on the table. Its hands were still at six. The Hatter brought his face to the watch.

"...This watch is not broken. **It decided to stop.** Someone made it, you see."

On the back cover, a tiny hole.`],
    options: {
      open: { label: "Slide the silver spoon into the hole", locked: "The back cover will not open. Something with a thin handle would have to go into that small hole." },
      back: { label: "Put the watch away" }
    }
  },
  watch_inside: {
    title: "Inside the Back Cover",
    pages: [`With a small click, the back cover opened.

Inside, a folded slip of paper.

"**At six, under the station clock.** It's all right if you're late. If you come, that's enough. — Lina"

Alice read it.

While she read, **it was not the watch that had stopped**.

(Half a year ago. The meeting ran over. "Ten more minutes," she wrote. **The ten minutes went past six.**)

The Hatter said nothing. Neither did the March Hare. The Dormouse had his eyes open.`],
    options: { on: { label: "Clench the slip in your hand" } }
  },

  /* ───── chapter 7 ───── */
  croquet: {
    title: "The Queen's Ground",
    pages: [
      `The middle road ended in a red garden.

White roses being painted red. Three gardener cards hurried about, looking for patches they'd missed.

Beyond them, a procession began. Soldier cards. A king and queen. And at the very end, **a red-faced Queen**.

"Is there anyone with **a complaint** about this garden?!"

Every soldier shook his head sideways. **They couldn't nod, either.**`,
      `The Queen's ground. The croquet is still being set up.`,
      `Three hoops: **red, blue, green**. Hedgehogs for balls. Flamingos for mallets.

The soldiers stand in a triangle.`
    ],
    options: {
      count: { label: "Count the soldiers in formation" }, hoop: { label: "Check the order of the hoops" },
      queen: { label: "Speak to the Queen" }, queen_no: { label: "Speak to the Queen" }, queen_done: { label: "Greet the Queen" },
      gry: { label: "Follow the Gryphon" }, maze: { label: "To the hedge maze at the edge of the garden" },
      court: { label: "Head for the court", locked: "Going to court without the ledger is like going to war without a weapon." },
      back: { label: "Back to the fork" }
    }
  },
  croquet_early: {
    title: "Before the Queen",
    pages: [`Alice tried to approach, and a soldier stopped her.

"**Those who have not made preparations may not come before Her Majesty.**"

(It seems she must count the soldiers and be sure of the hoops' order.)`],
    options: { back: { label: "Step back" } }
  },
  croquet_count: {
    title: "Counting the Soldiers",
    pages: [`The soldiers stand in a triangle.

**One** at the front. **Two** behind. **Three** behind them. ...One more per row, and **nine** in the last.

The Queen says: "**How many in all?** If you get it wrong,"

The Queen did not finish.`],
    options: { n36: { label: "Thirty-six" }, n45: { label: "Forty-five" }, n54: { label: "Fifty-four" }, n55: { label: "Fifty-five" }, no: { label: "Count again" } }
  },
  croquet_count_wrong: {
    title: "Wrong Count",
    pages: [`"...Wrong."

The Queen tapped Alice's nose with her fan.

"**Count again.** Though there isn't much time."

(One, two, three, ... nine. Add them up.)`],
    options: { back: { label: "Step back" } }
  },
  croquet_count_ok: {
    title: "Forty-five",
    pages: [`"**Forty-five.**"

The Queen's brow twitched.

"...Correct. **But** it may be luck."`],
    options: { on: { label: "Bow in silence" } }
  },
  croquet_hoop: {
    title: "Order of the Hoops",
    pages: [`Three hoops: red, blue, green. They must be passed in a set order. A gardener card whispered the rules.

"**Green is not first.**"

"**Red is not last.**"

"**Blue comes right before green.**"

(The card said no more, and went back to painting.)`],
    options: {
      h1: { label: "Red → Blue → Green" }, h2: { label: "Red → Green → Blue" }, h3: { label: "Blue → Red → Green" },
      h4: { label: "Blue → Green → Red" }, h5: { label: "Green → Red → Blue" }, no: { label: "Think about it later" }
    }
  },
  croquet_hoop_wrong: {
    title: "The Hoops Laugh",
    pages: [`She rolled the hedgehog. It bumped into one hoop after another, and curled up.

The gardener card whispered. "...Wrong."`],
    options: { back: { label: "Think again" } }
  },
  croquet_hoop_ok: {
    title: "Red, Blue, Green",
    pages: [`The hedgehog passed through red, blue, green, in that order, neat as anything.

The gardener card raised his head, just a little. "...Well done."

Far away, the Queen snorted **once**.`],
    options: { on: { label: "Give a small bow" } }
  },
  queen_talk: {
    title: "The Queen of Hearts",
    pages: [
      `The Queen looked Alice up and down.

"You counted the soldiers. You remembered the hoops. ...**Very well.**"

The Queen's face was red. Whether from anger or by nature, it was hard to tell.

"One question only. **Is this garden beautiful?**"`,
      `The Queen fanned herself, satisfied.`
    ],
    options: {
      yes: { label: "\"Yes, Your Majesty. A most beautiful garden.\"" },
      no: { label: "\"No. It looks as if you are painting red paint on white roses.\"" },
      but: { label: "\"...Well. The roses are a little sad, aren't they.\"" },
      back: { label: "Step back" }
    }
  },
  queen_hmm: {
    title: "On the Edge",
    pages: [`The Queen's face went from red to **dark red**.

"...Sad? ...The roses?"

The soldiers took up their axes. The Queen raised a hand. Only a little.

"**Once more. Is this garden beautiful?**"

(It would be wiser to mind your phrasing.)`],
    options: {
      yes: { label: "\"Yes, Your Majesty. A most beautiful garden.\"" },
      no: { label: "\"No.\"" }
    }
  },
  queen_yes: {
    title: "A Word of Praise",
    pages: [`The Queen **laughed aloud**.

"Of course. Of course. **My garden.**"

After the laughter, for a split second, the Queen looked **terribly tired**.

"...I give you **permission**. **Permission to speak in court.** I don't, as a rule."

The Queen turned away and added, "At six, **everything will be counted again.** As many times as it takes."`],
    options: { on: { label: "Bow deeply" } }
  },
  queen_after: {
    title: "Greeting the Queen",
    pages: [`"What?" said the Queen from behind her fan.

"...Never mind. Go. Six is coming."`],
    options: { back: { label: "Go back" } }
  },

  /* ───── chapter 8 ───── */
  school: {
    title: "The Mock Turtle's School",
    pages: [
      `The Gryphon took Alice to a rocky shore at the edge of the garden.

On a rock, someone sat alone. The **Mock Turtle**. A calf's head on a turtle's body. Tears streaming from his eyes.

"He's **crying all the time**," said the Gryphon. "Nothing sad about it. Right?"

The Mock Turtle gave a sob.

"...I was once a real turtle."

On the blackboard, faint writing remained.`,
      `The Mock Turtle's school. The sea is far away.`,
      `"**Let me give you a lesson,**" said the Mock Turtle. "While I cry, **numbers are a comfort.**"`
    ],
    options: {
      lesson: { label: "Take the lesson" }, dance: { label: "Dance the Quadrille" }, talk: { label: "Listen to the Mock Turtle's story" },
      hint: { label: "Call out to the Gryphon" }, back: { label: "Back to the garden" }
    }
  },
  school_talk: {
    title: "The Turtle's Story",
    pages: [`"**Long ago, the afternoon never ended,**" said the Mock Turtle.

"Every day, the same lesson. Nine to six. ...At six, **everything vanished.** The blackboard. Me. **Before vanishing, I could take one thing with me.**"

"I took my tears. ...I **can't remember** anything else."

The Gryphon was looking at the sea. "**At six, the numbers stop adding up**. ...Here, anyway."`],
    options: { back: { label: "Nod" } }
  },
  school_lesson: {
    title: "The Lesson",
    pages: [`The Mock Turtle wrote on the blackboard.

"Start from **seven**. **Subtract three.** **Double it.** **Divide by four.** ...Now, **what is it**?"

(Calculations have an order.)`],
    options: { l1: { label: "One" }, l2: { label: "Two" }, l3: { label: "Three" }, l4: { label: "Four" }, l7: { label: "Seven" }, no: { label: "Later" } }
  },
  school_lesson_wrong: {
    title: "Wrong Answer",
    pages: [`The Mock Turtle wept in great drops.

"...Wrong. ...But **making mistakes is not so bad**. I made plenty, once."

(In order. One at a time.)`],
    options: { back: { label: "Once more" } }
  },
  school_lesson_ok: {
    title: "Two",
    pages: [`Seven minus three, four. Doubled, eight. Divided by four, **two**.

"...Yes. Two. ...There were two of us, weren't there. ...No, never mind."

The Mock Turtle quietly erased the writing on the board.`],
    options: { on: { label: "Nod in silence" } }
  },
  school_dance: {
    title: "The Quadrille",
    pages: [`"**Five** of them," said the Gryphon, "dance in a single line. Named A, B, C, D, E."

"Their order is **fixed**."

"**E is last.**"

"**C is right behind B.**"

"**A is ahead of B.**"

"**D is not at the front.**"

"But **D is not next to C.**"

"Now line up. **Before the music stops.**"`],
    options: {
      d1: { label: "A → B → C → D → E" }, d2: { label: "A → D → B → C → E" },
      d3: { label: "D → A → B → C → E" }, d4: { label: "A → B → D → C → E" }, no: { label: "Later" }
    }
  },
  school_dance_wrong: {
    title: "Tangled Feet",
    pages: [`A lobster fell on his back. The five tangled in a heap.

"Did you check **every condition**?" asked the Gryphon.`],
    options: { back: { label: "Line up again" } }
  },
  school_dance_ok: {
    title: "A, D, B, C, E",
    pages: [`A, D, B, C, E.

The five advanced, retreated, and advanced again, in one neat line.

Nobody laughed. But **nobody cried**.`],
    options: { on: { label: "Bow" } }
  },
  school_hint: {
    title: "The Gryphon's Whisper",
    pages: [`The Gryphon took Alice behind a rock.

"You've solved both. ...Then **I'll tell you one thing.**"

"In court, **a poem will be read.** The King reads from the front. **The meaning doesn't matter.**"

"**A poem is read from its head.** ...The **first letter** of each line."

"That's all."`],
    options: { on: { label: "Thank him" } }
  },

  /* ───── chapter 9 ───── */
  maze: {
    title: "The Maze Gate",
    pages: [
      `At the edge of the garden stood a **hedge maze**.

At the entrance, two gateposts. On one, a carving of something in flight. On the other, a carving of something standing.

Wind and rain have worn the carvings almost smooth.`,
      `The hedge maze. The gateposts are as before.`,
      `Her body has shrunk. At the foot of the hedge is a hole just big enough for Alice.`,
      `Her body is big. The hedge comes **only to her knees.**`,
      `There are said to be six forks. **Take the wrong order, and you're sent back.**`
    ],
    options: {
      enter: { label: "Enter the maze" }, hole: { label: "Crawl through the hole at the foot of the hedge" },
      top: { label: "Look down on the maze from above" },
      eatR: { label: "Bite the red-capped mushroom", msg: "She shrank, all at once." },
      eatB: { label: "Bite the blue-capped mushroom", msg: "...Nothing happened." },
      eatW: { label: "Bite the white-capped mushroom", msg: "She grew and grew." },
      giveup: { label: "I don't want to walk any more. Lean against the hedge" },
      back: { label: "Back to the garden" }
    }
  },
  maze_top: {
    title: "The Maze From Above",
    pages: [`The hedge only reaches her knees. She can see the whole maze.

At each fork stands an arch with a carving. **Wing**, or **ear**.

The arches on the **right path** at the six forks, in order:

**Wing, wing, ear, wing, ear, ear.**

(Alice repeated it in her head **twice**. ...Three times would be unnecessary.)`],
    options: { on: { label: "Enter the maze" } }
  },
  maze_wrong: {
    title: "Dead End",
    pages: [`A dead end.

Retracing her steps, **she lost track of the way she'd come**. She found herself again before the gateposts.

(From the beginning.)`],
    options: { back: { label: "Back to the entrance" } }
  },
  m1: {
    title: "First Fork",
    pages: [`The first fork.

On the left arch, a carving of an **ear**. On the right arch, a carving of a **wing**.`],
    options: { ear: { label: "The arch carved with an ear" }, wing: { label: "The arch carved with a wing" }, back: { label: "Back to the entrance" } }
  },
  m2: {
    title: "Second Fork",
    pages: [`The second fork.

On the left arch, a **wing**. On the right arch, an **ear**.`],
    options: { wing: { label: "The arch carved with a wing" }, ear: { label: "The arch carved with an ear" } }
  },
  m3: {
    title: "Third Fork",
    pages: [`The third fork.

On the left arch, an **ear**. On the right arch, a **wing**.`],
    options: { ear: { label: "The arch carved with an ear" }, wing: { label: "The arch carved with a wing" } }
  },
  m4: {
    title: "Fourth Fork",
    pages: [`The fourth fork.

On the left arch, a **wing**. On the right arch, an **ear**.`],
    options: { ear: { label: "The arch carved with an ear" }, wing: { label: "The arch carved with a wing" } }
  },
  m5: {
    title: "Fifth Fork",
    pages: [`The fifth fork.

On the left arch, a **wing**. On the right arch, an **ear**.`],
    options: { wing: { label: "The arch carved with a wing" }, ear: { label: "The arch carved with an ear" } }
  },
  m6: {
    title: "Sixth Fork",
    pages: [`The sixth fork.

On the left arch, an **ear**. On the right arch, a **wing**.`],
    options: { ear: { label: "The arch carved with an ear" }, wing: { label: "The arch carved with a wing" } }
  },
  maze_center: {
    title: "The Heart of the Maze",
    pages: [
      `The center of the maze was a small plaza.

A dry fountain. Beyond it, in the hedge wall, **a rusted iron door**.

The door has **a keyhole**.`,
      `The center of the maze. The fountain is still dry. The iron door is open.`
    ],
    options: {
      door: { label: "Put the key in the keyhole", locked: "The door doesn't budge. It seems to want a key." },
      again: { label: "Go through the door" }, out: { label: "Leave the maze" }
    }
  },
  secret_garden: {
    title: "The Secret Garden",
    pages: [
      `Beyond the door was **a small garden**.

White roses. Not painted. A single bench.

On the bench lay **a white envelope**, addressed to **Alice**.

The seal was already broken.`,
      `A small garden. White roses. A bench.`
    ],
    options: { read: { label: "Open the envelope" }, stay: { label: "Sit on the bench" }, out: { label: "Leave the garden" } }
  },
  secret_letter: {
    title: "Lina's Letter",
    pages: [`**Dear Alice,**

If you are reading this, you must still be inside that afternoon.

You didn't **forget** our six o'clock. You just couldn't make it. Those are different things.

I'm not angry. **I only got tired of waiting, and started walking ahead.**

So please.

**Don't make six o'clock your punishment.**

— Lina

P.S. **Doubting numbers is a good habit.** But **the numbers you wrote with your own hand — doubt those most, to the very end.**`],
    options: { on: { label: "Tuck the letter against your chest" } }
  }
});
