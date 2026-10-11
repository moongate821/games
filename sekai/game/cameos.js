/* 特別なキャラクターの出番。ふだんは出さない。ヒントは遠まわしに。 */
window.GAME.cameos = {
  gap: 3,
  list: [
    { id: "fin_true", group: ["yuzuki", "yui", "eve", "aira", "regulus", "asteru"], scenes: ["e_true"], kinds: ["true"], always: true, kind: "cheer", lines: ["何度失っても、また会いに行く。"] },
    { id: "fin_happy_yuzuki", p: "yuzuki", name: "結月", kinds: ["happy"], chance: 0.35, kind: "cheer", lines: ["探してくれて、ありがとう。", "約束、守ってくれたね。"] },
    { id: "fin_happy_yui", p: "yui", name: "ユイ", kinds: ["happy"], chance: 0.3, kind: "cheer", lines: ["もう、ひとりじゃない。"] },
    { id: "b_guardian", p: "guardian", name: "防衛機構", scenes: ["b_guard"], kinds: ["bad"], always: true, kind: "sad", lines: ["『……排除対象、確認』"] },
    { id: "bad_any", p: "oldman", name: "旅の老人", kinds: ["bad", "stuck"], chance: 0.75, kind: "sad", lines: ["おや。ひとつ前の道まで、戻ってみるかい。", "旅は、まだ、続くよ。"] },
    { id: "loop_any", p: "yui", name: "ユイ", kinds: ["loop"], chance: 0.8, kind: "sad", lines: ["……ぐるぐる、まわってる。"] },
    { id: "h_loss", p: "yuzuki", name: "結月", scenes: ["loss"], when: "!has:diary", chance: 0.6, kind: "hint", lines: ["(遠くから)……机の上の、日記を、見てあげて。"] },
    { id: "h_ruins", p: "yui", name: "ユイ", scenes: ["ruins"], when: "!flag:yui && visits:ruins>=2", chance: 0.6, kind: "hint", lines: ["(光の向こうから)……こたえて。お願い。"] },
    { id: "h_mountain", p: "oldman", name: "旅の老人", scenes: ["mountain"], when: "!has:compass", chance: 0.6, kind: "hint", lines: ["荷袋の中の、銀色のものを、持っていきなさい。"] },
    { id: "h_obs2", p: "yuzuki", name: "結月", scenes: ["obs2"], when: "!has:hairpin", chance: 0.6, kind: "hint", lines: ["(光の中で)……小さな花の、髪飾り。"] },
    { id: "c_yuzuki", p: "yuzuki", name: "結月", zone: "mura", chance: 0.1, kind: "chat", lines: ["流れ星、また見たいな。"] },
    { id: "c_oldman", p: "oldman", name: "旅の老人", zone: "tabi", chance: 0.08, kind: "chat", lines: ["〜♪(笛)"] },
    { id: "c_aira", p: "aira", name: "アイラ", zone: "seikai", chance: 0.08, kind: "chat", lines: ["星海は、とても、広いんです。"] }
  ]
};
