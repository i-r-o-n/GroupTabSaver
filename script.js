import * as tabEditor from "./tabEditor.js";


const storiesDiv = document.querySelector('#stories');

const storyNode = (story) => {
  var template = document.createElement('template');
  template.innerHTML = story;
  return template.content.childNodes[0];
}

const addStories = (stories) => {
  for (let index in stories) {
    const story = stories[index];
    const html = `<div class="story">
      <a href="${story.url}">${story.title}</a>
    </div>`;
    storiesDiv.appendChild(storyNode(html));
  }
}

// if (localStorage.lastFetch && localStorage.tabs && (new Date() - localStorage.lastFetch) < (1000*60*60)) {
//   addStories(JSON.parse(localStorage.stories));
// } else {
//   if (localStorage.stories) {
//     addStories(JSON.parse(localStorage.stories));
//   }

//   fetch('https://api.hackernoon.com/featured-stories',{
//       method: 'GET',
//       mode: 'no-cors',
//       // headers:{},
//       credentials: 'include'
//     })
//     .then(response => response.json())
//     .then(data => {
//       if (!localStorage.stories) {
//         addStories(data);
//       }

//       localStorage.setItem("stories", JSON.stringify(data));
//       localStorage.setItem("lastFetch", new Date()-1);
//     });
// }
 

const time = document.getElementById('clockTimeSpan');
const date = document.getElementById('clockDate');
const hand = document.getElementById('seccondHand');
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let angleOffset = 0 
function timeSet() {
  let d = new Date();
  let s = d.getSeconds();
  let m = d.getMinutes();
  let h = d.getHours();
  let angle =  (s*6 +180);
  // if (angle == 534){
  //   angleOffset+=1
  // }
  let angleToRotate = angle+(angleOffset*360)
  
  // console.log(angleToRotate)
  time.innerText = 
    ("0" + h).substr(-2) + ":" + ("0" + m).substr(-2) ;

  
  let rotate = "rotate(" +angleToRotate + "deg" +") ";
  
  hand.style.transform = "translate(" +Math.sin(angle * Math.PI / 180) * -110+"px,"+ Math.cos(angle * Math.PI / 180) * 110+"px) " + rotate;
  
  let month = months[d.getMonth()];
  date.innerText = month + " "+ d.getDate() + ", " + d.getFullYear();
}
timeSet();
setInterval(() => timeSet(),1000);

let savedGroups = {};
// localStorage.removeItem("savedGroups")
console.log(localStorage.getItem("savedGroups"))
if( localStorage.getItem("savedGroups") == null){
  localStorage.setItem("savedGroups", JSON.stringify({}))
}else{
  savedGroups = JSON.parse(localStorage.getItem("savedGroups"))
}

async function updateLocalStorage(savedGroups) {
  localStorage.setItem("savedGroups", JSON.stringify(savedGroups))
};

function addGroupToStorage(element) {
  savedGroups[element.tabinfo.title] = element
  console.log(savedGroups)
  getTabsFromStorage()
  updateLocalStorage(savedGroups);
  getTabs()
}

function deleteGroup(title){
  let x=confirm(`Are you sure you want to delete tab group ${title}`);
  if (!x){
    return;
  }
  console.log(title)
  delete savedGroups[title]
  console.log(savedGroups)
  getTabsFromStorage()
  updateLocalStorage(savedGroups);
  getTabs()
}
// window.deleteGroup = deleteGroup

