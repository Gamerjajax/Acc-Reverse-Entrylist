const fs = require("fs");
const prompts = require("prompts");

// Hilfsfunktion für UTF-16 LE BOM schreiben
function writeUtf16Bom(filename, jsonContent) {
  const bom = Buffer.from([0xff, 0xfe]);
  const buf = Buffer.from(jsonContent, "utf16le");
  fs.writeFileSync(filename, Buffer.concat([bom, buf]));
  console.log(`✓ Datei gespeichert: ${filename}`);
}

// Qualifying-Datei mit Endung Q.json finden
function findQualifyingFile() {
  const files = fs.readdirSync(".");
  return files.find((f) => f.endsWith("Q.json"));
}

// Robustes Einlesen (UTF-16 LE bevorzugt)
function readJsonFileWithFallback(filename) {
  const encodings = ["utf16le", "utf8", "latin1", "ascii"];

  for (const encoding of encodings) {
    try {
      let buffer = fs.readFileSync(filename);

      // BOM erkennen und behandeln
      if (buffer[0] === 0xff && buffer[1] === 0xfe) {
        buffer = buffer.slice(2);
        const content = buffer.toString("utf16le").trim();
        return JSON.parse(content);
      } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
        buffer = buffer.slice(2);
        const content = buffer.toString("utf16be").trim();
        return JSON.parse(content);
      } else if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
        buffer = buffer.slice(3);
        const content = buffer.toString("utf8").trim();
        return JSON.parse(content);
      }

      let content = buffer.toString(encoding).trim();
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }

      return JSON.parse(content);
    } catch (e) {
      continue;
    }
  }

  console.error("❌ Konnte Datei mit keinem Encoding erfolgreich parsen!");
  process.exit(1);
}

// Erstellen eines Entry aus Qualifying LeaderLine
function createEntryFromLeaderLine(line, forceRaceNumber, forceCarModel) {
  return {
    drivers: line.car.drivers.map((driver) => ({
      playerID: driver.playerId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      shortName: driver.shortName,
      driverCategory: 0,
      cupCategory: line.car.cupCategory || 0,
      nationality: driver.nationality || 0,
    })),
    raceNumber: forceRaceNumber ? line.car.raceNumber || -1 : -1,
    forcedCarModel: forceCarModel ? line.car.carModel || -1 : -1,
    overrideDriverInfo: 0,
    customCar: "",
    overrideCarModelForCustomCar: 0,
    isServerAdmin: 0,
    defaultGridPosition: 0,
    ballastKg: 0,
    restrictor: 0,
    TeamName: line.car.teamName || "",
  };
}

// Grid-Varianten
async function applyGridStrategy(leaders, strategy) {
  switch (strategy) {
    case "reverse":
      return [...leaders].reverse();

    case "customreverse":
      const response = await prompts({
        type: "number",
        name: "reverseCount",
        message: `Wie viele Fahrer sollen reversed werden? (Max: ${leaders.length})`,
        initial: 8,
        validate: (val) =>
          val >= 1 && val <= leaders.length
            ? true
            : `Bitte eine Zahl zwischen 1 und ${leaders.length} eingeben`,
      });

      if (!response.reverseCount) process.exit(0);

      const topN = leaders.slice(0, response.reverseCount).reverse();
      const rest = leaders.slice(response.reverseCount);
      return [...topN, ...rest];

    case "random":
      return [...leaders].sort(() => Math.random() - 0.5);

    case "normal":
    default:
      return [...leaders];
  }
}

// Fahrer anzeigen mit Position
function displayDrivers(drivers) {
  console.log("\n=== Aktuelle Grid-Reihenfolge ===");
  drivers.forEach((driver, idx) => {
    const name = `${driver.car.drivers[0].firstName} ${driver.car.drivers[0].lastName}`;
    console.log(`${idx + 1}. #${driver.car.raceNumber} - ${name}`);
  });
  console.log("");
}

