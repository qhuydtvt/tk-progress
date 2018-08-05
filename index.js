let db = null;
function initFirebase() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDCzZTYZtxDLLpDS-l-POL0KvXk0x30A5E",
    authDomain: "tk-progress.firebaseapp.com",
    databaseURL: "https://tk-progress.firebaseio.com",
    projectId: "tk-progress",
    storageBucket: "tk-progress.appspot.com",
    messagingSenderId: "309041406117"
  };
  firebase.initializeApp(config);
  db = firebase.firestore();
  const settings = { timestampsInSnapshots: true };
  db.settings(settings);
}

const takeAllFromSnapshot = (snapshot) => snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));

const fPopulate = (parent, childName) => {
  return parent[childName].get().then(s => ({...parent, [childName]: s.data() }));
}


const projectCollection = () => db.collection("projects");
const sprintCollection = () => db.collection("sprints");

const getAllProjects = () => projectCollection()
                          .get()
                          .then(takeAllFromSnapshot);

const getAllSprints = async () => {
  const sprints = await sprintCollection().get().then(takeAllFromSnapshot);
  const populateProjects = sprints.map(sprint => fPopulate(sprint, 'project'));
  return await Promise.all(populateProjects);
}

function repeatUpdateTimeLeft(sprint) {
  updateTimeLeft(sprint);
  setTimeout(() => {
    repeatUpdateTimeLeft(sprint);
  }, 1000);
}

function updateTimeLeft(sprint) {
  const totalSecondsLeft =  new Date(sprint.deadline.seconds) - Date.now() / 1000;
  if (totalSecondsLeft > 0) {
    const s = Math.floor(totalSecondsLeft % 60);
    const m = Math.floor((totalSecondsLeft / 60) % 60);
    const h = Math.floor((totalSecondsLeft / 60 / 60) % 24);
    const d = Math.floor(totalSecondsLeft / 60 / 60 / 24);
    let textColor = 'green';
    if (d < 1) {
      textColor = 'red';
    }
    else if (d < 3) {
      textColor = 'orange';
    }
    $(`#${sprint.id} .time-left`).attr('class', `time-left ${textColor}`);
    $(`#${sprint.id} .time-left`).text(`${d}d:${h}h:${m}m:${s}s`);
  } else {
    $(`#${sprint.id} .time-left`).attr('class', 'time-left red');  
    $(`#${sprint.id} .time-left`).text("0d:0h:0m:0s");
  }
}

async function showSprints() {
  const sprints = await getAllSprints();
  $("#loading").addClass('hidden');
  sprints.forEach(sprint => {
    $(` <li id='${sprint.id}'>
          <div class="sprint-info">
            <div class="project-title">${sprint.project.title}</div>
            <div class="sprint-code-name">${sprint.codeName}</div>
          </div>
          <div class="time-left"></div>
        </li>`
    ).appendTo("#sprint_list");
    repeatUpdateTimeLeft(sprint);
  });
}

$(document).ready(async () => {
  initFirebase();
  showSprints();
});