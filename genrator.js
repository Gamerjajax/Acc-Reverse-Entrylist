const fs = require("fs");
const prompts = require("prompts");

const CAR_MODELS = [
  "Porsche 991 GT3 R", "Mercedes-AMG GT3", "Ferrari 488 GT3", "Audi R8 LMS",
  "Lamborghini Huracan GT3", "McLaren 650S GT3", "Nissan GT-R Nismo GT3 2018",
  "BMW M6 GT3", "Bentley Continental GT3 2018", "Porsche 991II GT3 Cup",
  "Nissan GT-R Nismo GT3 2017", "Bentley Continental GT3 2016",
  "Aston Martin V12 Vantage GT3", "Lamborghini Gallardo R-EX", "Jaguar G3",
  "Lexus RC F GT3", "Lamborghini Huracan Evo (2019)", "Honda NSX GT3",
  "Lamborghini Huracan SuperTrofeo", "Audi R8 LMS Evo (2019)", "AMR V8 Vantage (2019)",
  "Honda NSX Evo (2019)", "McLaren 720S GT3 (2019)", "Porsche 911II GT3 R (2019)",
  "Ferrari 488 GT3 Evo 2020", "Mercedes-AMG GT3 2020", "Ferrari 488 Challenge Evo",
  "BMW M2 CS Racing", "Porsche 911 GT3 Cup (Type 992)", "Lamborghini Huracán Super Trofeo EVO2",
  "BMW M4 GT3", "Audi R8 LMS GT3 evo II", "Ferrari 296 GT3", "Lamborghini Huracan Evo2",
  "Porsche 992 GT3 R", "McLaren 720S GT3 Evo 2023", "Ford Mustang GT3",
  "Alpine A110 GT4", "AMR V8 Vantage GT4", "Audi R8 LMS GT4", "BMW M4 GT4",
  "Chevrolet Camaro GT4", "Ginetta G55 GT4", "KTM X-Bow GT4", "Maserati MC GT4",
  "McLaren 570S GT4", "Mercedes-AMG GT4", "Porsche 718 Cayman GT4",
  "Audi R8 LMS GT2", "KTM XBOW GT2", "Maserati MC20 GT2", "Mercedes AMG GT2",
  "Porsche 911 GT2 RS CS Evo", "Porsche 935"
];



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
function createEntryFromLeaderLine(
  line,
  gridPosition,
  forceRaceNumber,
  forceCarModel,
  globalCarModelIndex = undefined,
  individualCarModelIndex = undefined
) {
  // Prioritization:
  // 1. Globally forced car model (if set and not -1)
  // 2. Individual car model (if set and not -1)
  // 3. If forceCarModel is true, take car model from qualifying
  // 4. Otherwise -1 (no forced car model)

  const forcedModel =
    globalCarModelIndex !== undefined && globalCarModelIndex !== -1
      ? globalCarModelIndex
      : individualCarModelIndex !== undefined && individualCarModelIndex !== -1
        ? individualCarModelIndex
        : forceCarModel
          ? line.car.carModel || -1
          : -1;

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
    forcedCarModel: forcedModel,
    overrideDriverInfo: 0,
    customCar: "",
    overrideCarModelForCustomCar: 0,
    isServerAdmin: 0,
    defaultGridPosition: gridPosition,
    ballastKg: 0,
    restrictor: 0,
    TeamName: line.car.teamName || "",
  };
}

