let currentScene = 0;
let data;
const scenes = [drawScene0, drawScene1, drawScene2];

d3.csv("data/consolidated_dataset.csv", d3.autoType).then(csv => {
  csv.forEach(d => {
    d.date = new Date(d.year, 0); // Convert year to Date object
  });
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
  d3.select("#filters").style("display", "none"); // avoid show filters

  const svg = d3.select("#vis");
  const margin = {top: 60, right: 40, bottom: 60, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("display", "none");

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
  const yAdjustedMin = yExtent[0] * (1 - marginPercentage*2);
  const yAdjustedMax = yExtent[1] * (1 + marginPercentage*2);
  
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

  // Axis titles
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Annual Mean Salary");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Total Employment");

  // Data
  g.selectAll("path.point")
    .data(filtered)
    .enter()
    .append("path")
    .attr("d", d => d3.symbol().type(shape(d.occupation_level)).size(70)())
    .attr("transform", d => `translate(${x(d.annual_mean)},${y(d.total_employment)})`)
    .attr("fill", d => color(d.year))
    .on("mousemove", (e, d) => {
      tooltip.style("display", "block")
        .style("left", `${e.pageX + 10}px`)
        .style("top", `${e.pageY - 30}px`)
        .html(`<strong>${d.occupation_title}</strong><br>
          Income: $${d.annual_mean.toLocaleString()}<br>
          Employment: ${d.total_employment.toLocaleString()}`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // Plot title
  svg.append("text")
    .attr("x", svg.attr("width") / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .text(`Occupation Overview - ${year}`);

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

  let xOffset = 550;
  shape.domain().forEach((level, i) => {
    legend.append("path")
      .attr("transform", `translate(${xOffset}, 0)`)
      .attr("d", d3.symbol().type(shape(level)).size(70)())
      .attr("fill", "#555");
    legend.append("text")
      .attr("x", xOffset + 15)
      .attr("y", 5)
      .text(level);
    xOffset += 90;
  });

  // Annotations
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
  d3.select("#filters").style("display", "none"); // avoid show filters

  const svg = d3.select("#vis");
  const margin = {top: 60, right: 40, bottom: 60, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const occupation = "Management Occupations";
  const filtered = data.filter(d => d.occupation_title === occupation);

  const years = d3.extent(filtered, d => d.date);

  const marginPercentage = 0.1;
  const yMin = d3.min(filtered, d => d.annual_percentile_10);
  const yMax = d3.max(filtered, d => d.annual_percentile_90);
  const yAdjustedMin = yMin * (1 - marginPercentage);
  const yAdjustedMax = yMax * (1 + marginPercentage);

  const x = d3.scaleTime().domain(years).range([0, width]);
  const y = d3.scaleLog().domain([yAdjustedMin, yAdjustedMax]).range([height, 0]);

  g.append("g")
    .attr("class", "grid x-grid")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(d3.timeFormat("%Y"))
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
      .x(d => x(d.date))
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

   // Axis titles
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Year");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text("Income (USD)");

  // Title
  svg.append("text")
    .attr("x", svg.attr("width") / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .text(`Income Over Time — ${occupation}`);
}

function drawScene2(data) {
  const svg = d3.select("#vis");
  const margin = { top: 80, right: 100, bottom: 80, left: 100 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const plotHeight = height / 2 - 40; // half the SVG height

  d3.select("#filters").style("display", "block");

  const years = Array.from(new Set(data.map(d => d.year))).sort();
  const yearsOptions = ["All", ...years];
  const levels = Array.from(new Set(data.map(d => d.occupation_level))).sort();
  const levelsOptions = ["All", ...levels];
  const titles = Array.from(new Set(data.map(d => d.occupation_title))).sort();
  const titlesOptions = ["All", ...titles];

  populateSelect("#yearSelect", yearsOptions);
  populateSelect("#levelSelect", levelsOptions);
  populateSelect("#titleSelect", titlesOptions);

  function populateSelect(id, values) {
    const sel = d3.select(id).selectAll("option")
      .data(values)
      .join("option")
      .attr("value", d => d)
      .text(d => d);
  }

  // Initial values
  let selectedYear = yearsOptions[0];
  let selectedLevel = levelsOptions[0];
  let selectedTitle = titlesOptions[0];

  d3.select("#yearSelect").on("change", () => {
    selectedYear = d3.select("#yearSelect").property("value");
    updateScene();
  });
  d3.select("#levelSelect").on("change", () => {
    selectedLevel = d3.select("#levelSelect").property("value");
    updateOccupationTitles();
    updateScene();
  });
  d3.select("#titleSelect").on("change", () => {
    selectedTitle = d3.select("#titleSelect").property("value");
    updateScene();
  });

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("display", "none");

  function updateOccupationTitles() {
    const currentLevel = d3.select("#levelSelect").property("value");

    let relevantTitles = data;
    if (currentLevel !== "All") {
      relevantTitles = relevantTitles.filter(d => d.occupation_level === currentLevel);
    }

    const titles = Array.from(new Set(relevantTitles.map(d => d.occupation_title))).sort();
    populateSelect("#titleSelect", ["All", ...titles]);
  }

  function updateScene() {
    svg.selectAll("*").remove();

    const g1 = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const g2 = svg.append("g").attr("transform", `translate(${margin.left},${margin.top + plotHeight + 60})`);

    let scatterData = data.filter(d =>
      d.annual_mean > 0 && d.total_employment > 0
    );

    if (selectedYear!=="All") {
      scatterData = scatterData.filter(d => d.year === +selectedYear)
    }
    if (selectedLevel!=="All") {
      scatterData = scatterData.filter(d => d.occupation_level === selectedLevel)
    }
    if (selectedTitle!=="All") {
      scatterData = scatterData.filter(d => d.occupation_title === selectedTitle)
    }

    const marginPercentage = 0.1;

    const x1Extent = d3.extent(scatterData, d => d.annual_mean);
    const x1AdjustedMin = x1Extent[0] * (1 - marginPercentage);
    const x1AdjustedMax = x1Extent[1] * (1 + marginPercentage);

    const x1 = d3.scaleLog().domain([x1AdjustedMin, x1AdjustedMax]).range([0, width]);

    const y1Extent = d3.extent(scatterData, d => d.total_employment);
    const y1AdjustedMin = y1Extent[0] * (1 - marginPercentage*2);
    const y1AdjustedMax = y1Extent[1] * (1 + marginPercentage*2);

    const y1 = d3.scaleLog().domain([y1AdjustedMin, y1AdjustedMax]).range([plotHeight, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain([...new Set(data.map(d => d.year))]);
    const shape = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.occupation_level))])
      .range([d3.symbolSquare, d3.symbolTriangle]);
    
    g1.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${plotHeight})`)
      .call(
        d3.axisBottom(x1)
          .tickSize(-plotHeight)
      );
    g1.append("g")
      .attr("class", "grid y-grid")
      .call(
        d3.axisLeft(y1)
          .tickSize(-width)
      );

    // Data
    g1.selectAll("path.point")
      .data(scatterData)
      .enter()
      .append("path")
      .attr("d", d => d3.symbol().type(shape(d.occupation_level)).size(70)())
      .attr("transform", d => `translate(${x1(d.annual_mean)},${y1(d.total_employment)})`)
      .attr("fill", d => color(d.year))
      .on("mousemove", (e, d) => {
        tooltip.style("display", "block")
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 30}px`)
          .html(`<strong>${d.occupation_title}</strong><br>
            Income: $${d.annual_mean.toLocaleString()}<br>
            Employment: ${d.total_employment.toLocaleString()}`);
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    g1.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text(`Occupation Scatter — ${selectedYear}, Level: ${selectedLevel}`);

    g1.append("text")
      .attr("x", width / 2)
      .attr("y", plotHeight + 40)
      .attr("text-anchor", "middle")
      .text("Annual Mean Salary");

    g1.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .text("Total Employment");

      const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

    let xOffset = 500;
    let yOffset = 40;
    shape.domain().forEach((level, i) => {
      legend.append("path")
        .attr("transform", `translate(${xOffset}, ${yOffset})`)
        .attr("d", d3.symbol().type(shape(level)).size(70)())
        .attr("fill", "#555");
      legend.append("text")
        .attr("x", xOffset + 15)
        .attr("y", yOffset + 5)
        .text(level);
      xOffset += 90;
    });

    let lineData = data;

    if (selectedLevel !== "All") {
      lineData = lineData.filter(d => d.occupation_level === selectedLevel);
    }

    if (selectedTitle !== "All") {
      lineData = lineData.filter(d => d.occupation_title === selectedTitle);
    } else {
      lineData = d3.rollups(
        lineData,
        v => ({
          annual_percentile_10: d3.mean(v, d => d.annual_percentile_10),
          annual_percentile_25: d3.mean(v, d => d.annual_percentile_25),
          annual_percentile_50: d3.mean(v, d => d.annual_percentile_50),
          annual_percentile_75: d3.mean(v, d => d.annual_percentile_75),
          annual_percentile_90: d3.mean(v, d => d.annual_percentile_90),
          date: v[0].date,
          year: v[0].year
        }),
        d => d.year
      ).map(([year, values]) => values);
    }

    const x2 = d3.scaleTime().domain(d3.extent(lineData, d => d.date)).range([0, width]);

    const y2Min = d3.min(lineData, d => d.annual_percentile_10);
    const y2Max = d3.max(lineData, d => d.annual_percentile_90);
    const y2AdjustedMin = y2Min * (1 - marginPercentage);
    const y2AdjustedMax = y2Max * (1 + marginPercentage);

    const y2 = d3.scaleLinear().domain([y2AdjustedMin, y2AdjustedMax]).range([plotHeight, 0]);

    g2.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${plotHeight})`)
      .call(
        d3.axisBottom(x2)
          .tickSize(-plotHeight)
          .tickFormat(d3.timeFormat("%Y"))
        );
    g2.append("g")
      .attr("class", "grid y-grid")
      .call(
        d3.axisLeft(y2)
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
        .x(d => x2(d.date))
        .y(d => y2(d[p.key]));

      g2.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", p.color)
        .attr("stroke-width", 2)
        .attr("d", line);

      g2.append("text")
        .attr("x", width - 60)
        .attr("y", y2(lineData[lineData.length - 1][p.key]))
        .attr("fill", p.color)
        .text(p.key.replace("annual_percentile_", "P"));
    });

    g2.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .text(`Income Over Time — ${selectedTitle}`);

    g2.append("text")
      .attr("x", width / 2)
      .attr("y", plotHeight + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    g2.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .text("Income (USD)");
  }

  updateScene();
}