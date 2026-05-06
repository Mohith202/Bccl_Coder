import Plot from "react-plotly.js";
import { Card } from "./Card.jsx";
import { applyTheme, PLOTLY_CONFIG } from "../theme.js";

export default function ChartPanel({ title, subtitle, data, layout = {}, config = {}, height = 380 }) {
  return (
    <Card className="p-4">
      {title && (
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <h3 className="font-medium text-ink-800">{title}</h3>
            {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
          </div>
        </div>
      )}
      <Plot
        data={data}
        layout={applyTheme({ autosize: true, height, ...layout })}
        config={{ ...PLOTLY_CONFIG, ...config }}
        useResizeHandler
        style={{ width: "100%" }}
      />
    </Card>
  );
}
