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