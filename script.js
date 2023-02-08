import * as tabEditor from "./tabEditor.js";

import {colorsKey} from "./dist/colors.js";
/**
 * @param {string} text
 * @return {string}
 */
function filterXSS(text) {
  // return text
  return DOMPurify.sanitize(text, { USE_PROFILES: {} })
  var element = document.createElement('div');
  element.innerText = text;
  return element.innerHTML;
}


const time = document.getElementById('clockTimeSpan');
const date = document.getElementById('clockDate');
const hand = document.getElementById('seccondHand');
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let angleOffset = 0;
function timeSet() {
  let d = new Date();
  let s = d.getSeconds();
  let m = d.getMinutes();
  let h = d.getHours();
  let angle = (s*6);

  
  
  // console.table({
  //   angle:angle,
  //   angleOffset:angleOffset,
  //   angleOffsetM:angleOffset%360,
  //   angleToRotate:angleOffset  +180,

  // })
  let difference = angle - (angleOffset%360)
  if (difference < 0){
    difference = 6;
  }
  angleOffset += difference
  let angleToRotate = angleOffset  +180
  // switched to substring from substr
  time.innerText = 
    ("0" + h).substring(("0" + h).length - 2) + ":" + ("0" + m).substring(("0" + m).length - 2)  ;

  
  let rotate = "rotate(" +angleToRotate + "deg" +") ";
  
  hand.style.transform = "translate(" +Math.sin(angle * Math.PI / 180) * -110+"px,"+ Math.cos(angle * Math.PI / 180) * 110+"px) " + rotate;
  
  let month = months[d.getMonth()];
  date.innerText = month + " "+ d.getDate() + ", " + d.getFullYear();
}


let savedGroups = {};

async function loadDataFromStorageSync() {
  let keys = await chrome.storage.sync.get(["savedGroupsForSync"])

  console.log(keys)
  if(keys == null){
    updateLocalStorageKey()
  }else{
    await Promise.all(keys.savedGroupsForSync.map(async (key) => {
      
      savedGroups[key] = (await chrome.storage.sync.get([key]))[key]
      // console.log(await chrome.storage.sync.get([key]))
    }));

  }

};

// TODO: add to settings
function resetLocalStorage() {
  Object.keys(savedGroups).forEach(key => {
    chrome.storage.sync.remove(key);
  })
  
  chrome.storage.sync.set({ "savedGroupsForSync": [] }).then(() => {
    console.log("Value is set to " + Object.keys(savedGroups));
  });
};
// resetLocalStorage()

function updateLocalStorageKey() {
  chrome.storage.sync.set({ "savedGroupsForSync": Object.keys(savedGroups) }).then(() => {
    console.log("Value is set to " + Object.keys(savedGroups));
  });
};

async function updateLocalStorage(element) {
  chrome.storage.sync.set({ [element.tabinfo.title]:  element})
  updateLocalStorageKey()
};

async function deleteFromLocalStorage(title) {
  chrome.storage.sync.remove(title);
  updateLocalStorageKey()
}


function addGroupToStorage(element) {
  

  savedGroups[element.tabinfo.title] = element
  console.log(savedGroups)
  getTabsFromStorage()
  updateLocalStorage(element);
  getTabs()
}

function deleteGroup(title){
  let x=confirm(`Are you sure you want to delete tab group ${filterXSS(title)}`);
  if (!x){
    return;
  }
  console.log(title)
  delete savedGroups[title]
  console.log(savedGroups)
  getTabsFromStorage()
  deleteFromLocalStorage(title);
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
    if(filterXSS(element.tabinfo.title) == "" ){
      return
    }

      console.log(element)
      const newGroup = document.createElement("div");
      newGroup.classList.add("tabGroup");
      // newGroup.onclick = function() { addGroupToStorage(element); };

      // console.log(element.tabinfo.title)
      // console.log(savedGroups)
      
      // console.log(filterXSS(element.tabinfo.title))
      let groupHtml = `
          <div class="groupName" id=groupNameNew${filterXSS(element.tabinfo.title)}>
            ${filterXSS(element.tabinfo.title.replace(/_/g, " "))}
            <img src="/images/${!(element.tabinfo.title in savedGroups)? 'save' : 'update'}.svg" class="actionImg">
          </div>
    
          <ul class="tabList">
          `;
      for (const tab of element.tabs) {
        groupHtml += `<li>
          <img src="${tab.favIconUrl}">
          <a href="${tab.url}">${filterXSS(tab.title)}</a>
        </li>`;
      }
      
      groupHtml += `</ul>`;
      newGroup.innerHTML = groupHtml;
      newGroupsEl.appendChild(newGroup);
      console.log(document.getElementById(`groupNameNew${element.tabinfo.title}`))
      console.log(filterXSS(element.tabinfo.title))
      let groupTouchTarget = document.getElementById(`groupNameNew${filterXSS(element.tabinfo.title)}`)
      groupTouchTarget.addEventListener("click", () => {
        addGroupToStorage(element)
      });
      groupTouchTarget.style.backgroundColor = colorsKey[element.tabinfo.color]
    // }
  })
}


const tabGroupsEl = document.getElementById('tabGroups');
function getTabsFromStorage() {
  //imploment getting from extention
  tabGroupsEl.innerHTML="";
  console.log(savedGroups)
  for (var key in savedGroups) {
    
    if (savedGroups.hasOwnProperty(key)) {
      let element = savedGroups[key]

      console.table(element)
      const newGroup = document.createElement("div");
      newGroup.classList.add("tabGroup");
      // newGroup.onclick = function() { addGroupToStorage(element); };
  
      let groupHtml = `
      <div class="deleteContainer">
          <div class="groupName" id=groupName${filterXSS(element.tabinfo.title)}>
            ${filterXSS(element.tabinfo.title.replace(/_/g, " "))}
            <img src="/images/openIcon.svg" class="actionImg">
            
          
          </div>
          <img class="deleteButton" id="deleteTitle${filterXSS(element.tabinfo.title)}" src="/images/delete.svg">
        </div>
          <ul class="tabList">
          `;


      for (const tab of element.tabs) {
        groupHtml += `<li>
          <img src="${tab.favIconUrl}">
          <a href="${tab.url}">${filterXSS(tab.title)}</a>
        </li>`;
      }
      
      groupHtml += `</ul>`;
      newGroup.innerHTML = groupHtml;
      tabGroupsEl.appendChild(newGroup);
      document.getElementById(`deleteTitle${filterXSS(element.tabinfo.title)}`).addEventListener("click", () => {
        deleteGroup(element.tabinfo.title)
      });

      let groupTouchTarget = document.getElementById(`groupName${filterXSS(element.tabinfo.title)}`)
      groupTouchTarget.addEventListener("click", () => {
        tabEditor.Creator.createGroupFromURLs2(
            element.tabs.map(tab => tab.url), element.tabinfo);
        // deleteGroup(element.tabinfo.title)
      });

      groupTouchTarget.style.backgroundColor = colorsKey[element.tabinfo.color]
    }
  }
}


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
    // getTabsFromStorage();
  };
}

let exampleData;
async function init(){
  timeSet();
  setInterval(() => timeSet(),1000);

  await loadDataFromStorageSync()
  // console.log(tabEditor)

  exampleData = await tabEditor.Reader.getCurrentTabData();
  
  // console.log(exampleData)

  getTabs();
  getTabsFromStorage();

  Listeners.init();

  document.getElementsByClassName("relitiveEls")[0].style.visibility = "visible";
  document.getElementsByClassName("relitiveEls")[0].style.opacity = 1;

  // return exampleData
}

init()