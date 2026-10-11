type TimeLogBubble = { cell: "arr" | "start" | "lunch" | "back" | "out"; time: string; text: string; desktopOnly?: boolean };

const timeLogBubbles: TimeLogBubble[] = [
  { cell: "arr", time: "7:21", text: "Arrived 7:21", desktopOnly: true },
  { cell: "start", time: "7:23", text: "Login 7:23" },
  { cell: "lunch", time: "12:04", text: "Lunch out 12:04" },
  { cell: "back", time: "12:47", text: "Back 12:47" },
  { cell: "out", time: "15:00", text: "Out 3:00" },
];

/** Mock UI text drawn inside scenes. Scenes are aria-hidden illustrations, but their words still follow
 *  the copy rules, so they live here and tests/content-rules.test.ts scans them. */
export const sceneText = {
  pos: { peso: "₱", sackLabel: "FEEDS", sackWeight: "50 KG" },
  timeLog: {
    backed: "Backed up",
    title: "Timesheet: A. Santos",
    head: ["Day", "Arrival", "Start", "Break", "In", "Lunch", "In", "Finish", "Total"],
    week: [
      ["Mon", "6:55", "6:58", "9:30", "9:45", "12:00", "12:41", "3:00", "7:21"],
      ["Tue", "7:02", "7:04", "9:41", "9:55", "12:10", "12:52", "3:04", "7:18"],
      ["Wed", "6:57", "7:00", "", "", "11:58", "12:40", "3:00", "7:18"],
      ["Thu", "7:05", "7:06", "9:35", "9:50", "12:05", "12:48", "3:02", "7:13"],
    ],
    friday: { day: "Fri", arr: "7:21", start: "7:23", lunch: "12:04", back: "12:47", out: "3:00", total: "6:54" },
    tabs: ["Week 40", "Week 41"],
    readBack: "Read-back OK",
    avatar: "A",
    bubbles: timeLogBubbles,
  },
};
