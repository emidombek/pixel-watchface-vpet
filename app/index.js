import clock from "clock";
import { today } from "user-activity";
import { preferences } from "user-settings";
import * as fs from "fs";
import document from "document";

clock.granularity = "minutes";
const STEP_GOAL = 8000;
const SPECIES_LIST = ["sprout", "ember", "aqua", "crystal", "shadow", "volt", "bloom", "stone"];
const STAGE_NAMES = ["egg", "baby", "teen", "adult"];
const DAYS_TO_LINGER_AT_GOAL = 3;

// behavior thresholds - steps gained since the last one-minute tick
const RUN_STEPS_PER_TICK = 130; // roughly a running pace over a minute
const WALK_STEPS_PER_TICK = 15;
const NIGHT_START_HOUR = 23;
const NIGHT_END_HOUR = 6;
const EAT_TICKS_AFTER_TREAT = 2; // how many one-minute ticks the eat pose shows for

// egg and baby are legless blobs (roll animation); teen and adult have
// legs (walk/run animation) - see resources/images naming
const MOVE_BEHAVIOR_BY_STAGE = ["roll", "roll", "walk", "walk"];
// species that roll at every stage regardless of stage/legs (a deliberate
// design choice for that species, not the legs-based default above)
const SPECIES_ALWAYS_ROLL = ["bloom"];
// egg has no eat art yet - falls back to idle instead
const STAGES_WITHOUT_EAT = [0];

const STATE_FILE = "pet-data.json";

const timeText = document.getElementById("timeText");
const stepsText = document.getElementById("stepsText");
const treatsText = document.getElementById("treatsText");
const goalBadge = document.getElementById("goalBadge");
const petImage = document.getElementById("petImage");
const staticOverlay = document.getElementById("staticOverlay");

function shuffled(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function loadState() {
  try {
    return fs.readFileSync(STATE_FILE, "json");
  } catch (e) {
    const deck = shuffled(SPECIES_LIST);
    return {
      species: deck.pop(),
      speciesDeck: deck,
      stageIndex: 0,
      treats: 0,
      daysAtGoal: 0,
      lastDate: "",
      awardedToday: false,
      lastSteps: 0,
      eatTicksRemaining: 0,
      frameToggle: 0,
    };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, state, "json");
}

let state = loadState();
let transitioning = false;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function moveBehaviorFor(species, stageIndex) {
  if (SPECIES_ALWAYS_ROLL.indexOf(species) !== -1) return "roll";
  return MOVE_BEHAVIOR_BY_STAGE[stageIndex];
}

function spriteHref(species, stageIndex, behavior, frame) {
  return `images/${species}-${STAGE_NAMES[stageIndex]}-${behavior}-${frame}.png`;
}