// Manuelle Bearbeitung
async function manualEdit(drivers) {
  while (true) {
    displayDrivers(drivers);

    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "Was möchtest du tun?",
      choices: [
        { title: "Fahrer tauschen", value: "swap" },
        { title: "Fahrer verschieben", value: "move" },
        { title: "Fertig - Speichern", value: "done" },
      ],
    });

    if (!action || action === "done") break;

    if (action === "swap") {
      const answers = await prompts([
        {
          type: "number",
          name: "pos1",
          message: "Position 1 (zum Tauschen):",
          validate: (val) => (val > 0 && val <= drivers.length ? true : "Ungültige Position"),
        },
        {
          type: "number",
          name: "pos2",
          message: "Position 2 (zum Tauschen):",
          validate: (val) => (val > 0 && val <= drivers.length ? true : "Ungültige Position"),
        },
      ]);

      if (!answers.pos1 || !answers.pos2) continue;

      [drivers[answers.pos1 - 1], drivers[answers.pos2 - 1]] = [
        drivers[answers.pos2 - 1],
        drivers[answers.pos1 - 1],
      ];
      console.log(`✓ Fahrer auf Position ${answers.pos1} und ${answers.pos2} getauscht`);
    }

    if (action === "move") {
      const answers = await prompts([
        {
          type: "number",
          name: "from",
          message: "Von Position:",
          validate: (val) => (val > 0 && val <= drivers.length ? true : "Ungültige Position"),
        },
        {
          type: "number",
          name: "to",
          message: "Nach Position:",
          validate: (val) => (val > 0 && val <= drivers.length ? true : "Ungültige Position"),
        },
      ]);

      if (!answers.from || !answers.to) continue;

      const driver = drivers.splice(answers.from - 1, 1)[0];
      drivers.splice(answers.to - 1, 0, driver);
      console.log(`✓ Fahrer von Position ${answers.from} nach ${answers.to} verschoben`);
    }
  }

  return drivers;
}

// Hauptprogramm
async function main() {
  console.log("=== ACC Entrylist Generator ===\n");

  const qualyFile = findQualifyingFile();

  if (!qualyFile) {
    console.error("❌ Keine Qualifying-Datei mit 'Q.json'-Endung gefunden.");
    process.exit(1);
  }

  console.log(`✓ Qualifying-Datei gefunden: ${qualyFile}`);

  const qualyJson = readJsonFileWithFallback(qualyFile);
  let leaders = qualyJson.sessionResult?.leaderBoardLines || [];

  if (leaders.length === 0) {
    console.error("❌ Keine Fahrer in Quali-Ergebnissen gefunden.");
    process.exit(1);
  }

  console.log(`✓ ${leaders.length} Fahrer gefunden\n`);

  // Grid-Strategie wählen
  const { strategy } = await prompts({
    type: "select",
    name: "strategy",
    message: "Welche Grid-Strategie möchtest du anwenden?",
    choices: [
      { title: "Normal (Qualifying-Reihenfolge)", value: "normal" },
      { title: "Reverse Grid (komplett umgedreht)", value: "reverse" },
      { title: "Custom Reverse (wählbare Anzahl)", value: "customreverse" },
      { title: "Random Grid (zufällig)", value: "random" },
    ],
  });

  if (!strategy) process.exit(0);

  leaders = await applyGridStrategy(leaders, strategy);
  console.log(`✓ Strategie angewendet`);

  // Manuelle Bearbeitung
  const { wantEdit } = await prompts({
    type: "confirm",
    name: "wantEdit",
    message: "Möchtest du die Grid-Reihenfolge manuell bearbeiten?",
    initial: false,
  });

  if (wantEdit) {
    leaders = await manualEdit(leaders);
  }

  // Force-Optionen
  console.log("\n=== Force-Optionen ===");
  
  const { forceRaceNumber } = await prompts({
    type: "confirm",
    name: "forceRaceNumber",
    message: "Sollen die Rennnummern aus dem Qualifying übernommen werden?",
    initial: true,
  });

  const { forceCarModel } = await prompts({
    type: "confirm",
    name: "forceCarModel",
    message: "Sollen die Fahrzeugmodelle aus dem Qualifying übernommen werden?",
    initial: false,
  });

  // Dateiname für Ausgabe
  const { filename } = await prompts({
    type: "text",
    name: "filename",
    message: "Wie soll die Entrylist-Datei heißen?",
    initial: "entrylist.json",
    validate: (val) => (val.endsWith(".json") ? true : "Dateiname muss mit .json enden"),
  });

  if (!filename) process.exit(0);

  // Entrylist erstellen und speichern
  const newEntryList = {
    entries: leaders.map((leader) => 
      createEntryFromLeaderLine(leader, forceRaceNumber, forceCarModel)
    ),
    forceEntryList: 0,
  };

  writeUtf16Bom(filename, JSON.stringify(newEntryList, null, 2));
  
  console.log("\n✓ Entrylist erfolgreich erstellt!");
  console.log(`  - Rennnummern: ${forceRaceNumber ? "Aus Qualifying übernommen" : "Nicht forciert (-1)"}`);
  console.log(`  - Fahrzeugmodelle: ${forceCarModel ? "Aus Qualifying übernommen" : "Nicht forciert (-1)"}`);
}

main().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});
