inputsArray = [];
var timer;
var startTime;
var intervalCounter;
var settings;
var isRunning = false;
var isRest = false;
var pb;
var total_with_rest;
var total_without_rest;
function initInputsData() {
  pb = document.getElementById("canvas");
  total_with_rest = document.getElementById("total_with_rest");
  total_without_rest = document.getElementById("total_without_rest");

  getCachedData();
  setGUIState(0);
  if (inputsArray.length <= 0) {
    var txtwork_min = {
      id: "txtwork_min",
      validClicks: 0,
      nextControl: "txtwork_sec",
    };
    var txtwork_sec = {
      id: "txtwork_sec",
      validClicks: 0,
      nextControl: "txtrest_min",
    };
    var txtrest_min = {
      id: "txtrest_min",
      validClicks: 0,
      nextControl: "txtrest_sec",
    };
    var txtrest_sec = {
      id: "txtrest_sec",
      validClicks: 0,
      nextControl: "txtwork_min",
    };
    inputsArray[0] = txtwork_min;
    inputsArray[1] = txtwork_sec;
    inputsArray[2] = txtrest_min;
    inputsArray[3] = txtrest_sec;
  }
}
function onSelectingTimeFocus(evt) {
  this.select();
  // Reset all clicks
  for (var i = 0; i < inputsArray.length; i++) {
    inputsArray[i].validClicks = 0;
  }
}
function onSelectingTime(evt) {
  var inp = findInputObject(this.id);
  var moded = this.value;
  for (var c = 0; c < moded.length; c++) {
    if (/^\d+$/.test(moded[c]) == false) {
      moded = moded.substring(0, c);
      if (moded.length == 1) moded = "0" + moded;
      this.value = moded;
      return;
    }
  }
  if (moded.length > 2) {
    if (moded[0] == "0") {
      moded = moded.substring(1, 3);
      this.value = moded;
    } else {
      moded = moded.substring(0, 2);
      this.value = moded;
    }
  } else if (moded.length == 1) {
    moded = "0" + moded;
    this.value = moded;
  }
  if (evt.inputType == "deleteContentBackward") {
    // User deleted previous character, reduce validClicks by 1
    if (inp.validClicks > 0) {
      inp.validClicks = inp.validClicks - 1;
    }
  } else {
    if (inp.validClicks < 2) {
      inp.validClicks++;
    }
    if (isRunning == false) {
      setDefaults();
    }
  }
  if (inp.validClicks >= 2) {
    document.getElementById(inp.nextControl).select();
  }
}
function findInputObject(id) {
  for (var i = 0; i < inputsArray.length; i++) {
    if (inputsArray[i].id == id) {
      return inputsArray[i];
    }
  }
}
function setDefaults() {
  settings = getTimerSettings();
  var rounds = document.getElementById("rounds");
  var tmr = document.getElementById("tmr");
  rounds.innerText = "0" + "/" + settings.intervals;
  tmr.innerText =
    addLeadingZero(settings.w_m) + ":" + addLeadingZero(settings.w_s);
  isRest = false;
  isRunning = false;
  // Set the total time info
  var totalSecs = getTotalSecondsWorkoutTime();
  var onlyWork = getTotalSecondsWorkoutTimeWithoutRest();
  total_with_rest.innerText = getTimeFormatFromSeconds(totalSecs);
  total_without_rest.innerText = getTimeFormatFromSeconds(onlyWork);
}
function getTimeFormatFromSeconds(seconds) {
  try {
    // multiply by 1000 because Date() requires miliseconds
    var date = new Date(seconds * 1000);
    var hh = addLeadingZero(date.getUTCHours());
    var mm = addLeadingZero(date.getUTCMinutes());
    var ss = addLeadingZero(date.getSeconds());

    return hh + ":" + mm + ":" + ss;
  } catch {
    return "??:??:??";
  }
}
function onIntervalsBtnClick(d) {
  var txtintervals = document.getElementById("txtintervals");
  var currentVal = parseInt(txtintervals.value);
  if (currentVal + d > 0 && currentVal + d < 100) {
    txtintervals.value = currentVal + d;
  }
  if (isRunning == false) {
    setDefaults();
  }
}
function start() {
  try {
    if (isRunning) {
      setGUIState(0);
    } else {
      // Start countdown
      countDown();
    }
  } catch (err) {
    console.log(err);
  }
}
function countDown() {
  setStartBtnState(true);
  setGUIState(1);
  var counter = 4;
  var tmr = document.getElementById("tmr");
  tmr.innerText = "5";
  playAudio(
    "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/beep.wav"
  );
  this.timer = setInterval(function () {
    if (counter <= 0) {
      clearInterval(this.timer);
      tmr.innerText = "GO!";
      initWorkout();
      return;
    } else {
      playAudio(
        "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/beep.wav"
      );
      tmr.innerText = counter;
      counter--;
    }
  }, 1000);
}
function initWorkout() {
  intervalCounter = 1;
  settings = getTimerSettings();
  setCachedItems(settings);
  var rounds = document.getElementById("rounds");
  var tmr = document.getElementById("tmr");
  tmr.innerText =
    addLeadingZero(settings.w_m) + ":" + addLeadingZero(settings.w_s);
  document.getElementById("canvasCont").style.display = "inline-flex";
  startTime = new Date().getTime();
  work();
}
function work() {
  playAudio(
    "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/Timer_bell.wav"
  );
  setGUIState(2);
  var rounds = document.getElementById("rounds");
  var tmr = document.getElementById("tmr");
  tmr.innerText =
    addLeadingZero(settings.w_m) + ":" + addLeadingZero(settings.w_s);
  rounds.innerText = intervalCounter + "/" + settings.intervals;
  var workUntil =
    new Date().getTime() + (settings.w_m * 60 + settings.w_s) * 1000;
  // Start the timer
  this.timer = setInterval(function () {
    var diff = workUntil - new Date().getTime();
    var secondsToExpirity = parseInt(Math.ceil(diff / 1000));
    updateProgressBar();
    if (secondsToExpirity <= 0) {
      // Round was over
      isRest = true;
      updateProgressBar();
      tmr.innerText = "00:00";
      clearInterval(this.timer);
      if (intervalCounter < settings.intervals) {
        // There are more rounds
        intervalCounter++;
        rest();
      } else {
        // All rounds was over
        setGUIState(0);
        playAudio(
          "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/finishbell.wav"
        );
      }
    } else {
      var m = Math.floor(secondsToExpirity / 60);
      var s = secondsToExpirity - m * 60;
      tmr.innerText = addLeadingZero(m) + ":" + addLeadingZero(s);
      if (secondsToExpirity < 5) {
        playAudio(
          "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/beep.wav"
        );
      }
    }
  }, 1000);
}
function rest() {
  setGUIState(3);
  var rounds = document.getElementById("rounds");
  var tmr = document.getElementById("tmr");
  tmr.innerText =
    addLeadingZero(settings.r_m) + ":" + addLeadingZero(settings.r_s);
  var restUntil =
    new Date().getTime() + (settings.r_m * 60 + settings.r_s) * 1000;
  playAudio(
    "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/Electronic_bell.wav"
  );
  // Start timer
  this.timer = setInterval(function () {
    var diff = restUntil - new Date().getTime();
    var secondsToExpirity = parseInt(Math.ceil(diff / 1000));
    updateProgressBar();
    if (secondsToExpirity <= 0) {
      // Rest is over
      isRest = false;
      updateProgressBar();
      tmr.innerText = "00:00";
      clearInterval(this.timer);
      // Return to work
      work();
    } else {
      var m = Math.floor(secondsToExpirity / 60);
      var s = secondsToExpirity - m * 60;
      tmr.innerText = addLeadingZero(m) + ":" + addLeadingZero(s);
      if (secondsToExpirity < 5) {
        playAudio(
          "https://codverterassets.blob.core.windows.net/reps/a7/a3073/other/beep.wav"
        );
      }
    }
  }, 1000);
}
function setStartBtnState(isReset) {
  var btn = document.getElementById("btnStart");
  if (isReset) {
    isRunning = true;
    btn.innerText = "СТОП";
    btn.classList.remove("strt");
    btn.classList.add("stop");
  } else {
    isRunning = false;
    btn.innerText = "СТАРТ";
    btn.classList.remove("stop");
    btn.classList.add("strt");
  }
}
function setGUIState(timer_state) {
  var cont = document.getElementById("timerCont");
  cont.classList = "";
  cont.classList.add("timer_cont");
  switch (timer_state) {
    case 0: {
      // Pause
      cont.classList.add("pause");
      clearInterval(this.timer);
      setStartBtnState(false);
      document.getElementById("txtstatus").innerText = "";
      document.getElementById("settingsCont").style.display = "block";
      document.getElementById("tmr_summary").style.display = "block";
      document.getElementById("rounds").style.color = "silver";
      setDefaults();
      resetProgressBar();
      handleMobileNoSleep(false);
      break;
    }
    case 1: {
      // Countdown
      cont.classList.add("countdown");
      startTime = null;
      var elem = document.getElementById("txtstatus");
      document.getElementById("rounds").style.color = "rgb(54,54,54)";
      document.getElementById("settingsCont").style.display = "none";
      document.getElementById("tmr_summary").style.display = "none";
      elem.innerText = "ПОДГОТОВКА";
      handleMobileNoSleep(true);
      window.parent.parent.scrollTo({ top: 91, behavior: "smooth" });
      break;
    }
    case 2: {
      // Work
      cont.classList.add("work");
      document.getElementById("txtstatus").innerText = "РАБОТА";
      document.getElementById("rounds").style.color = "silver";
      break;
    }
    case 3: {
      // Rest
      cont.classList.add("rest");
      document.getElementById("txtstatus").innerText = "ОТДЫХ";
      document.getElementById("rounds").style.color = "rgb(100,100,100)";
      break;
    }
  }
}
function handleMobileNoSleep(isKeepScreenOn) {
  var noSleep = new NoSleep();
  if (isKeepScreenOn) {
    noSleep.enable();
  } else {
    noSleep.disable();
  }
}
function playAudio(url) {
  var audio = new Audio(url);
  audio.play();
}
function getTimerSettings() {
  try {
    var intervals = document.getElementById("txtintervals");
    var txtwork_min = document.getElementById("txtwork_min");
    var txtwork_sec = document.getElementById("txtwork_sec");
    var txtrest_min = document.getElementById("txtrest_min");
    var txtrest_sec = document.getElementById("txtrest_sec");
    var font_size = document.getElementById("txtFont").value.split("%")[0];
    // Handle numbers safely
    var w_m = toNumber(parseInt(txtwork_min.value));
    var w_s = toNumber(parseInt(txtwork_sec.value));
    var r_m = toNumber(parseInt(txtrest_min.value));
    var r_s = toNumber(parseInt(txtrest_sec.value));
    var result = {
      intervals: parseInt(intervals.value),
      w_m: w_m,
      w_s: w_s,
      r_m: r_m,
      r_s: r_s,
      fnt: parseInt(font_size),
    };
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
  }
}
function toNumber(val) {
  if (isNaN(val)) {
    return 0;
  } else {
    return val;
  }
}
function setCachedItems(obj) {
  var str =
    obj.intervals +
    ";" +
    obj.w_m +
    ":" +
    obj.w_s +
    ";" +
    obj.r_m +
    ":" +
    obj.r_s +
    ";" +
    obj.fnt;
  localStorage.setItem("timer_cached_data", str);
}
function addLeadingZero(num) {
  if (num < 10) {
    return "0" + num;
  } else {
    return "" + num;
  }
}
function getCachedData() {
  if (localStorage.getItem("timer_cached_data") != null) {
    try {
      var splitted = localStorage.getItem("timer_cached_data").split(";");
      if (splitted.length != 4) {
        // Something went wrong
        return;
      }
      var intervals = splitted[0];
      var temp = splitted[1].split(":");
      var w_m = temp[0];
      var w_s = temp[1];
      temp = splitted[2].split(":");
      var r_m = temp[0];
      var r_s = temp[1];
      var fnt = splitted[3];
      var txtIntervals = document.getElementById("txtintervals");
      var txtwork_min = document.getElementById("txtwork_min");
      var txtwork_sec = document.getElementById("txtwork_sec");
      var txtrest_min = document.getElementById("txtrest_min");
      var txtrest_sec = document.getElementById("txtrest_sec");
      txtIntervals.value = intervals;
      txtwork_min.value = addLeadingZero(w_m);
      txtwork_sec.value = addLeadingZero(w_s);
      txtrest_min.value = addLeadingZero(r_m);
      txtrest_sec.value = addLeadingZero(r_s);
      if (!isNaN(fnt) && fnt !== 100) {
        onFontChange(fnt - 100);
      }
    } catch (err) {
      console.log(err);
    }
  }
}
function updateProgressBar() {
  var canvasContext = pb.getContext("2d");
  var totalPassed = new Date().getTime() - startTime;
  var secondsPassed = parseInt(Math.ceil(totalPassed / 1000));
  var totalWorkout = getTotalSecondsWorkoutTime();
  var percent = secondsPassed / totalWorkout;
  if (percent > 1) percent = 1;
  canvasContext.fillStyle = getPbColor();
  canvasContext.fillRect(0, 0, pb.width * percent, pb.height);
}
function getPbColor() {
  if (isRest) {
    return "#7f38ec";
  } else {
    return "springgreen";
  }
}
function getTotalSecondsWorkoutTime() {
  var work_min = settings.w_m * 60 * settings.intervals;
  var work_sec = settings.w_s * settings.intervals;
  var rest_min = settings.r_m * 60 * (settings.intervals - 1);
  var rest_sec = settings.r_s * (settings.intervals - 1);
  return work_min + work_sec + rest_min + rest_sec;
}

