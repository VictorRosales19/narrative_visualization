// Load the local CSV from /data/income.csv
d3.csv("data/income.csv").then(function(data) {
    console.log("CSV loaded:", data);
  
    // Select the div to insert data
    const output = d3.select("#data-output");
  
    // Append a table
    const table = output.append("table").style("border-collapse", "collapse");
  
    // Add table header
    const header = table.append("thead").append("tr");
    header.append("th").text("State").style("border", "1px solid black").style("padding", "4px");
    header.append("th").text("Income").style("border", "1px solid black").style("padding", "4px");
  
    // Add table rows
    const rows = table.append("tbody")
      .selectAll("tr")
      .data(data)
      .enter()
      .append("tr");
  
    rows.append("td").text(d => d.State)
      .style("border", "1px solid black")
      .style("padding", "4px");
    rows.append("td").text(d => `$${parseInt(d.Income).toLocaleString()}`)
      .style("border", "1px solid black")
      .style("padding", "4px");
  });
  