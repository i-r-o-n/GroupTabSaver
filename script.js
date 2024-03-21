import * as tabEditor from "./tabEditor.js";

import {colorsKey,months} from "./dist/colors.js";
/**
 * @param {string} text
 * @return {string}
 */


function filterXSS(text) {
  // return text
  // return DOMPurify.sanitize(text, { USE_PROFILES: {} })
  return text.replace(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
}


const time = document.getElementById('clockTimeSpan');
const date = document.getElementById('clockDate');
const hand = document.getElementById('seccondHand');
let angleOffset = 0;

// This function sets up the time and the clock
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
function search(query){
  chrome.search.query(
    {text:query}
  )
    
}

function setUpSearchBar() {
  const submitButton = document.getElementById('searchButton');
  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('keydown', function onEvent(event) {
      if (event.key === "Enter") {
        search(searchBox.value)
      }
  });
  submitButton.addEventListener("click", () => {
    search(searchBox.value)
  });
  // searchBox
}

async function setUpLocalStorageLinks() {
  let localFileAccess = await chrome.extension.isAllowedFileSchemeAccess();
  if(!localFileAccess) {
    document.getElementById("noFileAccessPopup").style.display = "block";
  }

  document.getElementById("noFileAccessPopupClose").addEventListener("click", () => {
    document.getElementById("noFileAccessPopup").style.display = "none";
  });
}

// Set the global var savedGroups to the content stored in chrome sync
let savedGroups = {};
async function loadDataFromStorageSync() {
  let keys = await chrome.storage.sync.get(["savedGroupsForSync"])
  console.log(keys)
  // console.log(keys)
  if(keys == null || keys.savedGroupsForSync == undefined){
    updateLocalStorageKey()
    // console.log("had to update keys?")
  }else{
    await Promise.all(keys.savedGroupsForSync.map(async (key) => {
      
      savedGroups[key] = (await chrome.storage.sync.get([key]))[key]
      // console.log(await chrome.storage.sync.get([key]))
    }));

  }

};

// TODO: add to settings
// Resets the local storage it if get currupted or I just want to test a new user starting.
function resetLocalStorage() {
  Object.keys(savedGroups).forEach(key => {
    chrome.storage.sync.remove(key);
  })
  
  chrome.storage.sync.set({ "savedGroupsForSync": [] }).then(() => {
    console.log("savedGroupsForSync is set to " + Object.keys(savedGroups));
  });
};

// resetLocalStorage()
//code for checking whether 2 arrays have the same contence
function sameMembers(arr1, arr2) {
  try {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    return arr1.every(item => set2.has(item)) &&
        arr2.every(item => set1.has(item))
  } catch (error) {
    console.log(error)
    return false;
  }

}

async function updateLocalStorageKey() {
  let currenlySavedKeys = await chrome.storage.sync.get("savedGroupsForSync");
  // console.log(currenlySavedKeys.savedGroupsForSync)
  // console.log(Object.keys(savedGroups))
  // console.log(sameMembers(currenlySavedKeys.savedGroupsForSync, Object.keys(savedGroups)))


  // `true`

  if(!sameMembers(currenlySavedKeys.savedGroupsForSync, Object.keys(savedGroups))){
    chrome.storage.sync.set({ "savedGroupsForSync": Object.keys(savedGroups) }).then(() => {
      console.log("updateLocalStorageKey updated savedGroupsForSync to " + Object.keys(savedGroups));
    });
  }


};

//this function is the same as the one in server-worker.js and needs to be consolidated
async function updateLocalStorage(element) {
  let currenlySavedElement = await chrome.storage.sync.get(element.tabinfo.title);
  // console.log(JSON.stringify(currenlySavedElement[element.tabinfo.title].tabinfo.color))
  // console.log(JSON.stringify(element.tabinfo.color))
  if(currenlySavedElement[element.tabinfo.title] === undefined 
    ||
    JSON.stringify(currenlySavedElement[element.tabinfo.title].tabs) !== JSON.stringify(element.tabs)
    || currenlySavedElement[element.tabinfo.title].tabinfo.color !== element.tabinfo.color
    ){
    chrome.storage.sync.set({ [element.tabinfo.title]:  element})
    updateLocalStorageKey()
    console.log("updated a local storage ellemet")
    console.log(element.tabinfo.title + " had changes")

  }else{
    console.log(element.tabinfo.title + " had no changes")
  }

  
};

async function deleteFromLocalStorage(title) {
  chrome.storage.sync.remove(title);
  updateLocalStorageKey()

  chrome.storage.sync.set({ "savedGroupsForSync": Object.keys(savedGroups) }).then(() => {
    console.log("savedGroupsForSync is set to " + Object.keys(savedGroups));
  });
}

// Adds or updates a tab group in the Global var and in the chrome sync storage
function addGroupToStorage(element,liveSwitch=false,saveToSync=true) {
  if(element.tabinfo == undefined){
    console.log("why would the addGroupToStorage el be undefinged")
    console.log(element)
    return
  }
  
  let tempEl = element

  element.tabs = tabEditor.getCondensedTabData(element.tabs)
  // check if it's new or updating
  // Then if its updating set a loading time to catch other quick changes.
  if(savedGroups[element.tabinfo.title] != undefined){
    
    tempEl.tabinfo.live = savedGroups[element.tabinfo.title].tabinfo.live
  }else{
    element.tabinfo.live = true;
  }
  // tempEl.tabinfo.live = savedGroups[element.tabinfo.title].tabinfo.live

  if(tempEl == savedGroups[element.tabinfo.title] && !liveSwitch){
    return
  }
    
  savedGroups[element.tabinfo.title] = tempEl
  // console.log(savedGroups)
  getTabsFromStorage()
  if(saveToSync){
    updateLocalStorage(tempEl);
  }

  getTabs()
  console.log(tempEl)

}

// Deletes a group in the Global var and in the chrome sync storage
function deleteGroup(title){
  let x=confirm(`Are you sure you want to delete tab group ${filterXSS(title)}`);
  if (!x){
    return;
  }
  // console.log(title)
  delete savedGroups[title]
  // console.log(savedGroups)
  getTabsFromStorage()
  deleteFromLocalStorage(title);
  getTabs()
}
// window.deleteGroup = deleteGroup

// gets the tabs currenly open in the browser and displays them as edits and additons
const newGroupsEl = document.getElementById('newGroups');
function getTabs() {
  //imploment getting from extention
  newGroupsEl.innerHTML = "";
  // console.log(exampleData)
  exampleData.forEach(element => {
    if(element == null){
      return
    }
    if(filterXSS(element.tabinfo.title) == "" ){
      return
    }
    if(savedGroups[element.tabinfo.title] != undefined){
      if(savedGroups[element.tabinfo.title].tabinfo.live == true ){
        return
      }
    }

      // console.log(element)
      const newGroup = document.createElement("div");
      newGroup.classList.add("tabGroup");
      // newGroup.onclick = function() { addGroupToStorage(element); };

      // console.log(element.tabinfo.title)
      // console.log(savedGroups)
      
      // console.log(filterXSS(element.tabinfo.title))
      let groupHtml = `
          <button class="groupName" id=groupNameNew${filterXSS(element.tabinfo.title)}>
            <span class="innerButtonText" >${filterXSS(element.tabinfo.title.replace(/_/g, " "))}</span>
            <img src="/images/${!(element.tabinfo.title in savedGroups)? 'save' : 'update'}.svg" class="actionImg">
          </button>
    
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
      // console.log(document.getElementById(`groupNameNew${element.tabinfo.title}`))
      // console.log(filterXSS(element.tabinfo.title))
      let groupTouchTarget = document.getElementById(`groupNameNew${filterXSS(element.tabinfo.title)}`)
      groupTouchTarget.addEventListener("click", () => {
        addGroupToStorage(element)
      });
      groupTouchTarget.style.backgroundColor = colorsKey[element.tabinfo.color]
    // }
  })
}

// Displays the saved tab groups (does not update savedGroups)
const tabGroupsEl = document.getElementById('tabGroups');
function getTabsFromStorage(live = false) {
  
  //imploment getting from extention
  if(!live){
    tabGroupsEl.innerHTML="";
  }
  
  for (var key in savedGroups) {
    
    if (savedGroups.hasOwnProperty(key)) {
      let element = savedGroups[key]
      if(live) {
        let newTabData = exampleData.find(el => {return el.tabinfo.title == key})
        
        if(savedGroups[key] === undefined){
          delete savedGroups[key];
          deleteFromLocalStorage(key)
          continue;
        }else if(savedGroups[key].tabinfo.live && newTabData != undefined){
          newTabData.tabinfo.live == savedGroups[key].tabinfo.live
          addGroupToStorage(newTabData,undefined,false)
          element = savedGroups[key]
        }else{
          continue;
        }
        
      }
      const newGroup = document.createElement("div");
      newGroup.classList.add("tabGroup");
      newGroup.id = `newGroup${filterXSS(element.tabinfo.title)}`
      // newGroup.tabIndex = 0;
      // newGroup.onclick = function() { addGroupToStorage(element); };
  
      let groupHtml = `
      <div class="deleteContainer" id="deleteContainer${filterXSS(element.tabinfo.title)}">
          <button tabindex="0" class="groupName" id=groupName${filterXSS(element.tabinfo.title)}>
            <span class="innerButtonText" >${filterXSS(element.tabinfo.title.replace(/_/g, " "))}</span>
            <img src="/images/openIcon.svg" class="actionImg">
            
          
          </button>
          <button class="deleteButt" id="deleteTitle${filterXSS(element.tabinfo.title)}">
            <img class="deleteButton" src="/images/ellipsis-solid.svg"></button>
            <div class="groupContextMenu" id="groupContextMenu${filterXSS(element.tabinfo.title)}" >
              <button class="deleteButtonReal" id="deleteButtonReal${filterXSS(element.tabinfo.title)}">
                Delete ${filterXSS(element.tabinfo.title.replace(/_/g, " "))}
              </button>
              <button class="liveButton" id="liveButton${filterXSS(element.tabinfo.title)}">
                Switch to ${element.tabinfo.live == true? "static":"live"} group
              </button>
            </div>
          <div>
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

      if(live){
        document.getElementById(`newGroup${filterXSS(element.tabinfo.title)}`).innerHTML = groupHtml;
      }else{
        newGroup.innerHTML = groupHtml;
        tabGroupsEl.appendChild(newGroup);
      }
      
      
      document.getElementById(`deleteTitle${filterXSS(element.tabinfo.title)}`).addEventListener("click", () => {
        const contextMenue = document.getElementById(`groupContextMenu${filterXSS(element.tabinfo.title)}`)
        contextMenue.style.display = "block"
        
        // Checks if the user clicked outside of the menu and closes it.
        const outsideClickListener = event => {
          if (event.target.closest(`#deleteContainer${filterXSS(element.tabinfo.title)}`) === null) { // or use: event.target.closest(selector) === null
            contextMenue.style.display = 'none';
            removeClickListener();
          }
        }
      
        const removeClickListener = () => {
          document.removeEventListener('click', outsideClickListener);
        }
      
        document.addEventListener('click', outsideClickListener);
        
      });

      document.getElementById(`liveButton${filterXSS(element.tabinfo.title)}`).addEventListener("click", () => {

        element.tabinfo.live = element.tabinfo.live == true ? false:true
        console.log(element.tabinfo.live)
        savedGroups[element.tabinfo.title].tabinfo.live = element.tabinfo.live

        // if(savedGroups[element.tabinfo.title].tabinfo.live == false){
          addGroupToStorage(savedGroups[element.tabinfo.title],true)
        // }
        // addGroupToStorage(newTabData)

        document.getElementById(`liveButton${filterXSS(element.tabinfo.title)}`).innerText = `Switch to ${element.tabinfo.live == true? "static":"live"} group`
        getTabsFromStorage();
        getTabs();
      });

      document.getElementById(`deleteButtonReal${filterXSS(element.tabinfo.title)}`).addEventListener("click", () => {
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

function liveTabsUpdate() {
  for (var key in savedGroups) {
  
    if (savedGroups.hasOwnProperty(key) && savedGroups[key].tabinfo.live) {
      // console.log("what groups are we looking at for live tabsUpdates")
      // console.log(savedGroups[key])
      // // checks to see if it was a changed and real group, probably innifficant.

      if(exampleData.some(e => {
        return (e.tabinfo.title == savedGroups[key].tabinfo.title) && (e != savedGroups[key])
      } )){
        clearTimeout(savedGroups[key].tabinfo.updateTimeout);
        savedGroups[key].tabinfo.updateTimeout = setTimeout(() =>{
          getTabsFromStorage(true);
        }, 1000);
      }
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
    // console.log("a tab group was updated!")
    exampleData = await tabEditor.Reader.getCurrentTabData();
    // console.log(exampleData)
    getTabs();
    liveTabsUpdate()
    // getTabsFromStorage();
  };
}

let exampleData;
async function init(){
  timeSet();
  setInterval(() => timeSet(),1000);

  await loadDataFromStorageSync()
  // console.log(tabEditor)
  setUpSearchBar()
  exampleData = await tabEditor.Reader.getCurrentTabData();
  
  // console.log(exampleData)

  getTabs();
  getTabsFromStorage();
  getTabsFromStorage(true);

  Listeners.init();

  document.getElementsByClassName("relitiveEls")[0].style.visibility = "visible";
  document.getElementsByClassName("relitiveEls")[0].style.opacity = 1;

  //updates the tabs when the user goes back to the tab
  document.addEventListener("visibilitychange", async () => {
    
    if (!document.hidden) {
      console.log(document.hidden)
      await loadDataFromStorageSync()
      exampleData = await tabEditor.Reader.getCurrentTabData();
      getTabs();
      getTabsFromStorage();
    }
  });
  // return exampleData
  setUpLocalStorageLinks();
  
}

init()