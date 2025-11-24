# ACC Reverse Entrylist Generator

Ein interaktiver Node.js-basierter Entrylist-Generator für Assetto Corsa Competizione (ACC), der verschiedene Grid-Strategien aus Qualifying-Ergebnissen erstellt.

## Features

### 🏁 Grid-Strategien
- **Normal Grid**: Qualifying-Reihenfolge beibehalten
- **Reverse Grid**: Komplett umgedrehte Startaufstellung
- **Custom Reverse**: Wählbare Anzahl von Fahrern reversed
  - Optional: Reversed Fahrer ans Ende der Liste verschieben
- **Random Grid**: Zufällige Startreihenfolge

### ⚙️ Konfigurationsoptionen
- **Rennnummern forcen**: Übernimmt die Startnummern aus dem Qualifying
- **Fahrzeugmodelle forcen**: Zwingt Fahrer, ihr Qualifying-Fahrzeug zu verwenden
- **Globales Fahrzeugmodell forcen**: Erlaube das Erzwingen eines einzigen Fahrzeugmodells für alle Fahrer
- **Manuelle Bearbeitung**: 
  - Fahrer tauschen
  - Fahrer verschieben
- **Grid-Positionen**: Automatische Zuweisung basierend auf finaler Reihenfolge, beginnend bei 1

### 📊 Vergleichsansicht
Zeigt eine übersichtliche Tabelle mit Qualifying vs. Race Grid Positionen inklusive Positionsänderungen und Fahrzeugmodellen (qualifiziert / final).

### ✨ Automatische Duplikatentfernung
- Mehrfacheinträge von Fahrern werden erkannt
- Nur der Eintrag mit der besten Startposition wird behalten

## Installation

1. Node.js installieren (v14 oder höher empfohlen)
2. Projekt herunterladen
3. Abhängigkeiten installieren:
    npm install prompts

## Verwendung

1. Lege die Qualifying-Ergebnisdatei mit der Endung `Q.json` im gleichen Verzeichnis ab
2. Führe das Programm aus:
    node ./generator.js
3. Folge den interaktiven Anweisungen im Terminal

## Workflow

1. Qualifying-Datei wird automatisch erkannt und eingelesen
2. Duplikate werden entfernt, nur beste Positionen bleiben
3. Auswahl der Grid-Strategie (Normal, Reverse, Custom Reverse, Random)
4. Optional: Manuelle Bearbeitung der Grid-Reihenfolge (Tauschen und Verschieben)
5. Anzeige einer detaillierten Vergleichstabelle Qualifying vs. Finales Grid inkl. Fahrzeugmodell
6. Force-Optionen:
- Rennnummern aus Qualifying übernehmen oder nicht
- Fahrzeugmodelle aus Qualifying übernehmen oder nicht
- Globales Fahrzeugmodell für alle Fahrer festlegen oder individuelle Fahrzeuge setzen
7. Eingabe des Dateinamens für die generierte Entrylist
8. Speichern der Entrylist im UTF-16 LE BOM-Format, kompatibel mit ACC

## Technische Details

- Unterstützt UTF-16 LE, UTF-8, Latin1, ASCII Encodings beim Einlesen, mit automatischer BOM-Erkennung
- Alle Objektinformationen werden beim Sortieren und Bearbeiten kopiert, damit keine Daten verloren gehen
- Dynamisch formatierte Tabellenübersicht mit sauberen und durchgehenden Linien für bessere Lesbarkeit
- Grid-Positionen sind 1-basiert entsprechend ACC-Standard

## Beispiel-Output

- Liste mit Fahrerdaten: PlayerID, Name, Nationalität
- Grid-Positionen beginnen bei 1
- Forcierte oder aus Qualifying übernommene Rennnummern
- Forcierte Fahrzeugmodelle global oder individuell pro Fahrer
- Teamnamen inklusive

## Anforderungen

- Node.js (v14 oder höher)
- npm package: `prompts`

## Hinweise

- Nur Dateien mit `Q.json` Endung werden akzeptiert
- Verwende `-1` für nicht forcierte Rennnummern oder Fahrzeugmodelle
- Die Tabelle zeigt Positionen, Fahrzeuge und Änderungen übersichtlich an

## Lizenz

GPL-3.0 license

## Support

NONE
