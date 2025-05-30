// Make sure Luxon is loaded as an external script!

const timezones = [
  { label: "Fairfax, VA (EDT)", value: "America/New_York", abbr: "EDT", full: "Eastern Daylight Time" },
  { label: "Seattle (PDT)", value: "America/Los_Angeles", abbr: "PDT", full: "Pacific Daylight Time" },
  { label: "London (BST)", value: "Europe/London", abbr: "BST", full: "British Summer Time" },
  { label: "Ho Chi Minh City (ICT)", value: "Asia/Ho_Chi_Minh", abbr: "ICT", full: "Indochina Time" },
  { label: "Bangkok (ICT)", value: "Asia/Bangkok", abbr: "ICT", full: "Indochina Time" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo", abbr: "JST", full: "Japan Standard Time" },
  { label: "Seoul (KST)", value: "Asia/Seoul", abbr: "KST", full: "Korea Standard Time" },
  { label: "Taipei (CST)", value: "Asia/Taipei", abbr: "CST", full: "China Standard Time" },
  { label: "Hong Kong (HKT)", value: "Asia/Hong_Kong", abbr: "HKT", full: "Hong Kong Time" },
  { label: "Jingdezhen (CST)", value: "Asia/Shanghai", abbr: "CST", full: "China Standard Time" }
];

// =============== Helper functions ================
function cityOnly(label) {
  return label.split('(')[0].trim();
}
function getZObj(val) {
  return timezones.find(z => z.value === val);
}
function sliderToTime(idx) {
  let hour = Math.floor(idx/2);
  let min = (idx%2) * 30;
  return {hour, min};
}
function timeToSlider(hour, min) {
  return hour*2 + (min >= 30 ? 1 : 0);
}
function getHourDifference(fromTz, toTz, date){
  let f = date.setZone(fromTz);
  let t = f.setZone(toTz);
  let diff = (t.offset - f.offset)/60;
  return diff;
}

// ============= State and DOM =============
const fromSelect = document.getElementById('from-select');
const toSelect = document.getElementById('to-select');
const fromSlider = document.getElementById('from-slider');
const toSlider = document.getElementById('to-slider');
const calBtn = document.getElementById('calendar-trigger');
const calPopup = document.getElementById('calendar-popup');

// Populate select options
timezones.forEach(z => {
  const o1 = document.createElement('option');
  o1.value = z.value;
  o1.textContent = z.label;
  fromSelect.appendChild(o1);

  const o2 = document.createElement('option');
  o2.value = z.value;
  o2.textContent = z.label;
  toSelect.appendChild(o2);
});
// Set defaults
fromSelect.value = "America/New_York";
toSelect.value = "Asia/Ho_Chi_Minh";

// Default state: today, 9am in Fairfax
let state = {
  from: "America/New_York",
  to: "Asia/Ho_Chi_Minh",
  date: luxon.DateTime.now().setZone("America/New_York").set({minute:0, second:0, millisecond:0}).plus({hours:9}),
  fromSlider: 18,
  toSlider: 40
};

function renderMarks(marksDiv) {
  marksDiv.innerHTML = '';
  for (let i = 0; i <= 24; i+=3) {
    let s = document.createElement('span');
    s.textContent = (i===0?'12am':i<12?`${i}am`:i===12?'12pm':`${i-12}pm`);
    marksDiv.appendChild(s);
  }
}
function renderSubmarks(div) {
  div.innerHTML = '';
  for (let i = 0; i <= 47; i++) {
    let tick = document.createElement('div');
    tick.className = 'slider-tick';
    if (i % 6 === 0) { // every 3 hours
      tick.style.height = '19px';
      tick.style.opacity = '0.64';
      tick.style.background = 'var(--olive)';
    } else {
      tick.style.height = '12px';
      tick.style.opacity = '0.38';
      tick.style.background = 'var(--olive)';
    }
    div.appendChild(tick);
  }
}
renderMarks(document.getElementById('from-marks'));
renderMarks(document.getElementById('to-marks'));
renderSubmarks(document.getElementById('from-submarks'));
renderSubmarks(document.getElementById('to-submarks'));

// Main update logic
function updateState(changed) {
  if(changed==="from-slider"){
    let {hour,min} = sliderToTime(Number(fromSlider.value));
    state.date = state.date.set({hour,minute:min});
  }
  let fromTz = fromSelect.value, toTz = toSelect.value;
  let fromDate = state.date.setZone(fromTz);
  let toDate = fromDate.setZone(toTz);
  state.fromSlider = timeToSlider(fromDate.hour, fromDate.minute);
  state.toSlider = timeToSlider(toDate.hour, toDate.minute);
  fromSlider.value = state.fromSlider;
  toSlider.value = state.toSlider;
  renderBars();
}
function updateFromToTz() {
  state.from = fromSelect.value; state.to = toSelect.value;
  state.date = luxon.DateTime.now().setZone(state.from).set({minute:0, second:0, millisecond:0}).plus({hours:9});
  updateState();
}
fromSelect.onchange = updateFromToTz;
toSelect.onchange = updateFromToTz;

fromSlider.oninput = function(){
  let {hour,min} = sliderToTime(Number(fromSlider.value));
  state.date = state.date.set({hour, minute:min});
  updateState("from-slider");
};
toSlider.oninput = function(){
  let {hour,min} = sliderToTime(Number(toSlider.value));
  let toTz = toSelect.value, fromTz = fromSelect.value;
  let base = state.date.setZone(fromTz).setZone(toTz,true).set({hour, minute:min});
  let fromDate = base.setZone(fromTz);
  state.date = fromDate;
  updateState("to-slider");
};
document.getElementById('switch-btn').onclick = function(){
  let tmp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = tmp;
  updateFromToTz();
}

function renderBars() {
  let fromObj = getZObj(fromSelect.value), toObj = getZObj(toSelect.value);
  let fromTz = fromObj.value, toTz = toObj.value;
  let fromDate = state.date.setZone(fromTz);
  let toDate = fromDate.setZone(toTz);
  function label(date, obj) {
    let day = date.toFormat('cccc');
    let dstr = date.toFormat('MMMM d, yyyy');
    let tstr = date.toFormat('hh:mm a');
    let abbr = obj.abbr, city = cityOnly(obj.label), fulltz = obj.full;
    return `<span class="selected-time">${tstr}</span> ${abbr}, ${city}<br>${day}, ${dstr}`;
  }
  document.getElementById('from-time-label').innerHTML = label(fromDate, fromObj);
  document.getElementById('to-time-label').innerHTML = label(toDate, toObj);
  renderDifference(fromObj, toObj, fromTz, toTz, fromDate);
}

function renderDifference(fromObj, toObj, fromTz, toTz, date) {
  const differenceDiv = document.getElementById('difference-label');
  let fromCity = cityOnly(fromObj.label), toCity = cityOnly(toObj.label);
  let fromFull = fromObj.full, toFull = toObj.full;
  let diff = getHourDifference(fromTz, toTz, date);
  let isSame = diff === 0;
  let summary;
  if(isSame){
    summary = `<span class="samezone">Same timezone:</span> ${fromCity} (${fromObj.abbr}, ${fromFull}) & ${toCity} (${toObj.abbr}, ${toFull})`;
  } else {
    summary = `${fromCity} (${fromObj.abbr}, ${fromFull}) is ${diff>0?`+${diff}h ahead of`:`${diff}h behind`} ${toCity} (${toObj.abbr}, ${toFull})`;
  }
  differenceDiv.innerHTML = summary;
}

updateState();

calBtn.onclick = function(){
  showCalendar();
};
function showCalendar() {
  calPopup.style.display = 'block';
  let base = state.date.startOf('week');
  let days = [];
  for(let i=0; i<7; i++) days.push(base.plus({days:i}));
  calPopup.innerHTML = `
    <div class="calendar-nav">
      <button id="cal-prev">&#8592;</button>
      <span id="cal-week-label">${base.toFormat('M/d/yyyy')} - ${base.plus({days:6}).toFormat('M/d/yyyy')}</span>
      <button id="cal-next">&#8594;</button>
    </div>
    <div class="weekdays"><div></div>${days.map(d=>`<div>${d.toFormat('ccc')}</div>`).join('')}</div>
    <div class="dates-row"><div></div>${days.map(d=>`<div>${d.toFormat('d')}</div>`).join('')}</div>
    <div class="calendar-grid" id="calendar-grid">
      ${Array.from({length:17}).map((_,hr)=>`
        <div class="grid-hour">${hr+6<=12?(hr+6)+'am':(hr+6-12)+'pm'}</div>
        ${days.map((d,di)=>`
          <div class="grid-cell" data-day="${di}" data-hour="${hr+6}"></div>
        `).join('')}
      `).join('')}
    </div>
  `;
  document.getElementById('cal-prev').onclick = ()=>{
    state.date = state.date.minus({days:7});
    showCalendar();
  };
  document.getElementById('cal-next').onclick = ()=>{
    state.date = state.date.plus({days:7});
    showCalendar();
  };
  document.querySelectorAll('.grid-cell').forEach(cell=>{
    cell.onclick = ()=>{
      let day = Number(cell.getAttribute('data-day'));
      let hour = Number(cell.getAttribute('data-hour'));
      let sel = base.plus({days:day, hours:hour- state.date.hour}).set({hour, minute:0});
      state.date = sel;
      calPopup.style.display = 'none';
      updateState("calendar");
    };
  });
  let cday = state.date.weekday%7;
  let chour = state.date.hour;
  document.querySelectorAll(`.grid-cell[data-day="${cday}"][data-hour="${chour}"]`).forEach(cell=>{
    cell.style.background = '#b7e2b2';
  });
}
window.onclick = function(e){
  if(!e.target.closest('.calendar-popup') && !e.target.closest('.calendar-trigger')){
    calPopup.style.display = 'none';
  }
};
