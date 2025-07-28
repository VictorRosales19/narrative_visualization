let currentScene = 0;
let data;
const scenes = [drawScene0, drawScene1, drawScene2, drawScene3, drawScene4, drawScene5];

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
  const contentDiv = d3.select('#content');
  contentDiv.html('');
  contentDiv.append("p").text("The labor market can be divided into four quadrants based on pay and employment levels:");
  contentDiv.append('ol').attr("id", "myList");
  
  const paragraphs = [
    "High Pay, High Employment: Jobs with good salaries and many opportunities." ,
    "High Pay, Low Employment: Well-paying positions with fewer openings, often due to high skill requirements." ,
    "Low Pay, High Employment: Numerous job opportunities but lower wages, typical of entry-level roles." ,
    "Low Pay, Low Employment: Limited job openings and lower compensation, often reflecting economic challenges." ,
  ];
  const textList = d3.select('#myList');

  paragraphs.forEach(text => {
    textList.append('li')
      .text(text)
      .style("margin-bottom", "15px");
  });

  contentDiv.append("p").text("These quadrants provide insight into the overall financial landscape.");

  const svg = d3.select("#vis");
  svg.attr("height", 600);
  const margin = {top: 60, right: 120, bottom: 60, left: 80};
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

  const year = 2024;
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

  const yearExtent = d3.extent(data, d => d.year);
  const color = d3.scaleLinear()
    .domain(yearExtent) 
    .range(["lightblue", "darkblue"]);
  
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
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .text(`Occupation Overview - ${year}`);

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

  let xOffset = 830;
  let yOffset = 65;
  shape.domain().forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset + i * 20})`); 

    legendItem.append("path")
      .attr("transform", `translate(5, ${6 + i * 2})`)
      .attr("d", d3.symbol().type(shape(level)).size(120)())
      .attr("fill", "#555");

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  const yearsElements = Array.from(new Set(filtered.map(d => d.year))).sort().reverse();
  yearsElements.forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset*3 + i * 20})`);

    legendItem.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(level));

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  // Annotations
  const middleY = height / 2;
  g.append("line")
    .attr("x1", 0)
    .attr("y1", middleY)
    .attr("x2", width)
    .attr("y2", middleY)
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .style("stroke-dasharray", ("5, 5"));

  const middleX = width / 2;
  g.append("line")
    .attr("x1", middleX)
    .attr("y1", 0)
    .attr("x2", middleX)
    .attr("y2", height)
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .style("stroke-dasharray", ("5, 5"));

  const annotations = [ 
    {
      note: { label: "High Pay, High Employment" },
      x: x(140000),
      y: y(5000000),
      dx: 25,
      dy: -25,
      color: "#115104ff",
      className: "my-annotation"
    },
    {
      note: { label: "High Pay, Low Employment" },
      x: x(140000),
      y: y(100000),
      dx: 25,
      dy: 25,
      color: "#5d7212ff",
      className: "my-annotation"
    },
    {
      note: { label: "Low Pay, High Employment" },
      x: x(42000),
      y: y(5000000),
      dx: -25,
      dy: -25,
      color: "#ae8c07ff",
      className: "my-annotation" 
    },
    {
      note: { label: "Low Pay, Low Employment" },
      x: x(42000),
      y: y(100000),
      dx: -25,
      dy: 25,
      color: "#760c0cff",
      className: "my-annotation"
    }
  ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  g.append("g").call(makeAnnotations);

  g.selectAll(".my-annotation")
    .style("font-weight", "bold");
}

