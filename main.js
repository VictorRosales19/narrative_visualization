let currentScene = 0;
let data;
const scenes = [drawScene0, drawScene1];

d3.csv("data/consolidated_dataset.csv", d3.autoType).then(csv => {
  data = csv;
  renderScene(currentScene);
});

function renderScene(sceneIndex) {
  d3.select("#vis").selectAll("*").remove();
  scenes[sceneIndex](data);
}

d3.select("#nextBtn").on("click", () => {
  if (currentScene < scenes.length - 1) {
    currentScene++;
    renderScene(currentScene);
  }
});

d3.select("#prevBtn").on("click", () => {
  if (currentScene > 0) {
    currentScene--;
    renderScene(currentScene);
  }
});

function drawScene0(data) {
  const svg = d3.select("#vis");
  const margin = {top: 60, right: 40, bottom: 60, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const year = 2019;
  const filtered = data.filter(d => d.year === year && d.annual_mean > 0 && d.total_employment > 0);

  const marginPercentage = 0.1;

  const xExtent = d3.extent(filtered, d => d.annual_mean);
  const xAdjustedMin = xExtent[0] * (1 - marginPercentage);
  const xAdjustedMax = xExtent[1] * (1 + marginPercentage);

  const x = d3.scaleLog()
    .domain([xAdjustedMin, xAdjustedMax])
    .range([0, width]);

  const yExtent = d3.extent(filtered, d => d.total_employment);
  const yAdjustedMin = yExtent[0] * (1 - marginPercentage);
  const yAdjustedMax = yExtent[1] * (1 + marginPercentage);
  
  const y = d3.scaleLog()
    .domain([yAdjustedMin, yAdjustedMax])
    .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10).domain([...new Set(data.map(d => d.year))]);
  const shape = d3.scaleOrdinal()
    .domain([...new Set(data.map(d => d.occupation_level))])
    .range([d3.symbolSquare, d3.symbolTriangle]);

  g.append("g")
    .attr("class", "grid x-grid")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickSize(-height)
    );
    
  g.append("g")
    .attr("class", "grid y-grid")
    .call(
      d3.axisLeft(y)
        .tickSize(-width)
    );

  g.selectAll("path.point")
    .data(filtered)
    .enter()
    .append("path")
    .attr("d", d => d3.symbol().type(shape(d.occupation_level)).size(70)())
    .attr("transform", d => `translate(${x(d.annual_mean)},${y(d.total_employment)})`)
    .attr("fill", d => color(d.year));

  const annotations = [ {
    note: { label: "High employment & income" },
    x: x(123000),
    y: y(8000000),
    dx: 25,
    dy: -25
  } ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  g.append("g").call(makeAnnotations);
}

function drawScene1(data) {
  const svg = d3.select("#vis");
  const margin = {top: 60, right: 40, bottom: 60, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const occupation = "Management Occupations";
  const filtered = data.filter(d => d.occupation_title === occupation);

  const years = d3.extent(filtered, d => d.year);

  const marginPercentage = 0.1;
  const yMin = d3.min(filtered, d => d.annual_percentile_10);
  const yMax = d3.max(filtered, d => d.annual_percentile_90);
  const yAdjustedMin = yMin * (1 - marginPercentage);
  const yAdjustedMax = yMax * (1 + marginPercentage);

  const x = d3.scaleLinear().domain(years).range([0, width]);
  const y = d3.scaleLog().domain([yAdjustedMin, yAdjustedMax]).range([height, 0]);

  g.append("g")
    .attr("class", "grid x-grid")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(d3.format("d"))
    );
  g.append("g")
    .attr("class", "grid y-grid")
    .call(
      d3.axisLeft(y)
        .tickSize(-width)
    );

  const percentiles = [
    {key: 'annual_percentile_10', color: '#91bfdb'},
    {key: 'annual_percentile_25', color: '#4575b4'},
    {key: 'annual_percentile_50', color: '#e3af20'},
    {key: 'annual_percentile_75', color: '#fc8d59'},
    {key: 'annual_percentile_90', color: '#d73027'}
  ];

  percentiles.forEach(p => {
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d[p.key]));

    g.append("path")
      .datum(filtered)
      .attr("fill", "none")
      .attr("stroke", p.color)
      .attr("stroke-width", 2)
      .attr("d", line);

    g.append("text")
      .attr("x", width - 60)
      .attr("y", y(filtered[filtered.length - 1][p.key]))
      .attr("fill", p.color)
      .text(p.key.replace('annual_percentile_', 'P'));
  });
}
