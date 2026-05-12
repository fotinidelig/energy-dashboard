import './App.css'
import { data } from "./energy.js"
import ResponsiveBarPlot from "./BarPlot.jsx"
import ResponsiveDonutPlot from './DonutPlot.jsx';
import { schemeTableau10 } from "d3";

/** Mix columns from `energy.js` (excludes country, year, primary_energy). */
const ENERGY_SOURCE_KEYS = [
  "coal",
  "oil",
  "gas",
  "nuclear",
  "hydro",
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

// Donut: one row for World in `year` — mix by source (same keys as bar palette).
const worldRow = data.find((d) => d.country === 'World' && d.year === year) ?? null
const donutData = ENERGY_SOURCE_KEYS.map((source) => ({
  source,
  value: worldRow ? Number(worldRow[source]) || 0 : 0,
}))

function App() {
  return (
    <div className="app">
      <main className="container">
        <h1>Energy dashboard</h1>
        <div id='dashboard'>
          <div className='chart-card'>
            <ResponsiveBarPlot
              data={yearlyData}
              country='None'
              source='oil'
              sourceColors={energySourceToColor}
            />
          </div><div className='chart-card'>
            <ResponsiveDonutPlot
              data={donutData}
              year={year}
              country='World'
              sourceColors={energySourceToColor}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