function drawScene1(data) {
  d3.select("#filters").style("display", "none"); // avoid show filters
  const contentDiv = d3.select('#content');
  contentDiv.html('');
  contentDiv.append("p").text("There are two distinct levels of occupation:");
  contentDiv.append('ol').attr("id", "myList");
  
  const paragraphs = [
    "Major Level: This encompasses broad categories that include Professional and Related Occupations, as well as certain types of roles.",
    "Minor Level: This consists of subsets within the major occupational categories, focusing on specific types of occupations." ,
  ];
  const textList = d3.select('#myList');

  paragraphs.forEach(text => {
    textList.append('li')
      .text(text)
      .style("margin-bottom", "15px");
  });

  contentDiv.append("p").text("For instance, Management occupations include the following occupation titles:");
  // Add multiple paragraphs with an array of texts
  contentDiv.append('ol').attr("id", "myListExamples");
  
  const occupations = [
    "Top executives",
    "Operations specialties managers",
    "Advertising, marketing, and sales managers",
    "Other management occupations",
  ];
  const textList_examples = d3.select('#myListExamples');

  occupations.forEach(text => {
    textList_examples.append('li')
      .text(text)
      .style("margin-bottom", "15px");
  });


  const svg = d3.select("#vis");
  svg.attr("height", 600);
  const margin = {top: 60, right: 120, bottom: 60, left: 80};
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

  const occupationGroup = "Management Occupations";
  const occupationGroupCode = 11;
  const year = 2024
  const filtered = data.filter(d => 
    d.occupation_code_group === occupationGroupCode 
    && d.year === year
    && d.annual_mean > 0 
    && d.total_employment > 0
  );

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

  const yearExtent = d3.extent(data, d => d.year);
  const color = d3.scaleLinear()
    .domain(yearExtent) 
    .range(["lightblue", "darkblue"]);
  
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
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .text(`Occupation Overview - ${year} - ${occupationGroup}`);

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

  let xOffset = 830;
  let yOffset = 65;
  shape.domain().forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset + i * 20})`); 

    legendItem.append("path")
      .attr("transform", `translate(5, ${6 + i * 2})`)
      .attr("d", d3.symbol().type(shape(level)).size(120)())
      .attr("fill", "#555");

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  const yearsElements = Array.from(new Set(filtered.map(d => d.year))).sort().reverse();
  yearsElements.forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset*3 + i * 20})`);

    legendItem.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(level));

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  // Annotations
  const annotations = [ 
    {
      note: { label: "Occupation level: major" },
      x: x(142000),
      y: y(11000000),
      dx: 25,
      dy: 25,
      color: "#135607ff",
      className: "my-annotation"
    },
    {
      note: { label: "Occupation level: minor" },
      x: x(140000),
      y: y(3800000),
      dx: 25,
      dy: -25,
      color: "#60b83eff",
      className: "my-annotation"
    },
    {
      note: { label: "Occupation level: minor" },
      x: x(121800),
      y: y(3400000),
      dx: 25,
      dy: -25,
      color: "#60b83eff",
      className: "my-annotation"
    },
    {
      note: { label: "Occupation level: minor" },
      x: x(161000),
      y: y(2700000),
      dx: 25,
      dy: -25,
      color: "#60b83eff",
      className: "my-annotation"
    },
    {
      note: { label: "Occupation level: minor" },
      x: x(164000),
      y: y(1140000),
      dx: 25,
      dy: -25,
      color: "#60b83eff",
      className: "my-annotation"
    }
  ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  g.append("g").call(makeAnnotations);

  g.selectAll(".my-annotation")
    .style("font-weight", "bold");
}

