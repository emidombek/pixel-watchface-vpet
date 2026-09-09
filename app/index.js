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
const SPECIES_ALWAYS_ROLL = ["bloom","volt","stone"];
// egg has no eat art yet - falls back to idle instead
const STAGES_WITHOUT_EAT = [0];

const STATE_FILE = "pet-data.json";

const timeText = document.getElementById("timeText");
const stepsText = document.getElementById("stepsText");
const treatsText = document.getElementById("treatsText");
const goalBadge = document.getElementById("goalBadge");
const backgroundImage = document.getElementById("background");
const petImage = document.getElementById("petImage");
const staticOverlay = document.getElementById("staticOverlay");

function util_zeroPad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

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

function resetToNewEgg() {
  if (!state.speciesDeck || state.speciesDeck.length === 0) {
    const deck = shuffled(SPECIES_LIST);
    if (deck[deck.length - 1] === state.species) {
      const swapIndex = Math.floor(Math.random() * (deck.length - 1));
      const last = deck[deck.length - 1];
      deck[deck.length - 1] = deck[swapIndex];
      deck[swapIndex] = last;
    }
    state.speciesDeck = deck;
  }
  state.species = state.speciesDeck.pop();
  state.stageIndex = 0;
  state.daysAtGoal = 0;
}

function checkDailyReset() {
  const currentToday = todayKey();
  if (state.lastDate !== currentToday) {
    if (state.lastDate !== "") {
      // Only increment daysAtGoal if the pet is fully grown (Adult) AND reached goal yesterday
      if (state.stageIndex === STAGE_NAMES.length - 1 && state.awardedToday) {
        state.daysAtGoal += 1;
        // If it's been an adult at goal for 3 days, reset to a new egg
        if (state.daysAtGoal >= DAYS_TO_LINGER_AT_GOAL) {
          playEvolutionTransition(() => {
            resetToNewEgg();
          });
        }
      }
    }
    // Daily maintenance resets (allows step goals & treat earning for the new day)
    state.lastDate = currentToday;
    state.awardedToday = false;
    state.lastSteps = 0;
    saveState(state);
  }
}

function maybeAwardTreat(steps) {
  if (steps >= STEP_GOAL && !state.awardedToday) {
    state.treats += 1;
    state.awardedToday = true;
    state.eatTicksRemaining = EAT_TICKS_AFTER_TREAT;

    if (state.stageIndex < STAGE_NAMES.length - 1) {
      if (state.stageIndex === 0) {
        playHatchThenEvolve();
        return;
      }
      state.stageIndex += 1;
      if (state.stageIndex === STAGE_NAMES.length - 1) {
        state.daysAtGoal = 0;
      }
      playEvolutionTransition(() => {});
      return;
    }
    saveState(state);
  }
}

// the egg's transition uses its own hand-drawn hatch animation instead of
// the generic checker-static, since real art exists for this one moment
function playHatchThenEvolve() {
  transitioning = true;
  let toggles = 0;
  const maxToggles = 6;
  const timer = setInterval(() => {
    petImage.href = spriteHref(state.species, 0, "hatch", (toggles % 2) + 1);
    toggles += 1;
    if (toggles >= maxToggles) {
      clearInterval(timer);
      state.stageIndex = 1; // baby
      saveState(state);
      transitioning = false;
      render();
    }
  }, 200);
}

// classic vpet-style black/white static flicker, played with fast
// timers rather than clock ticks since it only runs for about a second.
// used for every transition except egg->baby, which has its own hatch art.
function playEvolutionTransition(mutateStateFn) {
  transitioning = true;
  let toggles = 0;
  const maxToggles = 8;
  const timer = setInterval(() => {
    const covered = toggles % 2 === 0;
    staticOverlay.style.opacity = covered ? 1 : 0;

    // swap the underlying state/art at the midpoint, while fully covered
    if (toggles === Math.floor(maxToggles / 2) && covered) {
      if (typeof mutateStateFn === "function") {
        mutateStateFn();
      }
      saveState(state);
    }

    toggles += 1;
    if (toggles >= maxToggles) {
      clearInterval(timer);
      staticOverlay.style.opacity = 0;
      transitioning = false;
      render();
    }
  }, 150);
}

