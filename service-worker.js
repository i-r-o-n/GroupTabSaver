import * as tabEditor from "./tabEditor.js";

import {colorsKey,months} from "./dist/colors.js";
/**
 * @param {string} text
 * @return {string}
 */
function filterXSS(text) {
  // return text
  return DOMPurify.sanitize(text, { USE_PROFILES: {} })
}



// Set the global var savedGroups to the content stored in chrome sync
let savedGroups = {};
async function loadDataFromStorageSync() {
  let keys = await chrome.storage.sync.get(["savedGroupsForSync"])
  console.log(keys)
  // console.log(keys)
  if(keys == null || keys.savedGroupsForSync == undefined){
    updateLocalStorageKey()
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

function updateLocalStorageKey() {
  chrome.storage.sync.set({ "savedGroupsForSync": Object.keys(savedGroups) }).then(() => {
    console.log("savedGroupsForSync is set to " + Object.keys(savedGroups));
  });
};

async function updateLocalStorage(element) {
  chrome.storage.sync.set({ [element.tabinfo.title]:  element})
  updateLocalStorageKey()
};

async function deleteFromLocalStorage(title) {
  chrome.storage.sync.remove(title);
  updateLocalStorageKey()

  chrome.storage.sync.set({ "savedGroupsForSync": Object.keys(savedGroups) }).then(() => {
    console.log("savedGroupsForSync is set to " + Object.keys(savedGroups));
  });
}

// Adds or updates a tab group in the Global var and in the chrome sync storage
function addGroupToStorage(element,liveSwitch=false) {
  if(element.tabinfo == undefined){
    console.log("why would the addGroupToStorage el be undefinged")
    console.log(element)
    return
  }
  
  let tempEl = element
  // check if it's new or updating
  // Then if its updating set a loading time to catch other quick changes.
  if(savedGroups[element.tabinfo.title] != undefined){
    
    tempEl.tabinfo.live = savedGroups[element.tabinfo.title].tabinfo.live
  }
  // tempEl.tabinfo.live = savedGroups[element.tabinfo.title].tabinfo.live

  if(tempEl == savedGroups[element.tabinfo.title] && !liveSwitch){
    return
  }
    
  savedGroups[element.tabinfo.title] = tempEl
  // console.log(savedGroups)
  getTabsFromStorage()
  updateLocalStorage(tempEl);
  getTabs()
  console.log(tempEl)

}


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

async function onGroupUpdated() {
// communicate group 
// console.log("a tab group was updated!")
exampleData = await tabEditor.Reader.getCurrentTabData();
// console.log(exampleData)
getTabs();
liveTabsUpdate()
// getTabsFromStorage();
};

chrome.tabGroups.onUpdated.addListener(onGroupUpdated);
chrome.tabs.onUpdated.addListener(onGroupUpdated);


let exampleData;

loadDataFromStorageSync()
// console.log(tabEditor)
setUpSearchBar()
exampleData = tabEditor.Reader.getCurrentTabData();

// console.log(exampleData)

getTabs();
getTabsFromStorage();
getTabsFromStorage(true);

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
