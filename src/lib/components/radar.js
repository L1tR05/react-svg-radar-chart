import React from 'react';

const polarToX = (angle, distance) => Math.cos(angle - Math.PI / 2) * distance;

const polarToY = (angle, distance) => Math.sin(angle - Math.PI / 2) * distance;

const points = points => {
  return points
    .map(point => point[0].toFixed(4) + ',' + point[1].toFixed(4))
    .join(' ');
};

const axis = options => (col, i) => (
  <polyline
    key={`poly-axis-${i}`}
    points={points([
      [0, 0],
      [
        polarToX(col.angle, options.chartSize / 2),
        polarToY(col.angle, options.chartSize / 2)
      ]
    ])}
    {...options.axisProps(col)}
  />
);

const dot = (columns, options, maxValue) => (chartData, i) => {
  const data = chartData.data;
  const meta = chartData.meta || {};
  const extraProps = options.dotProps(meta);
  maxValue = maxValue || 1;
  let mouseEnter = () => {};
  let mouseLeave = () => {};
  if (extraProps.mouseEnter) {
    mouseEnter = extraProps.mouseEnter;
  }
  if (extraProps.mouseLeave) {
    mouseLeave = extraProps.mouseLeave;
  }
  return columns.map(col => {
    const val = data[col.key] / maxValue;
    if ('number' !== typeof val) {
      throw new Error(`Data set ${i} is invalid.`);
    }

    return (
      <circle
        key={`dot-${col.key}-${val}`}
        cx={polarToX(col.angle, (val * options.chartSize) / 2)}
        cy={polarToY(col.angle, (val * options.chartSize) / 2)}
        r="4"
        className={[extraProps.className, meta.class].join(' ')}
        onMouseEnter={() => mouseEnter({ key: col.key, value: val, idx: i })}
        onMouseLeave={() => mouseLeave({})}
      >
        <title>{val * maxValue}</title>
      </circle>
    );
  });
};

const shape = (columns, options, series, maxValue) => (chartData, i) => {
  const data = chartData.data;
  const meta = chartData.meta || {};
  series = series || [];
  const extraProps = options.shapeProps(meta);
  maxValue = maxValue || 1;
  return (
    <path
      key={`shape-${i}`}
      d={options.smoothing(
        columns.map(col => {
          const val = data[col.key] / maxValue;

          if ('number' !== typeof val) {
            throw new Error(`Data set ${i} is invalid.`);
          }

          return [
            polarToX(col.angle, (val * options.chartSize) / 2),
            polarToY(col.angle, (val * options.chartSize) / 2)
          ];
        })
      )}
      {...extraProps}
      stroke={meta.color}
      fill={meta.color}
      className={[extraProps.className, meta.class].join(' ')}
    >
      <title>{series[i] || `Serie ${i+1}`}</title>
    </path>
  );
};

const scale = (options, value) => (
  <circle
    key={`circle-${value}`}
    cx={0}
    cy={0}
    r={(value * options.chartSize) / 2}
    {...options.scaleProps(value)}
  />
);

const caption = options => col => (
  <text
    key={`caption-of-${col.key}`}
    x={polarToX(col.angle, (options.size / 2) * 0.95).toFixed(4)}
    y={polarToY(col.angle, (options.size / 2) * 0.95).toFixed(4)}
    dy={(options.captionProps(col).fontSize || 10) / 2}
    {...options.captionProps(col)}
  >
    {col.caption}
  </text>
);

const render = (captions, chartData, options = {}, series) => {
  if ('object' !== typeof captions || Array.isArray(captions)) {
    throw new Error('caption must be an object');
  }
  if (!Array.isArray(chartData)) {
    throw new Error('data must be an array');
  }
  options.chartSize = options.size / options.zoomDistance;
  const maxVal = chartData.reduce((b,d) => { 
    let val = Object.entries(d.data).reduce((a,e) => e[1] > a ? e[1] : a, 0)
    return val > b ? val : b
  },0);
  const columns = Object.keys(captions).map((key, i, all) => {
    return {
      key,
      caption: captions[key],
      angle: (Math.PI * 2 * i) / all.length
    };
  });
  const groups = [
    <g key={`g-groups}`}>{chartData.map(shape(columns, options, series, maxVal))}</g>
  ];
  if (options.captions) {
    groups.push(<g key={`poly-captions`}>{columns.map(caption(options))}</g>);
  }
  if (options.dots) {
    groups.push(<g key={`g-dots`}>{chartData.map(dot(columns, options, maxVal))}</g>);
  }
  if (options.axes) {
    groups.unshift(<g key={`group-axes`}>{columns.map(axis(options))}</g>);
  }
  if (options.scales > 0) {
    const scales = [];
    for (let i = options.scales; i > 0; i--) {
      scales.push(scale(options, i / options.scales));
    }
    groups.unshift(<g key={`poly-scales`}>{scales}</g>);
  }
  const delta = (options.size / 2).toFixed(4);
  return <g transform={`translate(${delta},${delta})`}>{groups}</g>;
};

export default render;
