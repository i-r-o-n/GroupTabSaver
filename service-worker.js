import * as tabEditor from "./tabEditor.js";



// Set the global var savedGroups to the content stored in chrome sync
let savedGroups = {};
async function loadDataFromStorageSync() {
  let keys = await chrome.storage.sync.get(["savedGroupsForSync"])
  console.log(keys)
  // console.log(keys)
  if(keys == null || keys.savedGroupsForSync == undefined){
    // updateLocalStorageKey()
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
  //there should never be a reason to do this in the service worker
  console.log("tried to update the list")


  // let currenlySavedKeys = await chrome.storage.sync.get("savedGroupsForSync");
  // // console.log(currenlySavedKeys.savedGroupsForSync)
  // // console.log(Object.keys(savedGroups))
  // // console.log(sameMembers(currenlySavedKeys.savedGroupsForSync, Object.keys(savedGroups)))


  // // `true`

  // if(!sameMembers(currenlySavedKeys.savedGroupsForSync, Object.keys(savedGroups))){
  //   chrome.storage.sync.set({ "savedGroupsForSync": Object.keys(savedGroups) }).then(() => {
  //     console.log("updateLocalStorageKey updated savedGroupsForSync to " + Object.keys(savedGroups));
  //   });
  // }


};

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
function addGroupToStorage(element,liveSwitch=false) {
  
  if(element.tabinfo == undefined){
    console.log("why would the addGroupToStorage el be undefinged")
    console.log(element)
    return
  }

  element.tabs = tabEditor.getCondensedTabData(element.tabs)
  
  let tempEl = element
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
  updateLocalStorage(tempEl);
  console.log(tempEl)

}





// Displays the saved tab groups (does not update savedGroups)
function getTabsFromStorage(live = false) {
  
  //imploment getting from extention
  // if(!live){
  //   tabGroupsEl.innerHTML="";
  // }
  
  for (var key in savedGroups) {
    
    if (savedGroups.hasOwnProperty(key)) {
      let element = savedGroups[key]
      if(live) {
        let newTabData = exampleData.find(el => {return el.tabinfo.title == key})
        if(savedGroups[key] === undefined){
          delete savedGroups[key];
          deleteFromLocalStorage(key);
          continue;

        }else if(savedGroups[key].tabinfo.live && newTabData != undefined){
          newTabData.tabinfo.live == savedGroups[key].tabinfo.live
          addGroupToStorage(newTabData)
          element = savedGroups[key]
        }else{
          continue;
        }
        
      }

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
    liveTabsUpdate()
    // getTabsFromStorage();
  };
}

let exampleData;
async function init(){

  await loadDataFromStorageSync()
  // console.log(tabEditor)
  exampleData = await tabEditor.Reader.getCurrentTabData();
  
  // console.log(exampleData)

  getTabsFromStorage();
  getTabsFromStorage(true);

  Listeners.init();


}

init()