// Grid-Varianten
async function applyGridStrategy(leaders, strategy) {
  switch (strategy) {
    case "reverse":
      return [...leaders].map(driver => ({ ...driver })).reverse();

    case "customreverse":
      const countResponse = await prompts({
        type: "number",
        name: "reverseCount",
        message: `Wie viele Fahrer sollen reversed werden? (Max: ${leaders.length})`,
        initial: 8,
        validate: (val) =>
          val >= 1 && val <= leaders.length
            ? true
            : `Bitte eine Zahl zwischen 1 und ${leaders.length} eingeben`,
      });

      if (!countResponse.reverseCount) process.exit(0);

      const { moveToEnd } = await prompts({
        type: "confirm",
        name: "moveToEnd",
        message: "Sollen die reversed Fahrer ans Ende der Liste verschoben werden?",
        initial: false,
      });

      const topN = leaders.slice(0, countResponse.reverseCount).map(d => ({ ...d })).reverse();
      const rest = leaders.slice(countResponse.reverseCount).map(d => ({ ...d }));

      if (moveToEnd) {
        return [...rest, ...topN];
      } else {
        return [...topN, ...rest];
      }

    case "random":
      return [...leaders].map(d => ({ ...d })).sort(() => Math.random() - 0.5);

    case "normal":
    default:
      return [...leaders].map(d => ({ ...d }));
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

// Vergleichsanzeige zwischen Qualifying und finalem Grid
function displayComparison(originalLeaders, finalLeaders) {
  // Spaltenbezeichnungen
  const headers = [
    "Quali Pos",
    "Fahrer",
    "Rennnummer",
    "Teamname",
    "Quali Car",
    "Grid Car",
    "Änderung",
  ];

  // Hilfsfunktion Modellname holen
  const getModelName = (index) => {
    if (index === undefined || index === -1 || index === null) return "-";
    return CAR_MODELS[index] || `Modell ${index}`;
  };

  // Mapping für Positionen und Fahrzeuge im finalen Grid
  const finalPositions = new Map();
  finalLeaders.forEach((driver, idx) => {
    const playerId = driver.car.drivers[0].playerId;
    finalPositions.set(playerId, { pos: idx + 1, forcedCarModel: driver.forcedCarModel });
  });

  // Alle Daten sammeln für Berechnung der maximalen Spaltenbreite
  const rows = originalLeaders.map((driver, idx) => {
    const qualyPos = (idx + 1).toString();
    const playerId = driver.car.drivers[0].playerId;
    const name = `${driver.car.drivers[0].firstName} ${driver.car.drivers[0].lastName}`.trim();
    const raceNumber = driver.car.raceNumber.toString();
    const teamName = driver.car.teamName || "-";
    const gridInfo = finalPositions.get(playerId) || {};
    const gridPos = gridInfo.pos ? gridInfo.pos.toString() : "-";
    const qualyCarModel = driver.car.carModel ?? -1;
    const gridCarModel = gridInfo.forcedCarModel ?? -1;
    const qualyCarName = getModelName(qualyCarModel);
    const gridCarName = getModelName(gridCarModel);
    const change = gridPos === "-" ? 0 : parseInt(gridPos, 10) - parseInt(qualyPos, 10);

    let changeStr = "";
    if (change > 0) changeStr = `↓ ${change}`;
    else if (change < 0) changeStr = `↑ ${Math.abs(change)}`;
    else changeStr = "→ 0";

    return [
      qualyPos,
      name,
      raceNumber,
      teamName,
      qualyCarName,
      gridCarName,
      changeStr,
    ];
  });

  // Maximalbreite je Spalte ausrechnen (inkl. Header)
  const colWidths = headers.map((h, i) => {
    const maxCol = Math.max(
      h.length,
      ...rows.map((row) => (row[i] ? row[i].length : 0))
    );
    return maxCol;
  });

  // Hilfsfunktion: Trennerzeile erzeugen
  const createSeparator = (left, middle, right) =>
    left +
    colWidths.map((w) => "═".repeat(w + 2)).join(middle) +
    right;

  // Hilfsfunktion: eine Zeile formatieren
  const formatRow = (row) =>
    "║ " +
    row
      .map((cell, i) => {
        const padSize = colWidths[i] - (cell ? cell.length : 0);
        return (cell || "").padEnd(colWidths[i]) + " ";
      })
      .join("║ ") +
    "║";

  // Tabelle ausgeben
  console.log("\n" + createSeparator("╔", "╦", "╗"));
  console.log(formatRow(headers));
  console.log(createSeparator("╠", "╬", "╣"));
  rows.forEach((row) => {
    console.log(formatRow(row));
  });
  console.log(createSeparator("╚", "╩", "╝") + "\n");
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

function removeDuplicateDriversByBestPosition(leaders) {
  const seen = new Map();

  leaders.forEach((leader, index) => {
    const playerId = leader.car.drivers[0].playerId;
    if (!seen.has(playerId)) {
      seen.set(playerId, { leader, index });
    } else {
      const current = seen.get(playerId);
      if (index < current.index) {
        seen.set(playerId, { leader, index });
      }
    }
  });

  const uniqueLeaders = Array.from(seen.values())
    .sort((a, b) => a.index - b.index)
    .map(item => item.leader);

  return uniqueLeaders;
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
  let originalLeaders = qualyJson.sessionResult?.leaderBoardLines || [];

  if (originalLeaders.length === 0) {
    console.error("❌ Keine Fahrer in Quali-Ergebnissen gefunden.");
    process.exit(1);
  }

  console.log(`✓ ${originalLeaders.length} Fahrer gefunden\n`);

  originalLeaders = removeDuplicateDriversByBestPosition(originalLeaders);
  
  console.log(`✓ Duplikate entfernt, jetzt ${originalLeaders.length} eindeutige Fahrer`);

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

  let leaders = await applyGridStrategy(originalLeaders, strategy);
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
  console.log("=== Force-Optionen ===");

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

  const { forceSpecificCar } = await prompts({
    type: "confirm",
    name: "forceSpecificCar",
    message: "Möchtest du ein Fahrzeugmodell für alle Fahrer global erzwingen?",
    initial: false,
  });

  let globalCarModelIndex = -1;
  if (forceSpecificCar) {
    const { selectedCar } = await prompts({
      type: "select",
      name: "selectedCar",
      message: "Wähle das Fahrzeugmodell, das du für alle Fahrer erzwingen möchtest:",
      choices: CAR_MODELS.map((model, index) => ({ title: model, value: index })),
    });
    globalCarModelIndex = selectedCar;

    // globalCarModelIndex auf alle Fahrer verteilen
    for (let i = 0; i < leaders.length; i++) {
      leaders[i].forcedCarModel = globalCarModelIndex;
    }
  }

  if (!forceSpecificCar) {
    // Optional: für jeden Fahrer individuell das Modell setzen
    for (let i = 0; i < leaders.length; i++) {
      const driverName = `${leaders[i].car.drivers[0].firstName} ${leaders[i].car.drivers[0].lastName}`;
      const { individualCarModelIndex } = await prompts({
        type: "select",
        name: "individualCarModelIndex",
        message: `Welches Fahrzeugmodell für Fahrer ${driverName} (Rennnummer: ${leaders[i].car.raceNumber})?`,
        choices: [{ title: "Nicht erzwingen (-1)", value: -1 }].concat(
          CAR_MODELS.map((model, index) => ({ title: model, value: index }))
        ),
      });
      leaders[i].forcedCarModel = individualCarModelIndex;
    }
  }

  // Dateiname für Ausgabe
  const { filename } = await prompts({
    type: "text",
    name: "filename",
    message: "Wie soll die Entrylist-Datei heißen?",
    initial: "entrylist.json",
    validate: (val) => (val.endsWith(".json") ? true : "Dateiname muss mit .json enden"),
  });

  if (!filename) process.exit(0);

  // Entrylist erstellen und speichern mit korrekten Grid-Positionen (1-basiert)
  const newEntryList = {
    entries: leaders.map((leader, index) =>
      createEntryFromLeaderLine(
        leader,
        index + 1,
        forceRaceNumber,
        forceCarModel,
        globalCarModelIndex,
        leader.forcedCarModel
      )
    ),
    forceEntryList: 0,
  };


  writeUtf16Bom(filename, JSON.stringify(newEntryList, null, 2));

  // Display comparison
  displayComparison(originalLeaders, leaders);

  console.log("\n✓ Entrylist erfolgreich erstellt!");
  console.log(`  - Rennnummern: ${forceRaceNumber ? "Aus Qualifying übernommen" : "Nicht forciert (-1)"}`);
  console.log(`  - Fahrzeugmodelle: ${forceCarModel ? "Aus Qualifying übernommen" : "Nicht forciert (-1)"}`);
  console.log(`  - Grid-Positionen: 1-${leaders.length} (basierend auf finaler Reihenfolge)`);

}

main().catch((err) => {
  console.error("❌ Fehler:", err);
  process.exit(1);
});
