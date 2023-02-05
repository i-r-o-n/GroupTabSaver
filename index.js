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

  static async getCurrentTabData() {
    //TODO:parilize this 
    let tabs = await Reader.getTabs();
    let groups = await Reader.getGroups();
    let groupIds = groups.map(group => {
      return group.id
    })

    let listToReturn = groups.map(group => {
      return {
        "tabinfo":group,
        tabs:[]
      }

    })

    // console.log(groupIds)
    tabs.forEach(tab => {
      let index = groupIds.indexOf(tab.groupId)
      if(index != -1){
        
        listToReturn[index].tabs.push(tab)
      }
      
    });
    
    return listToReturn
  }
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
    let groupsTemp = (await Reader.getGroups())
    let currentGroups = groupsTemp.map(group => group.title);
    let currentGroupIds = groupsTemp.map(group => group.id);
    console.log([title,currentGroups,title in currentGroups])
    if(currentGroups.includes(title)){
      let groupId = currentGroupIds[currentGroups.indexOf(title)]
      console.log("asdfasdfasdfasdfasdffas")
      if(!confirm(`Reset tab group ${title}?`)){
        return
      }else{
        console.log((await Reader.getTabs()).forEach(tab => {
          if(tab.groupId == groupId){
            console.log(tab)
            chrome.tabs.remove(tab.id)
          }
        }))
        
      }
    }

    let _tabIds = [];
    let currentGroupId = 0;
    //add the first tab to the group
    
    await chrome.tabs.create(
      {url:urlList[0], active: false}, 
      function(tab) {
        chrome.tabs.group({
            tabIds: tab.id
          },
          function(groupId) {
            // console.log(["groupId",groupId])
            currentGroupId = groupId; 
            chrome.tabGroups.update(groupId = currentGroupId, {collapsed: true, title: title})

            // there as got be a way to await this but for now it stays in the call back
            urlList.slice(1).map(
              url => {
                // console.log(url)
                chrome.tabs.create({
                    url:url, active:false
                  },
                  async function(tab) {
                    // console.table([tab.id,currentGroupId]);
                    await chrome.tabs.group({tabIds: tab.id, groupId: currentGroupId});
                    _tabIds.push(tab.id);
                  }
                )
              }
        
            )
          } 
        )
      }
      // function(groupId) {_groupId = groupId; chrome.tabGroups.update(groupId = _groupId, {collapsed: true, title: title})} )}
    )

    
    
    // console.log(_tabIds)
    // await chrome.tabs.group({tabIds: _tabIds["1"], groupId: _groupId})
  };

  // group button pressed when group already exists
  static resetGroup() {
    
  };

}


// TODO: remove upon integration with live page
// button on test page for debugging purposes only
const button = document.getElementById("button1");
button.addEventListener("click", async () => {
  console.log("button1")
  // console.log(await Reader.getTabs());
  // console.log(await Reader.getTabGroups());
  // console.log((await Reader.getTabs()).map(tab => tab.favIconUrl));
  console.log(await Creator.createGroupFromURLs2(
    ["https://google.com/", "https://bing.com/", "https://duckduckgo.com/"], "search"));
  // console.log(await Creator.addTabIdsToGroup(await Creator.createTabsFromURLs(
  //   ["https://google.com/", "https://bing.com/", "https://duckduckgo.com/"])));
});

const button2 = document.getElementById("button2");
button2.addEventListener("click", async () => {
  console.log("button2")
  Reader.getCurrentTabData();

});


// activate listeners
function init() {
  Listeners.init();
}

init();