//Global variables
let canvasSize = 500
let offset = 50;
let total = 0;
let baseTable;
let stateTable;
let selectedState = "";
let raceArray = [];
let stateArray = Array(50);
let incomeArray = Array(50);
let distArray = Array(50);
let stateIncomeArray = [];
let stateDistArray = [];
let resizeTimeout = false;

let colors = [
    [255, 0, 0],
    [255, 165, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 128, 128],
    [0, 0, 255],
    [75, 0, 130],
    [238, 130, 238],
    [139, 69, 19],
];

//preload function to load CSV files
function preload() {
  baseTable = loadTable("projects/interactive-art/HouseHoldIncome.csv", "csv", "header");
  stateTable = loadTable("projects/interactive-art/50States.csv", "csv", "header");
}

//setup function to initialize canvas and UI elements
function setup() {
  container = select('#p5-sketch');
  let containerWidth;
  if (container && container.elt && container.elt.clientWidth) {
    containerWidth = container.elt.clientWidth;
  } else {
    containerWidth = windowWidth;
  }
  initialWidth = Math.max(420, containerWidth);
  canvasSize = (initialWidth - (offset * 2)) / 1.5;
  initialHeight = Math.round(canvasSize + (offset * 2));

  cnv = createCanvas(Math.round(initialWidth), initialHeight);
  cnv.parent('p5-sketch');
  background(200);

  selectState = createSelect();

  title();
  dropDown();
  stateArraySetup();
  getArrays();
}

//draw function to update visualizations based on selected state
function draw() {
  let state = selectState.value();
  if (state !== selectedState) {
    selectedState = state;
    drawBarGraph(state);
    drawPieChart(state);
  }
}

//function to display title
function title(){
  push();
  fill(0, 0, 0);
  textSize(canvasSize/20);
  textAlign(CENTER, TOP);
  text("Median Household Income and Demographic", width/2, 0);
  text(" Distribution by U.S. State ", width/2, textAscent()+textDescent());
  pop();
}

//function to create dropdown menu
function dropDown(){
  push();
  fill(0, 0, 0);
  textSize(canvasSize/30);
  textAlign(LEFT, TOP);
  text("Select a state below:", 0, 0);

  selectState.parent('p5-sketch');
  let textHeight = textAscent() + textDescent();
  selectState.position(0, textHeight + 5);
  selectState.style('width', Math.min(Math.round(canvasSize * 0.25), windowWidth*0.7) + 'px');
  selectState.style('font-size', Math.round(canvasSize / 30) + 'px');
  pop();
}

//function to setup state array and populate dropdown
function stateArraySetup(){
  stateArray = stateTable.getColumn(0);
  stateArray.forEach((stateName, index) => {
    selectState.option(stateName, index);
  });
  selectState.selected(stateArray[0]);
}

//function to handle window resizing with debounce
function windowResized() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    handleResize();
  }, 100);
}

//function to handle resizing and redraw visualizations
function handleResize() {
  container = select('#p5-sketch');
  let containerWidth = container?.elt?.clientWidth || windowWidth;
  let newWidth = Math.max(420, containerWidth);
  canvasSize = (newWidth - offset*2) / 1.5;
  let newHeight = Math.round(canvasSize + offset*2);
  resizeCanvas(Math.round(newWidth), newHeight);
  background(200);

  title();

  if (selectState) {
    dropDown();
  }

  let stateIndex = parseInt(selectState.value(), 10);
  drawBarGraph(stateIndex);
  drawPieChart(stateIndex);
}

//function to setup income and distribution arrays
function getArrays() {
  let incomeIndex = 0;
  let distIndex = 0;
  formatTitles();

  for (let c = 1; c < baseTable.getColumnCount()-2; c++) {
    if(c == 18 || c == 19){
      continue;
    }
    if (c % 2 === 0) {
      incomeArray[incomeIndex] = [];
      for (let r = 0; r < baseTable.getRowCount(); r++) {
        let value = baseTable.getString(r, c).replace(/,/g, "");
        incomeArray[incomeIndex].push(parseFloat(value));
      }
      incomeIndex++;
    } else {
      distArray[distIndex] = [];
      for (let r = 0; r < baseTable.getRowCount(); r++){
        let value = baseTable.getString(r, c).replace(/,/g, "");
        distArray[distIndex].push(parseFloat(value));
      }
      distIndex++;
    }
  }
}

//function to format race titles
function formatTitles(){
  raceShortNames = {
    "Households": "Overall",
    "White": "White",
    "Black or African American": "African\nAmerican",
    "American Indian and Alaska Native": "Native\nAmerican",
    "Asian": "Asian\nAmerican",
    "Native Hawaiian and Other Pacific Islander": "Pacific\nIslander",
    "Some other race": "Other",
    "Two or more races": "2+ Races",
    "Hispanic or Latino origin (of any race)": "Hispanic\nLatino",
    "White alone, not Hispanic or Latino": "White\n(Non-Hispanic)"
  };

  for (let r = 0; r < baseTable.getRowCount(); r++) {
    let value = baseTable.getString(r, 0);
    if (raceShortNames[value]) {
      raceArray.push(raceShortNames[value]);
    } else {
      raceArray.push(value);
    }
  }
}