function drawScene2(data) {
  d3.select("#filters").style("display", "none"); // avoid show filters
  const contentDiv = d3.select('#content');
  // Clear previous content
  contentDiv.html('');
  contentDiv.append("p").text("Examination of the latest data reveal significant trends in the job market. We can identify occupations that are decreasing, those that remain stable, and those that are increasing.")
  contentDiv.append("p").text("For instance, the job market is seeing an increase in management positions, with growth projected across various management categories.").style("margin-bottom", "20px");
  contentDiv.append("p").text("Investigating additional material, we discovered that specifically, management occupations are expected to grow faster than the average for all occupations between 2023 and 2033, with an estimated 1.2 million openings each year.").style("margin-bottom", "20px");
  contentDiv.append("p").text("This growth is driven by the need to replace workers leaving the field and by overall employment growth.");

  const svg = d3.select("#vis");
  svg.attr("height", 600);
  const margin = {top: 60, right: 120, bottom: 60, left: 80};
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

  const occupationTitle = "Management Occupations";
  const filtered = data.filter(d => 
    d.occupation_title === occupationTitle
    && d.annual_mean > 0 
    && d.total_employment > 0
  );

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

  const yearExtent = d3.extent(data, d => d.year);
  const color = d3.scaleLinear()
    .domain(yearExtent) 
    .range(["lightblue", "darkblue"]);
  
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
          Employment: ${d.total_employment.toLocaleString()}<br>
          Year: ${d3.timeFormat('%Y')(d.date)}`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // Plot title
  svg.append("text")
    .attr("x", svg.attr("width") / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .text(`Occupation Overview - ${occupationTitle}`);

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

  let xOffset = 830;
  let yOffset = 65;
  shape.domain().forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset + i * 20})`); 

    legendItem.append("path")
      .attr("transform", `translate(5, ${6 + i * 2})`)
      .attr("d", d3.symbol().type(shape(level)).size(120)())
      .attr("fill", "#555");

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  const yearsElements = Array.from(new Set(filtered.map(d => d.year))).sort().reverse();
  yearsElements.forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset*3 + i * 20})`);

    legendItem.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(level));

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  // Annotations
  g.append("line")
    .attr("x1", x(117000))
    .attr("y1", y(8000000))
    .attr("x2", x(148000))
    .attr("y2", y(11400000))
    .attr("stroke", "darkgreen")
    .attr("stroke-width", 1)
    .style("stroke-dasharray", ("5, 5"));

  const annotations = [ {
    note: { label: "Increasing employment trend" },
    x: x(145000),
    y: y(11050000),
    dx: 25,
    dy: -25,
    color: "#135607ff",
    className: "my-annotation"
  } ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  g.append("g").call(makeAnnotations);

  g.selectAll(".my-annotation")
    .style("font-weight", "bold");
}

function drawScene3(data) {
  d3.select("#filters").style("display", "none"); // avoid show filters
  const contentDiv = d3.select('#content');
  contentDiv.html('');

  contentDiv.append("p").text("On the other hand, we can also identify occupations that are decreasing.")
  contentDiv.append("p").text("For instance, the farming industry is at a crucial crossroads, facing a notable decline in the number of farmers.").style("margin-bottom", "20px");
  contentDiv.append("p").text("Investigating additional material, we discovered that this trend raises urgent concerns about the sustainability of agricultural careers, primarily fueled by factors like low wages and a physically demanding work environment.").style("margin-bottom", "20px");
  contentDiv.append("p").text("As farmers grapple with labor shortages and an aging workforce, the perception of farming as undesirable work becomes increasingly problematic.").style("margin-bottom", "20px");
  contentDiv.append("p").text("Coupled with the uncertainties of immigration policy and rising labor costs, it's clear that we need to rethink how we can support and revitalize this vital industry").style("margin-bottom", "20px");
  const svg = d3.select("#vis");
  svg.attr("height", 600);
  const margin = {top: 60, right: 120, bottom: 60, left: 80};
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

  const occupationTitle = "Farming, Fishing, and Forestry Occupations";
  const filtered = data.filter(d => 
    d.occupation_title === occupationTitle
    && d.annual_mean > 0 
    && d.total_employment > 0
  );

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

  const yearExtent = d3.extent(data, d => d.year);
  const color = d3.scaleLinear()
    .domain(yearExtent) 
    .range(["lightblue", "darkblue"]);
  
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
          Employment: ${d.total_employment.toLocaleString()}<br>
          Year: ${d3.timeFormat('%Y')(d.date)}`);
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // Plot title
  svg.append("text")
    .attr("x", svg.attr("width") / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .text(`Occupation Overview - ${occupationTitle}`);

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

  let xOffset = 830;
  let yOffset = 65;
  shape.domain().forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset + i * 20})`); 

    legendItem.append("path")
      .attr("transform", `translate(5, ${6 + i * 2})`)
      .attr("d", d3.symbol().type(shape(level)).size(120)())
      .attr("fill", "#555");

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  const yearsElements = Array.from(new Set(filtered.map(d => d.year))).sort().reverse();
  yearsElements.forEach((level, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset*3 + i * 20})`);

    legendItem.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(level));

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(level);
  });

  // Annotations
    g.append("line")
    .attr("x1", x(30000))
    .attr("y1", y(500000))
    .attr("x2", x(43000))
    .attr("y2", y(430000))
    .attr("stroke", "darkred")
    .attr("stroke-width", 1)
    .style("stroke-dasharray", ("5, 5"));
  
  const annotations = [ {
    note: { label: "Decreasing employment trend" },
    x: x(42000),
    y: y(434000),
    dx: 25,
    dy: 25,
    color: "#760c0cff",
    className: "my-annotation"
  } ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  g.append("g").call(makeAnnotations);

  g.selectAll(".my-annotation")
    .style("font-weight", "bold");
}