const newGroupsEl = document.getElementById('newGroups');
function getTabs() {
  //imploment getting from extention
  newGroupsEl.innerHTML = "";
  console.log(exampleData)
  exampleData.forEach(element => {
    if(element == null){
      return
    }
    // if(!element.tabinfo.title == ""){

      console.log(element)
      const newGroup = document.createElement("div");
      newGroup.classList.add("tabGroup");
      // newGroup.onclick = function() { addGroupToStorage(element); };

      // console.log(element.tabinfo.title)
      // console.log(savedGroups)
      
      
      let groupHtml = `
          <div class="groupName" id=groupNameNew${element.tabinfo.title}>
            ${element.tabinfo.title}
            <img src="/images/${!(element.tabinfo.title in savedGroups)? 'save' : 'update'}.svg" class="actionImg">
          </div>
    
          <ul class="tabList">
          `;
      for (const tab of element.tabs) {
        groupHtml += `<li>
          <img src="${tab.favIconUrl}">
          <a href="${tab.url}">${tab.title}</a>
        </li>`;
      }
      
      groupHtml += `</ul>`;
      newGroup.innerHTML = groupHtml;
      newGroupsEl.appendChild(newGroup);
      console.log(document.getElementById(`groupNameNew${element.tabinfo.title}`))
      console.log(element.tabinfo.title)
      document.getElementById(`groupNameNew${element.tabinfo.title}`).addEventListener("click", () => {
          addGroupToStorage(element)
        });
    // }
  })
}


const tabGroupsEl = document.getElementById('tabGroups');
function getTabsFromStorage() {
  //imploment getting from extention
  tabGroupsEl.innerHTML="";
  for (var key in savedGroups) {
    
    if (savedGroups.hasOwnProperty(key)) {
      let element = savedGroups[key]

      console.table(element)
      const newGroup = document.createElement("div");
      newGroup.classList.add("tabGroup");
      // newGroup.onclick = function() { addGroupToStorage(element); };
  
      let groupHtml = `
      <div class="deleteContainer">
          <div class="groupName" id=groupName${element.tabinfo.title}>
            ${element.tabinfo.title}
            <img src="/images/openIcon.svg" class="actionImg">
            
          
          </div>
          <img class="deleteButton" id="deleteTitle${element.tabinfo.title}" src="/images/delete.svg">
        </div>
          <ul class="tabList">
          `;


      for (const tab of element.tabs) {
        groupHtml += `<li>
          <img src="${tab.favIconUrl}">
          <a href="${tab.url}">${tab.title}</a>
        </li>`;
      }
      
      groupHtml += `</ul>`;
      newGroup.innerHTML = groupHtml;
      tabGroupsEl.appendChild(newGroup);
      document.getElementById(`deleteTitle${element.tabinfo.title}`).addEventListener("click", () => {
        deleteGroup(element.tabinfo.title)
      });

      document.getElementById(`groupName${element.tabinfo.title}`).addEventListener("click", () => {
        tabEditor.Creator.createGroupFromURLs2(
            element.tabs.map(tab => tab.url), element.tabinfo.title);
        // deleteGroup(element.tabinfo.title)
      });
    }
  }
}
function getFromAPI(username){
  fetch('https://GroupTabsSaverAPI-1.ahanaroychaudhu.repl.co/api/'+username)
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      let res = data;
      console.log(res)
      localStorage.setItem("savedGroups", JSON.stringify(res.data))
      getTabs();
      getTabsFromStorage();
      });
};

function saveToAPI() {
  let username = localStorage.getItem("username")
  fetch('https://GroupTabsSaverAPI-1.ahanaroychaudhu.repl.co/api/'+username, {
    method: 'POST', // or 'PUT'
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(savedGroups),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}




console.log(tabEditor)

let exampleData = await tabEditor.Reader.getCurrentTabData();

console.log(exampleData)

getTabs();
getTabsFromStorage();

document.getElementById("login").addEventListener("click", () => {
  let username = prompt("Enter your storage code")
  // localStorage.setItem("username", username)
  saveToAPI(username)
});
document.getElementById("cloudRetreive").addEventListener("click", () => {
  let username = prompt("Enter your storage code")
  // localStorage.setItem("username", username)
  getFromAPI(username)
});

class Listeners {
  static init() {
    chrome.tabGroups.onUpdated.addListener(Listeners.onGroupUpdated);
    chrome.tabs.onUpdated.addListener(
      Listeners.onGroupUpdated
    )
  };

  static async onGroupUpdated() {
    // communicate group 
    console.log("a tab group was updated!")
    exampleData = await tabEditor.Reader.getCurrentTabData();
    getTabs();
    getTabsFromStorage();
  };
}

Listeners.init();