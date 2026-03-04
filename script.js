let habits = JSON.parse(localStorage.getItem("habits")) || [];
let notificationTriggeredAt = null;

/* NAV */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* HEADER */
function loadHeader() {
  const h = new Date().getHours();
  let g = "Good Night 🌙";
  if (h >= 5 && h < 12) g = "Good Morning 🌅";
  else if (h < 17) g = "Good Afternoon ☀️";
  else if (h < 21) g = "Good Evening 🌆";

  const name = localStorage.getItem("name");
  document.getElementById("greeting").innerText = name ? `${g}, ${name}` : g;

  document.getElementById("date").innerText =
    new Date().toLocaleDateString("en-US", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
}

/* HABITS */
function addHabit() {
  const input = document.getElementById("habitInput");
  if (!input.value) return;

  habits.push({
    name: input.value,
    streak: 0,
    lastDone: null,
    missed: false,
    notifiedAt: null   // 👈 NEW (per-habit)
  });

  input.value = "";
  save();
}
function markDone(index) {
  const today = new Date().toISOString().split("T")[0];
  const habit = habits[index];

  if (habit.lastDone === today) {
    alert("Already marked today 🌿");
    return;
  }

  habit.streak += 1;
  habit.lastDone = today;
  habit.missed = false;
  habit.notifiedAt = null; // 👈 CLEAR notification state

  save();
}
function getPlantImage(streak) {
  if (streak === 0) return "assets/seed.png";
  if (streak <= 3) return "assets/sprout.png";
  if (streak <= 7) return "assets/plant.png";
  return "assets/tree.png";
}

function renderHome() {
  const grid = document.getElementById("habitGrid");
  grid.innerHTML = "";
  habits.forEach((h,i)=>{
    grid.innerHTML += `
      <div class="habit-card">
        <img class="${h.missed ? 'wilted' : ''}" src="${getPlantImage(h.streak)}">
        <h4>${h.name}</h4>
        <p>Streak: ${h.streak} 🔥</p>
        <button onclick="markDone(${i})">Mark Done</button>
      </div>`;
  });
}

/* PROGRESS */
function renderProgress() {
  document.getElementById("totalHabits").innerText = habits.length;
  document.getElementById("totalStreak").innerText =
    habits.reduce((s,h)=>s+h.streak,0);
  document.getElementById("grownCount").innerText =
    habits.filter(h=>h.streak>=8).length;
  drawChart();
}

/* SINGLE BAR GRAPH */
function drawChart() {
  const c = document.getElementById("habitBarChart");
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);

  if (habits.length === 0) return;

  const max = Math.max(...habits.map(h=>h.streak),1);
  const colors = ["#66BB6A","#42A5F5","#FFA726","#AB47BC","#EF5350"];

  habits.forEach((h,i)=>{
    const hgt = (h.streak/max)*120;
    ctx.fillStyle = colors[i%colors.length];
    ctx.fillRect(30+i*45,180-hgt,30,hgt);
    ctx.fillStyle="#333";
    ctx.font="10px Arial";
    ctx.fillText(h.name.substring(0,6),30+i*45,195);
  });
}

/* NOTIFICATION */
if ("Notification" in window) Notification.requestPermission();

function sendNotification(name){
  if(Notification.permission==="granted"){
    new Notification("Habit Bloom 🌱",{
      body:`You haven't completed "${name}" today`
    });
  }
}

function checkMissedHabits() {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  habits.forEach(habit => {
    // Notify ONLY if habit is not done today AND not already notified
    if (habit.lastDone !== today && habit.notifiedAt === null) {
      sendNotification(habit.name);
      habit.notifiedAt = now.toISOString(); // 👈 store per habit
    }
  });

  save();
}

function checkAfterTwoHours() {
  const now = new Date();
  const today = new Date().toISOString().split("T")[0];

  habits.forEach(habit => {
    if (habit.notifiedAt) {
      const notifiedTime = new Date(habit.notifiedAt);
      const diffHours = (now - notifiedTime) / (1000 * 60 * 60);

      // If 2 hours passed AND still not done
      if (diffHours >= 2 && habit.lastDone !== today) {
        habit.streak = 0;      // reset streak
        habit.missed = true;   // wilt plant
        habit.notifiedAt = null;
      }
    }
  });

  save();
}

function scheduleDailyNotification(){
  const time=localStorage.getItem("notify");
  if(!time) return;
  const [hh,mm]=time.split(":").map(Number);
  const now=new Date();
  const target=new Date();
  target.setHours(hh,mm,0,0);
  if(target<=now) target.setDate(target.getDate()+1);
  setTimeout(()=>{
    checkMissedHabits();
    setInterval(checkMissedHabits,24*60*60*1000);
  },target-now);
}

setInterval(checkAfterTwoHours,5*60*1000);

/* SETTINGS */
function saveName(){
  localStorage.setItem("name",document.getElementById("nameInput").value);
  loadHeader();
}
function toggleTheme(){ document.body.classList.toggle("dark"); }
function saveNotify(){
  localStorage.setItem("notify",document.getElementById("notifyTime").value);
  scheduleDailyNotification();
}

/* DELETE */
function renderDelete(){
  const box=document.getElementById("deleteList");
  box.innerHTML="";
  habits.forEach((h,i)=>{
    box.innerHTML+=`<p>${h.name}<button onclick="deleteHabit(${i})">🗑️</button></p>`;
  });
}
function deleteHabit(i){ habits.splice(i,1); save(); }

/* SAVE */
function save(){
  localStorage.setItem("habits",JSON.stringify(habits));
  renderHome();
  renderProgress();
  renderDelete();
}

/* INIT */
loadHeader();
renderHome();
renderProgress();
renderDelete();
scheduleDailyNotification();