function drawScene4(data) {
  d3.select("#filters").style("display", "none"); // avoid show filters
  const contentDiv = d3.select('#content');
  // Clear previous content
  contentDiv.html('');
  contentDiv.append("p").text("There are some professions where obtaining a position does not necessarily mean high pay.").style("margin-bottom", "20px");
  contentDiv.append("p").text("For example, in the legal field, which generally offers high salaries but has limited overall job availability, there is a significant disparity between the earnings of the highest-paid lawyers and those of the majority in the profession.").style("margin-bottom", "20px");
  contentDiv.append("p").text("Additionally, low- and medium-income professionals were the most affected during the pandemic in 2021.").style("margin-bottom", "20px");
  const svg = d3.select("#vis");
  svg.attr("height", 600);
  const margin = {top: 60, right: 120, bottom: 60, left: 80};
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

  const occupation = "Legal Occupations";
  const filtered = data.filter(d => d.occupation_title === occupation);

  const paddingDays = 30; 
  const years = d3.extent(filtered, d => d.date);
  const paddedMinDate = d3.timeDay.offset(years[0], -paddingDays);
  const paddedMaxDate = d3.timeDay.offset(years[1], paddingDays);

  const marginPercentage = 0.2;
  const yMin = d3.min(filtered, d => d.annual_percentile_10);
  const yMax = d3.max(filtered, d => d.annual_percentile_90);
  const yAdjustedMin = yMin * (1 - marginPercentage*2);
  const yAdjustedMax = yMax * (1 + marginPercentage*2);

  const x = d3.scaleTime().domain([paddedMinDate, paddedMaxDate]).range([0, width]);
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

    g.selectAll(`.dot-${p.key}`)
      .data(filtered)
      .join("circle")
      .attr("class", `dot-${p.key}`)
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d[p.key]))
      .attr("r", 8)
      .attr("fill", p.color)
      .on("mouseover", (event, d) => {
        tooltip
          .style("display", "block")
          .html(`
            <strong>${p.key.replace('annual_percentile_', 'P')}:</strong> $${d[p.key].toLocaleString()}<br>
            <strong>Year:</strong> ${d3.timeFormat('%Y')(d.date)}
          `);
      })
      .on("mousemove", event => {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"));

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
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .text(`Income Over Time — ${occupation}`);

    // Annotations
  const annotations = [ {
    note: { label: "5x the low earners" },
    x: x(new Date(2024, 0)),
    y: y(262000),
    dx: 25,
    dy: -25,
    color: "#760c0cff",
    className: "my-annotation"
  } ];

  const makeAnnotations = d3.annotation().annotations(annotations);
  g.append("g").call(makeAnnotations);

  g.selectAll(".my-annotation")
    .style("font-weight", "bold");
}

function drawScene5(data) {
  const contentDiv = d3.select('#content');
  contentDiv.html('');
  contentDiv.append("p").text("Reflection Invitation: Assessing Your Position and Planning Your Next Steps").style("margin-bottom", "20px");
  contentDiv.append("p").text("Take a moment to consider your current situation and where you stand.").style("margin-bottom", "20px");
  contentDiv.append("p").text("Reflect on your current occupation, your income, and your employment status.").style("margin-bottom", "20px");
  contentDiv.append("p").text("Are you satisfied with your current position?").style("margin-bottom", "20px");

  const svg = d3.select("#vis");
  svg.attr("height", 1000);

  const margin = {top: 60, right: 120, bottom: 60, left: 80};
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const plotHeight1 =  5*((height / 9));
  const plotHeight2 = height - plotHeight1 - height/7;

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
    const g2 = svg.append("g").attr("transform", `translate(${margin.left},${margin.top + plotHeight1 + 130})`);

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

    const y1 = d3.scaleLog().domain([y1AdjustedMin, y1AdjustedMax]).range([plotHeight1, 0]);

    const yearExtent = d3.extent(data, d => d.year);
    const color = d3.scaleLinear()
      .domain(yearExtent) 
      .range(["lightblue", "darkblue"]);
    
    const shape = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.occupation_level))])
      .range([d3.symbolSquare, d3.symbolTriangle]);
    
    g1.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${plotHeight1})`)
      .call(
        d3.axisBottom(x1)
          .tickSize(-plotHeight1)
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
            Employment: ${d.total_employment.toLocaleString()}<br>
            Year: ${d3.timeFormat('%Y')(d.date)}`);
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    g1.append("text")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "25px")
      .style("font-weight", "bold")
      .text(`Occupation — ${selectedYear}, Level: ${selectedLevel}`);

    g1.append("text")
      .attr("x", width / 2)
      .attr("y", plotHeight1 + 40)
      .attr("text-anchor", "middle")
      .text("Annual Mean Salary");

    g1.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight1/2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text("Total Employment");

    // Legend
    const legend = svg.append("g").attr("transform", `translate(${margin.left}, 20)`);

    let xOffset = 830;
    let yOffset = 65;
    shape.domain().forEach((level, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${xOffset}, ${yOffset + i * 20})`); 

      legendItem.append("path")
        .attr("transform", `translate(5, ${6 + i * 2})`)
        .attr("d", d3.symbol().type(shape(level)).size(120)())
        .attr("fill", "#555");

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(level);
    });

    const yearsElements = Array.from(new Set(scatterData.map(d => d.year))).sort().reverse();
    yearsElements.forEach((level, i) => {
      const legendItem = legend.append("g")
        .attr("transform", `translate(${xOffset}, ${yOffset*3 + i * 20})`);

      legendItem.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(level));

      legendItem.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(level);
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
    
    const paddingDays = 30; 
    const years = d3.extent(lineData, d => d.date);
    const paddedMinDate = d3.timeDay.offset(years[0], -paddingDays);
    const paddedMaxDate = d3.timeDay.offset(years[1], paddingDays);

    const x2 = d3.scaleTime().domain([paddedMinDate, paddedMaxDate]).range([0, width]);

    const y2Min = d3.min(lineData, d => d.annual_percentile_10);
    const y2Max = d3.max(lineData, d => d.annual_percentile_90);
    const y2AdjustedMin = y2Min * (1 - marginPercentage*2);
    const y2AdjustedMax = y2Max * (1 + marginPercentage*2);

    const y2 = d3.scaleLinear().domain([y2AdjustedMin, y2AdjustedMax]).range([plotHeight2, 0]);

    g2.append("g")
      .attr("class", "grid x-grid")
      .attr("transform", `translate(0,${plotHeight2})`)
      .call(
        d3.axisBottom(x2)
          .tickSize(-plotHeight2)
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

      g2.selectAll(`.dot-${p.key}`)
        .data(lineData)
        .join("circle")
        .attr("class", `dot-${p.key}`)
        .attr("cx", d => x2(d.date))
        .attr("cy", d => y2(d[p.key]))
        .attr("r", 8)
        .attr("fill", p.color)
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .html(`
              <strong>${p.key.replace('annual_percentile_', 'P')}:</strong> $${d[p.key].toLocaleString()}<br>
              <strong>Year:</strong> ${d3.timeFormat('%Y')(d.date)}
            `);
        })
        .on("mousemove", event => {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"));

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
      .style("font-size", "25px")
      .style("font-weight", "bold")
      .text(`Income Over Time — ${selectedTitle}`);

    g2.append("text")
      .attr("x", width / 2)
      .attr("y", plotHeight2 + 40)
      .attr("text-anchor", "middle")
      .text("Year");

    g2.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight2 / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text("Income (USD)");
  }

  updateScene();
}