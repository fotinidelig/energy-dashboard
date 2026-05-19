import { useState } from 'react';
import './App.css';
import { data } from "./energy.js"
import { sourceContext } from './DashboardContext.jsx';
import ResponsiveBarPlot from "./BarPlot.jsx"
import ResponsiveDonutPlot from './DonutPlot.jsx';
import ResponsiveAreaPlot from './StackedAreaPlot.jsx';
import ResponsiveLinePlot from './LinePlot.jsx';
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


/** Stable source key → Tableau 10 color. */
const energySourceToColor = Object.fromEntries(
  ENERGY_SOURCE_KEYS.map((key, i) => [key, schemeTableau10[i]]),
);

const combinedColor = '#2f2d4a';
const buttonSourceToColor = Object.fromEntries(
  buttonSources.map((key) => [key, key === 'combined' ? combinedColor : energySourceToColor[key]]),
);

const year = 2024
// change country name 'United Arab Emirates' to 'Un. Arab Emirates'
const countryData = data.filter(d => d.country != 'World')
  .map(d => d.country === 'United Arab Emirates' ? { ...d, country: 'Un. Arab Emirates' } : d)
const yearlyData = countryData.filter(d => d.year === year)

// Full time series for stacked area (one row per country × year).
const worldTimeSeries = data.filter((d) => d.country === 'World')

// Donut: one row for World in `year` — mix by source (same keys as bar palette).
const worldRow = data.find((d) => d.country === 'World' && d.year === year) ?? null
const donutData = ENERGY_SOURCE_KEYS.map((source) => ({
  source,
  value: worldRow ? Number(worldRow[source]) || 0 : 0,
}))

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

  return (
    <div className="app">
      <sourceContext.Provider value={{ selectedSource, setSelectedSource }}>
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
                    fontSize: source === 'other_renewable' ? fontSize.label : fontSize.body,
                }}
              >
                <SourceButtonLabel source={source} />
              </button>
            )
          })}
        </div>
        <main className="container app-main">
          <h1>Energy dashboard</h1>
          <div className="dashboard">
            <div className='chart-card'>
              <ResponsiveAreaPlot
                countryData={worldTimeSeries}
                country="World"
                sourceColors={energySourceToColor}
              />
            </div>
            <div className='chart-card'>
              <ResponsiveDonutPlot
                data={donutData}
                year={year}
                country='World'
                sourceColors={energySourceToColor}
              />
            </div>
            <div className='chart-card'>
              <ResponsiveLinePlot
                data={worldTimeSeries}
                country="World"
                sourceColors={energySourceToColor}
              />
            </div>
              <div className='chart-card'>
                <ResponsiveBarPlot
                  data={yearlyData}
                  country='None'
                  source={selectedSource}
                  sourceColors={buttonSourceToColor}
                />
              </div>
          </div>
        </main>
      </sourceContext.Provider>
    </div>
  )
}


export default App