function getTotalSecondsWorkoutTimeWithoutRest() {
  var work_min = settings.w_m * 60 * settings.intervals;
  var work_sec = settings.w_s * settings.intervals;
  return work_min + work_sec;
}
function resetProgressBar() {
  document.getElementById("canvasCont").style.display = "none";
  var canvasContext = pb.getContext("2d");
  canvasContext.clearRect(0, 0, pb.width, pb.height);
}
function onFontChange(change) {
  var rounds = document.getElementById("rounds");
  var tmr = document.getElementById("tmr");
  var txtFont = document.getElementById("txtFont");
  // Baseline vars
  var tmr_base_font_size = 9;
  var rounds_base_font_size = 7;
  console.log(change);
  var currentSize = txtFont.value.split("%")[0];
  var newSize = parseInt(currentSize) + parseInt(change);
  if (newSize > 990 || newSize < 10) {
    return;
  }
  // House keeping
  if (isNaN(newSize)) {
    return;
  }
  // Update the textbox
  txtFont.value = newSize + "%";
  // Change the font size
  var t;
  var r;
  var diff;
  if (newSize > 100) {
    diff = newSize - 100;
    t = tmr_base_font_size + tmr_base_font_size * parseFloat(diff / 100);
    r = rounds_base_font_size + rounds_base_font_size * parseFloat(diff / 100);
  } else {
    t = tmr_base_font_size * parseFloat(newSize / 100);
    r = rounds_base_font_size * parseFloat(newSize / 100);
  }
  // Set UI font
  tmr.style.fontSize = t.toString() + "em";
  rounds.style.fontSize = r.toString() + "em";
}
