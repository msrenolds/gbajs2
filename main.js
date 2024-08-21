const MOVE_DELAY = 250;
const speakingAudio = document.getElementById("speakingAudio");

let utterance = null;
/*speakingAudio.checked = true;


speakingAudio.addEventListener("click", function() {
    console.log("Clicked speaking audio", speakingAudio.checked);
    if (!(utterance === null)) {
        if (speakingAudio.checked) {
            utterance.volume = 1;
        }
        else {
            utterance.volume = 0;
        }
    }

})*/


keyInfo = {
    "l":{
        "color":"#1f77b4",
        "keyCode":"KEYCODE_LEFT"
    },
    "r":{
        "color":"#ff7f0e",
        "keyCode":"KEYCODE_RIGHT"
    },
    "u":{
        "color":"#2ca02c",
        "keyCode":"KEYCODE_UP"
    },
    "d":{
        "color":"#d62728",
        "keyCode":"KEYCODE_DOWN"
    },
    "b":{
        "color":"#bcbd22",
        "keyCode":"KEYCODE_B"
    },
    "a":{
        "color":"#9467bd",
        "keyCode":"KEYCODE_A"
    },
    "start":{
        "color":"#17becf",
        "keyCode":"KEYCODE_START"
    },
    "select":{
        "color":"#7f7f7f",
        "keyCode":"KEYCODE_SELECT"
    }
}


let gba;
let runCommands = [];
let debug = null;
let buf = null;

try {
    gba = new GameBoyAdvance();
    gba.keypad.eatInput = true;
    gba.setLogger(function (level, error) {
        console.log(error);
        gba.pause();
        let screen = document.getElementById('screen');
        if (screen.getAttribute('class') === 'dead') {
            console.log(
                'We appear to have crashed multiple times without reseting.'
            );
            return;
        }
        let crash = document.createElement('img');
        crash.setAttribute('id', 'crash');
        crash.setAttribute('src', 'resources/crash.png');
        screen.parentElement.insertBefore(crash, screen);
        screen.setAttribute('class', 'dead');
    });

} catch (exception) {
    gba = null;
}

window.onload = function () {
    if (gba && FileReader) {
        let canvas = document.getElementById('screen');
        canvas.style.width = window.innerWidth*0.48;
        gba.setCanvas(canvas);

        gba.logLevel = gba.LOG_ERROR;

        gba.setBios(biosBin);

        if (!gba.audio.context) {
            // Remove the sound box if sound isn't available
            let soundbox = document.getElementById('sound');
            soundbox.parentElement.removeChild(soundbox);
        }

        if (
            window.navigator.appName ===
            'Microsoft Internet Explorer'
        ) {
            // Remove the pixelated option if it doesn't work
            let pixelatedBox = document.getElementById('pixelated');
            pixelatedBox.parentElement.removeChild(pixelatedBox);
        }
        
        ////////////////////////////////////////////////
        let xhr = new XMLHttpRequest();
        xhr.open("GET", "PokeRuby.gba", true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function(e) {
            gba.setRom(this.response);
            gba.runStable();

            let xhr2 = new XMLHttpRequest();
            xhr2.open("GET", "G0evlujA", true);
            xhr2.responseType = "arraybuffer";
            xhr2.onload = function(e) {
                gba.setSavedata(this.response);
                
                for (let key in keyInfo) {
                    let dom = document.getElementById(key);
                    keyInfo[key].dom = dom;
                    keyInfo[key].styleBefore = dom.style;
                    dom.onmousedown = function() {
                        gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[key].keyCode], "type":"keydown", "preventDefault":()=>{}})
                    }
                    dom.ontouchstart = function() {
                        gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[key].keyCode], "type":"keydown", "preventDefault":()=>{}})
                    }
                    dom.onmouseup = function() {
                        gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[key].keyCode], "type":"keyup", "preventDefault":()=>{}})
                    }
                    dom.ontouchend = function() {
                        gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[key].keyCode], "type":"keyup", "preventDefault":()=>{}})
                    }
                }
                
                document.getElementById("loadingArea").style = "display:none;";
                document.getElementById("goArea").style = "display:block;";

            }
            xhr2.send();
            gba.keypad.keyboardHandler({"keyCode":gba.keypad.KEYCODE_START, "type":"keydown", "preventDefault":()=>{}})
            setTimeout(function() {
                gba.keypad.keyboardHandler({"keyCode":gba.keypad.KEYCODE_START, "type":"keyup", "preventDefault":()=>{}})
            }, 1000);
        }
        xhr.send();
        ////////////////////////////////////////////////



    } else {
        let dead = document.getElementById('controls');
        dead.parentElement.removeChild(dead);
    }
};


