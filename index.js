import { foo } from "./src/manager.js";

foo();

// attribute of tab without a group
const NoGroup = chrome.tabGroups.TAB_GROUP_ID_NONE;
// search in the the current window
const QueryInWindow = {windowId: chrome.windows.WINDOW_ID_CURRENT};


// function parseTabTrunk(tab) {};

class Listeners {
  static init() {
    chrome.tabGroups.onUpdated.addListener(Listeners.onGroupUpdated);
  };

  static onGroupUpdated() {
    // communicate group 
    console.log("a tab group was updated!")
  };
}


class Reader {

  // get all tabs in active window
  static async getTabs() {
    return await chrome.tabs.query(QueryInWindow);
  };

  // get all tab groups in active window
  static async getGroups() {
    return await chrome.tabGroups.query(QueryInWindow);
  };

}

Reader.Tabs = class {

  static getTabFaviconURL(tab) { return tab.favIconUrl; };

  static getTabURL(tab) { return tab.url; };

  static getTabTitle(tab) { return tab.getTabTitle; }
}
  
Reader.Groups = class {

  static getGroupIds() {
    chrome.tabGroups.query(QueryInWindow, id);
  };

}



class Creator {

  static createTabFromURL(url) {
    chrome.tabs.create({url:url})
  };

  static addTabIdsToGroupId(tabIds, groupId) {
    chrome.tabs.group({tabIds: tabIds, groupId: groupId});
  };

  // return list of tab ids
  static async createTabsFromURLs(urlList) {
    // try to get rid of dummy variable
    let tabIds = [];
    await urlList.map(url => chrome.tabs.create({url:url}, 
      function(tab) {tabIds.push(tab.id)} ));
    return tabIds;
  };

  static async addTabIdsToGroup(tabIds) {
    await chrome.tabs.group({tabIds: tabIds});
  };
  

  static async createGroupFromURLs(urlList, title) {
    // try to get rid of dummy variable
    let tabIds = [];
    // create new tabs and append all ids to list
    await urlList.map(url => chrome.tabs.create({url:url, active: false}, 
      function(tab) {tabIds.push(tab.id)} )).then(
        chrome.tabs.group({tabIds: tabIds})
      );

    // chrome.tabs.group({tabIds: tabIds[0]}, 
    //   function(group) {chrome.tabGroups.update({
    //     groupId: group.id, collapsed: true, title: title
    //   })} );
  };

  static async createGroupFromURLs2(urlList, title) {
    let _tabIds = [];
    let _groupId = 0;
    //add the first tab to the group
    chrome.tabs.create({url:urlList[0], active: false}, 
      function(tab) {chrome.tabs.group({tabIds: tab.id},
        function(groupId) {_groupId = groupId; chrome.tabGroups.update(groupId = _groupId, {collapsed: true, title: title})} )})
    await urlList.slice(1).map(url => chrome.tabs.create({url:url, active:false},
      function(tab) {_tabIds.push(tab.id)}))
    await chrome.tabs.group({tabIds: +_tabIds, groupId: _groupId})
  };

  // group button pressed when group already exists
  static resetGroup() {
    
  };

}


// TODO: remove upon integration with live page
// button on test page for debugging purposes only
const button = document.querySelector("button");
button.addEventListener("click", async () => {

  // console.log(await Reader.getTabs());
  // console.log(await Reader.getTabGroups());
  // console.log((await Reader.getTabs()).map(tab => tab.favIconUrl));
  console.log(await Creator.createGroupFromURLs2(
    ["https://google.com/", "https://bing.com/", "https://duckduckgo.com/"], "search"));
  // console.log(await Creator.addTabIdsToGroup(await Creator.createTabsFromURLs(
  //   ["https://google.com/", "https://bing.com/", "https://duckduckgo.com/"])));
});


// activate listeners
function init() {
  Listeners.init();
}

init();