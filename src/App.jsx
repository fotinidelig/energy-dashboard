import { useMemo, useState } from 'react';

import './App.css';
import { data } from "./energy.js"
import { sourceContext, countryContext, yearContext } from './DashboardContext.jsx';
import ResponsiveBarPlot from "./BarPlot.jsx"
import ResponsiveDonutPlot from './DonutPlot.jsx';
import ResponsiveAreaPlot from './StackedAreaPlot.jsx';
import ResponsiveLinePlot from './LinePlot.jsx';
import { FilterSelect } from './FilterSelect.jsx';
import { schemeTableau10 } from "d3";
import { muteColor } from './muteColor.js';
import { fontSize } from './theme/typography.js';

const ENERGY_SOURCE_KEYS = [
  "coal",
  "oil",
  "gas",
  "hydro",
  "nuclear",
  "solar",
  "wind",
  "biofuel",
  "other_renewable"
];

const buttonSources = [
  "combined",
  "coal",
  "oil",
  "gas",
  "hydro",
  "nuclear",
  "solar",
  "wind",
  "biofuel",
  "other_renewable"
]

const normalizeCountry = (name) =>
  name === 'United Arab Emirates' ? 'Un. Arab Emirates' : name;

const YEARS = [...new Set(data.map((d) => d.year))].sort((a, b) => a - b);

const COUNTRIES = [...new Set(data.map((d) => normalizeCountry(d.country)))].sort(
  (a, b) => (a === 'World' ? -1 : b === 'World' ? 1 : a.localeCompare(b)),
);

const yearOptions = YEARS.map((y) => ({ value: String(y), label: String(y) }));
const countryOptions = COUNTRIES.map((c) => ({ value: c, label: c }));

/** Stable source key → Tableau 10 color. */
const energySourceToColor = Object.fromEntries(
  ENERGY_SOURCE_KEYS.map((key, i) => [key, schemeTableau10[i]]),
);

const combinedColor = '#2f2d4a';
const buttonSourceToColor = Object.fromEntries(
  buttonSources.map((key) => [key, key === 'combined' ? combinedColor : energySourceToColor[key]]),
);

const countryData = data
  .filter((d) => d.country !== 'World')
  .map((d) =>
    d.country === 'United Arab Emirates' ? { ...d, country: 'Un. Arab Emirates' } : d,
  );

function SourceButtonLabel({ source }) {
  if (source === 'other_renewable') {
    return (
      <>
        other
        <br />
        renewable
      </>
    )
  }
  return source.replace(/_/g, ' ')
}

function App() {
  const [hoveredSource, setHoveredSource] = useState(null)
  const [selectedSource, setSelectedSource] = useState('combined')
  const [selectedCountry, setSelectedCountry] = useState('World')
  const [selectedYear, setSelectedYear] = useState(2024)  
  const [cursorPosition, setCursorPosition] = useState(null);


  const yearlyData = useMemo(
    () => countryData.filter((d) => d.year === selectedYear),
    [selectedYear],
  );

  const countryTimeSeries = useMemo(
    () => data.filter((d) => normalizeCountry(d.country) === selectedCountry),
    [selectedCountry],
  );

  const donutRow = useMemo(
    () =>
      data.find(
        (d) =>
          normalizeCountry(d.country) === selectedCountry &&
          d.year === selectedYear,
      ),
    [selectedCountry, selectedYear],
  );

  const donutData = useMemo(
    () =>
      ENERGY_SOURCE_KEYS.map((source) => ({
        source,
        value: donutRow ? Number(donutRow[source]) || 0 : 0,
      })),
    [donutRow],
  );

  return (
    <div className="app">
      <sourceContext.Provider value={{ selectedSource, setSelectedSource }}>
        <countryContext.Provider value={{ selectedCountry, setSelectedCountry }}>
          <yearContext.Provider value={{ selectedYear, setSelectedYear }}>
            <div className="source-button-container">
              {buttonSources.map((source) => {
                const isActive =
                  hoveredSource === source || selectedSource === source
                return (
                  <button
                    key={source}
                    type="button"
                    className="source-button"
                    onClick={() => {
                      if (source === selectedSource) {
                        setSelectedSource('combined');
                      } else {
                        setSelectedSource(source);
                      }
                    }}
                    onMouseEnter={() => setHoveredSource(source)}
                    onMouseLeave={() => setHoveredSource(null)}
                    style={{
                      backgroundColor: isActive
                        ? buttonSourceToColor[source]
                        : muteColor(buttonSourceToColor[source]),
                      color: source === 'combined' ? '#fff' : '#000',
                      fontSize:
                        source === 'other_renewable'
                          ? fontSize.label // smaller text for other renewable
                          : fontSize.body,
                    }}
                  >
                    <SourceButtonLabel source={source} />
                  </button>
                )
              })}
            </div>
            <main className="container app-main">
              <div className="dashboard-header">
                <h1>Energy dashboard</h1>
                <div className="filter-controls">
                  <FilterSelect
                    label="Year"
                    value={String(selectedYear)}
                    onChange={(v) => setSelectedYear(Number(v))}
                    options={yearOptions}
                  />
                  <FilterSelect
                    label="Country"
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                    options={countryOptions}
                  />
                </div>
              </div>
              <div className="dashboard">
                <div className="chart-card">
                  <ResponsiveAreaPlot
                    countryData={countryTimeSeries}
                    country={selectedCountry}
                    sourceColors={energySourceToColor}
                  />
                </div>
                <div className="chart-card">
                  <ResponsiveDonutPlot
                    data={donutData}
                    year={selectedYear}
                    country={selectedCountry}
                    sourceColors={energySourceToColor}
                  />
                </div>
                <div className="chart-card">
                  <ResponsiveLinePlot
                    data={countryTimeSeries}
                    sourceColors={energySourceToColor}
                    cursorPosition={cursorPosition}
                    setCursorPosition={setCursorPosition}
                  />
                </div>
                <div className="chart-card">
                  <ResponsiveBarPlot
                    data={yearlyData}
                    source={selectedSource}
                    sourceColors={buttonSourceToColor}
                  />
                </div>
              </div>
            </main>
          </yearContext.Provider>
        </countryContext.Provider>
      </sourceContext.Provider>
    </div>
  )
}

export default App