function setVolume(value) {
    gba.audio.masterVolume = Math.pow(2, value) - 1;
}


setVolume(0);

var allVoices = [];
var voiceToUse = null;
async function getVoices() {
    const GET_VOICES_TIMEOUT = 2000; // two second timeout

    let voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      return voices;
    }

    let voiceschanged = new Promise(
      r => speechSynthesis.addEventListener(
        "voiceschanged", r, { once: true }));

    let timeout = new Promise(r => setTimeout(r, GET_VOICES_TIMEOUT));

    // whatever happens first, a voiceschanged event or a timeout.
    await Promise.race([voiceschanged, timeout]);

    allVoices = window.speechSynthesis.getVoices();
    for (let i = 0; i < allVoices.length; i++) {
        if (allVoices[i].voiceURI.indexOf("US English") >= 0) {
            voiceToUse = allVoices[i];
            break;
        }
    }
  }


function go() {
    let lineno = 0;
    let totalLines = 0;
    document.getElementById("go").style = "display:none;";
    document.getElementById("everythingElse").style = "display:block;";
    
    async function processLine() {
        if (lineno > 0) {
            location.href = "#line" + (lineno-1);
        }
        let line = document.getElementById("line"+lineno);
        line.style.background = "#ffff0050";
        let sBefore = line.innerHTML;
        let sNew = "";
        // Step 1: Find and color highlight all instances if l,r,u,d,a,b
        const special = ["l", "r", "u", "d", "a", "b"];
        let moves = [];
        for (let i = 0; i < sBefore.length; i++) {
            if (special.includes(sBefore[i])) {
                moves.push(sBefore[i]);
                sNew += "<span style=\"text-decordation: underline; color:" + keyInfo[sBefore[i]].color + "\">" + sBefore[i] + "</span>";
            }
            else {
                sNew += sBefore[i];
            }
        }
    
        // Step 2: Make the corresponding moves
        let makeMoves = new Promise((resolve) => {
            if (moves.length == 0) {
                resolve();
            }
            else {
                let moveIdx = 0;
                gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[moves[0]].keyCode], "type":"keydown", "preventDefault":()=>{}})
                function makeMove() {
                    gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[moves[moveIdx]].keyCode], "type":"keyup", "preventDefault":()=>{}});
                    keyInfo[moves[moveIdx]].dom.style = keyInfo[moves[moveIdx]].styleBefore;
                    moveIdx++;
                    if (moveIdx >= moves.length) {
                        resolve();
                    }
                    else {
                        gba.keypad.keyboardHandler({"keyCode":gba.keypad[keyInfo[moves[moveIdx]].keyCode], "type":"keydown", "preventDefault":()=>{}});
                        keyInfo[moves[moveIdx]].dom.style.opacity = 0.6;
                        setTimeout(makeMove, MOVE_DELAY);
                    }
                }
                setTimeout(makeMove, MOVE_DELAY);
            }
        })
        line.innerHTML = sNew;

        utterance = new SpeechSynthesisUtterance(sBefore);
        

        await getVoices();
        utterance.voice = voiceToUse;
        window.utterances = [utterance];
        utterance.addEventListener('end', function() {
            lineno = (lineno+1) % totalLines;
            makeMoves.then(function() {
                line.style.background = "";
                line.innerHTML = sBefore;
                processLine();
            });
        });
        window.speechSynthesis.speak(utterance);


    }
    
    
    
    let projText = document.getElementById("proj2025");
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "p2025lines.json", true);
    xhr.responseType = "json";
    xhr.onload = function(e) {
        const lines = this.response;
        totalLines = lines.length;
        for (let i = 0; i < lines.length; i++) {
            let line = document.createElement("div");
            line.id = "line" + i;
            line.innerHTML = lines[i];
            projText.appendChild(line);
            projText.value += lines[i];
        }
        processLine();
    }
    xhr.send();
}
