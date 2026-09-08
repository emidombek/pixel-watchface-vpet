from PIL import Image
import os

OUT = "resources/images"
os.makedirs(OUT, exist_ok=True)

# 16x16 pixel grids. '.' = transparent, everything else is a palette key.
# A = main body, B = outline, C = species accent detail, H = highlight/shine, E = eye

EGG = [
"................",
"................",
".....BBBB.......",
"....BAAAAB......",
"...BAAAAAAB.....",
"...BAHAAAAB.....",
"..BAAAAAAAAB....",
"..BAAAAAACAB....",
"..BAAAAAAAAB....",
"..BAAAAAAAAB....",
"...BAAAAAAB.....",
"...BAAAAAAB.....",
"....BAAAAB......",
".....BBBB.......",
"................",
"................",
]

BABY = [
"................",
"................",
"...BBBBBBBB.....",
"..BAAAAAAAAB....",
".BAAEAAAAEAAB...",
".BAAAAAAAAAAB...",
".BAAAAAAAAAAB...",
".BAAAHAAAACAB...",
".BAAAAAAAAAAB...",
"..BAAAAAAAAB....",
"..BB.AAAA.BB....",
"...B.AAAA.B.....",
"....B....B......",
"................",
"................",
"................",
]

ACTIVE = [
"................",
".....BB..BB.....",
"....BAAB.BAAB...",
"...BAAAAAAAAAB..",
"..BAAEAAAAAAEAB.",
".BAAAAAAAAAAAAB.",
".BAAAAAHAAACAAB.",
".BAAAAAAAAAAAAB.",
".BAAAAAAAAAAAAB.",
"..BAAAAAAAAAAB..",
"..BB.AA..AA.BB..",
".BAB.AA..AA.BAB.",
"BAAB........BAAB",
"BB............BB",
"................",
"................",
]

GOAL = [
"...C........C..",
".....BB..BB.....",
"....BAAB.BAAB...",
"C..BAAAAAAAAAB.C",
"..BAAEAAAAAAEAB.",
".BAAAAAAAAAAAAB.",
".BAAAAAHHACCAAB.",
".BAAAAAHAAACAAB.",
".BAAAAAAAAAAAAB.",
"..BAAAAAAAAAAB..",
"..BB.AA..AA.BB..",
".BAB.AA..AA.BAB.",
"BAAB........BAAB",
"BB............BB",
".C............C.",
"...C........C..",
]

STAGES = {"egg": EGG, "baby": BABY, "teen": ACTIVE, "adult": GOAL}
BEHAVIORS = ["idle", "walk", "roll", "eat", "sleep"]

# species palettes, matching the earlier design ramps
SPECIES = {
    "sprout": {"A": (151, 196, 89, 255), "B": (39, 80, 10, 255), "C": (99, 153, 34, 255), "H": (234, 243, 222, 255), "E": (20, 20, 20, 255)},
    "ember":  {"A": (239, 159, 39, 255), "B": (99, 56, 6, 255),  "C": (186, 117, 23, 255), "H": (250, 238, 218, 255), "E": (20, 20, 20, 255)},
    "aqua":   {"A": (133, 183, 235, 255), "B": (12, 68, 124, 255), "C": (55, 138, 221, 255), "H": (230, 241, 251, 255), "E": (20, 20, 20, 255)},
    "crystal":{"A": (175, 169, 236, 255), "B": (38, 33, 92, 255), "C": (127, 119, 221, 255), "H": (238, 237, 254, 255), "E": (20, 20, 20, 255)},
    "shadow": {"A": (94, 84, 122, 255), "B": (18, 14, 30, 255), "C": (56, 48, 82, 255), "H": (196, 188, 219, 255), "E": (210, 60, 60, 255)},
    "volt":   {"A": (240, 219, 70, 255), "B": (128, 104, 8, 255), "C": (222, 179, 30, 255), "H": (252, 247, 210, 255), "E": (20, 20, 20, 255)},
    "bloom":  {"A": (236, 150, 190, 255), "B": (120, 40, 70, 255), "C": (222, 104, 155, 255), "H": (252, 228, 238, 255), "E": (20, 20, 20, 255)},
    "stone":  {"A": (168, 150, 122, 255), "B": (70, 58, 42, 255), "C": (132, 112, 84, 255), "H": (232, 222, 204, 255), "E": (20, 20, 20, 255)},
}

SCALE = 8  # 16px grid -> 128px final sprite

def render(grid, palette):
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch != ".":
                px[x, y] = palette[ch]
    return img.resize((16 * SCALE, 16 * SCALE), Image.NEAREST)

# Placeholders only: every stage currently uses the same base shape for all
# four behaviors (idle/walk/eat/sleep), with frame 2 just horizontally
# flipped so there's a visible difference to test animation timing against.
# Replace these once real per-behavior art exists - see README.
# Any file that already exists (real hand-drawn art, or a placeholder from a
# prior run) is left untouched - this only fills in genuinely missing files,
# so a species can be done one stage/behavior at a time without risk of an
# already-finished file getting clobbered by a later full run.
for species, palette in SPECIES.items():
    for stage, grid in STAGES.items():
        frame1 = render(grid, palette)
        frame2 = frame1.transpose(Image.FLIP_LEFT_RIGHT)
        for behavior in BEHAVIORS:
            for frame_num, frame_img in ((1, frame1), (2, frame2)):
                path = os.path.join(OUT, f"{species}-{stage}-{behavior}-{frame_num}.png")
                if not os.path.exists(path):
                    frame_img.save(path)
    # hatch is only ever used for the egg stage's treat-earned transition
    egg_frame1 = render(STAGES["egg"], palette)
    egg_frame2 = egg_frame1.transpose(Image.FLIP_LEFT_RIGHT)
    for frame_num, frame_img in ((1, egg_frame1), (2, egg_frame2)):
        path = os.path.join(OUT, f"{species}-egg-hatch-{frame_num}.png")
        if not os.path.exists(path):
            frame_img.save(path)

# also a simple app icon (sprout baby idle frame 1) at 80x80
icon = render(BABY, SPECIES["sprout"]).resize((80, 80), Image.NEAREST)
icon.save(os.path.join(OUT, "..", "icon.png"))

# checker-static overlay used for evolution transitions
checker = Image.new("RGBA", (128, 128), (0, 0, 0, 255))
cpx = checker.load()
tile = 16
for y in range(128):
    for x in range(128):
        cpx[x, y] = (245, 245, 245, 255) if ((x // tile) + (y // tile)) % 2 == 0 else (10, 10, 10, 255)
checker.save(os.path.join(OUT, "checker.png"))

# build a contact sheet preview of just the idle-1 frame for a quick look
# (8 species x 4 stages)
cell = 16 * SCALE
species_list = list(SPECIES.keys())
stage_list = list(STAGES.keys())
sheet = Image.new("RGBA", (cell * len(stage_list) + 30, cell * len(species_list) + 30), (30, 30, 30, 255))
for si, species in enumerate(species_list):
    for ti, stage in enumerate(stage_list):
        img = Image.open(os.path.join(OUT, f"{species}-{stage}-idle-1.png"))
        sheet.paste(img, (10 + ti * cell, 10 + si * cell), img)
sheet.save("sprite_sheet_preview.png")

print("done: placeholder sprites generated for", len(SPECIES), "species x", len(STAGES), "stages x", len(BEHAVIORS), "behaviors x 2 frames")