function behaviorFor(now, stepDelta) {
  const hour = now.getHours();
  const isNight = hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;

  if (state.eatTicksRemaining > 0) return "eat";
  if (isNight && stepDelta < WALK_STEPS_PER_TICK) return "sleep";
  if (stepDelta >= RUN_STEPS_PER_TICK) return "run";
  if (stepDelta >= WALK_STEPS_PER_TICK) return "walk";
  return "idle";
}

function render() {
  if (transitioning) return;
  checkDailyReset();
  if (transitioning) return; // a transition may have just started above
  backgroundImage.href = `images/bg-${state.species}.png`;
  const now = new Date();
  let hours = now.getHours();
  if (preferences.clockDisplay === "12h") {
    hours = hours % 12 || 12;
  }
  timeText.text = `${hours}:${util_zeroPad(now.getMinutes())}`;

  const steps = today.adjusted.steps || 0;
  const stepDelta = steps - (state.lastSteps || 0);
  state.lastSteps = steps;
  stepsText.text = `${steps}`;

  maybeAwardTreat(steps);
  if (transitioning) return; // a treat may have just triggered an evolution

  treatsText.text = `${state.treats}`;

  if (state.eatTicksRemaining > 0) {
    state.eatTicksRemaining -= 1;
  }

  // "run" reuses the walk/roll art, just flips frames faster (see maybeRunFastAnim)
  let behavior = behaviorFor(now, stepDelta);
  if (behavior === "eat" && STAGES_WITHOUT_EAT.indexOf(state.stageIndex) !== -1) {
    behavior = "idle";
  }
  const moveBehavior = moveBehaviorFor(state.species, state.stageIndex);
  const artBehavior = behavior === "run" || behavior === "walk" ? moveBehavior : behavior;

  state.frameToggle = state.frameToggle === 0 ? 1 : 0;
  const frame = state.frameToggle + 1; // 1 or 2

  petImage.href = spriteHref(state.species, state.stageIndex, artBehavior, frame);

  if (steps >= STEP_GOAL && state.treats > 0) {
    goalBadge.text = "Goal reached - treat earned";
  } else if (state.stageIndex === STAGE_NAMES.length - 1) {
    goalBadge.text = `Full grown - day ${state.daysAtGoal + 1}/${DAYS_TO_LINGER_AT_GOAL}`;
  } else {
    goalBadge.text = "";
  }

  saveState(state);
  maybeRunFastAnim(behavior);
}

// briefly flip frames faster than once-per-minute so walking/running reads
// as motion rather than a static pose - runs for a short burst only, to
// keep the always-on battery cost low.
let fastAnimTimer = null;

function maybeRunFastAnim(behavior) {
  if (fastAnimTimer) {
    clearInterval(fastAnimTimer);
    fastAnimTimer = null;
  }
  if (behavior !== "walk" && behavior !== "run") return;

  const speedMs = behavior === "run" ? 220 : 450;
  const moveBehavior = moveBehaviorFor(state.species, state.stageIndex);
  let ticks = 0;
  const maxTicks = 10; // roughly a few seconds of motion, then settle

  fastAnimTimer = setInterval(() => {
    if (transitioning) return;
    state.frameToggle = state.frameToggle === 0 ? 1 : 0;
    petImage.href = spriteHref(state.species, state.stageIndex, moveBehavior, state.frameToggle + 1);
    ticks += 1;
    if (ticks >= maxTicks) {
      clearInterval(fastAnimTimer);
      fastAnimTimer = null;
    }
  }, speedMs);
}

clock.ontick = render;
render();







