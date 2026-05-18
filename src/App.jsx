import { useState } from 'react';
import './App.css'
import { data } from "./energy.js"
import ResponsiveBarPlot from "./BarPlot.jsx"
import ResponsiveDonutPlot from './DonutPlot.jsx';
import ResponsiveAreaPlot from './StackedAreaPlot.jsx';
import ResponsiveLinePlot from './LinePlot.jsx';
import { schemeTableau10 } from "d3";
import { muteColor } from './muteColor.js';

/** Mix columns from `energy.js` (excludes country, year, primary_energy). */
const ENERGY_SOURCE_KEYS = [
  "coal",
  "oil",
  "gas",
  "hydro",
  "nuclear",
  "solar",
  "wind",
  "biofuel",
  "other_renewable",
];

/** Stable source key → Tableau 10 color. */
const energySourceToColor = Object.fromEntries(
  ENERGY_SOURCE_KEYS.map((key, i) => [key, schemeTableau10[i]]),
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
  const [selectedSource, setSelectedSource] = useState('total')
  const [hoveredSource, setHoveredSource] = useState(null)

  return (
    <div className="app">
      <div className="source-button-container">
        {ENERGY_SOURCE_KEYS.map((source) => {
          const isActive =
            hoveredSource === source || selectedSource === source
          return (
            <button
              key={source}
              type="button"
              className="source-button"
              onClick={() => {
                if (source === selectedSource) {
                  setSelectedSource('total');
                } else {
                  setSelectedSource(source);
                }
              }}
              onMouseEnter={() => setHoveredSource(source)}
              onMouseLeave={() => setHoveredSource(null)}
              style={{
                backgroundColor: isActive
                  ? energySourceToColor[source]
                  : muteColor(energySourceToColor[source]),
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
              sourceGlobal={selectedSource}
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
                sourceColors={energySourceToColor}
              />
            </div>
        </div>
      </main>
    </div>
  )
}


export default App