//function to draw bar graph
function drawBarGraph(state){
  push();
  noStroke();
  fill(255, 255, 255);
  rect(offset, height*0.1, width-(offset*2), height*0.35);
  
  let max = incomeArray[state][0];
  for (let i = 0; i < incomeArray[state].length; i++){
    stateIncomeArray[i] = incomeArray[state][i];
    if(stateIncomeArray[i]>max && (stateIncomeArray[i] != "N" && stateIncomeArray[i] != "-")){
      max = stateIncomeArray[i];
    }
  }
  max += max/4;
  drawBar(max);
  pop();
}

//function to draw individual bars
function drawBar(max){
  push();
  let totalWidth = width - (offset * 2);
  let numBars = stateIncomeArray.length;
  let barWidth = totalWidth / (numBars + (numBars - 1) * 0.5);
  let barGap = barWidth * 0.4;
  let graphStart = height * 0.1;
  let graphHeight = height * 0.35;

  for (let i = 0; i < stateIncomeArray.length; i++) {
    let value = stateIncomeArray[i];
    if(isNaN(value)){
      value = 0;
    }
    let barHeight = (value / max) * graphHeight;
    fill(0, 0, 255);
    rect(
      offset + barGap + i * (barWidth + barGap),
      graphStart + graphHeight - barHeight,
      barWidth,
      barHeight
    );

    textSize(canvasSize/40);
    textAlign(CENTER, BOTTOM);
    fill(0, 0, 0);

    if (value == 0) {
      text("Data not\navailable",
           offset + i * (barWidth + barGap) + (barWidth*0.9),
           graphStart + graphHeight - barHeight-offset);
    } else {
      text("$" + value.toLocaleString(),
           offset + i * (barWidth + barGap) + (barWidth*0.9),
           graphStart + graphHeight - barHeight);
    }

    textAlign(CENTER, TOP);
    text(raceArray[i],
         offset + i * (barWidth + barGap) + (barWidth*0.9),
         graphStart + graphHeight );
  }
  pop();
}

//function to draw pie chart
function drawPieChart(state){
  push();
  let diameter = width * 0.3;
  calculatePie(state);
  let lastAngle = 0;
  for (let i = 0; i < stateDistArray.length; i++) {
    let value = stateDistArray[i];
    if (isNaN(value)) { value = 0; }
    let angle = (value / total) * 360;
    fill(colors[i]);
    arc(
      width * 0.3,
      height * 0.75,
      diameter,
      diameter,
      radians(lastAngle),
      radians(lastAngle + angle)
    );
    lastAngle += angle;
  }
  stroke(0);
  strokeWeight(diameter*0.005);
  noFill();
  circle(width * 0.3, height * 0.75, (diameter*1.005));
  legendBox(state, colors);
  pop();
}

//function to calculate pie chart values
function calculatePie(state){
  push();
  total = 0;
  for (let i = 0; i < distArray[state].length - 2; i++) {
    stateDistArray[i] = distArray[state][i + 1];
    let value = stateDistArray[i];
    if (isNaN(value)) { value = 0; }
    total += value;
  }
  pop();
}

//function to draw legend box
function legendBox(state) {
  push();
  let boxX = width * 0.5;
  let boxY = height * 0.54;
  let boxWidth = width*0.4;
  let boxHeight = height*0.42;

  fill(125);
  stroke(0);
  rect(boxX, boxY, boxWidth, boxHeight, 25);

  fill(0);
  textSize(canvasSize/25);
  textAlign(LEFT, TOP);
  text("Race Breakdown:", boxX + 10, boxY + 10);

  let yOffset = (height*0.42)*0.1;

  for (let i = 0; i < stateDistArray.length; i++) {
    let value = stateDistArray[i];
    if (isNaN(value)) { value = 0; }
    let percentage = (value / total) * 100;
    fill(colors[i % colors.length]);
    let raceArrayCopy = [...raceArray];
    raceArrayCopy[i+1] = raceArrayCopy[i+1].replace("\n", " ");
    strokeWeight(canvasSize/(canvasSize*0.6));
    if(percentage == 0){
      text(raceArrayCopy[i+1] + ": Data not available", boxX + 10, boxY + 10+ yOffset);
    } else{
      text(raceArrayCopy[i+1] + ": " + percentage.toFixed(1) + "%", boxX + 10, boxY + 10 +yOffset);
    }
    yOffset += (height*0.42)*0.1;
  }
  pop();
}